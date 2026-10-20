import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'
import { chromium } from 'playwright'

const dir = mkdtempSync(join(tmpdir(), 'explore-layout-'))
afterAll(() => rmSync(dir, { recursive: true, force: true }))
const chromiumUp = await chromium.launch().then((b) => (b.close(), true), () => false)

/** A page of the template with one option whose component is `inner`; the checker's own output for it. */
function check(inner: string, css = '', attrs = '', args: string[] = []): { code: number; out: string } {
  const folder = join(dir, String(Math.random()).slice(2, 8))
  mkdirSync(folder)
  writeFileSync(join(folder, 'index.html'), `<!doctype html><html><head><link rel="stylesheet" href="/__explore/tokens.css"><style>*{box-sizing:border-box}.opt{display:flex;flex-direction:column;width:320px;padding:16px;background:#232323}.opt-content{display:flex;justify-content:center} ${css}</style></head><body><main class="explore-items"><article class="opt" data-option="1"${attrs}><p class="opt-label">Opção 1 - X</p><div class="opt-content">${inner}</div></article></main></body></html>`)
  try { return { code: 0, out: execFileSync('node', ['scripts/check-explore-layout.mjs', folder, ...args], { encoding: 'utf8' }) } }
  catch (e) { const x = e as { status: number; stderr: string }; return { code: x.status, out: x.stderr } }
}
const card = 'background: var(--color-semantic-functional-background-elevated); border-radius: var(--dimension-radius-semantic-card); padding: var(--dimension-spacing-semantic-card-inset); width: var(--dimension-size-semantic-card-width); min-height: 100px;'

describe.skipIf(!chromiumUp)('check-explore-layout', () => {
  it('passes a card made of the kit surface', () => {
    expect(check('<div class="c"><span>24°</span></div>', `.c{${card}}`)).toEqual({ code: 0, out: 'ok\n' })
  })
  it('advises, never fails, a surface the designer tuned off the kit on /tune', () => {
    const r = check('<div class="c"><span>24°</span></div>', `.c{${card} border-radius: 16px}`, ' data-tuned')
    expect(r.code).toBe(0)
    expect(r.out).toContain('advisory: Opção 1: superfície')
    expect(r.out.trim().endsWith('ok')).toBe(true)
  })
  it('names a radius that is not the kit\'s, and a pill on a tall box', () => {
    expect(check('<div class="c"><span>24°</span></div>', `.c{${card} border-radius: 16px}`).out).toContain('superfície')
    expect(check('<div class="c"><span>24°</span></div>', `.c{${card} border-radius: 100px; min-height: 180px}`).out).toContain('pílula')
  })
  it('names text on top of text, content cut by overflow, and a piece drawn outside its card', () => {
    expect(check('<div class="c"><span style="position:absolute">a b c</span><span style="position:absolute">x y z</span></div>', `.c{${card} position:relative}`).out).toContain('sobrepõe')
    expect(check('<div class="c" style="overflow:hidden;height:20px"><p style="height:60px">oi</p></div>', `.c{${card}}`).out).toContain('cortado')
    expect(check('<div class="c" style="width:400px;flex:none"><b>x</b></div>', `.c{${card}}`).out).toContain('escapa')
    // The inline span: its absolute layers have nothing to size against and are drawn at the page's top-left, outside the card.
    expect(check('<span class="c" style="position:static"><i style="position:absolute;top:-80px;left:0;width:50px;height:50px;background:red"></i><b>x</b></span>', `.c{${card}}`).out).toContain('escapa')
  })
  it('names a card that is not a kit width, squeezed or not, and a fixed height its content does not fill', () => {
    expect(check('<div class="c"><span>24°</span></div>', `.c{${card} width: 224px}`).out).toContain('de largura')
    expect(check('<div class="c"><span>24°</span></div>', `.c{${card} width: var(--dimension-size-semantic-content-card-width); max-width: 240px}`).out).toContain('de largura')
    expect(check('<div class="c"><span>24°</span></div>', `.c{${card} height: 300px}`).out).toContain('altura fixa de 300px')
  })
  it('lets data-stack and data-surface="own" through', () => {
    expect(check('<div class="c" data-stack style="overflow:hidden;height:20px"><p style="height:60px">oi</p></div>', `.c{${card}}`).code).toBe(0)
    expect(check('<div class="c" data-surface="own"><span>24°</span></div>', `.c{${card} border-radius: 12px}`).code).toBe(0)
  })
  it('looks at the page settled: a loading state its timer clears, a slow entrance animation at its end', () => {
    expect(check('<div class="c" style="width:400px;flex:none"><b>x</b></div><script>setTimeout(() => document.querySelector(".c").style.width = "", 200)</script>', `.c{${card}}`).code).toBe(0)
    expect(check('<div class="c"><b class="in">x</b></div>', `.c{${card}} .in{display:block;animation:in 5s} @keyframes in{from{transform:translateX(600px)}}`).code).toBe(0)
  })
  it('with --shots, shoots each option from the same render once it is ok, and one more per --keys key', () => {
    const shots = join(dir, 'shots')
    const keyed = '<div class="c"><b>Hoje</b></div><script>const o = document.querySelector(".opt"); o.tabIndex = 0; o.addEventListener("keydown", (e) => { if (e.key === "Enter") o.querySelector("b").textContent = "Amanhã, com chuva forte à tarde" })</script>'
    const r = check(keyed, `.c{${card}}`, '', ['--shots', shots, '--keys', 'ArrowRight,Enter'])
    expect(r.out.split('\n').filter(Boolean)).toEqual(['ok', 'opcao-1.png', 'opcao-1-1-ArrowRight.png', 'opcao-1-2-Enter.png'].map((f, i) => (i ? join(shots, f) : f)))
    // ArrowRight does nothing here, Enter changes the text: the shots say so.
    expect(readFileSync(join(shots, 'opcao-1-1-ArrowRight.png'))).toEqual(readFileSync(join(shots, 'opcao-1.png')))
    expect(readFileSync(join(shots, 'opcao-1-2-Enter.png'))).not.toEqual(readFileSync(join(shots, 'opcao-1.png')))
    const failing = join(dir, 'shots-failing')
    expect(check('<div class="c" style="width:400px;flex:none"><b>x</b></div>', `.c{${card}}`, '', ['--shots', failing]).code).toBe(1)
    expect(existsSync(failing)).toBe(false)
  })
})
