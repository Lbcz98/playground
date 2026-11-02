// node scripts/check-explore-tokens.mjs docs/explorations/<slug>   (or one part: docs/explorations/<slug>/parts/<N>.html)
// Fails when an exploration retypes the kit's tokens or bypasses them. Options may be anything; their look must come from the tokens.
// A token DESIGN.md bans (10px caption, extra-bold, pure-black text-inverse) fails even though global.css still defines it, and the line names the replacement.
// Advises (never fails) on a literal width/height equal or near to a kit component size (--dimension-size-semantic-*).
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { banForClass, banForCssVar, banForFontSizePx, banSentence, closestName } from './agent-token-bans.mjs'

const page = readFileSync(process.argv[2].endsWith('.html') ? process.argv[2] : `${process.argv[2]}/index.html`, 'utf8')
const css = readFileSync(fileURLToPath(new URL('../src/styles/global.css', import.meta.url)), 'utf8')
const kit = new Set(css.match(/--[\w-]+(?=\s*:)/g))
// The kit's component sizes, resolved from global.css, for advice only: sizes outside the kit stay allowed.
const defs = Object.fromEntries([...css.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)].reverse().map(m => [m[1], m[2].trim()]))
const value = v => (v?.startsWith('var(') ? value(defs[v.slice(4, -1)]) : v)
const SIZE = '--dimension-size-semantic-'
const sizes = Object.keys(defs).filter(n => n.startsWith(SIZE) && /^\d+px$/.test(value(defs[n]))).map(n => [n.slice(SIZE.length), parseFloat(value(defs[n]))])
const named = k => sizes.filter(s => s[1] === k).map(s => s[0]).join(' / ')
const strip = (s, re) => s.replace(re, '')

const parseHex = (hex) => {
  let h = hex.slice(1)
  if (h.length === 3 || h.length === 4) h = [...h].map(c => c + c).join('')
  if (h.length !== 6 && h.length !== 8) return undefined
  const n = parseInt(h.slice(0, 6), 16)
  if (Number.isNaN(n)) return undefined
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255, a: h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1 }
}
const parseColor = (raw) => {
  const s = String(raw).trim()
  if (s.startsWith('#')) return parseHex(s)
  const m = s.match(/^rgba?\(([^)]+)\)$/i)
  if (!m) return undefined
  const p = m[1].split(/[\s,/]+/).filter(Boolean).map(Number)
  if (p.length < 3 || p.some(n => Number.isNaN(n))) return undefined
  return { r: p[0], g: p[1], b: p[2], a: p[3] === undefined ? 1 : p[3] > 1 ? p[3] / 255 : p[3] }
}
const colorDist = (a, b) => Math.hypot(a.r - b.r, a.g - b.g, a.b - b.b, (a.a - b.a) * 255)
// Core swatches stay out of the suggestion: an agent names a semantic or opacity token (tokens.semantic-tier).
const colorTokens = [...kit].flatMap(name => {
  if (banForCssVar(name) || !name.startsWith('--color-') || name.startsWith('--color-core-')) return []
  const parsed = parseColor(value(defs[name]) ?? '')
  return parsed ? [{ name, ...parsed }] : []
})
const nearestColor = (raw) => {
  const parsed = parseColor(raw)
  if (!parsed) return '--color-semantic-functional-text-primary'
  // DESIGN §4.6: pure black and pure white are not tokens an agent may paint with.
  if (parsed.r === 0 && parsed.g === 0 && parsed.b === 0 && parsed.a >= 0.95) return '--color-semantic-functional-background-primary'
  if (parsed.r === 255 && parsed.g === 255 && parsed.b === 255 && parsed.a >= 0.95) return '--color-semantic-functional-text-primary'
  let best, bestD = Infinity
  for (const t of colorTokens) {
    const d = colorDist(parsed, t)
    if (d < bestD || (d === bestD && t.name < best)) { best = t.name; bestD = d }
  }
  return best ?? '--color-semantic-functional-text-primary'
}
const lengthTokens = [...kit].flatMap(name => {
  if (banForCssVar(name)) return []
  const resolved = value(defs[name])
  if (!/^\d+(?:\.\d+)?px$/.test(resolved ?? '')) return []
  const kind = name.startsWith('--dimension-spacing-') ? 'spacing' : name.startsWith('--dimension-radius-') ? 'radius' : name.startsWith('--typography-font-size-') ? 'font' : ''
  return kind ? [{ name, px: parseFloat(resolved), kind }] : []
})
// A tie takes the larger step: a near miss must not drop below the readable floor or the spacing step.
const nearestLength = (px, kind) => {
  let best, bestD = Infinity, bestPx = -1
  for (const t of lengthTokens) if (t.kind === kind) {
    const d = Math.abs(t.px - px)
    if (d < bestD || (d === bestD && (t.px > bestPx || (t.px === bestPx && t.name < best)))) { best = t.name; bestD = d; bestPx = t.px }
  }
  return best
}
const lengthKind = (prop, name = '') => prop === 'font-size' || /font|type/.test(name) ? 'font' : prop === 'border-radius' || /radius/.test(name) ? 'radius' : 'spacing'
const firstToken = (use) => use.match(/--[\w-]+|\.text-[\w-]+/)?.[0] ?? use
const suggestValue = (raw, name) => {
  const varName = raw.match(/^var\((--[\w-]+)/)?.[1]
  if (varName) {
    const ban = banForCssVar(varName)
    if (ban) return firstToken(ban.use)
    if (kit.has(varName)) return varName
  }
  const resolved = value(raw) ?? raw
  if (String(resolved).startsWith('#') || /^rgba?\(/i.test(resolved)) return nearestColor(resolved)
  const px = String(resolved).match(/^(\d+(?:\.\d+)?)px$/)
  if (px) return nearestLength(+px[1], lengthKind('', name)) ?? nearestLength(+px[1], 'spacing')
  return closestName(name, kit) ?? '--dimension-spacing-core-sm'
}

// /tune: a tuned option's spec (dial values, hex colors included) is data, and a value the designer moved off its token carries `/* tune */`: it is advised, not failed.
const tuned = [], tunedNames = []
const authored = page.replace(/\/\* Chrome \*\/[\s\S]*?(?=\/\* Options|<\/style>)/, '') // the template's chrome is fixed by Figma
  .replace(/<script type="application\/json" data-tune[\s\S]*?<\/script>/g, '')
  .replace(/(--[\w-]+):\s*([^;]+);\s*\/\* tune \*\//g, (_, name, v) => (tunedNames.push(name), tuned.push(`advisory: tuned off-token ${name}: ${v.trim()} (a candidate token; /proto snaps it to the nearest)`), ''))
const body = strip(strip(strip(authored, /<svg[\s\S]*?<\/svg>/g), /<!--[\s\S]*?-->/g), /\/\*[\s\S]*?\*\//g)
const root = body.match(/:root\s*\{[\s\S]*?\n\}/)?.[0] ?? ''
const outside = body.replace(root, '')
const declared = new Set([...(body.match(/--[\w-]+(?=\s*:)/g) ?? []), ...tunedNames])
const bad = []
// Banned names are scanned with the spec and the tune block still in the page: a dial whose token is banned is a use, not a free literal.
const visible = strip(strip(strip(page.replace(/\/\* Chrome \*\/[\s\S]*?(?=\/\* Options|<\/style>)/, ''), /<svg[\s\S]*?<\/svg>/g), /<!--[\s\S]*?-->/g), /\/\*[\s\S]*?\*\//g)

for (const [name] of visible.matchAll(/--[\w-]+/g)) {
  const ban = banForCssVar(name)
  if (ban) bad.push(banSentence(name, ban))
}
for (const [name] of visible.matchAll(/\btext-(?:caption(?:-[\w-]+)?|(?:[\w-]+-)?extra-bold)\b/g)) {
  const ban = banForClass(name)
  if (ban) bad.push(banSentence(name, ban))
}
for (const m of outside.matchAll(/font-weight\s*:\s*([^;{}]+)/g)) {
  if (/var\(/.test(m[1]) || !(/\b800\b|extra-bold/.test(m[1]))) continue
  const ban = banForCssVar('--typography-font-weight-extra-bold')
  if (ban) bad.push(banSentence('font-weight: 800', ban))
}

for (const [, n, raw] of root.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
  if (n.startsWith('--explore-') || banForCssVar(n)) continue
  if (kit.has(n)) bad.push(`:root redeclares ${n}: use var(${n})`)
  else bad.push(`:root redeclares ${n}: use var(${suggestValue(raw.trim(), n)})`)
}
for (const [, n] of body.matchAll(/var\((--[\w-]+)/g)) {
  if (banForCssVar(n) || kit.has(n) || declared.has(n)) continue
  const use = closestName(n, kit)
  bad.push(use ? `var(${n}) is not a kit token; use var(${use})` : `var(${n}) is not a kit token`)
}
for (const m of outside.matchAll(/#[0-9a-fA-F]{3,8}\b|rgba?\([^)]*\)/g)) bad.push(`literal color ${m[0]}: use var(${nearestColor(m[0])})`)
for (const m of outside.matchAll(/(padding|margin|gap|border-radius|font-size)[\w-]*:\s*([^;{}]*\d+px[^;{}]*)/g)) {
  const raw = m[2]
  const bare = raw.replace(/var\([^)]*\)/g, '')
  if (/var\(/.test(raw) && !/(^|[\s(])[1-9]\d*px/.test(bare)) continue
  const pxs = [...bare.matchAll(/(\d+(?:\.\d+)?)px/g)].map(x => +x[1])
  if (m[1] === 'font-size') {
    const small = pxs.find(n => banForFontSizePx(n))
    if (small !== undefined) { bad.push(banSentence(`font-size: ${small}px`, banForFontSizePx(small))); continue }
  }
  const uses = [...new Set(pxs.map(n => nearestLength(n, lengthKind(m[1]))).filter(Boolean))]
  bad.push(`literal length in ${m[1]}: ${raw.trim()}: use ${uses.map(u => `var(${u})`).join(' and ')}`)
}

const advice = [...tuned]
for (const m of outside.matchAll(/(?<![\w-])((?:min-|max-)?(?:width|height)):\s*([^;{}]*)/g))
  for (const [, n] of m[2].replace(/calc\((?:[^()]|\([^()]*\))*\)/g, '').replace(/var\([^)]*\)/g, '').matchAll(/(?<![\w.-])(\d+(?:\.\d+)?)px/g)) {
    // ponytail: "near" is within 5% of a kit size, a guess; tune it if it nags about sizes meant to be new.
    const v = +n, k = sizes.map(s => s[1]).filter(k => Math.abs(v - k) <= k / 20).sort((a, b) => Math.abs(v - a) - Math.abs(v - b))[0]
    if (k === v) advice.push(`advisory: ${m[1]}: ${v}px is kit size ${named(k)}: write var(${SIZE}<name>)`)
    else if (k) advice.push(`advisory: ${m[1]}: ${v}px is near kit size ${named(k)} (${k}px): use it if the box means that one, or keep ${v}px on purpose`)
  }

// A card family is width + radius (+ inset). Taking one family's width with another's radius is the drift to catch.
const FAMILIES = ['card', 'card-expanded', 'content-card']
const px = v => { const r = value(v?.trim()); return /^\d+(\.\d+)?px$/.test(r ?? '') ? parseFloat(r) : undefined }
const own = f => ({ width: px(`var(${SIZE}${f}-width)`), radius: px(`var(--dimension-radius-semantic-${f})`) })
// Only the block is matched: a leading `([^{}]+)` selector group backtracked from every character (24 s on a 250 KB page).
for (const [, decls] of outside.matchAll(/\{([^{}]*)\}/g)) {
  const get = p => decls.match(new RegExp(`(?<![\\w-])${p}:\\s*([^;]+)`))?.[1]
  const [w, r] = [px(get('width')), px(get('border-radius'))]
  const fam = FAMILIES.find(f => own(f).width === w)
  if (w && r !== undefined && fam && own(fam).radius !== r)
    advice.push(`advisory: width ${w}px is the ${fam} family (radius ${own(fam).radius}px) but border-radius is ${r}px: keep the family together, or say why you mix them`)
}

if (bad.length) console.error([...new Set(bad)].join('\n'))
if (advice.length) console.log([...new Set(advice)].join('\n'))
if (bad.length) process.exit(1)
console.log('ok')
