// node scripts/gold-sheet.mjs
// Renders the gold set (design-brain/toolbox/references/gold.json) into one contact sheet, gold-sheet.png.
// Explorers read that PNG from the pack; they do not open the cards' HTML to copy it.
import { copyFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import { openExploration } from './explore-page.mjs'
import { loadGold } from './explore-pack.mjs'

const root = fileURLToPath(new URL('..', import.meta.url))
const goldDir = join(root, 'design-brain/toolbox/references')
const gold = loadGold(goldDir)
if (!gold?.cards.length) { console.error('erro: gold set vazio'); process.exit(1) }

const shots = []
for (const card of gold.cards) {
  const { page, close } = await openExploration(join(goldDir, card.id))
  const el = page.locator('.opt[data-option]').first()
  await el.scrollIntoViewIfNeeded()
  shots.push([`${card.title} · ${card.source}`, await el.screenshot()])
  await close()
}

const browser = await chromium.launch()
const page = await browser.newPage()
const cells = shots.map(([label, png]) => `<figure><figcaption>${label}</figcaption><img src="data:image/png;base64,${png.toString('base64')}"></figure>`).join('')
await page.setContent(`<body style="margin:0;background:#0b0b0d"><div id="s" style="display:inline-grid;grid-template-columns:repeat(${shots.length},auto);gap:24px;padding:24px;align-items:start">${cells}</div><style>figure{margin:0}figcaption{font:600 16px system-ui;color:#ccc;margin:0 0 8px}img{display:block}</style></body>`)
const tmp = join(tmpdir(), 'gold-sheet.png')
await page.locator('#s').screenshot({ path: tmp })
await browser.close()
const out = join(goldDir, 'gold-sheet.png')
copyFileSync(tmp, out)
console.log(out)
