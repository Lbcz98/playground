// node scripts/explore-stitch.mjs docs/explorations/<slug> "<title>"                        new page from the template
// node scripts/explore-stitch.mjs docs/explorations/<slug> --append "<group>" [--parent N]  a batch of variations into the page
// node scripts/explore-stitch.mjs docs/explorations/<slug> --list                           what the page holds
// node scripts/explore-stitch.mjs docs/explorations/<slug> --drop                           throw the parts away (the designer cancelled)
// Puts the parts/<N>.html that parallel proto-explorer agents wrote (/explore) into index.html, then removes parts/.
import { existsSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
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

/** The page's cards: number, label, parent and whether the designer discarded it. */
export function options(page) {
  return [...page.matchAll(/<article\b([^>]*\bdata-option="(\d+)"[^>]*)>\s*(?:<!--[\s\S]*?-->\s*)*<p class="opt-label"[^>]*>([\s\S]*?)<\/p>/g)].map(([, attrs, n, label]) => ({
    n: Number(n), label: label.trim(), parent: attrs.match(/data-parent="(\d+)"/)?.[1], discarded: /\bdata-discarded\b/.test(attrs),
  }))
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [dir, ...rest] = process.argv.slice(2)
  const flag = (name) => { const i = rest.indexOf(name); return i >= 0 ? rest[i + 1] : undefined }
  const fail = (why) => { console.error(why); process.exit(1) }
  const index = `${dir}/index.html`, has = dir && existsSync(index)
  const group = flag('--append'), title = rest[0]?.startsWith('--') ? undefined : rest[0]

  if (rest.includes('--list')) {
    if (!has) fail(`${index} não existe`)
    const all = options(readFileSync(index, 'utf8'))
    console.log(`brief: ${existsSync(`${dir}/brief.md`) ? `${dir}/brief.md` : 'não existe (pergunte ao designer e salve antes de variar)'}`)
    console.log(`próxima opção: ${Math.max(0, ...all.map((o) => o.n)) + 1}`)
    for (const o of all) console.log(`${o.n} | ${o.label}${o.parent ? ` | variação da ${o.parent}` : ''}${o.discarded ? ' | DESCARTADA' : ''}`)
    process.exit(0)
  }
  if (dir && rest.includes('--drop')) { rmSync(`${dir}/parts`, { recursive: true, force: true }); console.log('ok: partes descartadas'); process.exit(0) }
  if (!dir || (!group && !title)) fail('uso: node scripts/explore-stitch.mjs docs/explorations/<slug> "<título>" | --append "<grupo>" [--parent N] | --list')
  if (group ? !has : has) fail(group ? `${index} não existe: nada para variar` : `${index} já existe: não sobrescrevo outra exploração`)

  const page = group ? readFileSync(index, 'utf8') : ''
  const first = group ? Math.max(0, ...options(page).map((o) => o.n)) + 1 : 1
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
