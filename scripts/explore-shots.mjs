// node scripts/explore-shots.mjs docs/explorations/<slug>[/parts/<N>.html] <out folder>
// One PNG per option card, rendered the way the live page shows it. The writer cannot see the page: this is how it looks before reporting.
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { openExploration } from './explore-page.mjs'

const [target, out] = process.argv.slice(2)
if (!target || !out) { console.error('uso: node scripts/explore-shots.mjs <pasta ou parts/N.html> <pasta de saída>'); process.exit(1) }
mkdirSync(out, { recursive: true })
const { page, close } = await openExploration(target)
for (const card of await page.locator('.opt[data-option]').all()) {
  const n = await card.getAttribute('data-option')
  await card.scrollIntoViewIfNeeded()
  await card.screenshot({ path: join(out, `opcao-${n}.png`) })
  console.log(join(out, `opcao-${n}.png`))
}
await close()
