/**
 * Live server for one exploration (`/explore`): serves `docs/explorations/<slug>/` over http,
 * injects the comment overlay into its HTML, and turns each comment or request for variations into one `COMMENT {json}` line.
 * `/tune/<N>` serves the same page as a fine-tuning stage for one option (scripts/explore-tune.js); "Aplicar valores" there is written by the server, no agent.
 *
 *   npm run explore:serve -- <folder> [--port N] [--idle-min 30]
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
// @ts-expect-error plain .mjs, like explore-stitch: `node` runs it without a build
import { applyTuned, tuneTarget } from './explore-tune.mjs'

export type Status = 'enviado' | 'aguardando' | 'aplicando' | 'aplicado' | 'falhou' | 'cancelado'
export interface Comment {
  id: number
  status: Status
  /** `dials`: the DialKit values the designer tuned and wants written in as the new defaults. */
  /** `vary`: variations of one option (`option`, `action`, optional `note`). `more`: a fresh batch from the brief. */
  /** `tune`: the designer opened the stage on an option that has no controls yet. `judge`: "Avaliar" on a tuned option. Both carry `option`. */
  kind: 'comment' | 'dials' | 'vary' | 'more' | 'tune' | 'judge'
  action?: Action
  note?: string
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
const INTER = fileURLToPath(new URL('../node_modules/@fontsource-variable/inter/', import.meta.url))
// Served without a token (like the overlay): fixed files, no state.
const ASSETS: Record<string, [string, string]> = {
  // The kit's own tokens and face: explorations link these instead of retyping values.
  'tokens.css': [fileURLToPath(new URL('../src/styles/global.css', import.meta.url)), 'text/css'],
  'inter.css': [INTER + 'wght.css', 'text/css'],
  'tune.js': [fileURLToPath(new URL('./explore-tune.js', import.meta.url)), 'text/javascript'],
  'dialkit.js': [DIALKIT + 'browser.global.js', 'text/javascript'],
  'dialkit.css': [DIALKIT + 'styles.css', 'text/css'],
}
const TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.woff2': 'font/woff2',
}
/** What a variation changes; the brief stays fixed in all of them. */
export const ACTIONS = { sutil: 'Variar sutil', forte: 'Variar forte', layout: 'Embaralhar layout', estilo: 'Mudar estilo', livre: 'Variar' } as const
export type Action = keyof typeof ACTIONS

/** The page with one option's card marked as discarded (hidden by the template, never deleted) or restored. */
export function setDiscarded(html: string, option: string, discarded: boolean): string {
  return html.replace(new RegExp(`<article\\b[^>]*\\bdata-option="${option}"[^>]*>`), (tag) => {
    const clean = tag.replace(/\s+data-discarded(="[^"]*")?/, '')
    return discarded ? clean.replace(/>$/, ' data-discarded>') : clean
  })
}

const STATUSES: Status[] = ['enviado', 'aguardando', 'aplicando', 'aplicado', 'falhou'] // what the session may set; `cancelado` is the designer's
const clip = (v: unknown, n: number) => String(v ?? '').slice(0, n)

export function startServer(opts: { dir: string; port?: number; idleMin?: number; log?: (line: string) => void }) {
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

  /** The page with the live layer; `tune` also loads the stage, which must run before the overlay (it defines window.exploreDials). */
  const withLive = (html: string, tune?: { option: string; preparing: boolean }) => {
    const tags = `<script>window.__EXPLORE__=${JSON.stringify({ token, tune })}</script>${tune ? '<script src="/__explore/tune.js"></script>' : ''}<script src="/__explore/overlay.js"></script>`
    return /<\/body>/i.test(html) ? html.replace(/<\/body>/i, () => tags + '</body>') : html + tags
  }

  const server = createServer(async (req, res) => {
    const url = new URL(req.url ?? '/', 'http://x')
    // Host must be ours (DNS rebinding); a cross-origin page sends a foreign Origin.
    if (req.headers.host !== new URL(origin).host) return json(res, 403, { error: 'host' })
    if (req.headers.origin && req.headers.origin !== origin) return json(res, 403, { error: 'origin' })

    if (url.pathname === '/__explore/overlay.js') {
      res.writeHead(200, { 'content-type': 'text/javascript', 'cache-control': 'no-store' }) // never an old overlay on a reloaded page
      return res.end(readFileSync(OVERLAY))
    }
    // The fine-tuning stage: option N when it has controls, else its newest tuned copy (a redirect), else the original while the copy is being made.
    const stage = url.pathname.match(/^\/tune\/(\d+)\/?$/)
    if (stage) {
      const html = readFileSync(join(root, 'index.html'), 'utf8')
      if (!new RegExp(`<article\\b[^>]*\\bdata-option="${stage[1]}"`).test(html)) return json(res, 404, { error: 'option' })
      const t = tuneTarget(html, stage[1])
      if (t.option !== stage[1]) { res.writeHead(302, { location: `/tune/${t.option}` }); return res.end() }
      res.writeHead(200, { 'content-type': TYPES['.html'], 'cache-control': 'no-store' })
      return res.end(withLive(html, t))
    }
    const name = url.pathname.replace('/__explore/', '')
    const asset = ASSETS[name] ?? (/^icons\/[a-z-]+\.svg$/.test(name) ? [ICONS + name.slice(6), 'image/svg+xml'] : /^files\/inter-[a-z-]+-wght-normal\.woff2$/.test(name) ? [INTER + name, 'font/woff2'] : undefined)
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
      // The judge's findings for one option: written by proto-judge next to the page, shown in the stage.
      if (url.pathname === '/__explore/judge') {
        const n = url.searchParams.get('option') ?? ''
        const file = join(root, `judge-${n}.json`)
        if (!/^\d+$/.test(n)) return json(res, 400, { error: 'option' })
        return json(res, 200, existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : null)
      }
      if (url.pathname === '/__explore/pending') return json(res, 200, comments.filter((c) => c.status === 'enviado' || c.status === 'aguardando'))
      if (req.method !== 'POST') return json(res, 405, { error: 'method' })
      const b = await body(req)
      if (!b) return json(res, 400, { error: 'json' })

      if (url.pathname === '/__explore/comment') {
        const dials = b.kind === 'dials'
        const vary = b.kind === 'vary', more = b.kind === 'more'
        const stageKind = b.kind === 'tune' || b.kind === 'judge' ? (b.kind as 'tune' | 'judge') : undefined
        if (stageKind) {
          if (!/^\d+$/.test(String(b.option))) return json(res, 400, { error: 'option' })
          // The stage asks on every load: one open request per option and kind is enough.
          const open = comments.find((x) => x.kind === stageKind && x.option === String(b.option) && (x.status === 'enviado' || x.status === 'aguardando' || x.status === 'aplicando'))
          if (open) return json(res, 200, { id: open.id })
        }
        if (vary && !(/^\d+$/.test(String(b.option)) && Object.hasOwn(ACTIONS, b.action))) return json(res, 400, { error: 'vary' })
        const note = vary || more ? clip(b.note, 300).trim() : ''
        // `livre` is the direction field sent alone: without words it asks for nothing.
        if (vary && b.action === 'livre' && !note) return json(res, 400, { error: 'note' })
        if (dials && !(b.values && typeof b.values === 'object' && !Array.isArray(b.values) && JSON.stringify(b.values).length <= 4000)) return json(res, 400, { error: 'values' })
        const text = stageKind ? `${stageKind === 'tune' ? 'Preparar controles' : 'Avaliar'} · opção ${b.option}`
          : dials ? 'Aplicar valores do DialKit'
          : vary ? `${ACTIONS[b.action as Action]} · opção ${b.option}${note && `: ${note}`}`
          : more ? `Mais opções${note && `: ${note}`}`
          : clip(b.comment, 2000).trim()
        if (!text) return json(res, 400, { error: 'empty' })
        const c: Comment = {
          id: comments.length + 1,
          kind: stageKind ?? (dials ? 'dials' : vary ? 'vary' : more ? 'more' : 'comment'),
          action: vary ? b.action : undefined, note: note || undefined,
          values: dials ? b.values : undefined,
          status: comments.some((x) => x.status === 'aplicando') ? 'aguardando' : 'enviado',
          comment: text, selector: clip(b.selector, 500), option: b.option ? clip(String(b.option), 40) : undefined,
          part: b.part ? clip(b.part, 40) : undefined, tag: clip(b.tag, 40), text: clip(b.text, 80), html: clip(b.html, 500),
        }
        comments.push(c)
        out(`COMMENT ${JSON.stringify(c)}`)
        broadcast(state())
        return json(res, 200, { id: c.id })
      }
      // Discarding needs no agent: the server marks the card in the file and the page reloads.
      if (url.pathname === '/__explore/discard') {
        if (!/^\d+$/.test(String(b.option))) return json(res, 400, { error: 'option' })
        const index = join(root, 'index.html'), html = readFileSync(index, 'utf8'), next = setDiscarded(html, String(b.option), b.discarded !== false)
        if (next === html) return json(res, 400, { error: 'option' })
        writeFileSync(index, next)
        broadcast('event: reload\ndata: 1\n\n')
        return json(res, 200, { ok: true })
      }
      // "Aplicar valores" in the stage: the spec holds the numbers, so the server rewrites them (and the CSS they drive) itself.
      if (url.pathname === '/__explore/tune-apply') {
        if (!/^\d+$/.test(String(b.option)) || !b.values || typeof b.values !== 'object') return json(res, 400, { error: 'values' })
        const index = join(root, 'index.html'), html = readFileSync(index, 'utf8')
        const { html: next, changed } = applyTuned(html, String(b.option), b.values)
        if (next !== html) { writeFileSync(index, next); broadcast('event: reload\ndata: 1\n\n') }
        return json(res, 200, { changed })
      }
      // The designer takes a request back: any queued one, and a batch of options while it is being made (an edit under way cannot be undone).
      if (url.pathname === '/__explore/cancel') {
        const c = comments.find((x) => x.id === b.id)
        const batch = c?.kind === 'vary' || c?.kind === 'more'
        if (!c || !(c.status === 'enviado' || c.status === 'aguardando' || (c.status === 'aplicando' && batch))) return json(res, 400, { error: 'cancel' })
        c.status = 'cancelado'
        broadcast(state())
        return json(res, 200, { ok: true })
      }
      if (url.pathname === '/__explore/status') {
        const c = comments.find((x) => x.id === b.id)
        if (!c || !STATUSES.includes(b.status)) return json(res, 400, { error: 'status' })
        // The session learns of a cancel here: it asks to start or finish the request and is told to drop it.
        if (c.status === 'cancelado') return json(res, 409, { error: 'cancelado' })
        c.status = b.status
        c.summary = b.summary ? clip(b.summary, 300) : undefined
        broadcast(state())
        if (c.status === 'aplicado' && c.kind !== 'judge') broadcast('event: reload\ndata: 1\n\n') // findings show without a reload
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
    if (basename(file) === 'index.html') data = withLive(data.toString())
    res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream', 'cache-control': 'no-store' })
    res.end(data)
  })

  // ponytail: idle cutoff polled every 30 s; fine for a one-person local server.
  const idle = (opts.idleMin ?? 30) * 60_000
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
    server.listen(opts.port ?? 0, '127.0.0.1', () => {
      origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
      ok({ url: origin + '/', token, comments, close })
    }),
  )
}

// CLI: `npm run explore:serve -- docs/explorations/<slug>`
async function main() {
  const args = process.argv.slice(2).filter((a) => a !== '--')
  const flag = (n: string) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : undefined }
  const dir = args.find((a, i) => !a.startsWith('--') && !args[i - 1]?.startsWith('--'))
  if (!dir || !existsSync(join(dir, 'index.html'))) {
    console.error('uso: npm run explore:serve -- <pasta com index.html> [--port N] [--idle-min 30]')
    process.exit(1)
  }
  const logFile = join(tmpdir(), `explore-${basename(resolve(dir))}.log`)
  writeFileSync(logFile, '')
  const log = (line: string) => { console.log(line); appendFileSync(logFile, line + '\n') }
  const s = await startServer({ dir, port: flag('--port') ? Number(flag('--port')) : undefined, idleMin: Number(flag('--idle-min') ?? 30), log })
  log(`READY ${JSON.stringify({ url: s.url, token: s.token, logFile })}`)
  process.on('SIGTERM', async () => { await s.close(); process.exit(0) })
  process.on('SIGINT', async () => { await s.close(); process.exit(0) })
}

if (!process.env.VITEST) void main()
