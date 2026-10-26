import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
// @ts-expect-error plain .mjs, so `node` runs it without a build
import { applyTuned, specJson, specMarkdown, tuneSpec, tuneTarget, varsBlock } from './explore-tune.mjs'
// @ts-expect-error plain .mjs, so `node` runs it without a build
import { startServer } from './explore-server.mjs'

const spec: any = {
  states: ['repouso', 'foco'],
  folders: [
    { name: 'Superfície', part: 'card', controls: [
      { id: 'radius', label: 'Raio', type: 'slider', var: '--radius', value: 40, base: 40, min: 0, max: 64, step: 1, unit: 'px', token: '--dimension-radius-semantic-content-card' },
      { id: 'bg', label: 'Fundo', type: 'color', var: '--bg', value: '#3f3f3f', base: '#3f3f3f', token: '--color-semantic-functional-background-elevated' },
    ] },
    { name: 'Movimento', controls: [
      { id: 'move', label: 'Transição', type: 'easing', durVar: '--dur', easeVar: '--ease', value: { duration: 0.2, ease: [0.2, 0, 0, 1] }, base: { duration: 0.2, ease: [0.2, 0, 0, 1] } },
      { id: 'mode', label: 'Modo', type: 'select', var: '--mode', value: 'a', options: ['a', 'b'] },
    ] },
  ],
}
const page = (extra = '') => `<style>\n${varsBlock(spec, 2)}\n</style>
<article class="opt" data-option="1"></article>
<article class="opt" data-option="2" data-parent="1" data-tuned>
<script type="application/json" data-tune="2">${JSON.stringify(spec)}</script></article>${extra}`

describe('tune spec and target', () => {
  it('reads the spec, and says where /tune/<n> lands', () => {
    expect(tuneSpec(page(), 2)).toEqual(spec)
    expect(tuneSpec(page(), 1)).toBeUndefined()
    expect(tuneTarget(page(), 2)).toEqual({ option: '2', preparing: false })
    expect(tuneTarget(page(), 1)).toEqual({ option: '2', preparing: false })
    expect(tuneTarget(page().replace('data-tuned', 'data-tuned data-discarded'), 1)).toEqual({ option: '1', preparing: true })
    expect(tuneTarget('<article data-option="3"></article>', 3)).toEqual({ option: '3', preparing: true })
  })
})

describe('vars block', () => {
  it('keeps a value on its token until it moves, and marks it when it leaves', () => {
    const same = varsBlock(spec, 2)
    expect(same).toContain('--radius: var(--dimension-radius-semantic-content-card);')
    expect(same).toContain('--bg: var(--color-semantic-functional-background-elevated);')
    expect(same).toContain('--dur: 200ms;')
    expect(same).toContain('--ease: cubic-bezier(0.2, 0, 0, 1);')
    expect(same).toContain('--mode: a;')
    const moved = structuredClone(spec); moved.folders[0].controls[0].value = 14; moved.folders[0].controls[1].value = '#112233'
    const out = varsBlock(moved, 2)
    expect(out).toContain('--radius: 14px; /* tune */')
    expect(out).toContain('--bg: #112233; /* tune */')
  })
})

describe('specJson', () => {
  it('is the same spec, one control per line', () => {
    const json = specJson(spec)
    expect(JSON.parse(json)).toEqual(spec)
    const lines = json.split('\n').map((l: string) => l.replace(/,$/, ''))
    for (const c of spec.folders.flatMap((f: any) => f.controls)) expect(lines).toContain(JSON.stringify(c))
  })
})

describe('applyTuned', () => {
  it('writes values into the spec and regenerates the block; ignores what does not fit', () => {
    const { html, changed } = applyTuned(page(), 2, { '0.radius': 14, '0.bg': '#112233', '1.move': { duration: 0.4, ease: [0.4, 0, 0.2, 1] }, '1.mode': 'zzz', '9.nope': 1, '0.radius ': 1 })
    expect(changed).toBe(3)
    expect(html).toContain('--radius: 14px; /* tune */')
    expect(html).toContain('--dur: 400ms;')
    expect(html).toContain('--ease: cubic-bezier(0.4, 0, 0.2, 1);')
    expect(html).toContain('--mode: a;')
    expect(tuneSpec(html, 2).folders[0].controls[0]).toMatchObject({ value: 14, base: 40 })
    expect(html.match(/tune:vars \*\//g)).toHaveLength(2) // one block, start and end
  })
  it('rewrites only its own option\'s block when the page holds several, and shows a pre-made copy once it is tuned', () => {
    const other = `<style>\n${varsBlock(spec, 3)}\n</style><article class="opt" data-option="3" data-tuned data-pretuned><script type="application/json" data-tune="3">${JSON.stringify(spec)}</script></article>`
    const { html } = applyTuned(page(other), 3, { '0.radius': 14 })
    expect(html).toContain(varsBlock(spec, 2))
    expect(html).toContain('[data-option="3"] {\n  --radius: 14px; /* tune */')
    expect(html).toContain('<article class="opt" data-option="3" data-tuned>')
  })
  it('clamps sliders, lowercases colors, bounds easing handles and leaves the page alone when nothing changes', () => {
    const { html } = applyTuned(page(), 2, { '0.radius': 999, '0.bg': '#ABCDEF', '1.move': { duration: 0.2, ease: [5, -3, 0, 1] } })
    const c = tuneSpec(html, 2).folders
    expect(c[0].controls[0].value).toBe(64)
    expect(c[0].controls[1].value).toBe('#abcdef')
    expect(c[1].controls[0].value.ease).toEqual([1, -3, 0, 1]) // x handles stay in 0..1, y handles may overshoot
    expect(applyTuned(page(), 2, { '0.radius': 40 })).toEqual({ html: page(), changed: 0 })
    expect(applyTuned(page(), 2, { '0.radius': 'abc', '0.bg': 'red' }).changed).toBe(0)
    expect(applyTuned('<article data-option="2"></article>', 2).changed).toBe(0)
  })
  it('cannot be broken out of its script tag', () => {
    const s = structuredClone(spec); s.folders[0].name = '</script><b>'
    const html = page().replace(JSON.stringify(spec), JSON.stringify(s).replace(/</g, '\\u003c'))
    const next = applyTuned(html, 2, { '0.radius': 10 }).html
    expect(next).not.toContain('</script><b>')
    expect(tuneSpec(next, 2).folders[0].name).toBe('</script><b>')
  })
})

describe('specMarkdown', () => {
  it('lists properties with live values, states, motion and token candidates', () => {
    const md = specMarkdown(page(), 2, { label: 'Opção 2 - Card', figma: 'https://figma.com/design/x', brief: '- Controle: ←/→ move' })
    expect(md).toContain('# Opção 2 - Card')
    expect(md).toContain('Figma: https://figma.com/design/x')
    expect(md).toContain('| Raio | `--radius` | 40px | 40px | `--dimension-radius-semantic-content-card` | 0–64px, step 1 |')
    expect(md).toContain('- `repouso`')
    expect(md).toContain('- Controle: ←/→ move')
    expect(md).toContain('- Movimento › Transição: 200ms, cubic-bezier(0.2, 0, 0, 1)')
    expect(md).toContain('Values that are not a kit token') // the easing has no token: a free literal
    expect(md).not.toContain('not applied')
  })
  it('warns about unapplied stage values and flags a value that left its token', () => {
    const md = specMarkdown(page(), 2, { values: { '0.radius': 20, '0.bg': 'nope' } })!
    expect(md).toContain('1 value(s) on the stage are not applied')
    expect(md).toContain('| Raio | `--radius` | 20px | 40px |')
    expect(md).toContain('- Superfície › Raio: 20px (was `--dimension-radius-semantic-content-card`)')
    expect(md).not.toContain('Superfície › Fundo') // an invalid live value is ignored: the colour is still its token
    expect(specMarkdown(page(), 1)).toBeUndefined()
  })
})

describe('stage routes', () => {
  const dir = mkdtempSync(join(tmpdir(), 'explore-tune-'))
  writeFileSync(join(dir, 'index.html'), `<html><body>${page()}</body></html>`)
  let s: Awaited<ReturnType<typeof startServer>>
  const lines: string[] = []
  beforeAll(async () => { s = await startServer({ dir, log: (l: string) => lines.push(l) }) })
  afterAll(async () => { await s.close(); rmSync(dir, { recursive: true, force: true }) })
  const post = (path: string, body: unknown) => fetch(s.url + '__explore/' + path, { method: 'POST', body: JSON.stringify(body), headers: { 'x-explore-token': s.token } })

  it('sends the original to its tuned copy and loads the stage script only there', async () => {
    const r = await fetch(s.url + 'tune/1', { redirect: 'manual' })
    expect([r.status, r.headers.get('location')]).toEqual([302, '/tune/2'])
    const html = await (await fetch(s.url + 'tune/2')).text()
    expect(html.indexOf('/__explore/tune.js')).toBeGreaterThan(0)
    expect(html.indexOf('/__explore/tune.js')).toBeLessThan(html.indexOf('/__explore/overlay.js')) // the stage defines window.exploreDials first
    expect(html).toContain('"tune":{"option":"2","preparing":false}')
    expect(await (await fetch(s.url)).text()).not.toContain('tune.js')
    expect((await fetch(s.url + 'tune/9')).status).toBe(404)
    expect((await fetch(s.url + '__explore/tune.js')).status).toBe(200)
  })

  it('asks once per option for the copy or the review, and refuses a bad option', async () => {
    const a = await (await post('comment', { kind: 'tune', option: '1' })).json()
    const b = await (await post('comment', { kind: 'tune', option: '1' })).json()
    expect(b.id).toBe(a.id)
    expect(JSON.parse(lines.at(-1)!.replace(/^COMMENT /, ''))).toMatchObject({ kind: 'tune', option: '1', comment: 'Preparar controles · opção 1' })
    const j = await (await post('comment', { kind: 'judge', option: 2 })).json()
    expect(j.id).not.toBe(a.id)
    expect((await post('comment', { kind: 'judge', option: 'x' })).status).toBe(400)
    const k = await (await post('comment', { kind: 'kit', option: 2 })).json()
    expect(k.id).not.toBe(j.id) // the kit audit is its own request, beside the review of the same option
    expect(JSON.parse(lines.at(-1)!.replace(/^COMMENT /, ''))).toMatchObject({ kind: 'kit', option: '2', comment: 'Auditoria do kit · opção 2' })
    expect((await (await post('comment', { kind: 'kit', option: 2 })).json()).id).toBe(k.id)
    expect((await post('comment', { kind: 'kit', option: 'x' })).status).toBe(400)
    await post('status', { id: a.id, status: 'aplicado' })
    expect((await (await post('comment', { kind: 'tune', option: '1' })).json()).id).not.toBe(a.id) // finished: a new ask is a new request
  })

  it('writes tuned values itself, and serves the findings the judge left', async () => {
    expect(await (await fetch(s.url + `__explore/judge?option=2&token=${s.token}`)).json()).toBeNull()
    writeFileSync(join(dir, 'judge-2.json'), JSON.stringify({ verdict: 'Approve', findings: [] }))
    expect((await (await fetch(s.url + `__explore/judge?option=2&token=${s.token}`)).json()).verdict).toBe('Approve')
    expect((await fetch(s.url + '__explore/judge?option=../x&token=' + s.token)).status).toBe(400)
    expect(await (await fetch(s.url + `__explore/judge?option=2&kit=1&token=${s.token}`)).json()).toBeNull()
    writeFileSync(join(dir, 'kit-2.json'), JSON.stringify({ verdict: 'Block', findings: [{ severity: 'HIGH', domain: 'tokens' }] }))
    expect((await (await fetch(s.url + `__explore/judge?option=2&kit=1&token=${s.token}`)).json()).verdict).toBe('Block')
    expect((await (await fetch(s.url + `__explore/judge?option=2&token=${s.token}`)).json()).verdict).toBe('Approve') // the review file is untouched
    expect((await post('tune-apply', { option: '2', values: { '0.radius': 12 } })).status).toBe(200)
    expect(readFileSync(join(dir, 'index.html'), 'utf8')).toContain('--radius: 12px; /* tune */')
    expect((await post('tune-apply', { option: 'x', values: {} })).status).toBe(400)
  })

  it('queues Figma pushes and pulls, and keeps the file state in figma.json', async () => {
    expect((await post('comment', { kind: 'figma-push', option: '2' })).status).toBe(400) // the live values come along
    expect((await post('comment', { kind: 'figma-pull', option: '2', values: {} })).status).toBe(400) // nothing sent yet
    const push = await (await post('comment', { kind: 'figma-push', option: '2', values: { '0.radius': 20 } })).json()
    expect((await (await post('comment', { kind: 'figma-push', option: '2', values: {} })).json()).id).toBe(push.id) // one open push per option
    expect(JSON.parse(lines.at(-1)!.replace(/^COMMENT /, ''))).toMatchObject({ kind: 'figma-push', option: '2', values: { '0.radius': 20 }, comment: 'Enviar ao Figma · opção 2' })
    const get = async () => (await fetch(s.url + `__explore/figma?token=${s.token}`)).json()
    expect(await get()).toBeNull()
    expect((await post('figma-state', { url: 'https://evil.example/x' })).status).toBe(400)
    await post('figma-state', { url: 'https://www.figma.com/design/abc', snapshot: { '0.radius': 20 } })
    await post('figma-state', { undo: { '0.radius': 12 } })
    expect(await get()).toEqual({ url: 'https://www.figma.com/design/abc', snapshot: { '0.radius': 20 }, undo: { '0.radius': 12 } })
    await post('figma-state', { undo: null })
    expect((await get()).undo).toBeUndefined()
    expect((await post('comment', { kind: 'figma-pull', option: '2', values: {} })).status).toBe(200) // sent: a pull is possible
    rmSync(join(dir, 'figma.json'))
  })

  it('writes spec-<n>.md from the live values, with the Figma link when there is one', async () => {
    writeFileSync(join(dir, 'figma.json'), JSON.stringify({ url: 'https://figma.com/design/abc' })) // after the Figma test removed its own
    const r = await (await post('tune-md', { option: '2', label: 'Opção 2', values: { '0.radius': 20 } })).json()
    expect(r.file).toBe('spec-2.md')
    expect(readFileSync(join(dir, 'spec-2.md'), 'utf8')).toBe(r.md)
    expect(r.md).toContain('Figma: https://figma.com/design/abc')
    expect(r.md).toContain('not applied')
    expect((await post('tune-md', { option: '1' })).status).toBe(400) // no spec
    expect((await post('tune-md', { option: 'x' })).status).toBe(400)
  })
})

describe('lintSpec', () => {
  // @ts-expect-error plain .mjs
  const lint = (html: string, kit?: Set<string>) => import('./explore-tune.mjs').then((m) => m.lintSpec(html, 2, kit) as string[])
  it('passes a sound option', async () => {
    expect(await lint(page().replace('<style>', '<style>[data-state="foco"]{}'), new Set(['--dimension-radius-semantic-content-card', '--color-semantic-functional-background-elevated']))).toEqual([])
  })
  it('names what would break on the stage', async () => {
    const s = structuredClone(spec)
    s.folders[0].controls[0].min = 50 // value 40 below min
    s.folders[0].controls[1].id = 'radius' // repeated id
    s.folders[1].controls[1].options = ['b'] // value not in options
    const broken = page().replace(JSON.stringify(spec), JSON.stringify(s))
    const bad = (await lint(broken, new Set())).join('\n')
    expect(bad).toContain('Raio: value deve estar entre min e max')
    expect(bad).toContain('id vazio ou repetido (radius)')
    expect(bad).toContain('Modo: value deve estar em options')
    expect(bad).toContain('--dimension-radius-semantic-content-card não é um token do kit')
    expect((await lint(page().replace('--radius: var(', '--radio: var('))).join('\n')).toContain('não é o que "Aplicar valores" escreveria')
    expect(await lint('<article data-option="2"></article>')).toEqual(['o <article data-option="2"> não tem data-tuned', 'falta <script type="application/json" data-tune="2"> com JSON válido'])
  })
})
