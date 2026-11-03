/**
 * `explorer_cap` for proto-explorer. The pack's loop_cap line did not hold: steps 6 and 7 still say
 * "fix until ok", and the explorers kept going (32–36 tool calls). This hook, wired from
 * `.claude/settings.json`, injects one line at the start of that agent and refuses the next
 * check round after two. Switch off or missing: no stdout and no decision, the old behaviour.
 *
 * Settings hooks run inside `claude -p` subagents. Frontmatter hooks do not, until the folder is trusted.
 */
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { explorerCap, flag } from './explore-economy.mjs'

export { EXPLORER_CAP } from './explore-economy.mjs'

const CHECK = /check-explore-(?:layout|tokens)\.mjs/
const SHOT = /(?:^|\/)opcao-[^/]*\.png$|explore-shots[\\/].*\.png$/
export const MAX_ROUNDS = 2
/** Initial write, one token fix, one fix per look round. The fifth edit is the "fix until ok" loop. */
export const MAX_EDITS = 4
export const DENY = 'explorer_cap: 2 rounds used. Stop and report ainda aberto.'
export const EDIT = 'explorer_cap: no more edits. Shoot or report ainda aberto.'

export const fresh = () => ({ rounds: 0, edits: 0, looked: false, closed: false })

const shotOf = (call) => call.tool === 'Read' && SHOT.test(call.path || '')
const checkOf = (call) => call.tool === 'Bash' && CHECK.test(call.command || '')
const editOf = (call) => call.tool === 'Write' || call.tool === 'Edit'

/** One tool call. Mutates `state`. `deny` false leaves the tool to the normal flow. */
export function step(state, call) {
  if (state.closed) return { deny: true, reason: DENY }
  if (checkOf(call)) {
    if (state.rounds >= MAX_ROUNDS) { state.closed = true; return { deny: true, reason: DENY } }
    state.rounds += 1
    return { deny: false }
  }
  if (editOf(call)) {
    if (state.rounds >= MAX_ROUNDS) { state.closed = true; return { deny: true, reason: DENY } }
    if (state.edits >= MAX_EDITS) return { deny: true, reason: EDIT }
    state.edits += 1
    return { deny: false }
  }
  if (state.rounds >= MAX_ROUNDS) {
    if (shotOf(call) && !state.looked) { state.looked = true; state.closed = true; return { deny: false } }
    state.closed = true
    return { deny: true, reason: DENY }
  }
  return { deny: false }
}

const callFrom = (evt) => ({
  tool: evt.tool_name,
  command: evt.tool_input?.command,
  path: evt.tool_input?.file_path,
})

const json = (hookEventName, fields) => JSON.stringify({ hookSpecificOutput: { hookEventName, ...fields } })

export function memoryStore() {
  const m = new Map()
  return {
    update(id, fn) {
      const state = m.get(id) ?? fresh()
      const decision = fn(state)
      m.set(id, state)
      return decision
    },
  }
}

/** One file per agent, so parallel explorers do not share a round count. */
export function fileStore(dir) {
  mkdirSync(dir, { recursive: true })
  return {
    update(id, fn) {
      const safe = String(id).replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 160)
      const file = join(dir, `${safe}.json`)
      const lock = join(dir, `${safe}.lock`)
      let held = false
      for (let i = 0; i < 40 && !held; i++) {
        try { mkdirSync(lock); held = true } catch { Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 5) }
      }
      if (!held) return { deny: false }
      try {
        let state = fresh()
        if (existsSync(file)) {
          try { state = { ...fresh(), ...JSON.parse(readFileSync(file, 'utf8')) } } catch { state = fresh() }
        }
        const decision = fn(state)
        writeFileSync(file, JSON.stringify(state))
        return decision
      } finally { rmSync(lock, { recursive: true, force: true }) }
    },
  }
}

/**
 * @returns {[number, string, string]} exit code, stdout, stderr
 * Switch off, another agent, or an event this hook does not judge: empty stdout, exit 0.
 */
export function runHook(input, { file, store } = {}) {
  if (!flag('explorer_cap', file)) return [0, '', '']
  let evt
  try { evt = JSON.parse(input) } catch { return [0, '', ''] }
  const type = evt.agent_type || ''
  const name = evt.hook_event_name
  if (name === 'SessionStart' || name === 'SubagentStart') {
    if (type !== 'proto-explorer') return [0, '', '']
    const line = explorerCap(file)
    return line ? [0, json(name, { additionalContext: line }), ''] : [0, '', '']
  }
  if (name !== 'PreToolUse' || type !== 'proto-explorer') return [0, '', '']
  const box = store ?? fileStore(join(tmpdir(), 'explore-explorer-cap'))
  const id = `${evt.session_id || 's'}:${evt.agent_id || 'main'}`
  const decision = box.update(id, (state) => step(state, callFrom(evt)))
  if (!decision.deny) return [0, '', '']
  return [0, json('PreToolUse', { permissionDecision: 'deny', permissionDecisionReason: decision.reason }), '']
}

if (!process.env.VITEST) {
  let input = ''
  try { input = readFileSync(0, 'utf8') } catch { /* empty stdin: nothing to cap */ }
  const [code, out, err] = runHook(input)
  if (out) process.stdout.write(out)
  if (err) process.stderr.write(err)
  process.exit(code)
}
