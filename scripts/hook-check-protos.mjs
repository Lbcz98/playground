/**
 * The PostToolUse hook of `.claude/settings.json` (Write, Edit): hands the tool call on stdin to scripts/check-edited.ts.
 * A plain `node` cannot import TypeScript on every Node the designers run, so the logic lives there, as vite-node runs it.
 */
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const run = spawnSync('npx', ['vite-node', '--config', 'vitest.config.ts', 'scripts/check-edited.ts'], { cwd: ROOT, stdio: 'inherit' })
process.exit(run.status ?? 1)
