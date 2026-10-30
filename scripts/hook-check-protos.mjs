/**
 * The PostToolUse hook of `.claude/settings.json` (Write, Edit): hands the tool call on stdin to scripts/check-edited.ts.
 * A plain `node` cannot import TypeScript on every Node the designers run, so the logic lives there, as vite-node runs it.
 * Starting vite-node costs seconds, so a file that is clearly not designer code is dropped here first, by the same
 * rule as `isDesignerCode` (src/shared/protoFolders.ts; scripts/hook-check-protos.test.ts keeps the two equal).
 * A tool call whose path cannot be read goes on to check-edited.ts, as before.
 */
import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('..', import.meta.url))

/** `isDesignerCode`: any `.tsx` or `.ts` below `…/web/protos/<designer>/`. */
export function isDesignerCode(path) {
  const m = /^((?:.*\/)?web\/protos\/([^/]+))\/(.+)$/.exec(path)
  return /\.tsx?$/.test(m ? m[3] : '')
}

/** False only when the tool call names a file path that is not designer code; true when unsure. */
export function mayBeDesignerCode(input) {
  let file
  try {
    file = JSON.parse(input).tool_input?.file_path
  } catch {
    return true
  }
  return typeof file !== 'string' || isDesignerCode(file)
}

/** Runs the hook for one stdin; `spawn` is spawnSync's shape. Returns the exit code. */
export function runHook(input, spawn = spawnSync) {
  if (!mayBeDesignerCode(input)) return 0
  // vite-node's own entry on this node: no `npx` lookup, and no `.bin` shim (a .cmd on Windows).
  const run = spawn(process.execPath, [join(ROOT, 'node_modules/vite-node/dist/cli.mjs'), '--config', 'vitest.config.ts', 'scripts/check-edited.ts'], { cwd: ROOT, input, stdio: ['pipe', 'inherit', 'inherit'] })
  return run.status ?? 1
}

if (!process.env.VITEST) {
  let input = ''
  try {
    input = readFileSync(0, 'utf8')
  } catch {}
  process.exit(runHook(input))
}
