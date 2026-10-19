// node scripts/tune-measure.mjs docs/explorations/<slug> <option>
// What the page really renders for one tuned option, as JSON, for proto-judge: facts, no verdicts.
//   contrast  every text piece in every state: its colour, the background it sits on, the WCAG ratio (the gate; APCA is not measured)
//   type      each distinct text style: size, weight, line-height ratio, lines, truncation
//   motion    each transition/animation: property, duration, delay, easing; `all`, will-change, and whether a reduced-motion rule exists
//   radii     nested rounded boxes: the radius, the padding between them and the concentric radius (inner + padding)
//   focus     outlines drawn in the state that looks like focus
import { fileURLToPath } from 'node:url'
import { openExploration } from './explore-page.mjs'

const lin = (c) => (c /= 255) <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
const lum = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
/** WCAG 2 contrast ratio of two opaque [r, g, b] colours. */
export const ratio = (a, b) => { const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x); return (hi + 0.05) / (lo + 0.05) }
/** `over` composited on `under`: [r, g, b, a] on [r, g, b]. */
export const mix = ([r, g, b, a], u) => [r, g, b].map((c, i) => c * a + u[i] * (1 - a))

async function measure(target, option) {
  const { page, close } = await openExploration(target)
  const facts = await page.evaluate(async (n) => {
    const art = document.querySelector(`.opt[data-option="${n}"]`)
    if (!art) return null
    const spec = JSON.parse(art.querySelector(`script[data-tune="${n}"]`)?.textContent ?? 'null')
    const states = spec?.states?.length ? spec.states : [art.dataset.state ?? '']
    const rgba = (s) => { const m = s.match(/[\d.]+/g)?.map(Number) ?? [0, 0, 0, 0]; return [m[0], m[1], m[2], m[3] ?? 1] }
    const name = (e) => `${e.tagName.toLowerCase()}${e.dataset.part ? `[${e.dataset.part}]` : e.classList.length ? '.' + e.classList[0] : ''}`
    const probe = Object.assign(document.createElement('i'), { style: 'background: var(--color-semantic-functional-background-primary)' })
    document.body.append(probe); const page0 = rgba(getComputedStyle(probe).backgroundColor); probe.remove()
    const all = [art, ...art.querySelectorAll('*')].filter((e) => e.tagName !== 'SCRIPT' && e.tagName !== 'STYLE' && !e.closest('.opt-label'))
    // Pieces with text of their own.
    const texts = all.filter((e) => [...e.childNodes].some((c) => c.nodeType === 3 && c.textContent.trim()))
    // The colours under a piece, outermost last: an unmeasurable layer (gradient, image) is reported, not guessed.
    const under = (e) => {
      const layers = []; let unmeasured = false
      for (let a = e; a; a = a.parentElement) {
        const s = getComputedStyle(a)
        if (s.backgroundImage !== 'none') unmeasured = true
        const c = rgba(s.backgroundColor); if (c[3] > 0) layers.push(c); if (c[3] === 1) break
      }
      return { layers, unmeasured }
    }
    const opacity = (e) => { let o = 1; for (let a = e; a; a = a.parentElement) o *= Number(getComputedStyle(a).opacity); return o }
    const out = { option: n, states, contrast: [], type: [], motion: [], radii: [], focus: [] }
    const settle = async () => { art.classList.add('tune-notrans'); void art.offsetWidth; await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))); }
    const style = Object.assign(document.createElement('style'), { textContent: '.tune-notrans, .tune-notrans * { transition: none !important; animation: none !important }' })
    document.head.append(style)
    for (const st of states) {
      if (st) art.dataset.state = st
      await settle()
      for (const e of texts) {
        const s = getComputedStyle(e), u = under(e), fg = rgba(s.color)
        out.contrast.push({ state: st, el: name(e), text: e.textContent.trim().slice(0, 28), fg, under: u.layers, page: page0, opacity: opacity(e), unmeasured: u.unmeasured, size: parseFloat(s.fontSize), weight: Number(s.fontWeight) })
      }
      for (const e of all) {
        const s = getComputedStyle(e)
        if (s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) > 0) out.focus.push({ state: st, el: name(e), width: s.outlineWidth, offset: s.outlineOffset, color: s.outlineColor })
      }
    }
    style.remove(); art.classList.remove('tune-notrans') // the real transitions are what the motion facts describe
    // Facts that do not depend on the state.
    const seen = new Set()
    for (const e of texts) {
      const s = getComputedStyle(e), lh = parseFloat(s.lineHeight) || parseFloat(s.fontSize) * 1.2
      const row = { el: name(e), size: parseFloat(s.fontSize), weight: Number(s.fontWeight), lineHeight: +(lh / parseFloat(s.fontSize)).toFixed(2), lines: Math.round(e.getBoundingClientRect().height / lh), letterSpacing: s.letterSpacing, truncated: s.textOverflow === 'ellipsis' && e.scrollWidth > e.clientWidth, wrap: s.textWrap }
      const key = JSON.stringify({ ...row, el: 0 }); if (!seen.has(key)) (seen.add(key), out.type.push(row))
    }
    const ms = (v) => v.split(',').map((x) => (x.trim().endsWith('ms') ? parseFloat(x) : parseFloat(x) * 1000))
    for (const e of all) {
      const s = getComputedStyle(e)
      const props = s.transitionProperty.split(',').map((x) => x.trim()), dur = ms(s.transitionDuration), del = ms(s.transitionDelay), ease = s.transitionTimingFunction.match(/cubic-bezier\([^)]*\)|steps\([^)]*\)|[a-z-]+/g) ?? []
      props.forEach((p, i) => { const d = dur[i % dur.length]; if (d > 0) out.motion.push({ el: name(e), kind: 'transition', property: p, duration: d, delay: del[i % del.length], easing: ease[i % ease.length] }) })
      if (s.animationName !== 'none') out.motion.push({ el: name(e), kind: 'animation', property: s.animationName, duration: ms(s.animationDuration)[0], delay: ms(s.animationDelay)[0], easing: s.animationTimingFunction, iterations: s.animationIterationCount })
      if (s.willChange !== 'auto') out.motion.push({ el: name(e), kind: 'will-change', property: s.willChange })
      const r = parseFloat(s.borderTopLeftRadius)
      if (r > 0) {
        const p = e.parentElement && all.includes(e.parentElement) ? getComputedStyle(e.parentElement) : null, pr = p ? parseFloat(p.borderTopLeftRadius) : 0
        if (pr > 0) { const pad = parseFloat(p.paddingTop); out.radii.push({ outer: name(e.parentElement), inner: name(e), outerRadius: pr, innerRadius: r, padding: pad, concentric: r + pad }) }
      }
    }
    const rules = [...document.styleSheets].flatMap((sh) => { try { return [...sh.cssRules] } catch { return [] } })
    out.reducedMotionRule = rules.some((r) => r.media?.mediaText.includes('prefers-reduced-motion') && r.cssText.includes(`data-option="${n}"`))
    return out
  }, String(option))
  await close()
  if (!facts) throw new Error(`opção ${option} não existe em ${target}`)
  // Ratios in node, so the maths is testable and shared.
  facts.contrast = facts.contrast.map(({ fg, under, page, opacity, ...row }) => {
    const bg = [...under].reverse().reduce((acc, layer) => mix(layer, acc), page.slice(0, 3))
    const text = mix([fg[0], fg[1], fg[2], fg[3] * opacity], bg)
    return { ...row, fg: text.map(Math.round), bg: bg.map(Math.round), ratio: +ratio(text, bg).toFixed(2) }
  })
  facts.contrast = fold(facts.contrast, 'state')
  facts.focus = fold(facts.focus, 'state')
  facts.motion = fold(facts.motion, 'el')
  return facts
}

/** Rows equal but for `field` as one row, its values joined: a fact true in every state, or of several pieces, is said once. */
export function fold(rows, field) {
  const by = new Map()
  for (const r of rows) {
    const key = JSON.stringify({ ...r, [field]: 0 })
    const had = by.get(key)
    if (!had) by.set(key, { ...r })
    else if (!String(had[field]).split(', ').includes(String(r[field]))) had[field] = `${had[field]}, ${r[field]}`
  }
  return [...by.values()]
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [target, option] = process.argv.slice(2)
  if (!target || !/^\d+$/.test(option ?? '')) { console.error('uso: node scripts/tune-measure.mjs docs/explorations/<slug> <opção>'); process.exit(1) }
  try { const f = await measure(target, option)
    for (const [k, v] of Object.entries(f)) console.log(Array.isArray(v) && v.length ? `${k}:\n${v.map((r) => '  ' + JSON.stringify(r)).join('\n')}` : `${k}: ${JSON.stringify(v)}`) } catch (e) { console.error(e.message); process.exit(1) }
}
