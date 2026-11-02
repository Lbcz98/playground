import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { RULES } from '../src/shared/design-system/rules'
import { buildGuides, GUIDE_FILES } from './build-guides'
import { collectTokens, cssVarName } from './tokens/compile'
// @ts-expect-error plain .mjs, shared with the node checker
import { banForClass, banForCssVar } from './agent-token-bans.mjs'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const read = (f: string): string => readFileSync(join(ROOT, f), 'utf8')
const tokensJson = JSON.parse(read('tokens/tokens.json'))
const built = buildGuides(tokensJson)

describe('generated guides', () => {
  it('are up to date (run npm run guides:build)', () => {
    expect(read(GUIDE_FILES.tokens)).toBe(built.tokens)
    expect(read(GUIDE_FILES.rules)).toBe(built.rules)
    expect(read(GUIDE_FILES.explore)).toBe(built.explore)
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

  it('name every spacing, radius, border-width and type variable global.css defines, for HTML explorations', () => {
    const css = read('src/styles/global.css')
    for (const m of css.matchAll(/^\s*(--(?:dimension-(?:(?:spacing|radius|border-width)-core|(?:size|radius|spacing)-semantic)|typography)-[\w-]+):/gm)) {
      if (banForCssVar(m[1])) expect(built.explore, m[1]).not.toContain(`\`${m[1]}\``)
      else expect(built.explore, m[1]).toContain(`\`${m[1]}\``)
    }
    for (const m of css.matchAll(/^\.(text-[\w-]+) \{/gm)) {
      if (banForClass(m[1])) expect(built.explore, m[1]).not.toContain(`\`.${m[1]}\``)
      else expect(built.explore, m[1]).toContain(`\`.${m[1]}\``)
    }
  })

  it('hides tokens DESIGN.md bans from both agent guides, and keeps the replacements', () => {
    for (const guide of [built.tokens, built.explore]) {
      expect(guide).not.toContain('text-inverse')
      expect(guide).not.toContain('extra-bold')
      expect(guide).not.toContain('caption')
      expect(guide).toContain('background-primary')
    }
    expect(built.tokens).toContain('footnote-medium')
    expect(built.tokens).toContain('body-sm-bold')
    expect(built.explore).toContain('`.text-footnote-medium`')
    expect(built.explore).toContain('`.text-body-sm-bold`')
    expect(built.explore).toContain('`--typography-font-weight-bold`')
    expect(built.explore).toContain('`--typography-font-size-sm`')
    expect(built.explore).not.toContain('`--typography-font-size-xs`')
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
