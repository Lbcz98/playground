// Opens an exploration in Chromium for the render checks: a folder (its index.html) or one part (parts/<N>.html, put into the template on the fly).
// A temporary copy is what gets opened, with the live server's /__explore/ links pointed at the repo's own files, so the page looks as it does live.
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
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
  // Counts the timers the page starts while it loads; one in a key handler never runs here.
  await page.addInitScript(() => {
    window.__loadTimers = 0
    for (const k of ['setTimeout', 'setInterval']) {
      const f = window[k]
      window[k] = function (...a) { window.__loadTimers++; return f.apply(this, a) }
    }
  })
  await page.goto(url(join(dir, 'index.html')))
  await page.evaluate(() => document.fonts.ready)
  // The "carregando" states clear themselves after a moment (a timer started on load); look at the page after that.
  if (await page.evaluate(() => window.__loadTimers)) await page.waitForTimeout(1300)
  await settle(page)
  return { page, close: async () => { await browser.close(); rmSync(dir, { recursive: true, force: true }) }, resolve }
}

/** Entrance animations and transitions jump to their end; looping ones keep running. */
export const settle = (page) => page.evaluate(() => {
  for (const a of document.getAnimations()) if (a.effect?.getComputedTiming().iterations !== Infinity) try { a.finish() } catch {}
  return new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
})

/**
 * One PNG per option card into `out` (opcao-<N>.png), and with `keys` (e.g. ['ArrowRight', 'Enter']) one more after each key,
 * pressed in order on that card with the focus on it (opcao-<N>-<i>-<key>.png). Returns the paths.
 */
export async function shoot(page, out, keys = []) {
  mkdirSync(out, { recursive: true })
  // The page's ring around the focused card is chrome: hidden, a key shot differs from the resting one only by what the option does.
  if (keys.length) await page.addStyleTag({ content: '.opt:focus, .opt:focus-visible { outline: none !important }' })
  const files = []
  const snap = async (card, name) => { await card.scrollIntoViewIfNeeded(); await card.screenshot({ path: join(out, name) }); files.push(join(out, name)) }
  for (const card of await page.locator('.opt[data-option]').all()) {
    const n = await card.getAttribute('data-option')
    await snap(card, `opcao-${n}.png`)
    if (!keys.length) continue
    await card.focus()
    for (const [i, key] of keys.entries()) {
      await page.keyboard.press(key)
      // ponytail: a state a key handler reveals through a timer is shot before the timer fires; wait here if that ever matters.
      await settle(page)
      await snap(card, `opcao-${n}-${i + 1}-${key}.png`)
    }
  }
  return files
}
