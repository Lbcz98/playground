import { describe, expect, it } from 'vitest'
import { harnessPage, Reloaded, type Page } from './harness-page'

const ORIGIN = 'http://harness'

/** A page that answers `evaluate` from a script (an Error in it is thrown) and counts how often it was waited on. */
function fakePage(script: unknown[], motion = true, waiting?: Error) {
  const calls = { waitedReady: 0, expressions: [] as string[], opened: [] as string[] }
  const page = {
    evaluate: async (expression: string) => {
      calls.expressions.push(expression)
      if (/matchMedia/.test(expression)) return motion
      const next = script.shift()
      if (next instanceof Error) throw next
      return next
    },
    goto: async (url: string) => void calls.opened.push(url),
    waitForFunction: async () => {
      calls.waitedReady++
      if (waiting) throw waiting
    },
    waitForTimeout: async () => {},
  } as unknown as Page
  return { page, calls }
}
const destroyed = () => new Error('page.evaluate: Execution context was destroyed, most likely because of a navigation')

describe('measuring through a page that reloads', () => {
  it('waits for the page to be ready again, and reads again', async () => {
    const { page, calls } = fakePage([destroyed(), { n: 1 }, { n: 1 }])
    expect(await harnessPage(page, ORIGIN).measure()).toEqual({ measured: { n: 1 }, motion: 'reduced', settledAfter: 2 })
    expect(calls.waitedReady).toBe(1)
  })

  // A reloaded document defines `__measure` before it has rendered anything: it would answer 'no <Screen> rendered'.
  it('reads only a page that says it is ready', async () => {
    const { page, calls } = fakePage([{ notReady: true }, { n: 1 }, { n: 1 }])
    expect(await harnessPage(page, ORIGIN).measure()).toMatchObject({ measured: { n: 1 }, settledAfter: 2 })
    expect(calls.waitedReady).toBe(1)
    expect(calls.expressions[0]).toMatch(/^window\.__ready === true \?/)
  })

  it('gives up after 5 reloads, with the page error', async () => {
    const { page } = fakePage(Array.from({ length: 6 }, destroyed))
    await expect(harnessPage(page, ORIGIN).measure()).rejects.toThrow(/Execution context was destroyed/)
  })

  it('does not hide an error that is not a reload', async () => {
    const { page, calls } = fakePage([new Error('page.evaluate: Target closed')])
    await expect(harnessPage(page, ORIGIN).measure()).rejects.toThrow(/Target closed/)
    expect(calls.waitedReady).toBe(0)
  })

  it('reports a screen that keeps changing instead of measuring it mid-change', async () => {
    const { page } = fakePage(Array.from({ length: 40 }, (_, n) => ({ n })))
    expect(await harnessPage(page, ORIGIN).measure()).toEqual({ error: 'the screen was still changing after 3s with motion off, so it cannot be measured' })
  })

  it('passes on what the page could not measure', async () => {
    const { page } = fakePage([{ error: 'no <Screen> rendered' }])
    expect(await harnessPage(page, ORIGIN).measure()).toEqual({ error: 'no <Screen> rendered' })
  })
})

describe('opening a screen or a flow', () => {
  it('goes to the harness page, waits for it to be ready and says what it failed with', async () => {
    const { page, calls } = fakePage(['Error: no such screen'])
    expect(await harnessPage(page, ORIGIN).open({ file: 'src/x.tsx' })).toBe('Error: no such screen')
    expect(calls.opened).toEqual(['http://harness/scripts/render-harness/index.html?file=/src/x.tsx'])
    expect(calls.waitedReady).toBe(1)
  })

  it('has nothing to say about a page that rendered, even if it reloads while that is asked', async () => {
    const { page, calls } = fakePage([destroyed(), undefined])
    expect(await harnessPage(page, ORIGIN).open({ flow: 'web/protos/x/flow' })).toBeUndefined()
    expect(calls.opened).toEqual(['http://harness/scripts/render-harness/index.html?flow=/web/protos/x/flow'])
    expect(calls.waitedReady).toBe(2)
  })
})

describe('playing a flow', () => {
  it('says whether a state came on screen: not within the time is no, a page that went away is a reload', async () => {
    expect(await harnessPage(fakePage([]).page, ORIGIN).arrives('rail')).toBe(true)
    expect(await harnessPage(fakePage([], true, new Error('page.waitForFunction: Timeout 10000ms exceeded.')).page, ORIGIN).arrives('rail')).toBe(false)
    await expect(harnessPage(fakePage([], true, new Error('page.waitForFunction: Target closed')).page, ORIGIN).arrives('rail')).rejects.toBeInstanceOf(Reloaded)
  })
})
