import { request } from 'node:http'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { startServer } from './explore-server'

const dir = mkdtempSync(join(tmpdir(), 'explore-test-'))
mkdirSync(join(dir, 'sub'))
writeFileSync(join(dir, 'index.html'), '<html><body><p data-option="1">oi</p></body></html>')
writeFileSync(join(dir, 'sub', 'a.css'), 'p{}')

let s: Awaited<ReturnType<typeof startServer>>
const lines: string[] = []
beforeAll(async () => { s = await startServer({ dir: join(dir), log: (l) => lines.push(l) }) })
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
    expect((await fetch(s.url + '__explore/icons/..%2f..%2fexplore-server.ts')).status).not.toBe(200)
  })

  it('takes tuned DialKit values as a "dials" message, and rejects a missing or oversized one', async () => {
    const r = await post('comment', { kind: 'dials', values: { 'Opção 2': { radius: 32 } } })
    expect(r.status).toBe(200)
    expect(s.comments.at(-1)).toMatchObject({ kind: 'dials', values: { 'Opção 2': { radius: 32 } } })
    expect((await post('comment', { kind: 'dials' })).status).toBe(400)
    expect((await post('comment', { kind: 'dials', values: { x: 'a'.repeat(5000) } })).status).toBe(400)
  })

  it('does not serve files outside the exploration folder', async () => {
    const r = await fetch(s.url + '..%2f..%2fetc/passwd')
    expect([403, 404]).toContain(r.status)
  })
})
