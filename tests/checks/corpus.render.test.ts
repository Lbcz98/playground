import { afterAll, describe, expect } from 'vitest'
import { browserIt } from './browser'
import { CASES } from './corpus/cases'
import { cleanCorpus, runCase } from './run'

afterAll(cleanCorpus)

/** Missing Chromium fails; SKIP_BROWSER_TESTS=1 explicitly skips local browser coverage. */
describe('conformance corpus (render)', () => {
  for (const c of CASES.filter((c) => c.expect.render)) {
    browserIt(`${c.id}: ${c.title}`, async () => {
      const r = await runCase(c, true)
      expect(r.renderNotes).toEqual([])
      expect({ exit: r.exit, laws: r.laws, advisories: r.advisoryLaws }).toEqual({
        exit: c.expect.exit,
        laws: [...c.expect.laws].sort(),
        advisories: [...(c.expect.advisories ?? [])].sort(),
      })
      expect(r.deviations).toEqual(c.expect.deviations ?? [])
    }, 180_000)
  }
})
