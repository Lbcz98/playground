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
