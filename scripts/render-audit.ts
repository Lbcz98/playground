/**
 * The render-measured laws on screens written as TSX: opens each file in a headless
 * Chromium (a Vite server serving `render-harness/`), reads the frame into rectangles
 * (`measureFrame`) and runs the same pure `auditRender` the canvas runs — content cut
 * off by the card that clips it, content past the frame, text on top of text, text
 * squeezed to nothing, and a container that covers the frame with a background.
 *
 * Needs Playwright and a Chromium: `playwright` if the repo resolves it, else
 * `PLAYWRIGHT_PATH`, else the one in /opt/npm-tools; the browser from `CHROMIUM_PATH`
 * or Playwright's own. Without them `renderAuditFiles` throws `RenderAuditUnavailable`.
 */
import { existsSync } from 'node:fs'
import { createRequire } from 'node:module'
import { relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { createServer } from 'vite'
import { auditRenderIssues, type RenderIssue, type RenderMeasurement } from '../src/shared/layout/renderAudit'

const ROOT = fileURLToPath(new URL('..', import.meta.url))

export class RenderAuditUnavailable extends Error {}

type Playwright = { chromium: { launch(o?: Record<string, unknown>): Promise<Browser> } }
export type Browser = { newPage(o?: Record<string, unknown>): Promise<Page>; close(): Promise<void> }
export type Page = {
  keyboard: { press(key: string): Promise<void> }
  goto(url: string): Promise<unknown>
  waitForFunction(fn: string, arg?: unknown, o?: Record<string, unknown>): Promise<unknown>
  waitForTimeout(ms: number): Promise<void>
  evaluate<T>(fn: string): Promise<T>
  on(event: string, handler: (arg: { text?: () => string; message?: string }) => void): void
  close(): Promise<void>
}

function loadPlaywright(): Playwright {
  const require = createRequire(import.meta.url)
  const candidates = ['playwright', process.env.PLAYWRIGHT_PATH, '/opt/npm-tools/node_modules/playwright'].filter((c): c is string => !!c)
  for (const candidate of candidates) {
    try {
      return require(candidate) as Playwright
    } catch {
      // try the next
    }
  }
  throw new RenderAuditUnavailable('Playwright is not installed (npm i -D playwright, or set PLAYWRIGHT_PATH) — the render check was skipped.')
}

export type RenderResult =
  | {
      file: string
      problems: string[]
      issues: RenderIssue[]
      measured?: RenderMeasurement
      /** What the page reported for `prefers-reduced-motion`: the audit asks for `reduced`. */
      motion?: 'reduced' | 'full'
      /** How many measurements it took for two in a row to be equal. */
      settledAfter?: number
      error?: undefined
    }
  | { file: string; problems: []; issues: []; measured?: undefined; motion?: undefined; settledAfter?: undefined; error: string }

/** Reloads of the page tolerated while reading it. */
const RELOADS = 5
/** Between two measurements, ms. */
const SETTLE_STEP = 100
/** Measurements before giving up on a screen that keeps changing (about 3s). */
const SETTLE_TRIES = 30

/**
 * The render harness served (Vite, on `origin`) and a headless Chromium, for as long as `use` runs.
 * Throws `RenderAuditUnavailable` when Playwright or Chromium is missing.
 */
export async function withHarness<T>(use: (browser: Browser, origin: string) => Promise<T>): Promise<T> {
  const playwright = loadPlaywright()
  const executablePath = process.env.CHROMIUM_PATH ?? (existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined)
  const server = await createServer({
    configFile: false,
    root: ROOT,
    logLevel: 'silent',
    // `dedupe`: the flow player lives in web/app, next to web/node_modules — it must get the same React as the kit.
    resolve: { alias: { '@': resolve(ROOT, 'src'), 'next/link': resolve(ROOT, 'scripts/render-harness/next-link.tsx') }, dedupe: ['react', 'react-dom'] },
    plugins: [react()],
    server: { host: '127.0.0.1', port: 0 },
    optimizeDeps: { include: ['react', 'react-dom', 'react-dom/client', 'react/jsx-runtime', 'react/jsx-dev-runtime'] },
  })
  await server.listen()
  const address = server.httpServer?.address()
  const port = typeof address === 'object' && address ? address.port : 5173
  let browser: Browser | undefined
  try {
    browser = await playwright.chromium.launch({ executablePath, args: ['--no-sandbox'] }).catch((e: unknown) => {
      throw new RenderAuditUnavailable(`Chromium could not start (${String(e).split('\n')[0]}) — the render check was skipped.`)
    })
    return await use(browser, `http://127.0.0.1:${port}`)
  } finally {
    await browser?.close()
    await server.close()
  }
}

export function renderAuditFiles(files: string[]): Promise<RenderResult[]> {
  return withHarness(async (browser, origin) => {
    const results: RenderResult[] = []
    for (const file of files) {
      // Motion off (the kit stops its animations and transitions under `prefers-reduced-motion`): what is measured is the resting screen.
      const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, reducedMotion: 'reduce' })
      if (process.env.RENDER_AUDIT_DEBUG) {
        page.on('console', (m) => console.error('[page]', m.text?.()))
        page.on('pageerror', (e) => console.error('[page error]', e.message ?? e))
      }
      // The dev server may reload the page while it is being read (Vite re-optimizing dependencies on a cold cache,
      // which is every CI run): wait for the new page to be ready and read again. A read that lands on the new
      // document before it is ready (`__measure` not defined yet, or defined with nothing rendered) counts as the same.
      const onPage = async <T,>(read: () => Promise<T>): Promise<T> => {
        for (let attempt = 0; ; attempt++) {
          try {
            return await read()
          } catch (e) {
            if (attempt >= RELOADS || !/Execution context was destroyed|navigation|__measure is not a function/.test(String(e))) throw e
            await page.waitForFunction('window.__ready === true || window.__error', null, { timeout: 60_000 })
          }
        }
      }
      try {
        const url = `${origin}/scripts/render-harness/index.html?file=/${relative(ROOT, resolve(file))}`
        await page.goto(url)
        await page.waitForFunction('window.__ready === true || window.__error', null, { timeout: 60_000 })
        const failed = await onPage(() => page.evaluate<string | undefined>('window.__error'))
        if (failed) {
          results.push({ file, problems: [], issues: [], error: failed })
          continue
        }
        // Fonts and the first layout settle at their own pace: measure until two readings in a row are equal.
        // Only a page that says it is ready is measured: a freshly reloaded one defines `__measure` before it has rendered anything.
        const read = (): Promise<RenderMeasurement | { error: string }> =>
          onPage(async () => {
            const got = await page.evaluate<RenderMeasurement | { error: string } | { notReady: true }>('window.__ready === true ? window.__measure() : { notReady: true }')
            if ('notReady' in got) throw new Error('navigation: the page is not ready yet')
            return got
          })
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
        if ('error' in measured) results.push({ file, problems: [], issues: [], error: measured.error })
        else if (!settled) results.push({ file, problems: [], issues: [], error: `the screen was still changing after ${(SETTLE_TRIES * SETTLE_STEP) / 1000}s with motion off, so it cannot be measured` })
        else {
          const issues = auditRenderIssues(measured)
          const motion = (await onPage(() => page.evaluate<boolean>("matchMedia('(prefers-reduced-motion: reduce)').matches"))) ? 'reduced' : 'full'
          results.push({ file, problems: issues.map((i) => i.message), issues, measured, motion, settledAfter: reads })
        }
      } catch (e) {
        results.push({ file, problems: [], issues: [], error: String(e).split('\n')[0] })
      } finally {
        await page.close()
      }
    }
    return results
  })
}
