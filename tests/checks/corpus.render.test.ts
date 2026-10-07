import { afterAll, describe, expect, it } from 'vitest'
import { CASES } from './corpus/cases'
import { cleanCorpus, runCase } from './run'

afterAll(cleanCorpus)

/** Needs Playwright and a Chromium; where they are missing each case skips itself (a skip is not a pass). */
describe('conformance corpus (render)', () => {
  for (const c of CASES.filter((c) => c.expect.render)) {
    it(`${c.id}: ${c.title}`, async () => {
      const r = await runCase(c, true)
      if (r.skipped) return void console.warn(`skipped ${c.id}: ${r.skipped}`)
      expect({ exit: r.exit, laws: r.laws, advisories: r.advisoryLaws }).toEqual({
        exit: c.expect.exit,
        laws: [...c.expect.laws].sort(),
        advisories: [...(c.expect.advisories ?? [])].sort(),
      })
      expect(r.deviations).toEqual(c.expect.deviations ?? [])
    }, 180_000)
  }
})
