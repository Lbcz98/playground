/**
 * Guard-rail: fail the build if design values are hard-coded instead of tokenised.
 *
 * Checks every file under src/ (except design-system/primitives.ts, the one place
 * raw values are allowed) for:
 *   - Tailwind arbitrary-value syntax:  class="p-[10px]", bg-[#fff], w-[50%]
 *   - raw hex colors and px lengths inside JSX/TS string literals
 *
 * This is what makes "the AI cannot invent styles" enforceable in code review as
 * well as at runtime.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname
const SRC = join(ROOT, 'src')
const ALLOWLIST = new Set([
  join(SRC, 'design-system', 'primitives.ts'),
  join(SRC, 'styles', 'global.css'),
  join(SRC, 'shared', 'design-system', 'w3c-token-source.ts'),
])

const ARBITRARY_CLASS = /\b(?:[a-z-]+)-\[[^\]]+\]/g
const RAW_HEX = /#[0-9a-fA-F]{3,8}\b/g
const RAW_PX = /\b\d+px\b/g

/** @param {string} dir */
function* walk(dir) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name)
    if (statSync(full).isDirectory()) yield* walk(full)
    // Tests deliberately feed invalid values (e.g. "10px") to the interpreter.
    else if (/\.(ts|tsx|css)$/.test(name) && !/\.test\.(ts|tsx)$/.test(name)) yield full
  }
}

const problems = []
for (const file of walk(SRC)) {
  if (ALLOWLIST.has(file)) continue
  const text = readFileSync(file, 'utf8')
  const rel = relative(ROOT, file)
  for (const [label, re] of [
    ['arbitrary Tailwind value', ARBITRARY_CLASS],
    ['raw hex color', RAW_HEX],
    ['raw px length', RAW_PX],
  ]) {
    const hits = text.match(re)
    if (hits) problems.push(`${rel}: ${label} -> ${[...new Set(hits)].join(', ')}`)
  }
}

if (problems.length) {
  console.error('Token check failed:\n' + problems.map((p) => '  ' + p).join('\n'))
  process.exit(1)
}
console.log('Token check passed — no hard-coded design values.')
