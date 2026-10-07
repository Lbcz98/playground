import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { RULES } from '../src/shared/design-system/rules'
import { buildGuides, GUIDE_FILES } from './build-guides'
import { collectTokens, cssVarName } from './tokens/compile'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const read = (f: string): string => readFileSync(join(ROOT, f), 'utf8')
const tokensJson = JSON.parse(read('tokens/tokens.json'))
const built = buildGuides(tokensJson)

describe('generated guides', () => {
  it('are up to date (run npm run guides:build)', () => {
    expect(read(GUIDE_FILES.tokens)).toBe(built.tokens)
    expect(read(GUIDE_FILES.rules)).toBe(built.rules)
  })

  it('list every rule id', () => {
    for (const r of RULES) expect(built.rules, r.id).toContain(`\`${r.id}\``)
  })

  it('never list a core token', () => {
    for (const t of collectTokens(tokensJson).filter((t) => t.path.includes('core'))) {
      expect(built.tokens, t.path.join('.')).not.toContain(`\`${t.path.join('.')}\``)
      expect(built.tokens, cssVarName(t.path)).not.toContain(cssVarName(t.path))
    }
  })

  it('do not depend on input order', () => {
    const rev = (o: Record<string, unknown>): Record<string, unknown> =>
      Object.fromEntries(
        Object.entries(o)
          .reverse()
          .map(([k, v]) => [k, v && typeof v === 'object' && !Array.isArray(v) ? rev(v as Record<string, unknown>) : v]),
      )
    expect(buildGuides(rev(tokensJson), [...RULES].reverse() as never)).toEqual(built)
  })
})
