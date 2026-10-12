/**
 * Live server for one exploration (`/explore`): serves `docs/explorations/<slug>/` over http,
 * injects the comment overlay into its HTML, and turns each comment into one `COMMENT {json}` line.
 *
 *   npm run explore:serve -- <folder>
 *
 * The session reads the lines (Monitor on the log file), applies the change, then reports back with
 * `POST /__explore/status {id,status,summary}`; "aplicado" makes the open page reload.
 * Only 127.0.0.1; every `/__explore/*` call but the overlay needs the per-run token.
 */
import { randomBytes } from 'node:crypto'
import { appendFileSync, existsSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'
import type { AddressInfo } from 'node:net'
import { tmpdir } from 'node:os'
import { basename, extname, join, normalize, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

export type Status = 'enviado' | 'aguardando' | 'aplicando' | 'aplicado' | 'falhou'
export interface Comment {
  id: number
  status: Status
  /** `dials`: the DialKit values the designer tuned and wants written in as the new defaults. */
  kind: 'comment' | 'dials'
  values?: Record<string, unknown>
  summary?: string
  comment: string
  selector: string
  option?: string
  part?: string
  tag: string
  text: string
  html: string
}

const OVERLAY = fileURLToPath(new URL('./explore-overlay.js', import.meta.url))
const ICONS = fileURLToPath(new URL('./explore-icons/', import.meta.url))
const DIALKIT = fileURLToPath(new URL('../node_modules/dialkit/dist/vanilla/', import.meta.url))
// Served without a token (like the overlay): fixed files, no state.
const ASSETS: Record<string, [string, string]> = {
  'dialkit.js': [DIALKIT + 'browser.global.js', 'text/javascript'],
  'dialkit.css': [DIALKIT + 'styles.css', 'text/css'],
}
const TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.woff2': 'font/woff2',
}
const STATUSES: Status[] = ['enviado', 'aguardando', 'aplicando', 'aplicado', 'falhou']
const clip = (v: unknown, n: number) => String(v ?? '').slice(0, n)

export function startServer(opts: { dir: string; log?: (line: string) => void }) {
  const root = resolve(opts.dir)
  const token = randomBytes(16).toString('hex')
  const comments: Comment[] = []
  const clients = new Set<ServerResponse>()
  const out = opts.log ?? (() => {})
  let lastActivity = Date.now()
  let origin = ''

  const state = () => `event: state\ndata: ${JSON.stringify(comments)}\n\n`
  const broadcast = (msg: string) => clients.forEach((c) => c.write(msg))
  const json = (res: ServerResponse, code: number, body: unknown) => {
    res.writeHead(code, { 'content-type': 'application/json' })
    res.end(JSON.stringify(body))
  }
  const body = (req: IncomingMessage) =>
    new Promise<any>((ok) => {
      let s = ''
      req.on('data', (d) => (s += d, s.length > 50_000 && req.destroy()))
      req.on('end', () => { try { ok(JSON.parse(s)) } catch { ok(null) } })
    })

  const server = createServer(async (req, res) => {
    const url = new URL(req.url ?? '/', 'http://x')
    // Host must be ours (DNS rebinding); a cross-origin page sends a foreign Origin.
    if (req.headers.host !== new URL(origin).host) return json(res, 403, { error: 'host' })
    if (req.headers.origin && req.headers.origin !== origin) return json(res, 403, { error: 'origin' })

    if (url.pathname === '/__explore/overlay.js') {
      res.writeHead(200, { 'content-type': 'text/javascript' })
      return res.end(readFileSync(OVERLAY))
    }
    const name = url.pathname.replace('/__explore/', '')
    const asset = ASSETS[name] ?? (/^icons\/[a-z-]+\.svg$/.test(name) ? [ICONS + name.slice(6), 'image/svg+xml'] : undefined)
    if (url.pathname.startsWith('/__explore/') && asset) {
      if (!existsSync(asset[0])) return json(res, 404, { error: 'asset' })
      res.writeHead(200, { 'content-type': asset[1] })
      return res.end(readFileSync(asset[0]))
    }
    if (url.pathname.startsWith('/__explore/')) {
      lastActivity = Date.now()
      if ((req.headers['x-explore-token'] ?? url.searchParams.get('token')) !== token) return json(res, 401, { error: 'token' })
      if (url.pathname === '/__explore/events') {
        res.writeHead(200, { 'content-type': 'text/event-stream', 'cache-control': 'no-cache' })
        res.write(state())
        clients.add(res)
        return void req.on('close', () => (clients.delete(res), (lastActivity = Date.now())))
      }
      if (url.pathname === '/__explore/pending') return json(res, 200, comments.filter((c) => c.status === 'enviado' || c.status === 'aguardando'))
      if (req.method !== 'POST') return json(res, 405, { error: 'method' })
      const b = await body(req)
      if (!b) return json(res, 400, { error: 'json' })

      if (url.pathname === '/__explore/comment') {
        const dials = b.kind === 'dials'
        if (dials && !(b.values && typeof b.values === 'object' && !Array.isArray(b.values) && JSON.stringify(b.values).length <= 4000)) return json(res, 400, { error: 'values' })
        const text = dials ? 'Aplicar valores do DialKit' : clip(b.comment, 2000).trim()
        if (!text) return json(res, 400, { error: 'empty' })
        const c: Comment = {
          id: comments.length + 1,
          kind: dials ? 'dials' : 'comment',
          values: dials ? b.values : undefined,
          status: comments.some((x) => x.status === 'aplicando') ? 'aguardando' : 'enviado',
          comment: text, selector: clip(b.selector, 500), option: b.option ? clip(b.option, 40) : undefined,
          part: b.part ? clip(b.part, 40) : undefined, tag: clip(b.tag, 40), text: clip(b.text, 80), html: clip(b.html, 500),
        }
        comments.push(c)
        out(`COMMENT ${JSON.stringify(c)}`)
        broadcast(state())
        return json(res, 200, { id: c.id })
      }
      if (url.pathname === '/__explore/status') {
        const c = comments.find((x) => x.id === b.id)
        if (!c || !STATUSES.includes(b.status)) return json(res, 400, { error: 'status' })
        c.status = b.status
        c.summary = b.summary ? clip(b.summary, 300) : undefined
        broadcast(state())
        if (c.status === 'aplicado') broadcast('event: reload\ndata: 1\n\n')
        return json(res, 200, { ok: true })
      }
      return json(res, 404, { error: 'not found' })
    }

    // Static files of the exploration only; "/" is index.html, which gets the overlay.
    const rel = normalize(decodeURIComponent(url.pathname)).replace(/^[/\\]+/, '') || 'index.html'
    const file = resolve(root, rel)
    if (file !== root && !file.startsWith(root + sep)) return json(res, 403, { error: 'path' })
    if (!existsSync(file) || !statSync(file).isFile()) return json(res, 404, { error: 'not found' })
    let data: Buffer | string = readFileSync(file)
    if (basename(file) === 'index.html') {
      const tags = `<script>window.__EXPLORE__=${JSON.stringify({ token })}</script><script src="/__explore/overlay.js"></script>`
      const html = data.toString()
      data = /<\/body>/i.test(html) ? html.replace(/<\/body>/i, () => tags + '</body>') : html + tags
    }
    res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream', 'cache-control': 'no-store' })
    res.end(data)
  })

  // ponytail: idle cutoff polled every 30 s; fine for a one-person local server.
  const idle = 30 * 60_000
  const timer = setInterval(() => {
    if (clients.size === 0 && Date.now() - lastActivity > idle) close()
  }, 30_000)
  timer.unref()

  const close = () => new Promise<void>((done) => {
    clearInterval(timer)
    clients.forEach((c) => c.end())
    server.close(() => done())
    server.closeAllConnections()
    out('STOPPED')
  })

  return new Promise<{ url: string; token: string; comments: Comment[]; close: () => Promise<void> }>((ok) =>
    server.listen(0, '127.0.0.1', () => {
      origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
      ok({ url: origin + '/', token, comments, close })
    }),
  )
}

// CLI: `npm run explore:serve -- docs/explorations/<slug>`
async function main() {
  const args = process.argv.slice(2).filter((a) => a !== '--')
  const dir = args.find((a) => !a.startsWith('--'))
  if (!dir || !existsSync(join(dir, 'index.html'))) {
    console.error('uso: npm run explore:serve -- <pasta com index.html>')
    process.exit(1)
  }
  const logFile = join(tmpdir(), `explore-${basename(resolve(dir))}.log`)
  writeFileSync(logFile, '')
  const log = (line: string) => { console.log(line); appendFileSync(logFile, line + '\n') }
  const s = await startServer({ dir, log })
  log(`READY ${JSON.stringify({ url: s.url, token: s.token, logFile })}`)
  process.on('SIGTERM', async () => { await s.close(); process.exit(0) })
  process.on('SIGINT', async () => { await s.close(); process.exit(0) })
}

if (!process.env.VITEST) void main()
