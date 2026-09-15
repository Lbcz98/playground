/**
 * Visual regression for the Storybook stories — `npm run test:visual`.
 *
 * Runs as an Electron main process (Electron is already a dependency, so there
 * is no browser to download): renders every `UI Kit/*` and `Primitives/*` story
 * offscreen at the 1280×720 frame, compares it pixel by pixel against
 * tests/visual/baselines/, and writes a side-by-side report to
 * tests/visual/.output/report.html.
 *
 *   npm run test:visual                    compare; exits 1 on any change
 *   npm run test:visual -- --only=wide     just the stories whose id contains "wide"
 *   npm run test:visual:update             accept the current renders as baselines
 *
 * Accept only after reading the report. Needs Storybook running
 * (`npm run storybook`, or point STORYBOOK_URL at one).
 */

import { app, BrowserWindow, nativeImage } from 'electron'
import { existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('../..', import.meta.url))
const BASELINES = join(ROOT, 'tests', 'visual', 'baselines')
const OUTPUT = join(ROOT, 'tests', 'visual', '.output')
const STORYBOOK = (process.env.STORYBOOK_URL ?? 'http://localhost:6006').replace(/\/$/, '')
const UPDATE = process.argv.includes('--update')
const ONLY = process.argv.find((arg) => arg.startsWith('--only='))?.slice('--only='.length)

const STORY_IDS = /^(ui-kit|primitives)-/
const VIEWPORT = { width: 1280, height: 720 }
/** Per-channel difference (0–255) treated as anti-aliasing noise, not a change. */
const CHANNEL_TOLERANCE = 8

const FREEZE_CSS =
  '*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}'

/** Runs inside the story page: freeze motion, then wait for render, fonts, images and scrolling to settle. */
async function settle(freezeCss) {
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
  const style = document.createElement('style')
  style.textContent = freezeCss
  document.head.append(style)

  const failed = () => document.body.classList.contains('sb-show-errordisplay')
  const root = document.getElementById('storybook-root')
  for (let i = 0; i < 200 && !root?.childElementCount && !failed(); i++) await sleep(25)
  if (failed()) return { error: document.getElementById('error-message')?.textContent || 'story failed to render' }
  if (!root?.childElementCount) return { error: 'story rendered nothing' }

  await document.fonts.ready
  await Promise.all(
    [...document.images].map((img) =>
      img.complete ? null : new Promise((resolve) => (img.onload = img.onerror = resolve)),
    ),
  )
  // InteractivityMenu smooth-scrolls its active card into view.
  const scrollState = () => [...document.querySelectorAll('*')].map((el) => `${el.scrollLeft},${el.scrollTop}`).join()
  let previous = ''
  for (let i = 0; i < 40; i++) {
    await sleep(100)
    const now = scrollState()
    if (now === previous) break
    previous = now
  }
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
  return { error: null }
}

function compare(baseline, current) {
  const size = baseline.getSize()
  const { width, height } = current.getSize()
  if (size.width !== width || size.height !== height) {
    return { changed: width * height, ratio: 1, diff: null, note: `size ${size.width}×${size.height} → ${width}×${height}` }
  }
  const a = baseline.toBitmap()
  const b = current.toBitmap()
  const diff = Buffer.alloc(a.length)
  let changed = 0
  for (let i = 0; i < a.length; i += 4) {
    const delta = Math.max(
      Math.abs(a[i] - b[i]),
      Math.abs(a[i + 1] - b[i + 1]),
      Math.abs(a[i + 2] - b[i + 2]),
      Math.abs(a[i + 3] - b[i + 3]),
    )
    if (delta > CHANNEL_TOLERANCE) {
      changed++
      diff.set([0, 0, 255, 255], i) // BGRA: red
    } else {
      const gray = Math.round(((a[i] + a[i + 1] + a[i + 2]) / 3) * 0.35)
      diff.set([gray, gray, gray, 255], i)
    }
  }
  return {
    changed,
    ratio: changed / (width * height),
    diff: changed ? nativeImage.createFromBitmap(diff, { width, height }) : null,
  }
}

function writeReport(results) {
  const escape = (s) => String(s).replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`)
  const img = (image, label) =>
    image ? `<figure><figcaption>${label}</figcaption><img src="${image.toDataURL()}"></figure>` : ''
  const rows = results
    .map(
      (r) =>
        `<tr class="${r.status}"><td>${escape(r.id)}</td><td>${r.status}</td><td>${
          r.changed === undefined ? '' : `${r.changed} px (${(r.ratio * 100).toFixed(3)}%)`
        }</td><td>${escape(r.note ?? '')}</td></tr>`,
    )
    .join('\n')
  const details = results
    .filter((r) => r.status === 'changed' || r.status === 'new')
    .map(
      (r) =>
        `<section><h2>${escape(r.id)} — ${r.status}</h2><div class="shots">${img(r.baseline, 'baseline')}${img(
          r.current,
          'current',
        )}${img(r.diff, 'diff (red = changed)')}</div></section>`,
    )
    .join('\n')
  writeFileSync(
    join(OUTPUT, 'report.html'),
    `<!doctype html><meta charset="utf-8"><title>Visual regression</title>
<style>
body{font:14px system-ui,sans-serif;margin:24px;background:#fafafa;color:#111}
table{border-collapse:collapse;margin-bottom:32px}td{padding:4px 12px;border-bottom:1px solid #ddd}
tr.changed td,tr.error td,tr.new td,tr.removed td{background:#fde8e8}
.shots{display:flex;gap:12px;overflow-x:auto}figure{margin:0}img{max-width:640px;border:1px solid #ccc}
</style>
<h1>Visual regression — ${new Date().toISOString()}</h1>
<table><tr><th>Story</th><th>Status</th><th>Changed</th><th>Note</th></tr>${rows}</table>
${details}`,
  )
}

async function run() {
  const response = await fetch(`${STORYBOOK}/index.json`).catch(() => null)
  if (!response?.ok) throw new Error(`No Storybook at ${STORYBOOK} — run \`npm run storybook\` first.`)
  const index = await response.json()
  const ids = Object.values(index.entries)
    .filter((entry) => entry.type === 'story' && STORY_IDS.test(entry.id) && (!ONLY || entry.id.includes(ONLY)))
    .map((entry) => entry.id)
    .sort()

  rmSync(OUTPUT, { recursive: true, force: true })
  mkdirSync(OUTPUT, { recursive: true })
  mkdirSync(BASELINES, { recursive: true })

  const win = new BrowserWindow({
    show: false,
    useContentSize: true,
    ...VIEWPORT,
    webPreferences: { offscreen: true },
  })

  const results = []
  for (const id of ids) {
    await win.loadURL(`${STORYBOOK}/iframe.html?id=${encodeURIComponent(id)}&viewMode=story`)
    const { error } = await win.webContents.executeJavaScript(`(${settle})(${JSON.stringify(FREEZE_CSS)})`)
    if (error) {
      results.push({ id, status: 'error', note: error })
      continue
    }
    const current = await win.webContents.capturePage()
    const file = join(BASELINES, `${id}.png`)
    if (UPDATE) {
      writeFileSync(file, current.toPNG())
      results.push({ id, status: 'updated' })
    } else if (!existsSync(file)) {
      results.push({ id, status: 'new', current })
    } else {
      const baseline = nativeImage.createFromPath(file)
      const result = compare(baseline, current)
      results.push({ id, status: result.changed ? 'changed' : 'same', baseline, current, ...result })
    }
  }

  if (!ONLY) {
    for (const name of readdirSync(BASELINES)) {
      const id = name.replace(/\.png$/, '')
      if (ids.includes(id)) continue
      if (UPDATE) rmSync(join(BASELINES, name))
      results.push({ id, status: UPDATE ? 'deleted' : 'removed', note: 'baseline has no story' })
    }
  }

  writeReport(results)
  const count = (status) => results.filter((r) => r.status === status).length
  const failing = results.filter((r) => ['changed', 'new', 'error', 'removed'].includes(r.status))
  for (const r of failing) {
    const detail = r.changed ? `${r.changed} px (${(r.ratio * 100).toFixed(3)}%)` : r.note ?? ''
    console.log(`  ${r.status.padEnd(8)} ${r.id} ${detail}`)
  }
  console.log(
    UPDATE
      ? `Updated ${count('updated')} baselines${count('deleted') ? `, deleted ${count('deleted')}` : ''}.`
      : `${count('same')} unchanged, ${failing.length} need review — ${join(OUTPUT, 'report.html')}`,
  )
  return UPDATE || failing.length === 0 ? 0 : 1
}

app.dock?.hide()
app.disableHardwareAcceleration()
app
  .whenReady()
  .then(run)
  .then((code) => app.exit(code))
  .catch((error) => {
    console.error(error.message)
    app.exit(2)
  })
