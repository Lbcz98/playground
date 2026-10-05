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
import { auditRender, type RenderMeasurement } from '../src/shared/layout/renderAudit'

const ROOT = fileURLToPath(new URL('..', import.meta.url))

export class RenderAuditUnavailable extends Error {}

type Playwright = { chromium: { launch(o?: Record<string, unknown>): Promise<Browser> } }
type Browser = { newPage(o?: Record<string, unknown>): Promise<Page>; close(): Promise<void> }
type Page = {
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

export type RenderResult = { file: string; problems: string[]; error?: undefined } | { file: string; problems: []; error: string }

export async function renderAuditFiles(files: string[]): Promise<RenderResult[]> {
  const playwright = loadPlaywright()
  const executablePath = process.env.CHROMIUM_PATH ?? (existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined)
  const server = await createServer({
    configFile: false,
    root: ROOT,
    logLevel: 'silent',
    resolve: { alias: { '@': resolve(ROOT, 'src') } },
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
    const results: RenderResult[] = []
    for (const file of files) {
      const page = await browser.newPage({ viewport: { width: 1280, height: 720 } })
      if (process.env.RENDER_AUDIT_DEBUG) {
        page.on('console', (m) => console.error('[page]', m.text?.()))
        page.on('pageerror', (e) => console.error('[page error]', e.message ?? e))
      }
      try {
        const url = `http://127.0.0.1:${port}/scripts/render-harness/index.html?file=/${relative(ROOT, resolve(file))}`
        await page.goto(url)
        await page.waitForFunction('window.__ready === true || window.__error', null, { timeout: 60_000 })
        const failed = await page.evaluate<string | undefined>('window.__error')
        if (failed) {
          results.push({ file, problems: [], error: failed })
          continue
        }
        await page.waitForTimeout(300) // fonts and the first layout settle
        const measured = await page.evaluate<RenderMeasurement | { error: string }>('window.__measure()')
        if ('error' in measured) results.push({ file, problems: [], error: measured.error })
        else results.push({ file, problems: auditRender(measured) })
      } catch (e) {
        results.push({ file, problems: [], error: String(e).split('\n')[0] })
      } finally {
        await page.close()
      }
    }
    return results
  } finally {
    await browser?.close()
    await server.close()
  }
}
