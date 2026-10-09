/**
 * Runs `check:laws` on a screen right after Claude Code writes it.
 * Run by the PostToolUse hook in `.claude/settings.json` (Write, Edit) with the tool call on stdin.
 * A file outside `web/protos/<designer>/` is ignored. A screen is checked itself (with its flow, when it
 * is in one); any other file of the folder (a local component, data, `flow.ts`) checks every screen of the
 * folder, since a component's focus or size shows on the screens that use it.
 * Exit 2 hands the findings back to the agent; they block nothing by themselves.
 */
import { spawnSync } from 'node:child_process'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('..', import.meta.url))

let input = ''
for await (const chunk of process.stdin) input += chunk
let file
try {
  file = JSON.parse(input).tool_input?.file_path
} catch {
  process.exit(0)
}
const m = typeof file === 'string' ? /^(.*\/web\/protos\/[^/]+)\/.+\.tsx?$/.exec(file) : null
if (!m || !existsSync(file)) process.exit(0)

const isScreen = (f) => f.endsWith('.tsx') && /<Screen[\s>]/.test(readFileSync(f, 'utf8'))
const screensIn = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const f = join(dir, e.name)
    return e.isDirectory() ? screensIn(f) : isScreen(f) ? [f] : []
  })
const targets = isScreen(file) ? [file] : screensIn(m[1])
if (targets.length === 0) process.exit(0)

const run = spawnSync('npm', ['run', '-s', 'check:laws', '--', ...targets], { cwd: ROOT, encoding: 'utf8' })
if (run.status === 0) process.exit(0)
const out = `${run.stdout}${run.stderr}`.split('\n').filter((l) => l.trim() && !/DeprecationWarning|--trace-deprecation/.test(l)).join('\n')
console.error(
  `check:laws encontrou bloqueios depois desta edição. Uma lei se corrige; um padrão só se declara com @deviation quando o usuário pediu a quebra, citando o pedido (web/protos/CODING_STANDARDS.md).\n${out}`,
)
process.exit(2)
