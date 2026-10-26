// node scripts/check-explore-layout.mjs docs/explorations/<slug>[/parts/<N>.html] [--shots <out folder> [--keys ArrowRight,Enter]]
// Renders the exploration and fails on what the writer cannot see by reading the code. One line per problem, in Portuguese:
//   escapa     a piece is drawn outside its card (usually width/height/position on an inline element: a <span>)
//   sobrepõe   two pieces with text sit on top of each other
//   cortado    content is cut by a parent with overflow hidden, or text touches a rounded corner
//   pílula     a pill radius on a box taller than a control
//   superfície a card-like surface that is not the kit's: radius, inset or width (see "Surfaces" in explore-tokens.md)
//   altura     a card with a fixed height its content does not fill (the kit's card hugs its content), or taller than the kit allows
//   ritmo      the gaps between the groups of a card: one value, 12 to 16 (smaller gaps are inside a group)
//   quebra     text of two lines or more with no text-wrap: balance (a title) or pretty (a sentence): its last line may be one lone word
//   respiro    a card whose space under its content is bigger than above it (a min-height or reserved lines for a longer text show as dead space at the bottom)
//   consistência  surfaces of one page that differ from the rest in radius, color or inset (whole page only)
// Opt-outs, for what is deliberate: `data-stack` on the element whose children overlap or are clipped on purpose (a flip card, a drawer that slides in, a carousel, a pile);
// `data-surface="own"` on a surface that is the idea of the option (not a card), with the reason in the report.
// --shots: when the page is `ok`, also the PNGs of scripts/explore-shots.mjs (with its --keys), from the same open page: one Chromium, one call.
import { openExploration, shoot } from './explore-page.mjs'

const { page, close } = await openExploration(process.argv[2])
const whole = !/\d+\.html$/.test(process.argv[2])
const result = await page.evaluate((whole) => {
  const out = []
  const name = (e) => `<${e.tagName.toLowerCase()}${e.classList.length ? '.' + [...e.classList].join('.') : ''}>`
  const px = (v) => parseFloat(v) || 0
  const visible = (e) => { const s = getComputedStyle(e); return s.display !== 'none' && s.visibility !== 'hidden' && s.opacity !== '0' }
  const inStack = (e) => !!e.closest('[data-stack]')
  // Every kit radius a card may have, and its inset (spacing-semantic-card-inset 24 for a Card, resting or expanded; card-inset-expanded 32 for the Content Card); read from the kit's own variables.
  // The expanded card and the Content Card share a radius: the width tells them apart, and an unknown width takes the Content Card's larger inset.
  const root = getComputedStyle(document.documentElement)
  const kit = (v) => px(root.getPropertyValue(v))
  const SURFACES = [
    { label: 'card', radius: kit('--dimension-radius-semantic-card'), inset: kit('--dimension-spacing-semantic-card-inset'), insetToken: '--dimension-spacing-semantic-card-inset', widths: [kit('--dimension-size-semantic-card-width')] },
    { label: 'content card', radius: kit('--dimension-radius-semantic-content-card'), inset: kit('--dimension-spacing-semantic-card-inset-expanded'), insetToken: '--dimension-spacing-semantic-card-inset-expanded', widths: [kit('--dimension-size-semantic-content-card-width')] },
    { label: 'card expandido', radius: kit('--dimension-radius-semantic-card-expanded'), inset: kit('--dimension-spacing-semantic-card-inset'), insetToken: '--dimension-spacing-semantic-card-inset', widths: [kit('--dimension-size-semantic-card-expanded-width')] },
  ]
  const CONTROL = kit('--dimension-size-semantic-control-height-lg')
  const MAX_HEIGHT = 456 // contentCardSpec.maxHeight in src/design-system/primitives.ts: the tallest a kit card may be
  // The darkest kit background is the TV behind the panel (a stage), not a card.
  const probe = Object.assign(document.createElement('i'), { style: 'background: var(--color-semantic-functional-background-primary)' })
  document.body.append(probe)
  const STAGE = getComputedStyle(probe).backgroundColor
  probe.remove()
  const surfaces = []
  // How far the card's edge is from what is drawn in it: text (its glyph boxes) and boxes that paint something, not layout boxes that only reserve room.
  const inkOf = (card) => {
    const cr = card.getBoundingClientRect()
    let top = Infinity, bottom = -Infinity
    const take = (r) => { if (r.width > 1 && r.height > 1) { top = Math.min(top, r.top); bottom = Math.max(bottom, r.bottom) } }
    const walk = document.createTreeWalker(card, NodeFilter.SHOW_TEXT)
    for (let t = walk.nextNode(); t; t = walk.nextNode()) {
      const p = t.parentElement
      if (!t.textContent.trim() || !p || !visible(p) || p.closest('svg') || p.closest('[data-stack]')) continue
      const rg = document.createRange(); rg.selectNodeContents(t); for (const r of rg.getClientRects()) take(r)
    }
    for (const e of card.querySelectorAll('*')) {
      if (!visible(e) || e.closest('[data-stack]')) continue
      const s = getComputedStyle(e), alpha = (s.backgroundColor.match(/[\d.]+/g)?.map(Number) ?? [0, 0, 0, 0])[3] ?? 1
      if ((e.tagName === 'svg' && !e.parentElement.closest('svg')) || (!e.closest('svg') && (e.tagName === 'IMG' || alpha > 0.05))) take(e.getBoundingClientRect())
    }
    return top === Infinity ? null : { top: top - cr.top, bottom: cr.bottom - bottom }
  }

  for (const card of document.querySelectorAll('.opt[data-option]')) {
    const n = card.dataset.option, content = card.querySelector('.opt-content'), box = card.getBoundingClientRect()
    if (!content) continue
    const say = (kind, msg) => out.push(`Opção ${n}: ${kind}: ${msg}`)
    const all = [...content.querySelectorAll('*')].filter((e) => visible(e) && !e.closest('svg') && !inStack(e))

    // escapa: a piece outside the card.
    const clipped = (e) => { for (let a = e.parentElement; a && a !== content; a = a.parentElement) if (/hidden|clip/.test(getComputedStyle(a).overflowX)) return true; return false }
    const spilled = all.find((e) => { const r = e.getBoundingClientRect(); return !clipped(e) && r.width && r.height && (r.left < box.left - 1 || r.right > box.right + 1 || r.top < box.top - 1 || r.bottom > box.bottom + 1) })
    if (spilled) {
      let inline = spilled
      while (inline !== card && getComputedStyle(inline).display !== 'inline') inline = inline.parentElement
      say('escapa', `${name(spilled)} sai do card (${inline === card ? 'confira o tamanho e a posição do pai' : `${name(inline)} é inline: width, height e position não valem nele; use display: block ou flex`})`)
    }

    // sobrepõe: text-bearing leaves whose boxes cross (neither inside the other).
    const texts = all.filter((e) => ![...e.childNodes].some((c) => c.nodeType === 1) && e.textContent.trim()).map((e) => ({ e, r: e.getBoundingClientRect() })).filter(({ r }) => r.width > 2 && r.height > 2)
    overlap: for (let i = 0; i < texts.length; i++) for (let j = i + 1; j < texts.length; j++) {
      const a = texts[i].r, b = texts[j].r
      const w = Math.min(a.right, b.right) - Math.max(a.left, b.left), h = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top)
      if (w > 2 && h > 2 && w * h > 0.25 * Math.min(a.width * a.height, b.width * b.height)) { say('sobrepõe', `${name(texts[i].e)} "${texts[i].e.textContent.trim().slice(0, 16)}" e ${name(texts[j].e)} "${texts[j].e.textContent.trim().slice(0, 16)}" ficam um sobre o outro`); break overlap }
    }

    // quebra: two lines or more need text-wrap: balance (a title) or pretty (a sentence), or a line may end in one lone word.
    for (const { e: t } of texts) {
      // The lines of the text itself (its client rects), not the height of its box: a segment 40px tall around one line is one line.
      const rg = document.createRange(); rg.selectNodeContents(t)
      const lines = new Set([...rg.getClientRects()].map((r) => Math.round(r.top / 4))).size
      if (lines < 2 || /balance|pretty/.test(getComputedStyle(t).textWrapStyle)) continue
      say('quebra', `o texto "${t.textContent.trim().slice(0, 18)}" tem ${lines} linhas sem text-wrap: balance (título) nem pretty (frase); a última linha pode ficar com uma palavra só`)
      break
    }

    // cortado: overflow hidden/clip with content beyond it (an ellipsis or a scroller is on purpose).
    for (const e of all) {
      const s = getComputedStyle(e)
      if (!/hidden|clip/.test(s.overflowX + s.overflowY) || s.textOverflow === 'ellipsis' || e.hasAttribute('data-stack')) continue
      if (e.scrollWidth > e.clientWidth + 1 || e.scrollHeight > e.clientHeight + 1) { say('cortado', `${name(e)} esconde conteúdo (${e.scrollWidth}×${e.scrollHeight} dentro de ${e.clientWidth}×${e.clientHeight}); aumente a caixa ou tire o overflow`); break }
    }

    // pílula + cortado nos cantos + superfícies: every box that looks like a card.
    for (const e of [content, ...all]) {
      const s = getComputedStyle(e), r = e.getBoundingClientRect()
      const bg = s.backgroundColor.match(/[\d.]+/g)?.map(Number) ?? [0, 0, 0, 0], filled = (bg[3] ?? 1) > 0.05
      const radius = px(s.borderTopLeftRadius)
      if (e === content || !filled || r.width < 120 || r.height < 72 || radius < 8) continue
      if (radius >= kit('--dimension-radius-core-full') - 1 && r.height > CONTROL * 2) say('pílula', `${name(e)} tem raio de pílula (${radius}px) em uma caixa de ${Math.round(r.height)}px de altura; use o raio de card do kit`)
      // Text touching the rounded corner: the corner of its box lies outside the arc.
      const eff = Math.min(radius, r.width / 2, r.height / 2)
      for (const { e: t, r: tr } of texts) {
        if (!e.contains(t)) continue
        // For each corner of the card: a text point inside that corner's eff×eff square must be within eff of the arc's center.
        const hit = [[r.left, r.top, 1, 1], [r.right, r.top, -1, 1], [r.left, r.bottom, 1, -1], [r.right, r.bottom, -1, -1]].some(([cx0, cy0, sx, sy]) => {
          const cx = cx0 + sx * eff, cy = cy0 + sy * eff
          return [[tr.left, tr.top], [tr.right, tr.top], [tr.left, tr.bottom], [tr.right, tr.bottom]].some(([x, y]) => (x - cx) * sx < 0 && (y - cy) * sy < 0 && Math.hypot(x - cx, y - cy) > eff + 0.5)
        })
        if (hit) { say('cortado', `o texto "${t.textContent.trim().slice(0, 16)}" encosta no canto arredondado de ${name(e)} (raio ${radius}px); dê mais respiro ou use um raio menor`); break }
      }
      if (e.dataset.surface === 'own' || e.closest('[data-surface="own"]') || s.backgroundColor === STAGE) continue
      if (surfaces.some((f) => f.n === n && f.e.contains(e))) continue // a box inside the option's card is one of its parts, not another card
      surfaces.push({ n, e, name: name(e), radius, bg: s.backgroundColor, inset: Math.min(px(s.paddingTop), px(s.paddingLeft), px(s.paddingRight), px(s.paddingBottom)), w: r.width, h: r.height, pill: radius >= kit('--dimension-radius-core-full') - 1 && r.height <= CONTROL * 2 })
    }
  }

  // superfície: against the kit's card recipes. A pill no taller than two controls is the kit's pill (a glance bar), not a card.
  for (const f of surfaces.filter((f) => !f.pill)) {
    const same = SURFACES.filter((x) => Math.abs(x.radius - f.radius) < 0.5)
    const r = same.find((x) => x.widths.some((w) => Math.abs(w - f.w) < 1)) ?? same[0]
    const at = `Opção ${f.n}: superfície: ${f.name}`
    if (!r) out.push(`${at} tem raio ${f.radius}px; os raios de card do kit são ${SURFACES.map((x) => x.radius + 'px (' + x.label + ')').join(', ')}. Use var(--dimension-radius-semantic-card) ou var(--dimension-radius-semantic-content-card)`)
    else if (f.inset < r.inset - 0.5) out.push(`${at} tem respiro de ${f.inset}px com raio ${f.radius}px; o kit usa ${r.inset}px (${r.insetToken})`)
    // Width: the kit's cards have a fixed width. Narrower than declared means the page squeezed it (max-width); another number means it is not a kit card.
    const fixed = [...new Set(SURFACES.flatMap((x) => x.widths))]
    if (r && !fixed.some((w) => Math.abs(w - f.w) < 1)) out.push(`${at} tem ${Math.round(f.w)}px de largura; as larguras de card do kit são ${fixed.join(', ')}px (--dimension-size-semantic-card-width, -card-expanded-width, -content-card-width), sem max-width que o aperte`)
    // Height: what the card would take if it hugged its content, against what it takes.
    const style = f.e.getAttribute('style')
    f.e.style.setProperty('height', 'auto', 'important')
    const natural = f.e.getBoundingClientRect().height
    style === null ? f.e.removeAttribute('style') : f.e.setAttribute('style', style)
    // A pile or a stage of absolutely placed layers has no content height to hug: `data-stack` inside says the height is the design.
    if (f.h - natural > 16 && !f.e.querySelector('[data-stack]')) out.push(`Opção ${f.n}: altura: ${f.name} tem altura fixa de ${Math.round(f.h)}px e o conteúdo ocupa ${Math.round(natural)}px: sobra um vazio de ${Math.round(f.h - natural)}px. O card do kit abraça o conteúdo: tire o height`)
    if (f.h > MAX_HEIGHT + 0.5) out.push(`Opção ${f.n}: altura: ${f.name} tem ${Math.round(f.h)}px; o card do kit vai até ${MAX_HEIGHT}px. Mostre menos de uma vez`)
    // ritmo: between the groups of a card, one gap, 12 to 16 (--dimension-spacing-core-xs or -sm). Gaps under 9 are inside a group (a title and its sentence).
    const stack = [...f.e.children].filter((k) => visible(k) && getComputedStyle(k).position !== 'absolute' && !inStack(k)).map((k) => k.getBoundingClientRect()).filter((r) => r.height > 0).sort((a, b) => a.top - b.top)
    const between = stack.slice(1).map((r, i) => r.top - stack[i].bottom).filter((g) => g >= 9)
    if (between.length && stack.every((r, i) => !i || r.top >= stack[i - 1].bottom - 1) && (between.some((g) => g < 11 || g > 17) || Math.max(...between) - Math.min(...between) > 2)) out.push(`Opção ${f.n}: ritmo: os vãos entre os grupos de ${f.name} são ${between.map((g) => Math.round(g) + 'px').join(', ')}; use um só valor, de 12 a 16 (--dimension-spacing-core-xs ou -sm), e deixe os vãos menores só dentro de um grupo`)
    // respiro: the same distance from the edge to the content at the top and at the bottom. A few px of text leading is not a gap; reserved room is.
    // Only where the card's height comes from its content: a kit Card of fixed size may have room under short content, by design.
    const was = f.e.getAttribute('style')
    f.e.style.setProperty('height', 'auto', 'important')
    f.e.style.setProperty('min-height', '0', 'important')
    const hug = f.e.getBoundingClientRect().height
    was === null ? f.e.removeAttribute('style') : f.e.setAttribute('style', was)
    const ink = f.h > 96 && f.h - hug <= 16 && !f.e.querySelector('[data-stack]') ? inkOf(f.e) : null
    if (ink && ink.bottom - ink.top > 8) out.push(`Opção ${f.n}: respiro: ${f.name} tem ${Math.round(ink.bottom)}px de espaço embaixo do conteúdo e ${Math.round(ink.top)}px em cima; o respiro é o mesmo nos dois (o inset do kit). Um min-height ou linhas reservadas para um texto mais longo aparecem como espaço morto embaixo: tire a reserva e escreva as frases com o mesmo número de linhas`)
  }
  // consistência: the same role looks the same in every option. The most used kit radius and the most used color are the reference.
  if (whole) {
    const cards = surfaces.filter((f) => !f.pill && f.h > 96)
    const top = (list, key) => { const c = {}; for (const f of list) c[f[key]] = (c[f[key]] || 0) + 1; return Object.entries(c).sort((a, b) => b[1] - a[1])[0]?.[0] }
    const radius = Number(top(cards.filter((f) => SURFACES.some((x) => Math.abs(x.radius - f.radius) < 0.5)), 'radius')), bg = top(cards, 'bg')
    for (const f of cards) {
      if (radius && f.radius !== radius && SURFACES.some((x) => Math.abs(x.radius - f.radius) < 0.5)) out.push(`Opção ${f.n}: consistência: ${f.name} tem raio ${f.radius}px e as outras opções usam ${radius}px`)
      if (f.bg !== bg) out.push(`Opção ${f.n}: consistência: ${f.name} tem outra cor de fundo (${f.bg}) das outras opções (${bg})`)
    }
  }
  // A tuned option (/tune) may leave the kit's radius, inset or color on purpose: advised, not failed.
  const tuned = (l) => document.querySelector(`.opt[data-option="${l.match(/^Opção (\d+)/)?.[1]}"]`)?.hasAttribute('data-tuned')
  const advice = out.filter((l) => /: (superfície|consistência):/.test(l) && tuned(l))
  return [[...new Set(out.filter((l) => !advice.includes(l)))], [...new Set(advice)]]
}, whole)
const [found, advice] = result
const flag = (n) => { const i = process.argv.indexOf(n); return i > 2 ? process.argv[i + 1] ?? '' : undefined }
const shots = !found.length && flag('--shots') ? await shoot(page, flag('--shots'), (flag('--keys') ?? '').split(',').filter(Boolean)) : []
await close()
if (advice.length) console.log(advice.map((l) => `advisory: ${l}`).join('\n'))
if (found.length) { console.error(found.join('\n')); process.exit(1) }
console.log(['ok', ...shots].join('\n'))
