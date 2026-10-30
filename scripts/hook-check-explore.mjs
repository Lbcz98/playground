/**
 * A PostToolUse hook of `.claude/settings.json` (Write, Edit): after an exploration's `parts/<N>.html` or `index.html` is
 * written, runs scripts/check-explore-tokens.mjs on it, so a proto-explorer sees a broken token rule without asking.
 * A failure exits 2 with the checker's lines on stderr (Claude Code hands them to the agent); advisories go back as
 * additionalContext; `ok` is silent. The layout check opens a browser, so it stays a step the agent runs itself.
 */
import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const CHECK = fileURLToPath(new URL('./check-explore-tokens.mjs', import.meta.url))

/** The file the hook checks: an exploration page or one of its parts; anything else is undefined. */
export function explorationFile(input) {
  let file
  try {
    file = JSON.parse(input).tool_input?.file_path
  } catch {
    return undefined
  }
  return typeof file === 'string' && /(?:^|\/)docs\/explorations\/[^/]+\/(?:index|parts\/\d+)\.html$/.test(file) ? file : undefined
}

/** Runs the hook for one stdin; `spawn` is spawnSync's shape. Returns [exit code, stdout, stderr]. */
export function runHook(input, spawn = spawnSync) {
  const file = explorationFile(input)
  if (!file) return [0, '', '']
  const run = spawn(process.execPath, [CHECK, file], { encoding: 'utf8' })
  const out = (run.stdout ?? '').trim(), err = (run.stderr ?? '').trim()
  if (run.status !== 0) return [2, '', `check-explore-tokens ${file}:\n${err || out}`]
  const advice = out.split('\n').filter((l) => l.startsWith('advisory:'))
  if (!advice.length) return [0, '', '']
  return [0, JSON.stringify({ hookSpecificOutput: { hookEventName: 'PostToolUse', additionalContext: `check-explore-tokens ${file}: ok, with advice:\n${advice.join('\n')}` } }), '']
}

if (!process.env.VITEST) {
  let input = ''
  try {
    input = readFileSync(0, 'utf8')
  } catch {}
  const [code, out, err] = runHook(input)
  if (out) process.stdout.write(out)
  if (err) process.stderr.write(err)
  process.exit(code)
}
