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
 *   npm run test:visual -- --probe         also measure every story: the 8pt grid on
 *                                          padding and gaps, the Content Card's geometry
 *                                          against its tokens, literal values in inline
 *                                          styles, and where the canvas injects --sfs-*
 *                                          (test plan V2–V5, docs/test-plan-storybook-sot.md)
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
const PROBE = process.argv.includes('--probe')

/**
 * Off-grid spacing the kit draws on purpose, keyed by the token the element's
 * inline style takes it from — so the exception is the token's decision, not a
 * story's. A new off-grid value fails until it is fixed or its token is listed.
 */
const GRID_EXCEPTIONS = [
  {
    token: '--dimension-border-width-',
    why: 'A stroke, not spacing: RestingBorder draws its gradient border as padding under a mask.',
  },
  {
    token: '--dimension-spacing-semantic-card-inset',
    why: 'tokens.json: "Figma-exact and internal to the card, so it may sit off the layout grid."',
  },
]

const STORY_IDS = /^(ui-kit|primitives|templates)-/
const VIEWPORT = { width: 1280, height: 720 }
/** Per-channel difference (0–255) treated as anti-aliasing noise, not a change. */
const CHANNEL_TOLERANCE = 8
/** The development warning `warnDeprecated()` (src/primitives/interactionState.ts) prints. */
const DEPRECATION = /^\[(ui-kit|primitives)\/[^\]]+\] `[^`]+` is deprecated/

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

/**
 * Runs inside the story page after `settle`: measures what the pixels can't say.
 * Every expected value is read back from the live CSS custom properties, so the
 * probe checks the render against the tokens, never against numbers of its own.
 */
function probe() {
  const root = document.getElementById('storybook-root')
  const round = (v) => Math.round(parseFloat(v) * 100) / 100
  const onGrid = (n) => n === 0 || n === 4 || n === 12 || n % 8 === 0
  const where = (el) => {
    const parts = []
    for (let node = el; node && node !== root && parts.length < 4; node = node.parentElement) {
      const index = node.parentElement ? [...node.parentElement.children].indexOf(node) : 0
      parts.unshift(`${node.tagName.toLowerCase()}[${index}]`)
    }
    return parts.join(' > ')
  }
  /** A CSS length through its custom-property chain, in px, via a throwaway element. */
  const resolve = (prop, value) => {
    const el = document.createElement('div')
    el.style.position = 'absolute'
    el.style.setProperty(prop, value)
    document.body.append(el)
    const px = round(getComputedStyle(el).getPropertyValue(prop))
    el.remove()
    return px
  }
  const stripVars = (text) => {
    let out = text
    for (let i = 0; i < 10 && /var\(/.test(out); i++) out = out.replace(/var\([^()]*\)/g, '')
    return out
  }

  const grid = []
  const literals = []
  for (const el of root.querySelectorAll('*')) {
    if (el.closest('svg')) continue
    const cs = getComputedStyle(el)
    for (const side of ['top', 'right', 'bottom', 'left']) {
      const px = round(cs.getPropertyValue(`padding-${side}`))
      if (!onGrid(px)) grid.push({ at: where(el), prop: `padding-${side}`, px, style: el.getAttribute('style') ?? '' })
    }
    if (/flex|grid/.test(cs.display)) {
      for (const prop of ['row-gap', 'column-gap']) {
        const value = cs.getPropertyValue(prop)
        if (value === 'normal') continue
        const px = round(value)
        if (!onGrid(px)) grid.push({ at: where(el), prop, px, style: el.getAttribute('style') ?? '' })
      }
    }
    // Uses only: a `--name: value` declaration is where a token is defined (the
    // canvas surface injects the active system's --sfs-* this way), not a use.
    const declarations = (el.getAttribute('style') ?? '').split(';').filter((d) => !d.trim().startsWith('--'))
    const inline = stripVars(declarations.join(';'))
    // A zero needs no token (the browser writes React's 0 as "0px").
    const literal = inline.match(/#[0-9a-f]{3,8}\b|rgba?\(|hsla?\(|(?<![\w.-])(?!0*\.?0+px)\d*\.?\d+px\b/i)
    if (literal) literals.push({ at: where(el), literal: literal[0], style: el.getAttribute('style') })
  }

  // The card itself — a story may also size a wrapper off the same token.
  const CARD_WIDTH = 'var(--dimension-size-semantic-content-card-width)'
  const cards = [...root.querySelectorAll('[style*="--dimension-size-semantic-content-card-width"]')]
    .filter((el) => el.style.width === CARD_WIDTH)
    .map((el) => {
      const cs = getComputedStyle(el)
      const expected = {
        width: resolve('width', 'var(--dimension-size-semantic-content-card-width)'),
        radius: resolve('border-top-left-radius', 'var(--dimension-radius-semantic-content-card)'),
        inset: resolve('padding-top', 'var(--dimension-spacing-core-lg)'),
      }
      const actual = {
        width: round(cs.width),
        radius: round(cs.borderTopLeftRadius),
        inset: Math.min(...['top', 'right', 'bottom', 'left'].map((s) => round(cs.getPropertyValue(`padding-${s}`)))),
        insetMax: Math.max(...['top', 'right', 'bottom', 'left'].map((s) => round(cs.getPropertyValue(`padding-${s}`)))),
      }
      return { at: where(el), expected, actual }
    })

  const sfs = (el) => (el ? [...el.style].filter((name) => name.startsWith('--sfs-')).length : 0)
  const surface = document.querySelector('[data-canvas-theme="active"]')
  const theme = surface ? { onSurface: sfs(surface), onRoot: sfs(document.documentElement) } : null

  return { grid, literals, cards, theme }
}

/** Probe findings for one story → the failures, as short lines. */
function probeFailures(id, found) {
  const failures = []
  for (const g of found.grid) {
    const excused = GRID_EXCEPTIONS.some((e) => g.style.includes(e.token))
    if (!excused) failures.push(`V2 off-grid ${g.prop} ${g.px}px at ${g.at}`)
  }
  for (const c of found.cards) {
    const { expected: e, actual: a } = c
    if (a.width !== e.width) failures.push(`V3 card width ${a.width}px ≠ token ${e.width}px at ${c.at}`)
    if (a.radius !== e.radius) failures.push(`V3 card radius ${a.radius}px ≠ token ${e.radius}px at ${c.at}`)
    if (a.inset !== e.inset || a.insetMax !== e.inset) failures.push(`V3 card inset ${a.inset}–${a.insetMax}px ≠ token ${e.inset}px at ${c.at}`)
  }
  for (const l of found.literals) failures.push(`V4 literal ${l.literal} in an inline style at ${l.at}`)
  if (found.theme && (found.theme.onSurface === 0 || found.theme.onRoot > 0)) {
    failures.push(`V5 --sfs-* vars: ${found.theme.onSurface} on the canvas surface, ${found.theme.onRoot} on :root`)
  }
  return failures
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
tr.changed td,tr.error td,tr.new td,tr.removed td,tr.deprecated td,tr.probe td{background:#fde8e8}
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

  // A story that still passes a deprecated prop teaches the old API; fail it.
  let deprecations = []
  win.webContents.on('console-message', (event, ...legacyArgs) => {
    const message = event.message ?? legacyArgs[1] ?? ''
    if (DEPRECATION.test(message)) deprecations.push(message)
  })

  const results = []
  /** What the probe actually measured — a clean run that measured nothing proves nothing. */
  const coverage = { stories: 0, cards: 0, surfaces: 0 }
  for (const id of ids) {
    deprecations = []
    await win.loadURL(`${STORYBOOK}/iframe.html?id=${encodeURIComponent(id)}&viewMode=story`)
    const { error } = await win.webContents.executeJavaScript(`(${settle})(${JSON.stringify(FREEZE_CSS)})`)
    if (error) {
      results.push({ id, status: 'error', note: error })
      continue
    }
    let probed = []
    if (PROBE) {
      const found = await win.webContents.executeJavaScript(`(${probe})()`)
      coverage.stories++
      coverage.cards += found.cards.length
      coverage.surfaces += found.theme ? 1 : 0
      probed = probeFailures(id, found)
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
    if (deprecations.length) {
      const last = results[results.length - 1]
      last.status = 'deprecated'
      last.note = [...new Set(deprecations)].join(' ')
    }
    if (probed.length) {
      const last = results[results.length - 1]
      last.status = last.status === 'same' || last.status === 'updated' ? 'probe' : last.status
      last.note = [last.note, ...probed].filter(Boolean).join(' · ')
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
  const failing = results.filter((r) => ['changed', 'new', 'error', 'removed', 'deprecated', 'probe'].includes(r.status))
  for (const r of failing) {
    const detail = [r.changed ? `${r.changed} px (${(r.ratio * 100).toFixed(3)}%)` : '', r.note ?? ''].filter(Boolean).join(' · ')
    console.log(`  ${r.status.padEnd(8)} ${r.id} ${detail}`)
  }
  if (PROBE) {
    console.log(
      `Probe: ${coverage.stories} stories, ${coverage.cards} Content Cards measured, ${coverage.surfaces} canvas surfaces checked.`,
    )
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
