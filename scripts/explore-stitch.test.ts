import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
// @ts-expect-error plain .mjs, so `node` runs it without a build
import { adopt, append, hold, liveHeld, missingCopies, nextOption, options, show, stitch } from './explore-stitch.mjs'

const template = readFileSync(new URL('../docs/explorations/_template/index.html', import.meta.url), 'utf8')
const part = (n: number) => `<style>[data-option="${n}"] .x { color: var(--c$1); }</style>\n<article class="opt" data-option="${n}"><p>$& ${n}</p></article>\n<script>(() => { /* ${n} */ })()</script>`

describe('explore-stitch', () => {
  it('puts every part in the template, in option order, and drops the placeholder card', () => {
    const page = stitch(template, 'Clima & <8>', [[2, part(2)], [10, part(10)], [1, part(1)]])
    expect(page).toContain('<title>Clima &amp; &lt;8></title>')
    expect([...page.matchAll(/<article class="opt" data-option="(\d+)"/g)].map((m) => m[1])).toEqual(['1', '2', '10'])
    expect(page).not.toContain('Opção 1 - Nome')
    expect(page).toContain('<p>$& 2</p>') // "$" patterns in a part stay literal
    expect(page.indexOf('[data-option="2"] .x { color: var(--c$1); }')).toBeLessThan(page.indexOf('</style>'))
    expect(page.indexOf('/* 10 */')).toBeGreaterThan(page.indexOf('View toggle'))
    expect(page.match(/<\/style>/g)).toHaveLength(1)
  })

  it('finds a card whose thesis comment sits between the article and its label', () => {
    const page = stitch(template, 't', [[1, '<article class="opt" data-option="1">\n  <!-- tese: uma ideia -->\n  <p class="opt-label" data-part="label">Opção 1 - Com tese</p></article>']])
    expect(options(page)).toMatchObject([{ n: 1, label: 'Opção 1 - Com tese' }])
  })

  it('appends a titled batch after the existing cards and records the parent', () => {
    const card = (n: number) => `<article class="opt" data-option="${n}">\n  <p class="opt-label" data-part="label">Opção ${n} - X</p></article>`
    const page = append(stitch(template, 't', [[1, card(1)], [2, card(2)]]), 'Variações da Opção 2 · forte', [[3, part(3).replace('<p>', '<p class="opt-label">')], [4, card(4)]], '2')
    expect(page.indexOf('<h2 class="opt-group">Variações da Opção 2 · forte</h2>')).toBeGreaterThan(page.indexOf('data-option="2"'))
    expect(page).toContain('<article data-parent="2" class="opt" data-option="3">')
    expect(page.match(/<\/main>/g)).toHaveLength(1)
    expect(page.indexOf('[data-option="3"] .x')).toBeLessThan(page.indexOf('</style>'))
    expect(options(page.replace('data-option="1"', 'data-option="1" data-discarded'))).toMatchObject([
      { n: 1, label: 'Opção 1 - X', discarded: true }, { n: 2, parent: undefined, discarded: false, pretuned: false }, { n: 3, parent: '2' }, { n: 4, parent: '2' },
    ])
  })

  it('refuses a part that is not one card with its own number', () => {
    expect(() => stitch(template, 't', [[3, part(4)]])).toThrow('parts/3.html')
    expect(() => stitch(template, 't', [[3, part(3) + part(3)]])).toThrow('parts/3.html')
  })

  it('holds numbers for tunable copies past the page and past copies still on the way', () => {
    const card = (n: number) => `<article class="opt" data-option="${n}">\n  <p class="opt-label" data-part="label">Opção ${n} - X</p></article>`
    const page = stitch(template, 't', [[1, card(1)], [2, card(2)]])
    const first = hold(page, {}, ['1', '2'])
    expect(first.pairs).toEqual([['1', 3], ['2', 4]])
    expect(nextOption(page, first.held)).toBe(5) // a batch of variations starts after the held numbers
    const again = hold(page, first.held, ['1']) // option 1 was edited while its copy was being made
    expect(again.held).toEqual({ 3: null, 4: '2', 5: '1' })
  })

  it('adopts a copy hidden under its parent, discards it when the parent changes, and shows it once tuned', () => {
    const card = (n: number, attrs = '') => `<article class="opt" data-option="${n}"${attrs}>\n  <p class="opt-label" data-part="label">Opção ${n} - X</p></article>`
    let page = adopt(stitch(template, 't', [[1, card(1)]]), 2, '1', card(2, ' data-tuned'))
    expect(page).toContain('<h2 class="opt-group">Ajuste da Opção 1</h2>')
    expect(page).toContain('<article data-parent="1" data-pretuned class="opt" data-option="2" data-tuned>')
    expect(hold(page, {}, ['1']).page).toContain('<article data-parent="1" data-pretuned class="opt" data-option="2" data-tuned data-discarded>')
    page = show(page, 2)
    expect(page).toContain('<article data-parent="1" class="opt" data-option="2" data-tuned>')
    expect(hold(page, {}, ['1']).page).toContain('data-option="2" data-tuned>') // a copy the designer tuned is theirs: never discarded
  })

  it('lists the options with no tunable copy: not discarded, not a copy, not already covered or on the way', () => {
    const card = (n: number, attrs = '') => `<article class="opt" data-option="${n}"${attrs}>\n  <p class="opt-label" data-part="label">Opção ${n} - X</p></article>`
    const page = adopt(stitch(template, 't', [[1, card(1)], [2, card(2)], [3, card(3, ' data-discarded')], [4, card(4)]]), 5, '1', card(5, ' data-tuned').replace('Opção 5 - X', 'Opção 5 - Ajuste da 1'))
    expect(missingCopies(page)).toEqual([2, 4]) // 1 has a copy, 3 is discarded, 5 is the copy
    expect(missingCopies(page, { 6: '4' })).toEqual([2]) // 4's copy is on the way
    const variation = append(page, 'Variações da Opção 2 · sutil', [[6, card(6, ' data-tuned').replace('Opção 6 - X', 'Opção 6 - Variação')]], '2') // a tuned variation is not a copy of its parent
    expect(missingCopies(variation)).toEqual([2, 4])
  })

  it('forgets copies whose tuner is gone: no file and held.json older than a session', () => {
    const held = { 5: '1', 6: '2', 7: null }
    const hasFile = (m: string) => m === '6'
    expect(liveHeld(held, hasFile, 60_000)).toEqual(held) // young: every tuner may still be working
    expect(liveHeld(held, hasFile, 31 * 60_000)).toEqual({ 6: '2' }) // old: only the copy that has its file stays
  })
})
