/**
 * The render harness page (`render-harness/main.tsx`) as the scripts use it: open a screen or a flow, wait until
 * it is rendered, read it. The `window.__…` it answers with, the address, the viewport and the wait for a page
 * that reloads while it is read are here and nowhere else; `render-audit.ts` and `flow-probe.ts` call these.
 */
import type { RenderMeasurement } from '../src/shared/layout/renderAudit'
import { harnessUrl, type HarnessWindow, type Target } from './render-harness/protocol'

export type Page = {
  keyboard: { press(key: string): Promise<void> }
  goto(url: string): Promise<unknown>
  waitForFunction(fn: string, arg?: unknown, o?: Record<string, unknown>): Promise<unknown>
  waitForTimeout(ms: number): Promise<void>
  evaluate<T>(fn: string): Promise<T>
  on(event: string, handler: (arg: { text?: () => string; message?: string }) => void): void
  close(): Promise<void>
}

/** The page was reloaded under a read or a key press (the dev server re-optimizing dependencies on a cold cache, which is every CI run). */
export class Reloaded extends Error {}

/** Reloads of the page tolerated while reading it. */
const RELOADS = 5
/** Between two measurements, ms. */
const SETTLE_STEP = 100
/** Measurements before giving up on a screen that keeps changing (about 3s). */
const SETTLE_TRIES = 30

export function harnessPage(page: Page, origin: string) {
  const ready = (): Promise<unknown> => page.waitForFunction('window.__ready === true || window.__error', null, { timeout: 60_000 })
  /** A read that does not depend on where the page was: on a reload, wait for the new page to be ready and read again. */
  const retrying = async <T,>(read: () => Promise<T>): Promise<T> => {
    for (let attempt = 0; ; attempt++) {
      try {
        return await read()
      } catch (e) {
        if (!(e instanceof Reloaded) || attempt >= RELOADS) throw e
        await ready()
      }
    }
  }
  /** The page's own errors, with the ones a reload causes told apart. */
  const onPage = <T,>(run: Promise<T>): Promise<T> =>
    run.catch((e: unknown) => {
      throw /Execution context was destroyed|navigation|__\w+ is not a function/.test(String(e)) ? new Reloaded(String(e)) : e
    })
  const evaluate = <T,>(js: string): Promise<T> => onPage(page.evaluate<T>(js))

  /**
   * What a `window.__…()` of the page answers, asked only of a page that says it is ready: a reloaded document
   * defines the functions before it has rendered anything, and would answer 'no <Screen> rendered'.
   */
  const ask = async <K extends 'measure'>(name: K): Promise<ReturnType<HarnessWindow[`__${K}`]>> => {
    const got = await evaluate<ReturnType<HarnessWindow[`__${K}`]> | { notReady: true }>(`window.__ready === true ? window.__${name}() : { notReady: true }`)
    if ('notReady' in got) throw new Reloaded('navigation: the page is not ready yet')
    return got
  }

  return {
    close: (): Promise<void> => page.close(),
    /** Shows a screen or a flow and waits until the page says it is ready. Resolves to why it failed, if it did. */
    async open(target: Target): Promise<string | undefined> {
      await onPage(page.goto(origin + harnessUrl(target)))
      await ready()
      return retrying(() => evaluate<string | undefined>('window.__error'))
    },
    /** The frame read into rectangles once two readings in a row are equal; `error`: what stopped it. */
    async measure(): Promise<{ measured: RenderMeasurement; motion: 'reduced' | 'full'; settledAfter: number } | { error: string }> {
      const read = (): Promise<RenderMeasurement | { error: string }> => retrying(() => ask('measure'))
      let measured = await read()
      let reads = 1
      let settled = false
      while (!settled && !('error' in measured) && reads < SETTLE_TRIES) {
        await page.waitForTimeout(SETTLE_STEP)
        const next = await read()
        reads++
        settled = JSON.stringify(next) === JSON.stringify(measured)
        measured = next
      }
      if ('error' in measured) return measured
      if (!settled) return { error: `the screen was still changing after ${(SETTLE_TRIES * SETTLE_STEP) / 1000}s with motion off, so it cannot be measured` }
      const motion = (await retrying(() => evaluate<boolean>("matchMedia('(prefers-reduced-motion: reduce)').matches"))) ? 'reduced' : 'full'
      return { measured, motion, settledAfter: reads }
    },
  }
}
