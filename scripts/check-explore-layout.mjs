// node scripts/check-explore-layout.mjs docs/explorations/<slug>
// Renders the exploration and fails when a piece of an option is drawn outside its card: the writer cannot see the page, this can.
// Typical cause: width/height or position on an inline element (a <span>), so the layers inside it collapse and spill.
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { chromium } from 'playwright'

const browser = await chromium.launch().catch(() => null)
if (!browser) { console.error('Chromium não subiu: rode `npm run browsers:install`'); process.exit(2) }
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } })
await page.goto(pathToFileURL(resolve(process.argv[2], 'index.html')).href)
const bad = await page.evaluate(() => {
  const out = []
  for (const card of document.querySelectorAll('.opt')) {
    const box = card.getBoundingClientRect()
    const walk = (el) => {
      const r = el.getBoundingClientRect(), s = getComputedStyle(el)
      if (s.display === 'none' || s.visibility === 'hidden') return
      if (r.width && r.height && (r.left < box.left - 1 || r.right > box.right + 1 || r.top < box.top - 1 || r.bottom > box.bottom + 1)) {
        const name = (e) => `<${e.tagName.toLowerCase()}${e.classList.length ? '.' + [...e.classList].join('.') : ''}>`
        let inline = el
        while (inline !== card && getComputedStyle(inline).display !== 'inline') inline = inline.parentElement
        const why = inline === card ? 'confira o tamanho e a posição do pai' : `${name(inline)} é inline: width, height e position não valem nele; use display: block ou flex`
        return out.push(`Opção ${card.dataset.option}: ${name(el)} sai do card (${why})`)
      }
      // What a clipping parent hides (a carousel's next slide) is not drawn, so it is not a spill.
      if (s.overflow === 'visible') for (const child of el.children) walk(child)
    }
    const before = out.length
    for (const child of card.querySelector('.opt-content')?.children ?? []) walk(child)
    out.length = Math.min(out.length, before + 1) // one line per option: the rest are the same cause
  }
  return out
})
await browser.close()
if (bad.length) { console.error(bad.join('\n')); process.exit(1) }
console.log('ok')
