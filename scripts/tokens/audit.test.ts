import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { AUDITED_DIRS, auditComponents } from './audit'
import { TOKENS_SOURCE } from './compile'

const ROOT = fileURLToPath(new URL('../..', import.meta.url))
const audits = auditComponents(ROOT, JSON.parse(readFileSync(join(ROOT, TOKENS_SOURCE), 'utf8')))

describe(`token discipline in ${AUDITED_DIRS.join(' and ')}`, () => {
  it('audits every component file', () => {
    expect(audits.some((a) => a.file.startsWith('src/ui-kit/'))).toBe(true)
    expect(audits.some((a) => a.file.startsWith('src/primitives/'))).toBe(true)
  })

  it('references no core token — only semantic tokens and the typed layout scales', () => {
    const leaks = audits.filter((a) => a.core.size).map((a) => `${a.file}: ${[...a.core.keys()].join(', ')}`)
    expect(leaks, 'reach for the semantic alias (or add one to tokens.json)').toEqual([])
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
