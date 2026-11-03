import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
// @ts-expect-error plain .mjs without types: a hook must run on a bare node
import { DENY, EDIT, EXPLORER_CAP, MAX_EDITS, MAX_ROUNDS, fileStore, memoryStore, runHook } from './hook-explorer-cap.mjs'

const dir = mkdtempSync(join(tmpdir(), 'explorer-cap-'))
const on = join(dir, 'on.json')
const off = join(dir, 'off.json')
writeFileSync(on, '{"explorer_cap":true,"loop_cap":true}')
writeFileSync(off, '{"loop_cap":true}')

const CHECK = 'node scripts/check-explore-tokens.mjs parts/1.html && node scripts/check-explore-layout.mjs parts/1.html --shots "$TMPDIR/explore-shots"'
const call = (tool: string, input: Record<string, string>, extra: Record<string, string> = {}) => JSON.stringify({
  hook_event_name: 'PreToolUse',
  agent_type: 'proto-explorer',
  session_id: 's',
  agent_id: 'a',
  tool_name: tool,
  tool_input: input,
  ...extra,
})
const check = () => call('Bash', { command: CHECK })
const edit = () => call('Write', { file_path: 'docs/explorations/x/parts/1.html' })
const shot = () => call('Read', { file_path: '/tmp/explore-shots/opcao-1-folha.png' })
const read = (file_path: string) => call('Read', { file_path })

const run = (input: string, file = on, store = memoryStore()) => runHook(input, { file, store })

describe('explorer_cap hook', () => {
  it('prints nothing and decides nothing when the switch is off or missing', () => {
    const store = { update() { throw new Error('store touched') } }
    for (const file of [off, join(dir, 'none.json'), join(dir, 'nope.json')]) {
      writeFileSync(join(dir, 'nope.json'), '{nope')
      expect(run(check(), file, store)).toEqual([0, '', ''])
      expect(run(JSON.stringify({ hook_event_name: 'SubagentStart', agent_type: 'proto-explorer' }), file, store)).toEqual([0, '', ''])
    }
    expect(run('not json', off, store)).toEqual([0, '', ''])
  })

  it('injects the one line at the start of proto-explorer only', () => {
    const start = (hook_event_name: string, agent_type?: string) => run(JSON.stringify({ hook_event_name, agent_type }))
    for (const name of ['SubagentStart', 'SessionStart']) {
      const [code, out] = start(name, 'proto-explorer')
      expect(code).toBe(0)
      expect(JSON.parse(out).hookSpecificOutput).toEqual({ hookEventName: name, additionalContext: EXPLORER_CAP })
    }
    expect(start('SessionStart')).toEqual([0, '', ''])
    expect(start('SubagentStart', 'proto-art-director')).toEqual([0, '', ''])
    expect(readFileSync(new URL('../.claude/agents/proto-explorer.md', import.meta.url), 'utf8')).toContain('line starting with `explorer_cap`')
    expect(readFileSync(new URL('../.claude/settings.json', import.meta.url), 'utf8')).toContain('hook-explorer-cap.mjs')
  })

  it('allows two check rounds and refuses the third', () => {
    const store = memoryStore()
    expect(run(check(), on, store)).toEqual([0, '', ''])
    expect(run(check(), on, store)).toEqual([0, '', ''])
    const [code, out] = run(check(), on, store)
    expect(code).toBe(0)
    expect(JSON.parse(out).hookSpecificOutput.permissionDecision).toBe('deny')
    expect(JSON.parse(out).hookSpecificOutput.permissionDecisionReason).toBe(DENY)
    expect(MAX_ROUNDS).toBe(2)
  })

  it('counts a combined tokens-and-layout Bash as one round', () => {
    const store = memoryStore()
    run(check(), on, store)
    expect(run(call('Bash', { command: 'node scripts/icon-to-png.mjs x' }), on, store)).toEqual([0, '', ''])
    expect(run(check(), on, store)).toEqual([0, '', ''])
    expect(JSON.parse(run(check(), on, store)[1]).hookSpecificOutput.permissionDecisionReason).toBe(DENY)
  })

  it('after the second round, one sheet read is allowed and the next tool is refused', () => {
    const store = memoryStore()
    run(check(), on, store)
    run(shot(), on, store)
    run(check(), on, store)
    expect(run(shot(), on, store)).toEqual([0, '', ''])
    expect(JSON.parse(run(read('docs/explorations/x/parts/1.html'), on, store)[1]).hookSpecificOutput.permissionDecisionReason).toBe(DENY)
    expect(run(read('design-brain/toolbox/references/gold-sheet.png'), on, store)[1]).toContain('deny')
  })

  it('stops the fix-until loop at the edit budget, and a check is still allowed', () => {
    const store = memoryStore()
    for (let i = 0; i < MAX_EDITS; i++) expect(run(edit(), on, store), String(i)).toEqual([0, '', ''])
    expect(JSON.parse(run(edit(), on, store)[1]).hookSpecificOutput.permissionDecisionReason).toBe(EDIT)
    expect(run(check(), on, store)).toEqual([0, '', ''])
  })

  it('does not cap other agents, and parallel explorers do not share a count', () => {
    const store = memoryStore()
    const other = call('Bash', { command: CHECK }, { agent_type: '' })
    expect(run(other, on, store)).toEqual([0, '', ''])
    const b = call('Bash', { command: CHECK }, { agent_id: 'b' })
    run(check(), on, store)
    run(check(), on, store)
    expect(run(check(), on, store)[1]).toContain('deny')
    expect(run(b, on, store)).toEqual([0, '', ''])
    expect(run(b, on, store)).toEqual([0, '', ''])
  })

  it('remembers the round in the file store', () => {
    const store = fileStore(mkdtempSync(join(tmpdir(), 'explorer-cap-disk-')))
    expect(run(check(), on, store)).toEqual([0, '', ''])
    expect(run(check(), on, store)).toEqual([0, '', ''])
    expect(run(check(), on, store)[1]).toContain(DENY)
  })
})
