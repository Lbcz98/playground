// Switches of the /explore token economy, read from scripts/explore-economy.json.
// A missing file or key is false: the old behaviour. Each switch is independent.
//   node scripts/explore-economy.mjs get <key>   prints true or false
//   node scripts/explore-economy.mjs headless    prints "sair" when headless_exit is on and the run is non-interactive (EXPLORE_HEADLESS=1 or --headless), else "seguir"
//   node scripts/explore-economy.mjs explorer    prints the explorer_cap line, or nothing when the switch is off
import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const FILE = fileURLToPath(new URL('./explore-economy.json', import.meta.url))

export function economy(file = FILE) {
  if (!existsSync(file)) return {}
  try { return JSON.parse(readFileSync(file, 'utf8')) } catch { return {} }
}

export const flag = (key, file = FILE) => economy(file)[key] === true

export const headlessExit = (env = process.env, argv = [], file = FILE) =>
  flag('headless_exit', file) && (env.EXPLORE_HEADLESS === '1' || argv.includes('--headless'))

/** One line, injected only while `explorer_cap` is on. Empty string restores the old prompt. */
export const EXPLORER_CAP = 'explorer_cap replaces steps 6 and 7: one Bash call checks and shoots (tokens && layout --shots); at most 2 look-and-fix rounds; then read your sheet once and report ainda aberto.'

export const explorerCap = (file = FILE) => (flag('explorer_cap', file) ? EXPLORER_CAP : '')

if (process.argv[1]?.endsWith('explore-economy.mjs')) {
  const [cmd, key] = process.argv.slice(2)
  if (cmd === 'get') console.log(String(flag(key)))
  else if (cmd === 'headless') console.log(headlessExit(process.env, process.argv.slice(3)) ? 'sair' : 'seguir')
  else if (cmd === 'explorer') { const line = explorerCap(); if (line) console.log(line) }
  else { console.error('uso: get <chave> | headless [--headless] | explorer'); process.exit(1) }
}
