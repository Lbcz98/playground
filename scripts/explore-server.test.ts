import { request } from 'node:http'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
// @ts-expect-error plain .mjs, so `node` runs it without a build
import { setDiscarded, startServer } from './explore-server.mjs'

const dir = mkdtempSync(join(tmpdir(), 'explore-test-'))
mkdirSync(join(dir, 'sub'))
writeFileSync(join(dir, 'index.html'), '<html><body><p data-option="1">oi</p></body></html>')
writeFileSync(join(dir, 'sub', 'a.css'), 'p{}')

let s: Awaited<ReturnType<typeof startServer>>
const lines: string[] = []
beforeAll(async () => { s = await startServer({ dir: join(dir), log: (l: string) => lines.push(l) }) })
afterAll(async () => { await s.close(); rmSync(dir, { recursive: true, force: true }) })

const post = (path: string, body: unknown, headers: Record<string, string> = { 'x-explore-token': s.token }) =>
  fetch(s.url + '__explore/' + path, { method: 'POST', body: JSON.stringify(body), headers })

// fetch ignores a custom Host header; node:http sends it as given.
const statusWithHost = (host: string) =>
  new Promise<number>((ok) => request(s.url, { headers: { host } }, (r) => (r.resume(), ok(r.statusCode ?? 0))).end())

describe('explore server', () => {
  it('injects the overlay into index.html and serves other files untouched', async () => {
    const html = await (await fetch(s.url)).text()
    expect(html).toContain('/__explore/overlay.js')
    expect(html).toContain(s.token)
    expect(await (await fetch(s.url + 'sub/a.css')).text()).toBe('p{}')
  })

  it('turns a comment into one COMMENT line and queues the next while one is applying', async () => {
    const r = await post('comment', { comment: 'mais contraste', selector: 'p', option: '1', tag: 'p', text: 'oi', html: '<p>' })
    expect(r.status).toBe(200)
    expect(JSON.parse(lines.at(-1)!.replace(/^COMMENT /, ''))).toMatchObject({ id: 1, kind: 'comment', status: 'enviado', comment: 'mais contraste' })
    await post('status', { id: 1, status: 'aplicando' })
    await post('comment', { comment: 'outro', selector: 'p', tag: 'p', text: '', html: '' })
    expect(s.comments[1].status).toBe('aguardando')
    const pending = await (await fetch(s.url + '__explore/pending?token=' + s.token)).json()
    expect(pending.map((c: { id: number }) => c.id)).toEqual([2])
  })

  it('refuses a missing token, a foreign Origin and a foreign Host', async () => {
    const before = s.comments.length
    expect((await post('comment', { comment: 'x' }, {})).status).toBe(401)
    expect((await post('comment', { comment: 'x' }, { 'x-explore-token': s.token, origin: 'http://evil.test' })).status).toBe(403)
    expect(await statusWithHost('evil.test')).toBe(403)
    expect(s.comments).toHaveLength(before)
  })

  it('serves the icons and the DialKit files without a token, and refuses other names', async () => {
    expect((await fetch(s.url + '__explore/icons/add.svg')).headers.get('content-type')).toBe('image/svg+xml')
    expect((await fetch(s.url + '__explore/dialkit.js')).status).toBe(200)
    expect((await fetch(s.url + '__explore/dialkit.css')).status).toBe(200)
    expect((await fetch(s.url + '__explore/icons/..%2f..%2fexplore-server.mjs')).status).not.toBe(200)
  })

  it('takes tuned DialKit values as a "dials" message, and rejects a missing or oversized one', async () => {
    const r = await post('comment', { kind: 'dials', values: { 'Opção 2': { radius: 32 } } })
    expect(r.status).toBe(200)
    expect(s.comments.at(-1)).toMatchObject({ kind: 'dials', values: { 'Opção 2': { radius: 32 } } })
    expect((await post('comment', { kind: 'dials' })).status).toBe(400)
    expect((await post('comment', { kind: 'dials', values: { x: 'a'.repeat(5000) } })).status).toBe(400)
  })

  it('takes a request for variations of one option, and rejects an unknown action or option', async () => {
    expect((await post('comment', { kind: 'vary', option: '1', action: 'forte', note: 'mais compacto' })).status).toBe(200)
    expect(JSON.parse(lines.at(-1)!.replace(/^COMMENT /, ''))).toMatchObject({ kind: 'vary', option: '1', action: 'forte', note: 'mais compacto', comment: 'Variar forte · opção 1: mais compacto' })
    expect((await post('comment', { kind: 'more' })).status).toBe(200)
    expect(s.comments.at(-1)).toMatchObject({ kind: 'more', comment: 'Mais opções' })
    expect((await post('comment', { kind: 'vary', option: '1', action: 'apagar' })).status).toBe(400)
    expect((await post('comment', { kind: 'vary', option: '1"] x', action: 'forte' })).status).toBe(400)
  })

  it('lets the designer cancel a queued request or a batch under way, and tells the session to drop it', async () => {
    const id = (await (await post('comment', { kind: 'more' })).json()).id
    expect((await post('cancel', { id })).status).toBe(200)
    const r = await post('status', { id, status: 'aplicando' })
    expect([r.status, await r.json()]).toEqual([409, { error: 'cancelado' }])
    expect((await post('cancel', { id })).status).toBe(400)
    const batch = (await (await post('comment', { kind: 'vary', option: '1', action: 'livre', note: 'sem ícones' })).json()).id
    await post('status', { id: batch, status: 'aplicando' })
    expect((await post('cancel', { id: batch })).status).toBe(200)
    expect((await post('cancel', { id: 1 })).status).toBe(400) // the first comment is an edit under way
    expect((await post('comment', { kind: 'vary', option: '1', action: 'livre' })).status).toBe(400)
  })

  it('discards and restores a card in the file, without deleting it', async () => {
    const page = '<article class="opt" data-option="2" tabindex="0"><p>a</p></article><article class="opt" data-option="12">b</article>'
    const gone = setDiscarded(page, '2', true)
    expect(gone).toContain('<article class="opt" data-option="2" tabindex="0" data-discarded><p>a</p>')
    expect(gone).toContain('data-option="12">b')
    expect(setDiscarded(setDiscarded(gone, '2', true), '2', false)).toBe(page)
    expect((await post('discard', { option: '9' })).status).toBe(400)
    expect(readFileSync(join(dir, 'index.html'), 'utf8')).not.toContain('data-discarded')
  })

  it('does not serve files outside the exploration folder', async () => {
    const r = await fetch(s.url + '..%2f..%2fetc/passwd')
    expect([403, 404]).toContain(r.status)
  })
})
