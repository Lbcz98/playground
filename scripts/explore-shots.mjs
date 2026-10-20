// node scripts/explore-shots.mjs docs/explorations/<slug>[/parts/<N>.html] <out folder> [--keys ArrowRight,Enter]
// One PNG per option card, rendered the way the live page shows it. The writer cannot see the page: this is how it looks before reporting.
// --keys: also one PNG after each key, pressed in order on each card (opcao-<N>-<i>-<key>.png), to see what the keys do.
import { openExploration, shoot } from './explore-page.mjs'

const [target, out] = process.argv.slice(2)
const keys = process.argv.includes('--keys') ? (process.argv[process.argv.indexOf('--keys') + 1] ?? '').split(',').filter(Boolean) : []
if (!target || !out || out.startsWith('--')) { console.error('uso: node scripts/explore-shots.mjs <pasta ou parts/N.html> <pasta de saída> [--keys ArrowRight,Enter]'); process.exit(1) }
const { page, close } = await openExploration(target)
console.log((await shoot(page, out, keys)).join('\n'))
await close()
