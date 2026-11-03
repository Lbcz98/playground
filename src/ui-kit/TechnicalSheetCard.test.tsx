import { readFileSync } from 'node:fs'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { TechnicalSheetCard } from './TechnicalSheetCard'

const css = readFileSync(new URL('./ui-kit.css', import.meta.url), 'utf8')
const render = (props: Partial<Parameters<typeof TechnicalSheetCard>[0]> = {}): string =>
  renderToStaticMarkup(
    <TechnicalSheetCard
      category="Série"
      directorsNames={['Maria Silva']}
      artDirectorsNames={['João Souza']}
      screenwritersNames={['Ana Lima']}
      authorsNames={['Autor que não pertence à série']}
      castNames={['Patrícia Poeta']}
      {...props}
    />,
  )

describe('<TechnicalSheetCard>', () => {
  it('shows direction, art direction, screenplay and cast for a series', () => {
    const out = render()
    expect(out).toContain('<article class="sfs-technical-sheet-card">')
    expect(out).toContain('<h2 class="text-body-lg-bold sfs-technical-sheet-card-title">Ficha Técnica</h2>')
    expect(out).toContain('<dt class="text-body-md-bold">Direção:</dt>')
    expect(out).toContain('<dd class="text-body-md-medium">Maria Silva</dd>')
    expect(out).toContain('<dt class="text-body-md-bold">Direção artística:</dt>')
    expect(out).toContain('<dt class="text-body-md-bold">Roteiro:</dt>')
    expect(out).toContain('<dt class="text-body-md-bold">Elenco:</dt>')
    expect(out).not.toContain('Autor:')
    expect(out.indexOf('Direção artística:')).toBeLessThan(out.indexOf('Elenco:'))
    expect(out.indexOf('Elenco:')).toBeLessThan(out.indexOf('Roteiro:'))
  })

  it('starts every field at the 2-line cap and the cast at 3, until the card is measured', () => {
    const out = render()
    expect(out).toMatch(/data-field="Direção" data-lines="2"/)
    expect(out).toMatch(/data-field="Direção artística" data-lines="2"/)
    expect(out).toMatch(/data-field="Roteiro" data-lines="2"/)
    expect(out).toMatch(/data-field="Elenco" data-lines="3"/)
    expect(out).not.toContain('data-lines="4"')
  })

  it('uses screenplay for films and authorship for novelas', () => {
    expect(render({ category: 'Filme' })).toContain('Roteiro:')
    expect(render({ category: 'Filme' })).not.toContain('Autor:')

    const novela = render({ category: 'Novela' })
    expect(novela).toContain('<dt class="text-body-md-bold">Autor:</dt>')
    expect(novela).toContain('Autor que não pertence à série')
    expect(novela).not.toContain('Roteiro:')
  })

  it('shows art direction regardless of category and omits each empty field with its label', () => {
    const out = render({
      category: 'Variedades',
      directorsNames: null,
      artDirectorsNames: 'João Souza',
      screenwritersNames: [],
      authorsNames: '',
      castNames: undefined,
    })
    expect(out).toContain('Direção artística:')
    expect(out).toContain('João Souza')
    expect(out).not.toContain('Direção:')
    expect(out).not.toContain('Roteiro:')
    expect(out).not.toContain('Autor:')
    expect(out).not.toContain('Elenco:')
  })

  it('renders nothing when no technical data is available', () => {
    const out = render({
      category: 'Variedades',
      directorsNames: null,
      artDirectorsNames: null,
      screenwritersNames: null,
      authorsNames: null,
      castNames: null,
    })
    expect(out).toBe('')
  })

  it('caps a single field like any other instead of leaving it unclamped', () => {
    const only = {
      directorsNames: null,
      artDirectorsNames: null,
      screenwritersNames: null,
      authorsNames: null,
    }
    const cast = render({ ...only, castNames: 'Um nome único e completo' })
    expect(cast).toContain('data-lines="3"')
    expect(cast).not.toContain('data-single')
    expect(render({ ...only, directorsNames: 'Um nome único e completo', castNames: null })).toContain('data-lines="2"')
    expect(css).not.toContain('[data-single]')
  })

  it('fills the remaining row width, flows wrapped values from the line start and clamps long rows', () => {
    expect(css).toMatch(/\.sfs-technical-sheet-card\s*\{[^}]*flex: 1 1 0/s)
    expect(css).toMatch(/\.sfs-technical-sheet-card\s*\{[^}]*align-self: stretch/s)
    expect(css).toMatch(/\.sfs-technical-sheet-card\s*\{[^}]*border-radius: var\(--dimension-radius-core-2xl\)/s)
    expect(css).toMatch(/\.sfs-technical-sheet-card\s*\{[^}]*padding: var\(--dimension-spacing-semantic-card-inset\)/s)
    expect(css).toMatch(/\.sfs-technical-sheet-card > \.sfs-resting-border\s*\{[^}]*background: var\(--gradient-semantic-border-about-card\)/s)
    expect(css).toMatch(/\.sfs-technical-sheet-card-title\s*\{[^}]*line-height: var\(--typography-line-height-semantic-detail-card-text\)/s)
    expect(css).toMatch(/\.sfs-technical-sheet-card-row\[data-lines='0'\]\s*\{[^}]*display: none/s)
    for (const lines of [1, 2, 3]) {
      expect(css).toMatch(
        new RegExp(`\\.sfs-technical-sheet-card-row\\[data-lines='${lines}'\\]\\s*\\{[^}]*-webkit-line-clamp: ${lines}`, 's'),
      )
    }
    expect(css).toMatch(/\.sfs-technical-sheet-card-row\s*\{[^}]*overflow-wrap: anywhere/s)
    expect(css).toMatch(/\.sfs-technical-sheet-card-row\s*\{[^}]*color: var\(--color-semantic-functional-technical-sheet-text\)/s)
    expect(css).toMatch(/\.sfs-technical-sheet-card-row\s*\{[^}]*line-height: var\(--typography-line-height-semantic-detail-card-text\)/s)
    expect(css).toMatch(/\.sfs-technical-sheet-card-row dt,\s*\.sfs-technical-sheet-card-row dd\s*\{[^}]*display: inline/s)
  })
})
