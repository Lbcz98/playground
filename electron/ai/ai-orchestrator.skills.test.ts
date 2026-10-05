/**
 * Orchestration v2, phase 1: `SFS_SKILLS`. Unset or empty, every call the pipeline makes — the planner's and the
 * generator's, system prompt and messages — is byte-identical to what it was before skills existed, for Faithful,
 * Exploratório and Os dois. Set, only the generator's system prompt changes, and only by the skills block appended to it.
 *
 * The hashes are of today's bytes, taken from the code at `ffe92ef` (before skills) with the fake provider below, not
 * recomputed from the prompt builders — a builder-as-oracle test would still pass if a prompt changed. They move only on a
 * deliberate prompt or reference-screen change, with the Faithful hashes in `faithfulPromptHashes.test.ts`.
 */
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { AiProvider, CompleteArgs } from './providers'
import { homeTemplate } from '@/shared/templates/home'

vi.mock('./providers', async (importActual) => {
  const actual = await importActual<typeof import('./providers')>()
  return { ...actual, resolveProvider: vi.fn() }
})

const { resolveProvider } = await import('./providers')
const { generateUI } = await import('./ai-orchestrator')
const { buildSystemPrompt } = await import('@/design-system/promptSpec')
const { SCREENFLOW_MANIFEST: M } = await import('@/shared/design-system/screenflow-manifest')
const { activeSkills, withSkills } = await import('./skills')

const FOCUS_SKILL = 'dtv-focus-micro-interaction'
const PROMPT = 'Um menu no centro da tela'

type Doc = Record<string, any>
const home = (): Doc => structuredClone(homeTemplate.blueprint) as unknown as Doc
/** A valid Exploratory screen: the root centred, declared. */
const explored = (): Doc => {
  const doc = home()
  doc.root.props = { ...doc.root.props, justify: 'center' }
  doc.root.deviation = { ruleId: 'layout.no-static-center', why: 'o pedido centraliza o menu' }
  return doc
}

/** sha256, first 16 hex, of a call's system prompt and messages. */
const sha = (system: string, messages: CompleteArgs['messages']): string =>
  createHash('sha256').update(JSON.stringify({ system, messages })).digest('hex').slice(0, 16)

/** What the pipeline sent, as hashes: the planner's calls in order, the generator's by mode. */
interface Sent {
  planner: string[]
  generator: Record<string, string>
}

const TODAY: Record<string, Sent> = {
  'no mode': { planner: ['906ed7466d47ff30'], generator: { faithful: '440b5d4984c94842' } },
  Fidedigno: { planner: ['906ed7466d47ff30'], generator: { faithful: '440b5d4984c94842' } },
  Exploratório: { planner: ['9722eb72ca8b3c61'], generator: { exploratory: '8b8420c0573870f3' } },
  'Os dois': { planner: ['906ed7466d47ff30', '8cdb0102d1e6b4d7'], generator: { exploratory: '8b8420c0573870f3', faithful: '440b5d4984c94842' } },
}
const CASES = [
  ['no mode', undefined],
  ['Fidedigno', 'faithful'],
  ['Exploratório', 'exploratory'],
  ['Os dois', 'both'],
] as const

function fake(id: AiProvider['id'] = 'api-key') {
  const planner: CompleteArgs[] = []
  const generator: CompleteArgs[] = []
  const provider = {
    id,
    label: 'Fake',
    isAvailable: async () => true,
    complete: vi.fn(async (a: CompleteArgs) => {
      planner.push(a)
      return { text: 'Template: home\nScreen: model "home", level 1\n1. Root Stack', model: 'm' }
    }),
    renderUi: vi.fn(async (a: CompleteArgs) => {
      generator.push(a)
      return { blueprint: a.mode === 'exploratory' ? explored() : home(), model: 'm' }
    }),
  } as AiProvider
  vi.mocked(resolveProvider).mockResolvedValue(provider)
  return { planner, generator, provider }
}

async function run(mode: 'faithful' | 'exploratory' | 'both' | undefined, skills: string | undefined, id?: AiProvider['id']) {
  if (skills === undefined) delete process.env.SFS_SKILLS
  else process.env.SFS_SKILLS = skills
  const calls = fake(id)
  const res = await generateUI(PROMPT, [], mode ? { mode } : {})
  return { res, ...calls }
}

afterEach(() => {
  delete process.env.SFS_SKILLS
})

describe('SFS_SKILLS unset or empty: every call is byte-identical to today', () => {
  it.each(CASES)('%s', async (name, mode) => {
    for (const value of [undefined, '', ' , ']) {
      const { res, planner, generator } = await run(mode, value)
      expect(res.ok).toBe(true)
      expect(planner.map((p) => sha(p.system, p.messages))).toEqual(TODAY[name].planner)
      expect(Object.fromEntries(generator.map((g) => [g.mode, sha(g.system, g.messages)]))).toEqual(TODAY[name].generator)
      expect(res.meta.steps.join('\n')).not.toMatch(/skills:/)
    }
  })
})

describe('SFS_SKILLS set: the generator prompt gains the skills block, and nothing else changes', () => {
  const skills = activeSkills(FOCUS_SKILL)
  const block = withSkills('', skills)
  const text = readFileSync(`skills/${FOCUS_SKILL}/SKILL.md`, 'utf8').trim()

  it('labels each skill and carries its full text', () => {
    expect(block).toBe(`\n\n# Skills\n\nThe skills below are part of these instructions.\n\n<skill name="${FOCUS_SKILL}">\n${text}\n</skill>`)
  })

  it.each(CASES)('%s: planners and generator messages unchanged, generator system = today’s + the block', async (name, mode) => {
    const { res, planner, generator } = await run(mode, FOCUS_SKILL)
    expect(res.ok).toBe(true)
    expect(planner.map((p) => sha(p.system, p.messages))).toEqual(TODAY[name].planner)
    for (const g of generator) {
      expect(g.system.endsWith(block)).toBe(true)
      expect(sha(g.system.slice(0, -block.length), g.messages)).toBe(TODAY[name].generator[g.mode as string])
      expect(g.system).toBe(withSkills(buildSystemPrompt('tool', M, g.mode), skills))
    }
    expect(generator.map((g) => g.mode).sort()).toEqual(Object.keys(TODAY[name].generator).sort())
    expect(res.meta.steps).toContain(`skills: ${FOCUS_SKILL}`)
  })

  it('reaches the Claude CLI provider through the same system prompt (its JSON-mode generator prompt)', async () => {
    const { generator } = await run('faithful', FOCUS_SKILL, 'claude-cli')
    expect(generator[0].system).toBe(withSkills(buildSystemPrompt('json', M, 'faithful'), skills))
  })
})

describe('an unknown skill name is an error, before any model call', () => {
  it.each(CASES)('%s', async (_, mode) => {
    const { res, planner, generator } = await run(mode, `${FOCUS_SKILL},no-such-skill`)
    expect(res.ok).toBe(false)
    expect(res.ok ? '' : res.error).toContain('SFS_SKILLS names an unknown skill "no-such-skill"')
    expect(res.ok ? '' : res.stage).toBe('skills')
    expect(planner).toHaveLength(0)
    expect(generator).toHaveLength(0)
  })

  it('also when no provider is available, where it would otherwise return the fixture silently', async () => {
    process.env.SFS_SKILLS = 'no-such-skill'
    vi.mocked(resolveProvider).mockResolvedValue(null)
    const res = await generateUI(PROMPT, [], {})
    expect(res.ok).toBe(false)
    expect(res.ok ? '' : res.error).toContain('unknown skill "no-such-skill"')
  })
})
