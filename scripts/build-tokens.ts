/**
 * `npm run tokens:build` — compiles tokens/tokens.json into src/styles/global.css
 * and src/styles/global-tokens.ts.
 *
 * `npm run tokens:check` (`--check`) writes nothing and exits 1 when either file
 * has drifted from tokens.json.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { compileTokens, TOKEN_OUTPUTS, TOKENS_SOURCE } from './tokens/compile'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const check = process.argv.includes('--check')

const compiled = compileTokens(JSON.parse(readFileSync(join(ROOT, TOKENS_SOURCE), 'utf8')))

const stale: string[] = []
for (const key of ['css', 'ts', 'names'] as const) {
  const file = join(ROOT, TOKEN_OUTPUTS[key])
  let current = ''
  try {
    current = readFileSync(file, 'utf8')
  } catch {
    // Missing counts as stale.
  }
  if (current === compiled[key]) continue
  stale.push(TOKEN_OUTPUTS[key])
  if (!check) writeFileSync(file, compiled[key])
}

if (check) {
  if (stale.length) {
    console.error(`Stale token output — run \`npm run tokens:build\`:\n${stale.map((f) => `  ${f}`).join('\n')}`)
    process.exit(1)
  }
  console.log('Token output is up to date with tokens/tokens.json.')
} else {
  console.log(stale.length ? `Wrote ${stale.join(', ')}` : 'Token output already up to date.')
}
