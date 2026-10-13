// node scripts/check-explore-tokens.mjs docs/explorations/<slug>   (or one part: docs/explorations/<slug>/parts/<N>.html)
// Fails when an exploration retypes the kit's tokens or bypasses them. Options may be anything; their look must come from the tokens.
// Advises (never fails) on a literal width/height equal or near to a kit component size (--dimension-size-semantic-*).
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

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

for (const n of root.match(/--[\w-]+(?=\s*:)/g) ?? []) if (!n.startsWith('--explore-')) bad.push(`:root redeclares ${n}: link the kit's token instead`)
for (const [, n] of body.matchAll(/var\((--[\w-]+)/g)) if (!kit.has(n) && !declared.has(n)) bad.push(`var(${n}) is not a kit token`)
for (const [, n] of body.matchAll(/var\((--[\w-]+)/g)) if (!kit.has(n) && !n.startsWith('--explore-') && root.includes(n + ':')) bad.push(`${n} is a retyped token`)
for (const m of outside.matchAll(/#[0-9a-fA-F]{3,8}\b|rgba?\(/g)) bad.push(`literal color ${m[0]}: use --color-semantic-* / --color-opacity-*`)
for (const m of outside.matchAll(/(padding|margin|gap|border-radius|font-size)[\w-]*:\s*([^;{}]*\d+px[^;{}]*)/g))
  if (!/var\(/.test(m[2]) || /(^|[\s(])[1-9]\d*px/.test(m[2].replace(/var\([^)]*\)/g, ''))) bad.push(`literal length in ${m[1]}: ${m[2].trim()}: use --dimension-* / --typography-*`)

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
for (const [, , decls] of outside.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
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
