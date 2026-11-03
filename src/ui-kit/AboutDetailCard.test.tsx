import { readFileSync } from 'node:fs'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { AboutDetailCard } from './AboutDetailCard'

const css = readFileSync(new URL('./ui-kit.css', import.meta.url), 'utf8')
const render = (props: Partial<Parameters<typeof AboutDetailCard>[0]> = {}): string =>
  renderToStaticMarkup(
    <AboutDetailCard
      logo={{ src: 'program.png', alt: 'Encontro' }}
      title="Encontro com Patrícia Poeta"
      description="Com pautas variadas e atuais."
      rating="10"
      year="2022"
      category="Variedades"
      genres={['Programa de Auditório', 'Entrevista']}
      country="Brasil"
      {...props}
    />,
  )

describe('<AboutDetailCard>', () => {
  it('renders an informational article with a semantic title and described image', () => {
    const out = render()
    expect(out).toContain('<article class="sfs-about-detail-card">')
    expect(out).toContain('<span class="sfs-about-detail-card-logo-frame"><img class="sfs-about-detail-card-logo" src="program.png" alt="Encontro"')
    expect(out).toContain('<h2 class="text-heading-5-bold sfs-about-detail-card-title">Encontro com Patrícia Poeta</h2>')
    expect(out).toContain('<p class="text-body-md-medium sfs-about-detail-card-description">Com pautas variadas e atuais.</p>')
  })

  it('keeps the rating meaningful and lists only metadata that exists', () => {
    const out = render({ category: undefined, country: undefined })
    expect(out).toContain(
      '<span class="text-body-sm-bold sfs-about-detail-card-rating" data-rating="10" style="--_rating-background:var(--color-semantic-functional-rating-10)">10</span>',
    )
    expect(out).toContain('<li>2022</li>')
    expect(out).toContain('<li>Programa de Auditório, Entrevista</li>')
    expect(out).not.toContain('<li></li>')
    expect(out).not.toContain('Variedades')
    expect(out).not.toContain('Brasil')
  })

  it('uses the exported rating vocabulary and fills each tag with its own colour', () => {
    const fills = { L: 'free', '6': '6', '10': '10', '12': '12', '14': '14', '16': '16', '18': '18' } as const
    for (const [rating, fill] of Object.entries(fills)) {
      const out = render({ rating: rating as keyof typeof fills })
      expect(out).toContain(`data-rating="${rating}"`)
      expect(out).toContain(`style="--_rating-background:var(--color-semantic-functional-rating-${fill})"`)
    }
  })

  it('uses the documented 24px standard rating tag geometry and role colors', () => {
    expect(css).toMatch(/\.sfs-about-detail-card-rating\s*\{[^}]*box-sizing: border-box/s)
    expect(css).toMatch(/\.sfs-about-detail-card-rating\s*\{[^}]*width: var\(--dimension-size-semantic-icon-lg\)/s)
    expect(css).toMatch(/\.sfs-about-detail-card-rating\s*\{[^}]*height: var\(--dimension-size-semantic-icon-lg\)/s)
    expect(css).toMatch(/\.sfs-about-detail-card-rating\s*\{[^}]*padding: var\(--dimension-spacing-semantic-badge-inset\)/s)
    expect(css).toMatch(/\.sfs-about-detail-card-rating\s*\{[^}]*border: var\(--dimension-border-width-semantic-badge\) solid transparent/s)
    expect(css).toMatch(/\.sfs-about-detail-card-rating\s*\{[^}]*var\(--gradient-semantic-border-rating\) border-box/s)
    expect(css).toMatch(/\.sfs-about-detail-card-rating\s*\{[^}]*border-radius: var\(--dimension-radius-core-xs\)/s)
    expect(css).toMatch(/\.sfs-about-detail-card-rating\s*\{[^}]*linear-gradient\(var\(--_rating-background\), var\(--_rating-background\)\) padding-box/s)
    expect(css).toMatch(/data-rating='18'\]\s*\{[^}]*color: var\(--color-semantic-functional-rating-18-text\)/s)
  })

  it('uses the card tokens and clamps stress content without reserving height', () => {
    expect(css).toMatch(/\.sfs-about-detail-card\s*\{[^}]*width: calc\(87 \* var\(--dimension-spacing-core-2xs\)\)/s)
    expect(css).toMatch(/\.sfs-about-detail-card\s*\{[^}]*gap: 0/s)
    expect(css).toMatch(/\.sfs-about-detail-card\s*\{[^}]*border-radius: var\(--dimension-radius-core-2xl\)/s)
    expect(css).toMatch(/\.sfs-about-detail-card\s*\{[^}]*padding: var\(--dimension-spacing-semantic-about-card-inset\)/s)
    expect(css).toMatch(/\.sfs-about-detail-card > \.sfs-resting-border\s*\{[^}]*background: var\(--gradient-semantic-border-about-card\)/s)
    expect(css).toMatch(/\.sfs-about-detail-card-header\s*\{[^}]*margin-bottom: var\(--dimension-spacing-core-2xs\)/s)
    expect(css).toMatch(/\.sfs-about-detail-card-description\s*\{[^}]*margin-bottom: var\(--dimension-spacing-core-xs\)/s)
    expect(css).toMatch(/\.sfs-about-detail-card-description\s*\{[^}]*color: var\(--color-semantic-functional-text-bright\)/s)
    expect(css).toMatch(/\.sfs-about-detail-card-title\s*\{[^}]*-webkit-line-clamp: 2/s)
    expect(css).toMatch(/\.sfs-about-detail-card-description\s*\{[^}]*-webkit-line-clamp: 3/s)
    expect(css).toMatch(/\.sfs-about-detail-card-logo-frame\s*\{[^}]*background: var\(--gradient-semantic-border-about-card\)/s)
    expect(css).toMatch(/\.sfs-about-detail-card-metadata\s*\{[^}]*text-overflow: ellipsis/s)
    expect(css).not.toMatch(/\.sfs-about-detail-card\s*\{[^}]*min-height:/s)
  })
})
