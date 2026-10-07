import { afterAll, describe, expect, it } from 'vitest'
import { CASES } from './corpus/cases'
import { cleanCorpus, runCase } from './run'

afterAll(cleanCorpus)

describe('conformance corpus (static + validator)', () => {
  it('has at least 16 cases with unique kebab-case ids and an entry file', () => {
    expect(CASES.length).toBeGreaterThanOrEqual(16)
    const ids = CASES.map((c) => c.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const c of CASES) {
      expect(c.id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/)
      expect(Object.keys(c.files)).toContain(c.entry)
    }
  })

  for (const c of CASES.filter((c) => !c.expect.render)) {
    it(`${c.id}: ${c.title}`, async () => {
      const r = await runCase(c, false)
      expect({ exit: r.exit, laws: r.laws }).toEqual({ exit: c.expect.exit, laws: [...c.expect.laws].sort() })
      expect(r.notRead).toBeGreaterThanOrEqual(c.expect.notRead ?? 0)
      if (c.expect.notRead === undefined) expect(r.notRead).toBe(0)
      expect(r.deviations).toEqual(c.expect.deviations ?? [])
    }, 120_000)
  }
})

describe('structured not-read and coverage', () => {
  it('reports kind, line and coverage; warnings stay human-readable', async () => {
    const c = CASES.find((x) => x.id === 'logic-map-clean')!
    const { checkLaws } = await import('../../scripts/check-laws')
    const { writeCase } = await import('./run')
    const r = checkLaws(writeCase(c))
    expect(r.notRead.map((n) => n.kind)).toContain('iteration')
    expect(r.notRead.every((n) => n.line > 0 && n.message)).toBe(true)
    expect(r.coverage.notRead).toBe(r.notRead.length)
    expect(r.coverage.read).toBeGreaterThan(3)
    expect(r.warnings).toHaveLength(r.notRead.length)
  })
})

describe('forbidden imports name the allowed forms', () => {
  for (const id of ['import-other-designer', 'import-escapes-folder', 'import-alias-store', 'import-npm-package', 'import-svg']) {
    it(id, async () => {
      const r = await runCase(CASES.find((c) => c.id === id)!, false)
      expect(r.problems.some((p) => /imports ".*" \(.*\) — allowed: react, @\/primitives, @\/ui-kit\/\*/.test(p))).toBe(true)
    }, 120_000)
  }
})
