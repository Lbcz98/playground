import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const root = fileURLToPath(new URL('..', import.meta.url))
const read = (rel: string) => readFileSync(join(root, rel), 'utf8')

describe('topic rules', () => {
  const rules = readdirSync(join(root, 'design-brain/rules')).filter((f) => f.endsWith('.md') && f !== 'COVERAGE.md')
  const craft = readdirSync(join(root, 'design-brain/rules/craft')).filter((f) => f.endsWith('.md'))

  it('gives every topic and every craft check a one-line applies-when', () => {
    for (const f of [...rules, ...craft.map((c) => `craft/${c}`)]) {
      expect(read(`design-brain/rules/${f}`), f).toMatch(/Applies when: \S+/)
    }
  })

  it('covers every topic file from the old handbooks, and the archive is not on an agent path', () => {
    const coverage = read('design-brain/rules/COVERAGE.md')
    for (const f of rules) {
      if (f === 'process.md') continue
      expect(coverage, f).toContain(f)
    }
    for (const agent of ['.claude/agents/proto-explorer.md', '.claude/agents/proto-art-director.md', '.claude/agents/proto-judge.md', '.claude/agents/proto-playbook-judge.md', '.claude/commands/explore.md']) {
      expect(read(agent), agent).not.toContain('toolbox/archive')
      expect(read(agent), agent).not.toContain('explore-legacy')
    }
    expect(read('.claude/agents/proto-explorer.md').length).toBeLessThan(10_240)
    expect(existsSync(join(root, '.claude/commands/explore-legacy.md'))).toBe(false)
    expect(read('.claude/agents/proto-judge.md')).toContain('model: sonnet')
    expect(read('.claude/agents/proto-playbook-judge.md')).toContain('model: sonnet')
    expect(read('.claude/agents/proto-art-director.md')).toContain('model: opus')
  })
})

describe('what an explorer is told to open', () => {
  it('does not send the explorer back to the full handbooks or the tuner', () => {
    const explorer = read('.claude/agents/proto-explorer.md')
    expect(explorer).toContain('Do not read `design-brain/DESIGN.md`')
    expect(explorer).toContain('8th tool call')
    expect(explorer).toContain('do not read `.claude/agents/proto-tuner.md`')
    expect(explorer).not.toContain('Instrument mode')
  })
})
