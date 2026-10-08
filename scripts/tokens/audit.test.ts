import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { AUDITED_DIRS, auditComponents } from './audit'
import { TOKENS_SOURCE } from './compile'

const ROOT = fileURLToPath(new URL('../..', import.meta.url))
const TOKENS = JSON.parse(readFileSync(join(ROOT, TOKENS_SOURCE), 'utf8'))
const audits = auditComponents(ROOT, TOKENS)

describe(`token discipline in ${AUDITED_DIRS.join(' and ')}`, () => {
  it('audits every component file', () => {
    expect(audits.some((a) => a.file.startsWith('src/ui-kit/'))).toBe(true)
    expect(audits.some((a) => a.file.startsWith('src/primitives/'))).toBe(true)
  })

  it('references no core token — only semantic tokens and the typed layout scales', () => {
    const leaks = audits.filter((a) => a.core.size).map((a) => `${a.file}: ${[...a.core.keys()].join(', ')}`)
    expect(leaks, 'reach for the semantic alias (or add one to tokens.json)').toEqual([])
  })

  it('lets a stylesheet name the layout scales spacing() and radius() give TSX, and nothing else from core', () => {
    const root = mkdtempSync(join(tmpdir(), 'token-audit-'))
    for (const dir of AUDITED_DIRS) mkdirSync(join(root, dir), { recursive: true })
    const css =
      '.a { gap: var(--dimension-spacing-core-2xs); border-radius: var(--dimension-radius-core-lg);' +
      ' padding: var(--dimension-spacing-core-md); border-width: var(--dimension-border-width-core-thin); }'
    writeFileSync(join(root, 'src/ui-kit/a.css'), css)
    writeFileSync(join(root, 'src/ui-kit/a.ts'), `export const gap = '--dimension-spacing-core-2xs'`)
    const core = Object.fromEntries(auditComponents(root, TOKENS).map((a) => [a.file, [...a.core.keys()]]))
    // `md` is off the layout grid (spacing() refuses it); a border width is not a layout scale.
    expect(core['src/ui-kit/a.css']).toEqual(['--dimension-spacing-core-md', '--dimension-border-width-core-thin'])
    // TSX still goes through the typed helpers.
    expect(core['src/ui-kit/a.ts']).toEqual(['--dimension-spacing-core-2xs'])
  })

  it('writes no untyped var(--…) string — token(), size() and spacing() type-check the name', () => {
    expect(audits.filter((a) => a.untypedVars).map((a) => `${a.file}: ${a.untypedVars}`)).toEqual([])
  })

  it('applies no .text-* class as a raw string — use <Text> or textClass()', () => {
    expect(audits.filter((a) => a.rawTextClasses).map((a) => `${a.file}: ${a.rawTextClasses}`)).toEqual([])
  })

  it('uses no measured size outside tokens.json', () => {
    expect(audits.filter((a) => a.measuredSizes).map((a) => `${a.file}: ${a.measuredSizes}`)).toEqual([])
  })
})
