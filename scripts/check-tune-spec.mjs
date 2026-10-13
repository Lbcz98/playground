// node scripts/check-tune-spec.mjs docs/explorations/<slug>[/parts/<N>.html] <option>
// Fails when a tuned option's controls (data-tune spec + tune:vars block) would not work on the /tune stage. The writer cannot see the stage: this is how it knows.
import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { lintSpec } from './explore-tune.mjs'

const [target, n] = process.argv.slice(2)
const file = target?.endsWith('.html') ? target : `${target}/index.html`
if (!target || !/^\d+$/.test(n ?? '') || !existsSync(file)) { console.error('uso: node scripts/check-tune-spec.mjs <pasta ou parts/N.html> <opção>'); process.exit(1) }
const css = readFileSync(fileURLToPath(new URL('../src/styles/global.css', import.meta.url)), 'utf8')
const bad = lintSpec(readFileSync(file, 'utf8'), n, new Set(css.match(/--[\w-]+(?=\s*:)/g)))
if (bad.length) { console.error(bad.join('\n')); process.exit(1) }
console.log('ok')
