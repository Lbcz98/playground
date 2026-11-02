// Opens an exploration in Chromium for the render checks: a folder (its index.html) or one part (parts/<N>.html, put into the template on the fly).
// A temporary copy is what gets opened, with the live server's /__explore/ links pointed at the repo's own files, so the page looks as it does live.
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { chromium } from 'playwright'
import { stitch } from './explore-stitch.mjs'

const here = (rel) => fileURLToPath(new URL(rel, import.meta.url))
const url = (file) => pathToFileURL(file).href
/** Agents read these pictures. Wider than this is shrunk so the read stays cheap. */
const MAX_SHOT = 800

const pngWidth = (buf) => (buf.length > 24 && buf[0] === 0x89 ? buf.readUInt32BE(16) : 0)

/** Writes `buf` only when the file's bytes would change. An unchanged path comes back prefixed, so a later read can skip it. */
export function commitShot(file, buf) {
  if (existsSync(file) && readFileSync(file).equals(buf)) return `inalterado: ${file}`
  writeFileSync(file, buf)
  return file
}

/** A PNG wider than `maxW`, redrawn at that width. Already narrow: the same buffer. */
export async function fitShot(browser, buf, maxW = MAX_SHOT) {
  if (pngWidth(buf) <= maxW) return buf
  const p = await browser.newPage()
  await p.setContent(`<img id="i" style="display:block;width:${maxW}px;height:auto">`)
  await p.locator('#i').evaluate((img, src) => { img.src = src }, `data:image/png;base64,${buf.toString('base64')}`)
  await p.locator('#i').evaluate((img) => (img.decode ? img.decode() : null))
  const out = await p.locator('#i').screenshot()
  await p.close()
  return out
}

/** Chromium, or exits with 2 when it cannot start. */
export async function launchChromium() {
  const browser = await chromium.launch().catch(() => null)
  if (!browser) { console.error('Chromium não subiu: rode `npm run browsers:install`'); process.exit(2) }
  return browser
}

/** `{ page, close }`, or exits with 2 when Chromium cannot start. `width` is the viewport: 1280 by default, where the grid has 3 columns. */
export async function openExploration(target, width = 1280) {
  const browser = await launchChromium()
  const part = target.endsWith('.html') && /^\d+\.html$/.test(basename(target))
  const source = part
    ? stitch(readFileSync(here('../docs/explorations/_template/index.html'), 'utf8'), 'parte', [[parseInt(basename(target)), readFileSync(target, 'utf8')]])
    : readFileSync(join(target, 'index.html'), 'utf8')
  let html = source
    .replaceAll('/__explore/tokens.css', url(here('../src/styles/global.css')))
    .replaceAll('/__explore/inter.css', url(here('../node_modules/@fontsource-variable/inter/wght.css')))
    .replaceAll('../../../src/styles/global.css', url(here('../src/styles/global.css')))
  // Relative assets of an option (assets/*.png, see scripts/icon-to-png.mjs) are found through a <base> on the exploration's own folder.
  if (!part) html = html.replace(/<head>/i, `<head><base href="${url(resolve(target)) + '/'}">`)
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
 * pressed in order on that card with the focus on it (opcao-<N>-<i>-<key>.png). With keys, the states of one card are also
 * laid side by side, labelled, in opcao-<N>-folha.png, and only the sheets are returned: one image to read per option
 * instead of one per key. Without keys, returns the resting PNGs.
 */
export async function shoot(page, out, keys = []) {
  checkShotsFolder(out)
  mkdirSync(out, { recursive: true })
  // The page's ring around the focused card is chrome: hidden, a key shot differs from the resting one only by what the option does.
  if (keys.length) await page.addStyleTag({ content: '.opt:focus, .opt:focus-visible { outline: none !important }' })
  const files = []
  const browser = page.context().browser()
  const snap = async (card, name) => {
    await card.scrollIntoViewIfNeeded()
    const buf = await fitShot(browser, await card.screenshot())
    return { buf, line: commitShot(join(out, name), buf) }
  }
  for (const card of await page.locator('.opt[data-option]').all()) {
    const n = await card.getAttribute('data-option')
    const first = await snap(card, `opcao-${n}.png`)
    const states = [['repouso', first.buf]]
    if (!keys.length) { files.push(first.line); continue }
    await card.focus()
    for (const [i, key] of keys.entries()) {
      await page.keyboard.press(key)
      // ponytail: a state a key handler reveals through a timer is shot before the timer fires; wait here if that ever matters.
      await settle(page)
      const shot = await snap(card, `opcao-${n}-${i + 1}-${key}.png`)
      states.push([`${i + 1} · ${key}`, shot.buf])
    }
    files.push(await sheet(page, join(out, `opcao-${n}-folha.png`), states))
  }
  return files
}

/** Screenshots are scratch: a folder inside the repo (outside docs/explorations/) would end up as untracked files at its root. */
export function checkShotsFolder(out) {
  const root = resolve(here('..')) + '/', abs = resolve(out) + '/'
  if (abs.startsWith(root) && !abs.startsWith(`${root}docs/explorations/`))
    throw new Error(`pasta de capturas dentro do repositório (${out}): use uma pasta temporária, como "$TMPDIR/explore-shots"`)
}

/** `checkShotsFolder` for a command line: a clean `erro:` and exit 1, before any browser opens. */
export function requireShotsFolder(out) {
  try { checkShotsFolder(out) } catch (e) { console.error(`erro: ${e.message}`); process.exit(1) }
}

/** The [label, png] states of one card side by side, wrapping after four, into `file`. Returns `file`. */
async function sheet(page, file, states) {
  const browser = page.context().browser()
  const p = await browser.newPage()
  const cols = Math.min(states.length, 4)
  const imgW = Math.max(80, Math.floor((MAX_SHOT - 16 * (cols + 1)) / cols))
  const cells = states.map(([label, png]) => `<figure><figcaption>${label}</figcaption><img style="width:${imgW}px;height:auto" src="data:image/png;base64,${png.toString('base64')}"></figure>`).join('')
  await p.setContent(`<body style="margin:0;background:#0b0b0d"><div id="s" style="display:inline-grid;grid-template-columns:repeat(${cols},auto);gap:16px;padding:16px;align-items:start;max-width:${MAX_SHOT}px">${cells}</div><style>figure{margin:0}figcaption{font:600 14px system-ui;color:#ccc;margin:0 0 6px}img{display:block}</style></body>`)
  const buf = await fitShot(browser, await p.locator('#s').screenshot())
  await p.close()
  return commitShot(file, buf)
}
