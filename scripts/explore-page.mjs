// Opens an exploration in Chromium for the render checks: a folder (its index.html) or one part (parts/<N>.html, put into the template on the fly).
// A temporary copy is what gets opened, with the live server's /__explore/ links pointed at the repo's own files, so the page looks as it does live.
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { chromium } from 'playwright'
import { stitch } from './explore-stitch.mjs'

const here = (rel) => fileURLToPath(new URL(rel, import.meta.url))
const url = (file) => pathToFileURL(file).href

/** `{ page, close }`, or exits with 2 when Chromium cannot start. `width` is the viewport: 1280 by default, where the grid has 3 columns. */
export async function openExploration(target, width = 1280) {
  const browser = await chromium.launch().catch(() => null)
  if (!browser) { console.error('Chromium não subiu: rode `npm run browsers:install`'); process.exit(2) }
  const part = target.endsWith('.html') && /^\d+\.html$/.test(basename(target))
  const source = part
    ? stitch(readFileSync(here('../docs/explorations/_template/index.html'), 'utf8'), 'parte', [[parseInt(basename(target)), readFileSync(target, 'utf8')]])
    : readFileSync(join(target, 'index.html'), 'utf8')
  const html = source
    .replaceAll('/__explore/tokens.css', url(here('../src/styles/global.css')))
    .replaceAll('/__explore/inter.css', url(here('../node_modules/@fontsource-variable/inter/wght.css')))
    .replaceAll('../../../src/styles/global.css', url(here('../src/styles/global.css')))
  // ponytail: relative assets of an option (images) are not found from the temp folder; explorations draw with CSS and inline SVG.
  const dir = mkdtempSync(join(tmpdir(), 'explore-page-'))
  writeFileSync(join(dir, 'index.html'), html)
  const page = await browser.newPage({ viewport: { width, height: 800 } })
  await page.goto(url(join(dir, 'index.html')))
  await page.evaluate(() => document.fonts.ready)
  // The "carregando" states clear themselves after a moment (a timer); look at the page after that.
  // With no timer in the page, look once its entrance animations have ended (at most the same 1.3 s).
  if (/\bset(Timeout|Interval)\s*\(/.test(source)) await page.waitForTimeout(1300)
  else
    await page.evaluate(() => Promise.race([
      Promise.all(document.getAnimations().filter((a) => a.effect?.getComputedTiming().iterations !== Infinity).map((a) => a.finished.catch(() => {}))),
      new Promise((r) => setTimeout(r, 1300)),
    ]).then(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))))
  return { page, close: async () => { await browser.close(); rmSync(dir, { recursive: true, force: true }) }, resolve }
}
