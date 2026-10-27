// node scripts/icon-to-png.mjs <icon.svg> <out.png> [--size 24] [--color "#EEEEEE"]
// The system does not use SVG in explorations: this renders an icon (a kit one in src/ui-kit/icons/, or one drawn for an option) to a transparent PNG at 2x, for <img> or a CSS mask-image.
// A mask-image keeps the colour a kit token: `mask: url(assets/x.png) center / contain no-repeat; background: var(--color-semantic-...)`. The PNG's own colour only shows in an <img>:
// `currentColor` in the SVG becomes --color (default #EEEEEE, the value of text-primary), so a kit icon is not rendered black.
import { mkdirSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { launchChromium } from './explore-page.mjs'

const args = process.argv.slice(2)
const option = (name, fallback) => { const i = args.indexOf(name); return i < 0 ? fallback : args.splice(i, 2)[1] }
const size = parseInt(option('--size', '24'))
const color = option('--color', '#EEEEEE')
const [src, out] = args
if (!src || !out || !(size > 0)) { console.error('uso: node scripts/icon-to-png.mjs <icon.svg> <saida.png> [--size 24] [--color "#EEEEEE"]'); process.exit(2) }

const svg = readFileSync(src, 'utf8').replace(/currentColor/g, color).replace(/<svg\b/, `<svg style="width:${size}px;height:${size}px;display:block"`)
const browser = await launchChromium()
try {
  const page = await browser.newPage({ viewport: { width: size, height: size }, deviceScaleFactor: 2 })
  await page.setContent(`<body style="margin:0;background:transparent">${svg}</body>`)
  mkdirSync(dirname(resolve(out)), { recursive: true })
  await page.screenshot({ path: out, omitBackground: true, clip: { x: 0, y: 0, width: size, height: size } })
} finally {
  await browser.close()
}
console.log(`${out} (${size * 2}×${size * 2}px, ${size}px em 2x)`)
