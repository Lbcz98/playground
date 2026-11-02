import { mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
// @ts-expect-error plain .mjs, so `node` runs it without a build
import { recordUsage, usageFrom } from './explore-usage.mjs'

describe('explore-usage', () => {
  it('reads Claude usage, including cache tokens, and treats a missing field as zero', () => {
    expect(usageFrom(JSON.stringify({
      usage: { input_tokens: 10, output_tokens: 4, cache_read_input_tokens: 80, cache_creation_input_tokens: 3 },
    }))).toEqual({ input: 10, output: 4, cache_read: 80, cache_write: 3 })
    expect(usageFrom('{"usage":{}}')).toEqual({ input: 0, output: 0, cache_read: 0, cache_write: 0 })
  })

  it('appends one line per role to the exploration folder', () => {
    const dir = mkdtempSync(join(tmpdir(), 'usage-'))
    recordUsage(dir, 'proto-explorer', { usage: { input_tokens: 100, output_tokens: 20, cache_read_input_tokens: 5, cache_creation_input_tokens: 0 } })
    recordUsage(dir, 'proto-playbook-judge', { usage: { input_tokens: 40, output_tokens: 8 } })
    const lines = readFileSync(join(dir, 'usage.jsonl'), 'utf8').trim().split('\n').map((l) => JSON.parse(l))
    expect(lines.map((l) => l.role)).toEqual(['proto-explorer', 'proto-playbook-judge'])
    expect(lines[0].input).toBe(100)
    expect(lines[1].output).toBe(8)
    expect(lines[1].cache_read).toBe(0)
  })
})
