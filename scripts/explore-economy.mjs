// Switches of the /explore token economy, read from scripts/explore-economy.json.
// A missing file or key is false: the old behaviour. Each switch is independent.
//   node scripts/explore-economy.mjs get <key>   prints true or false
//   node scripts/explore-economy.mjs headless    prints "sair" when headless_exit is on and the run is non-interactive (EXPLORE_HEADLESS=1 or --headless), else "seguir"
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

if (process.argv[1]?.endsWith('explore-economy.mjs')) {
  const [cmd, key] = process.argv.slice(2)
  if (cmd === 'get') console.log(String(flag(key)))
  else if (cmd === 'headless') console.log(headlessExit(process.env, process.argv.slice(3)) ? 'sair' : 'seguir')
  else { console.error('uso: get <chave> | headless [--headless]'); process.exit(1) }
}
