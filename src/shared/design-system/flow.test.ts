import { describe, expect, it } from 'vitest'
import { collectLinks, flowProblems, levelJumpProblem, levelKeyProblem, linkRoleProblem } from './flow'
import { SCREENFLOW_MANIFEST as S } from './screenflow-manifest'
import { moduleContentSide } from './screen-layers'

const btn = (goTo?: string) => ({ type: 'Button', props: { label: 'Go' }, ...(goTo ? { goTo } : {}) })
const screen = (id: string, model: string, level: number, goTo?: string) => ({
  id,
  screen: { model, level },
  root: { type: 'Stack', children: [{ type: 'Stack', children: [btn(goTo)] }] },
})

describe('collectLinks', () => {
  it('finds every goTo, with where it sits', () => {
    const links = collectLinks(screen('a', 'home', 1, 'b').root)
    expect(links).toEqual([{ path: 'root › Stack[0] › Button[0]', type: 'Button', target: 'b' }])
  })
})

describe('levelJumpProblem', () => {
  it('lets a link open the next level or go back up, never skip one', () => {
    expect(levelJumpProblem(1, 2)).toBeNull()
    expect(levelJumpProblem(3, 1)).toBeNull()
    expect(levelJumpProblem(2, 2)).toBeNull()
    expect(levelJumpProblem(1, 3)).toMatch(/skips one/)
    expect(levelJumpProblem(undefined, 3)).toBeNull()
  })
})

describe('flowProblems', () => {
  const home = screen('home', 'home', 1, 'rail')
  const rail = screen('rail', 'interactivity-buttons-right', 2, 'stats')
  const stats = screen('stats', 'interactivity-cards-right', 3)

  it('accepts Home → rail → interactivity', () => {
    expect(flowProblems([home, rail, stats], S)).toEqual([])
  })

  it('names a target that is not a screen, and lists the real ones', () => {
    const [problem] = flowProblems([screen('home', 'home', 1, 'nowhere'), rail], S)
    expect(problem).toMatch(/goTo "nowhere" is not a screen of this document\. Screens: "home", "rail"/)
  })

  it('rejects a link to itself and a duplicate id', () => {
    expect(flowProblems([screen('home', 'home', 1, 'home')], S)[0]).toMatch(/links the screen to itself/)
    expect(flowProblems([home, screen('home', 'home', 1)], S)[0]).toMatch(/share the id "home"/)
  })

  it('rejects a jump from level 1 straight to level 3', () => {
    const [problem] = flowProblems([screen('home', 'home', 1, 'stats'), stats], S)
    expect(problem).toMatch(/jumps from level 1 to level 3/)
  })
})

describe('moduleContentSide — the root stretches, the module places itself', () => {
  it('reads the first un-anchored module', () => {
    const root = { type: 'Stack', children: [{ type: 'InteractivityMenu', props: { align: 'end' } }] }
    expect(moduleContentSide(S, root)).toMatchObject({ side: 'right', prop: 'align', type: 'InteractivityMenu' })
    const row = { type: 'Stack', children: [{ type: 'Stack', props: { direction: 'horizontal', justify: 'start' } }] }
    expect(moduleContentSide(S, row)).toMatchObject({ side: 'left', prop: 'justify' })
  })

  it('says nothing for a module that spans', () => {
    expect(moduleContentSide(S, { type: 'Stack', children: [{ type: 'Stack' }] })).toBeNull()
  })
})

describe('link roles — the main menu, back and close', () => {
  it('the main menu carries no link', () => {
    expect(linkRoleProblem(S, 'MainMenu', 1, 2)).toMatch(/<MainMenu> carries no link/)
  })

  it('back returns exactly one level; close returns to Home', () => {
    expect(linkRoleProblem(S, 'RoundedButton', 3, 2)).toBeNull()
    expect(linkRoleProblem(S, 'RoundedButton', 3, 1)).toMatch(/returns exactly one level.*close button's job/)
    expect(linkRoleProblem(S, 'CloseButton', 3, 1)).toBeNull()
    expect(linkRoleProblem(S, 'CloseButton', 3, 2)).toMatch(/returns to Home.*back button's job/)
    expect(linkRoleProblem(S, 'InteractivityButton', 1, 2)).toBeNull()
  })

  it('the validator rejects them in a document', () => {
    const doc = (type: string, from: [string, number], to: [string, number]) => [
      { id: 'a', screen: { model: from[0], level: from[1] }, root: { type: 'Stack', children: [{ type, goTo: 'b' }] } },
      { id: 'b', screen: { model: to[0], level: to[1] }, root: { type: 'Stack' } },
    ]
    expect(flowProblems(doc('MainMenu', ['home', 1], ['interactivity-buttons-right', 2]), S)[0]).toMatch(/carries no link/)
    expect(flowProblems(doc('RoundedButton', ['interactivity-cards-right', 3], ['home', 1]), S)[0]).toMatch(/back control/)
    expect(flowProblems(doc('CloseButton', ['interactivity-cards-right', 3], ['home', 1]), S)).toEqual([])
  })
})

describe('the rail keeps its cards when entered', () => {
  const card = { type: 'InteractivityButton' }
  const screen = (id: string, model: string, level: number, cards: number) => ({
    id,
    screen: { model, level },
    root: { type: 'Stack', children: [{ type: 'InteractivityMenu', children: Array.from({ length: cards }, () => card) }] },
  })

  it('accepts one card on Home and one on the rail', () => {
    expect(flowProblems([screen('home', 'home', 1, 1), screen('rail', 'interactivity-buttons-right', 2, 1)], S)).toEqual([])
  })

  it('rejects a rail that grew or shrank on the way in', () => {
    const [p] = flowProblems([screen('home', 'home', 1, 1), screen('rail', 'interactivity-buttons-right', 2, 4)], S)
    expect(p).toMatch(/rail shows 4 .* Home rail .* shows 1/)
  })
})

describe('real-app navigation helpers', () => {
  it('levelKeyProblem: up/down/enter/back between levels', () => {
    expect(levelKeyProblem(1, 2, 'up')).toBeNull()
    expect(levelKeyProblem(1, 2, 'enter')).toMatch(/"up"/)
    expect(levelKeyProblem(2, 1, 'down')).toBeNull()
    expect(levelKeyProblem(2, 3, 'enter')).toBeNull()
    expect(levelKeyProblem(2, 3, 'up')).toMatch(/"enter"/)
    expect(levelKeyProblem(3, 2, 'back')).toBeNull()
    expect(levelKeyProblem(2, 2, 'left')).toBeNull()
    expect(levelKeyProblem(undefined, 2, 'up')).toBeNull()
  })
})
