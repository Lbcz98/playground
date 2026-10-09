/**
 * Phase 9G, C2: the Faithful prompts are byte-identical across the Exploratory-only Proposal wording. These hashes
 * are the ones `eval/run.ts` stamps on every run, so a Faithful result always names the prompts it ran with. They move
 * only on a deliberate Faithful prompt change (and then the stage's "before" baseline stops being comparable).
 * Oct 2: the generator hash moved a90e091535 → b010c5cf46 on purpose — the Portuguese notes example ("O mapa é aproximado
 * por um cartão") was removed because it pulled English requests' notes into Portuguese. The planner hash did not move.
 * Oct 2: the generator hash moved a90e091535 -> b010c5cf46 on purpose: the Portuguese notes example ("O mapa e aproximado
 * por um cartao") was removed because it pulled English requests' notes into Portuguese. The planner hash did not move.
 * Oct 3: both moved on purpose (planner 2e0c1f852d -> 168a7c19bb, generator b010c5cf46 -> 4a55df4278): the MainMenu
 * summary no longer says it is anchored, the kernel states its laws without capitals, and the planner has no line cap.
 * Oct 9: the planner hash moved 168a7c19bb -> c5e8493a6e on purpose: the navigation rules and the per-level focus hints
 * now follow the real app (Home focus starts on the bug; level keys, no wrap, back steps). The generator hash moved 4a55df4278 -> ee81bad023 for the same reason.
 * Oct 9 (later): planner c5e8493a6e -> a7b4c05df7, generator ee81bad023 -> 8d8d6a2da1 on purpose: level 3 starts on the back button, and the
 * viewer then moves the focus onto the content card (the previous wording let the content take it on entry).
 */
import { createHash } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { buildPlannerPrompt, buildSystemPrompt } from './promptSpec'
import { SCREENFLOW_MANIFEST as M } from '@/shared/design-system/screenflow-manifest'

const hash = (s: string) => createHash('sha1').update(s).digest('hex').slice(0, 10)

describe('the Faithful prompts', () => {
  it('are pinned by hash (the same hashes the eval stamps)', () => {
    expect(hash(buildPlannerPrompt(M, { prompt: '', mode: 'faithful' }))).toBe('a7b4c05df7')
    expect(hash(buildSystemPrompt('json', M, 'faithful'))).toBe('8d8d6a2da1')
  })

  it('never carry the Exploratory Proposal wording', () => {
    const planner = buildPlannerPrompt(M, { prompt: 'x', mode: 'faithful' })
    const generators = [buildSystemPrompt('tool', M, 'faithful'), buildSystemPrompt('json', M, 'faithful')]
    for (const text of [planner, ...generators]) expect(text).not.toMatch(/Proposal/)
    expect(planner).toContain('When you had to approximate something the registry lacks')
    for (const text of generators) expect(text).toContain('approximate it with the layout primitives')
  })

  it('the Exploratory prompts replace the approximate-it instructions instead of contradicting them', () => {
    const e = [buildPlannerPrompt(M, { prompt: 'x', mode: 'exploratory' }), buildSystemPrompt('tool', M, 'exploratory')].join('\n')
    expect(e).not.toContain('approximate it with the layout primitives')
    expect(e).not.toContain('When you had to approximate something the registry lacks')
    expect(e).not.toContain('when you approximated something the registry lacks')
    expect(e).toContain('declare a Proposal')
    expect(e).toContain('Proposal for X')
  })
})
