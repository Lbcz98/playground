// node scripts/explore-stitch.mjs docs/explorations/<slug> "<title>"                        new page from the template
// node scripts/explore-stitch.mjs docs/explorations/<slug> --append "<group>" [--parent N]  a batch of variations into the page
// node scripts/explore-stitch.mjs docs/explorations/<slug> --list                           what the page holds
// node scripts/explore-stitch.mjs docs/explorations/<slug> --drop                           throw the parts away (the designer cancelled)
// node scripts/explore-stitch.mjs docs/explorations/<slug> --pretune N[,N…]                 hold numbers for tunable copies (tune-parts/); `missing` = every option with none yet
// node scripts/explore-stitch.mjs docs/explorations/<slug> --adopt M                        put a finished copy in, hidden
// node scripts/explore-stitch.mjs docs/explorations/<slug> --show M                         show a copy the designer changed
// Puts the parts/<N>.html that parallel proto-explorer agents wrote (/explore) into index.html, then removes parts/.
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const text = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;')
const put = (page, re, to) => {
  if (!re.test(page)) throw new Error(`page lost its marker ${re}`)
  return page.replace(re, to)
}

/** Each part split into its style, card and script. `parts` is [[number, html], …]; a part is exactly one card with its own number. */
function split(parts) {
  const styles = [], cards = [], scripts = []
  for (const [n, html] of [...parts].sort((a, b) => a[0] - b[0])) {
    // ponytail: regex split, so a <style> or <script> inside an option's SVG moves out with the rest; parse the HTML if that ever bites.
    const rest = html
      .replace(/<style>([\s\S]*?)<\/style>/g, (_, css) => (styles.push(css.trim()), ''))
      .replace(/<script>[\s\S]*?<\/script>/g, (js) => (scripts.push(js), ''))
      .trim()
    if (!rest.startsWith('<article') || (rest.match(/<article/g) ?? []).length !== 1 || !rest.includes(`data-option="${n}"`))
      throw new Error(`parts/${n}.html: expected exactly one <article class="opt" data-option="${n}">`)
    cards.push(rest)
  }
  return { styles, cards, scripts }
}
const withAssets = (page, { styles, scripts }) =>
  put(put(page, /<\/style>/, () => `${styles.join('\n')}\n</style>`), /<\/body>/, () => `${scripts.join('\n')}\n</body>`)

/** The template with the title set and each part's style, card and script in place. */
export function stitch(template, title, parts) {
  const p = split(parts)
  const page = put(template, /<title>[\s\S]*?<\/title>/, () => `<title>${text(title)}</title>`)
  return withAssets(put(page, /(?<=<main class="explore-items"[^>]*>)[\s\S]*?(?=<\/main>)/, () => `\n${p.cards.join('\n')}\n    `), p)
}

/** An existing page with a titled group of new cards after the ones it has; each card records the option it came from. */
export function append(page, group, parts, parent) {
  const p = split(parts)
  const cards = parent ? p.cards.map((c) => c.replace(/^<article/, () => `<article data-parent="${parent}"`)) : p.cards
  return withAssets(put(page, /<\/main>/, () => `<h2 class="opt-group">${text(group)}</h2>\n${cards.join('\n')}\n    </main>`), p)
}

/** The page's cards: number, label, parent, whether the designer discarded it and whether it is a hidden copy made ahead of /tune. */
export function options(page) {
  return [...page.matchAll(/<article\b([^>]*\bdata-option="(\d+)"[^>]*)>\s*(?:<!--[\s\S]*?-->\s*)*<p class="opt-label"[^>]*>([\s\S]*?)<\/p>/g)].map(([, attrs, n, label]) => ({
    n: Number(n), label: label.trim(), parent: attrs.match(/data-parent="(\d+)"/)?.[1], discarded: /\bdata-discarded\b/.test(attrs), pretuned: /\bdata-pretuned\b/.test(attrs), tuned: /\bdata-tuned\b/.test(attrs),
  }))
}

/** Whether `c` is a tunable copy of option `n`: a tuned variation shares the parent link but is not one (the tuner labels its copies "Ajuste da N"). */
const copyOf = (c, n) => c.parent === String(n) && / - Ajuste da \d+/.test(c.label) && !c.discarded

/** The options with no tunable copy yet, on the page or on the way: not discarded, not tunable or a copy themselves. */
export const missingCopies = (page, held = {}) => {
  const cards = options(page), parentsOnTheWay = new Set(Object.values(held).filter(Boolean).map(String))
  return cards.filter((o) => !o.discarded && !o.tuned && !o.pretuned && !parentsOnTheWay.has(String(o.n)) && !cards.some((c) => copyOf(c, o.n))).map((o) => o.n)
}

/** `held` without the copies whose tuner is gone: no file for the number and held.json untouched for longer than a session (the server stops after 30 min idle). */
export const liveHeld = (held, hasFile, ageMs, maxMs = 30 * 60e3) =>
  Object.fromEntries(Object.entries(held).filter(([m]) => hasFile(m) || ageMs <= maxMs))

// Tunable copies made ahead of /tune: proto-tuner writes tune-parts/<M>.html in the background while the designer works, so
// "Ajustar" opens at once. tune-parts/held.json is { M: N } for each copy on the way (N = null once that copy is stale).

/** The next free option number: past every card on the page and every number held for a copy on the way. */
export const nextOption = (page, held = {}) => Math.max(0, ...options(page).map((o) => o.n), ...Object.keys(held).map(Number)) + 1

/**
 * Numbers held for the copies of `parents`. A parent that already has a copy on the way, or an untouched copy on the page,
 * was just edited: that copy is stale (null in `held`, discarded on the page) and a new number is held.
 */
export function hold(page, held, parents) {
  const next = { ...held }, pairs = []
  for (const n of parents.map(String)) {
    for (const [m, p] of Object.entries(next)) if (p === n) next[m] = null
    page = page.replace(new RegExp(`<article\\b(?=[^>]*\\bdata-parent="${n}")(?=[^>]*\\bdata-pretuned\\b)[^>]*>`, 'g'), (tag) => (/\bdata-discarded\b/.test(tag) ? tag : tag.replace(/>$/, ' data-discarded>')))
    const m = nextOption(page, next)
    next[m] = n; pairs.push([n, m])
  }
  return { page, held: next, pairs }
}

/** The page with copy `m` of option `n` in its own group, hidden (data-pretuned) until the designer tunes it. */
export const adopt = (page, m, n, html) =>
  append(page, `Ajuste da Opção ${n}`, [[m, html]], String(n)).replace(new RegExp(`<article data-parent="${n}"(?=[^>]*\\bdata-option="${m}")`), (a) => `${a} data-pretuned`)

/** The page with copy `m` shown: the designer changed it, so it is theirs now. */
export const show = (page, m) => page.replace(new RegExp(`<article\\b[^>]*\\bdata-option="${m}"[^>]*>`), (tag) => tag.replace(/\s+data-pretuned\b/, ''))

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [dir, ...rest] = process.argv.slice(2)
  const flag = (name) => { const i = rest.indexOf(name); return i >= 0 ? rest[i + 1] : undefined }
  const fail = (why) => { console.error(why); process.exit(1) }
  const index = `${dir}/index.html`, has = dir && existsSync(index)
  const group = flag('--append'), title = rest[0]?.startsWith('--') ? undefined : rest[0]
  const tuneDir = `${dir}/tune-parts`, heldFile = `${tuneDir}/held.json`
  const held = existsSync(heldFile) ? JSON.parse(readFileSync(heldFile, 'utf8')) : {}
  // Entries whose tuner is gone (see liveHeld) are not "on the way" and hold no number.
  const alive = existsSync(heldFile) ? liveHeld(held, (m) => existsSync(`${tuneDir}/${m}.html`), Date.now() - statSync(heldFile).mtimeMs) : held
  const saveHeld = (h) => {
    if (Object.keys(h).length) return void (mkdirSync(tuneDir, { recursive: true }), writeFileSync(heldFile, JSON.stringify(h)))
    rmSync(heldFile, { force: true })
    if (existsSync(tuneDir) && !readdirSync(tuneDir).length) rmSync(tuneDir, { recursive: true })
  }

  if (rest.includes('--list')) {
    if (!has) fail(`${index} não existe`)
    const page = readFileSync(index, 'utf8'), all = options(page)
    console.log(`brief: ${existsSync(`${dir}/brief.md`) ? `${dir}/brief.md` : 'não existe (pergunte ao designer e salve antes de variar)'}`)
    console.log(`próxima opção: ${nextOption(page, alive)}`)
    for (const o of all) console.log(`${o.n} | ${o.label}${o.parent ? ` | variação da ${o.parent}` : ''}${o.discarded ? ' | DESCARTADA' : ''}${o.tuned ? ' | ajustável' : ''}${o.pretuned ? ' | ajuste escondido (cópia igual à mãe, para o /tune)' : ''}`)
    for (const [m, n] of Object.entries(alive)) if (n) console.log(`ajuste da ${n} em preparo: opção ${m}`)
    process.exit(0)
  }
  if (rest.includes('--pretune')) {
    if (!has) fail(`${index} não existe`)
    const page = readFileSync(index, 'utf8')
    const arg = String(flag('--pretune') ?? ''), missing = arg === 'missing'
    const r = hold(page, alive, missing ? missingCopies(page, alive).map(String) : arg.split(',').filter((n) => /^\d+$/.test(n)))
    if (!r.pairs.length) {
      if (!missing) fail('uso: --pretune N[,N…] | missing (as opções que acabaram de entrar ou mudar, ou todas as sem cópia)')
      saveHeld(alive)
      console.log('nenhuma opção sem cópia ajustável')
      process.exit(0)
    }
    if (r.page !== page) writeFileSync(index, r.page)
    saveHeld(r.held)
    for (const [n, m] of r.pairs) console.log(`opção ${n} → ajuste ${m}: tune-parts/${m}.html`)
    process.exit(0)
  }
  if (rest.includes('--adopt')) {
    if (!has) fail(`${index} não existe`)
    // Only the copy whose agent answered: another may still be writing or fixing its file.
    const m = flag('--adopt'), file = `${tuneDir}/${m}.html`, n = held[m]
    if (!/^\d+$/.test(m ?? '') || !(m in held)) fail(`uso: --adopt M, com M um ajuste em preparo (veja --list)`)
    if (!existsSync(file)) fail(`${file} não existe`)
    if (n) {
      try { writeFileSync(index, adopt(readFileSync(index, 'utf8'), m, n, readFileSync(file, 'utf8'))) } catch (e) { fail(`falhou: ${e.message.replace(/parts\//, 'tune-parts/')}`) }
      console.log(`ok: ajuste ${m} da opção ${n}`)
    } else console.log(`descartado: ajuste ${m} (a opção mudou depois)`)
    rmSync(file); delete held[m]; saveHeld(held)
    process.exit(0)
  }
  if (rest.includes('--show')) {
    if (!has) fail(`${index} não existe`)
    writeFileSync(index, show(readFileSync(index, 'utf8'), flag('--show')))
    console.log(`ok: opção ${flag('--show')} aparece na página`)
    process.exit(0)
  }
  if (dir && rest.includes('--drop')) { rmSync(`${dir}/parts`, { recursive: true, force: true }); console.log('ok: partes descartadas'); process.exit(0) }
  if (!dir || (!group && !title)) fail('uso: node scripts/explore-stitch.mjs docs/explorations/<slug> "<título>" | --append "<grupo>" [--parent N] | --list')
  if (group ? !has : has) fail(group ? `${index} não existe: nada para variar` : `${index} já existe: não sobrescrevo outra exploração`)

  const page = group ? readFileSync(index, 'utf8') : ''
  const first = group ? nextOption(page, alive) : 1
  const files = existsSync(`${dir}/parts`) ? readdirSync(`${dir}/parts`).filter((f) => /^\d+\.html$/.test(f)) : []
  const have = files.map((f) => parseInt(f)).sort((a, b) => a - b)
  const want = have.map((_, i) => first + i)
  if (!files.length) fail(`nenhuma parte em ${dir}/parts`)
  if (have.join() !== want.join()) fail(`as partes devem ser ${first}, ${first + 1}, … sem pular número; achei: ${have.join(', ')}`)
  const parts = files.map((f) => [parseInt(f), readFileSync(`${dir}/parts/${f}`, 'utf8')])
  try {
    const template = () => readFileSync(fileURLToPath(new URL('../docs/explorations/_template/index.html', import.meta.url)), 'utf8')
    writeFileSync(index, group ? append(page, group, parts, flag('--parent')) : stitch(template(), title, parts))
  } catch (e) { fail(e.message) }
  rmSync(`${dir}/parts`, { recursive: true })
  console.log(`ok: opções ${have[0]} a ${have.at(-1)} em ${index}`)
}
