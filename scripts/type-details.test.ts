import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const read = (f: string) => readFileSync(join(__dirname, '..', f), 'utf8')
/** The declarations of the first rule that starts with `selector`. */
const rule = (css: string, selector: string) => new RegExp(`(?:^|\\n)${selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\{([^}]*)\\}`).exec(css)?.[1] ?? ''

// Type details that cost nothing and are felt: light text on dark renders thinner and crisper with grayscale smoothing,
// and numbers that update keep their width. The rule: design-brain/references/conceitos/tipografia-de-detalhe.md.
describe('type details', () => {
  it('smooths the text of the app and of an exploration page once, on the document', () => {
    expect(rule(read('src/index.css'), 'body')).toContain('-webkit-font-smoothing: antialiased')
    expect(rule(read('docs/explorations/_template/index.html'), 'body')).toContain('-webkit-font-smoothing: antialiased')
  })
  it('keeps the digits of a table cell the same width, since its stats, values and goals change during a match', () => {
    expect(rule(read('src/ui-kit/ui-kit.css'), '.sfs-table-cell')).toContain('font-variant-numeric: tabular-nums')
  })
})
