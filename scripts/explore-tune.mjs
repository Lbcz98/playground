// Pure helpers for /tune, shared by the live server and its tests.
//
// A tuned option (written by proto-tuner) is an <article data-option="M" data-tuned data-parent="N"> that holds
//   <script type="application/json" data-tune="M">{ states, folders: [{ name, part?, controls: [...] }] }</script>
// and a `/* tune:vars */ [data-option="M"] { --x: …; } /* /tune:vars */` block in its CSS. The spec is the single source of the
// numbers: "Aplicar valores" rewrites the spec's values and regenerates that block here, with no agent in the loop.

/** Control types the runtime (explore-tune.js) can draw. */
export const TYPES = ['slider', 'color', 'select', 'easing']
const VARS = /\/\* tune:vars \*\/[\s\S]*?\/\* \/tune:vars \*\//g

/** The tune:vars blocks that style option `n` (`[data-option="n"] {`), as { start, end, text }. The style may sit anywhere in the page, not inside the article. */
const varsBlocks = (html, n) => [...html.matchAll(VARS)]
  .filter((m) => new RegExp(`\\[data-option="${n}"\\]\\s*\\{`).test(m[0]))
  .map((m) => ({ start: m.index, end: m.index + m[0].length, text: m[0] }))

const article = (html, n) => html.match(new RegExp(`<article\\b[^>]*\\bdata-option="${n}"[^>]*>`))?.[0]

/** The spec of option `n`, or undefined when it has none or the JSON is broken. */
export function tuneSpec(html, n) {
  const m = html.match(new RegExp(`<script type="application/json" data-tune="${n}">([\\s\\S]*?)</script>`))
  try { return m ? JSON.parse(m[1]) : undefined } catch { return undefined }
}

/** Where `/tune/<n>` should land: the option itself when it is tuned, else its newest live tuned child, else `preparing` (no copy yet). */
export function tuneTarget(html, n) {
  if (article(html, n)?.includes('data-tuned')) return { option: String(n), preparing: false }
  const kids = [...html.matchAll(/<article\b[^>]*>/g)].map((m) => m[0])
    .filter((t) => t.includes(`data-parent="${n}"`) && t.includes('data-tuned') && !/\bdata-discarded\b/.test(t))
    .map((t) => t.match(/data-option="(\d+)"/)?.[1])
  return kids.length ? { option: kids.at(-1), preparing: false } : { option: String(n), preparing: true }
}

const num = (v, c) => Math.min(c.max ?? Infinity, Math.max(c.min ?? -Infinity, Number(v)))
/** One control's value, checked against its own definition; undefined when it does not fit (the old value stays). */
function clean(c, v) {
  if (c.type === 'slider') return Number.isFinite(Number(v)) ? num(v, c) : undefined
  if (c.type === 'color') return /^#[0-9a-f]{3,8}$/i.test(v) ? String(v).toLowerCase() : undefined
  if (c.type === 'select') return c.options?.some((o) => (o.value ?? o) === v) ? v : undefined
  if (c.type === 'easing') {
    const { duration, ease } = v ?? {}
    return Number.isFinite(duration) && duration >= 0 && duration <= 10 && Array.isArray(ease) && ease.length === 4 && ease.every(Number.isFinite)
      ? { duration, ease: ease.map((x, i) => (i % 2 ? x : Math.min(1, Math.max(0, x)))) } : undefined
  }
}

/** The CSS custom properties a control stands for, as [name, css value, offToken]. A value still equal to the token it came from stays that token. */
function declare(c) {
  const v = c.value, off = (css) => [css, c.token && v !== c.base]
  if (c.type === 'slider') { const [css, o] = off(`${v}${c.unit ?? ''}`); return [[c.var, c.token && !o ? `var(${c.token})` : css, o]] }
  if (c.type === 'color') return [[c.var, c.token && v === c.base ? `var(${c.token})` : v, c.token && v !== c.base]]
  if (c.type === 'select') return [[c.var, v, false]]
  if (c.type === 'easing') {
    const same = JSON.stringify(v) === JSON.stringify(c.base)
    return [[c.durVar, c.token && same ? `var(${c.token})` : `${Math.round(v.duration * 1000)}ms`, !!c.token && !same], [c.easeVar, `cubic-bezier(${v.ease.join(', ')})`, false]]
  }
  return []
}

const list = (v) => (Array.isArray(v) ? v.filter((x) => x && typeof x === 'object') : [])
export const controls = (spec) => list(spec?.folders).flatMap((f) => list(f.controls))

// The tune:vars block for option `n`: one declaration per property; a value that left its token carries a `tune` comment.
export function varsBlock(spec, n) {
  const lines = controls(spec).flatMap(declare).filter(([name]) => name)
    .map(([name, css, off]) => `  ${name}: ${css};${off ? ' /* tune */' : ''}`)
  return `/* tune:vars */\n[data-option="${n}"] {\n${lines.join('\n')}\n}\n/* /tune:vars */`
}

/** The spec as JSON with one control per line: a third shorter than indented, and no line too long for an agent to read. */
export function specJson({ folders, ...top }) {
  const folder = ({ controls = [], ...f }) => `${JSON.stringify(f).slice(0, -1)}${Object.keys(f).length ? ',' : ''}"controls":[\n${controls.map((c) => JSON.stringify(c)).join(',\n')}\n]}`
  return `${JSON.stringify(top).slice(0, -1)}${Object.keys(top).length ? ',' : ''}"folders":[\n${(folders ?? []).map(folder).join(',\n')}\n]}`
}

/**
 * The page with the designer's tuned `values` ({ "<folder index>.<control id>": value }) written into option `n`.
 * Unknown ids and values that do not fit their control are ignored. Returns `{ html, changed }`.
 */
export function applyTuned(html, n, values) {
  const spec = tuneSpec(html, n)
  if (!spec) return { html, changed: 0 }
  if (typeof spec !== 'object' || !Array.isArray(spec.folders)) return { html, changed: 0, error: 'spec' }
  const blocks = varsBlocks(html, n)
  if (blocks.length !== 1) return { html, changed: 0, error: blocks.length ? 'vars-duplicate' : 'vars-missing' }
  let changed = 0
  spec.folders.forEach((f, i) => list(f?.controls).forEach((c) => {
    const v = clean(c, values?.[`${i}.${c.id}`])
    if (v !== undefined && JSON.stringify(v) !== JSON.stringify(c.value)) (c.value = v, changed++)
  }))
  if (!changed) return { html, changed }
  let json, vars
  try { json = specJson(spec).replace(/</g, '\\u003c'); vars = varsBlock(spec, n) } catch { return { html, changed: 0, error: 'spec' } }
  const [b] = blocks
  const swapped = html.slice(0, b.start) + vars + html.slice(b.end)
  // Only the option's own spec script is rewritten; the block above kept every other option byte-for-byte.
  const next = swapped.replace(new RegExp(`(<script type="application/json" data-tune="${n}">)[\\s\\S]*?(</script>)`), (_, a, c) => `${a}${json}${c}`)
    .replace(new RegExp(`<article\\b[^>]*\\bdata-option="${n}"[^>]*>`), (tag) => tag.replace(/\s+data-pretuned\b/, '')) // the designer made the copy their own: it shows on the page now
  return { html: next, changed }
}

/** What is wrong with option `n`'s spec, as a list of sentences (empty when it is sound). `kit` is the set of the kit's token names, when known. */
export function lintSpec(html, n, kit) {
  const spec = tuneSpec(html, n), bad = []
  if (!article(html, n)?.includes('data-tuned')) bad.push(`o <article data-option="${n}"> não tem data-tuned`)
  if (!spec || typeof spec !== 'object') return [...bad, `falta <script type="application/json" data-tune="${n}"> com JSON válido`]
  const blocks = varsBlocks(html, n)
  if (!blocks.length) return [...bad, `falta o bloco /* tune:vars */ … /* /tune:vars */ de [data-option="${n}"]`]
  if (blocks.length > 1) bad.push(`há ${blocks.length} blocos tune:vars para [data-option="${n}"]; deve haver exatamente um`)
  if (!Array.isArray(spec.folders) || !spec.folders.length) bad.push('folders vazio')
  const ids = new Set(), names = new Set(), fin = Number.isFinite
  for (const f of list(spec.folders)) {
    if (!f.name || names.has(f.name) || f.name === 'Simulador' || f.name === 'Palco') bad.push(`pasta "${f.name}": nome vazio, repetido ou reservado (Simulador, Palco)`)
    names.add(f.name)
    const labels = new Set()
    for (const c of list(f.controls)) {
      const at = `${f.name} › ${c.label}`
      if (!c.id || ids.has(c.id)) bad.push(`${at}: id vazio ou repetido (${c.id})`)
      if (!c.label || labels.has(c.label)) bad.push(`${at}: label vazio ou repetido na pasta`)
      ids.add(c.id); labels.add(c.label)
      if (!TYPES.includes(c.type)) { bad.push(`${at}: tipo ${c.type} (use ${TYPES.join(', ')})`); continue }
      for (const k of c.type === 'easing' ? ['durVar', 'easeVar'] : ['var']) if (!/^--[\w-]+$/.test(c[k] ?? '')) bad.push(`${at}: ${k} deve ser um --nome`)
      if (c.type === 'slider' && !(fin(c.value) && fin(c.min) && fin(c.max) && c.min <= c.value && c.value <= c.max)) bad.push(`${at}: value deve estar entre min e max`)
      if (c.type === 'color' && !/^#[0-9a-f]{3,8}$/i.test(c.value)) bad.push(`${at}: cor deve ser #hex`)
      if (c.type === 'select' && !(c.options?.length && c.options.includes(c.value))) bad.push(`${at}: value deve estar em options`)
      if (c.type === 'easing' && clean(c, c.value) === undefined) bad.push(`${at}: easing precisa de duration (s) e ease [x1,y1,x2,y2]`)
      if (c.token) {
        if (c.base === undefined) bad.push(`${at}: com token, base é o valor original do token`)
        if (kit && !kit.has(c.token)) bad.push(`${at}: ${c.token} não é um token do kit`)
      }
    }
  }
  if (!Array.isArray(spec.states) || spec.states.length < 1) bad.push('states: liste os estados que o CSS lê em [data-state="…"]')
  else for (const s of spec.states.slice(1)) if (!html.includes(`data-state="${s}"`)) bad.push(`estado "${s}" não aparece em nenhum seletor [data-state="${s}"]`)
  const have = blocks[0].text.replace(/\s+/g, ' ')
  let want
  try { want = varsBlock(spec, n).replace(/\s+/g, ' ') } catch { bad.push('o spec tem controles malformados: não dá para gerar o bloco tune:vars') }
  if (want !== undefined && have !== want) bad.push('o bloco tune:vars não é o que "Aplicar valores" escreveria a partir do spec: escreva-o no formato exato (uma declaração por --var, token como var(--token), easing em ms e cubic-bezier)')
  return bad
}

const show = (c, v) => c.type === 'slider' ? `${v}${c.unit ?? ''}` : c.type === 'easing' ? `${Math.round(v.duration * 1000)}ms, cubic-bezier(${v.ease.join(', ')})` : String(v)
const cell = (s) => String(s ?? '').replace(/\|/g, '\\|') || '-'
const range = (c) => c.type === 'slider' ? `${c.min}–${c.max}${c.unit ?? ''}, step ${c.step ?? 1}` : c.type === 'select' ? c.options.join(' / ') : ''

/**
 * The option's contract as markdown for a developer's agent: properties (every dial, with the values on the stage now), states, keys, motion,
 * token candidates. `values` are the stage's live dial values ({ "<folder index>.<id>": value }); `brief` is brief.md; `figma` the pushed file's url.
 * Built from the spec alone, so the same input gives the same file.
 */
export function specMarkdown(html, n, { values = {}, label = `Option ${n}`, brief = '', figma } = {}) {
  const spec = tuneSpec(html, n)
  if (!spec) return undefined
  const rows = (spec.folders ?? []).flatMap((f, i) => (f.controls ?? []).map((c) => {
    const live = clean(c, values[`${i}.${c.id}`]), v = live ?? c.value
    return { f, c, v, moved: live !== undefined && JSON.stringify(live) !== JSON.stringify(c.value) }
  }))
  const unapplied = rows.filter((r) => r.moved).length
  const out = [`# ${label}`, '']
  if (unapplied) out.push(`> ${unapplied} value(s) on the stage are not applied to the option yet ("Aplicar valores"); this file uses the stage values.`, '')
  if (figma) out.push(`Figma: ${figma}`, '')
  out.push('## Properties', '')
  for (const f of spec.folders ?? []) {
    out.push(`### ${f.name}${f.part ? ` (\`data-part="${f.part}"\`)` : ''}`, '', '| Property | CSS variable | Value | Original | Token | Range |', '| --- | --- | --- | --- | --- | --- |')
    for (const { c, v } of rows.filter((r) => r.f === f)) {
      const name = c.type === 'easing' ? `${c.durVar}, ${c.easeVar}` : c.var
      out.push(`| ${cell(c.label)} | \`${name}\` | ${cell(show(c, v))} | ${cell(c.base === undefined ? '' : show(c, c.base))} | ${cell(c.token && `\`${c.token}\``)} | ${cell(range(c))} |`)
    }
    out.push('')
  }
  out.push('## States', '', `The option reads its state from \`data-state\` on its root. Resting state: \`${spec.states?.[0]}\`.`, '', ...(spec.states ?? []).map((s) => `- \`${s}\``), '')
  const keys = brief.split('\n').filter((l) => /^\s*[-*]?\s*\**(controle|teclas)\b/i.test(l)).map((l) => l.trim())
  out.push('## Keys', '', 'TV remote model inside the card (source: `node scripts/explore-ref.mjs --teclas`): ←/→ move the one focus without wrapping, Enter acts on the focused piece, Back (Esc / Backspace) undoes the last action and, at the initial state, leaves the card; ↑/↓ leave the card and are never handled inside it.', '', ...keys, ...(keys.length ? [''] : []))
  const motion = rows.filter((r) => r.c.type === 'easing')
  out.push('## Motion', '', ...(motion.length ? motion.map(({ c, f, v }) => `- ${f.name} › ${c.label}: ${show(c, v)}`) : ['- No timed transitions.']), '- With `prefers-reduced-motion: reduce`, slides and scales become an opacity crossfade and the focus ring stays.', '')
  const cand = rows.filter((r) => r.c.type !== 'select' && (r.c.token ? JSON.stringify(r.v) !== JSON.stringify(r.c.base) : true))
  out.push('## Token candidates', '', ...(cand.length ? ['Values that are not a kit token (moved off their token, or a free literal in the design):', '', ...cand.map(({ c, f, v }) => `- ${f.name} › ${c.label}: ${show(c, v)}${c.token ? ` (was \`${c.token}\`)` : ''}`)] : ['None: every value is a kit token.']), '')
  return out.join('\n')
}
