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
import { harnessPage, type Page } from './harness-page'
import { VIEWPORT } from './render-harness/protocol'

const ROOT = fileURLToPath(new URL('..', import.meta.url))

export class RenderAuditUnavailable extends Error {}

type Playwright = { chromium: { launch(o?: Record<string, unknown>): Promise<Browser> } }
type Browser = { newPage(o?: Record<string, unknown>): Promise<Page>; close(): Promise<void> }

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
      issues: RenderIssue[]
      measured?: RenderMeasurement
      /** What the page reported for `prefers-reduced-motion`: the audit asks for `reduced`. */
      motion?: 'reduced' | 'full'
      /** How many measurements it took for two in a row to be equal. */
      settledAfter?: number
      error?: undefined
    }
  | { file: string; issues: []; measured?: undefined; motion?: undefined; settledAfter?: undefined; error: string }

/**
 * The render harness served (Vite) and a headless Chromium, for as long as `use` runs; `newPage` opens a page on it.
 * Throws `RenderAuditUnavailable` when Playwright or Chromium is missing.
 */
export async function withHarness<T>(use: (newPage: () => Promise<ReturnType<typeof harnessPage>>) => Promise<T>): Promise<T> {
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
    const launched = browser
    return await use(async () => {
      // Motion off (the kit stops its animations and transitions under `prefers-reduced-motion`): what is read is the resting screen.
      const page = await launched.newPage({ viewport: VIEWPORT, reducedMotion: 'reduce' })
      if (process.env.RENDER_AUDIT_DEBUG) {
        page.on('console', (m) => console.error('[page]', m.text?.()))
        page.on('pageerror', (e) => console.error('[page error]', e.message ?? e))
      }
      return harnessPage(page, `http://127.0.0.1:${port}`)
    })
  } finally {
    await browser?.close()
    await server.close()
  }
}

export function renderAuditFiles(files: string[]): Promise<RenderResult[]> {
  return withHarness(async (newPage) => {
    const results: RenderResult[] = []
    for (const file of files) {
      const page = await newPage()
      try {
        const failed = await page.open({ file: relative(ROOT, resolve(file)) })
        if (failed) {
          results.push({ file, issues: [], error: failed })
          continue
        }
        const got = await page.measure()
        if ('error' in got) results.push({ file, issues: [], error: got.error })
        else {
          const issues = auditRenderIssues(got.measured)
          results.push({ file, issues, measured: got.measured, motion: got.motion, settledAfter: got.settledAfter })
        }
      } catch (e) {
        results.push({ file, issues: [], error: String(e).split('\n')[0] })
      } finally {
        await page.close()
      }
    }
    return results
  })
}
