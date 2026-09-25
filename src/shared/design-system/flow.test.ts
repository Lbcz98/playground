import { describe, expect, it } from 'vitest'
import { collectLinks, flowProblems, focusEntersLevel, focusLeavesLevel, levelJumpProblem, linkRoleProblem, type PlayScreen } from './flow'
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

describe('playing — the focus decides the page', () => {
  const node = (id: string, type: string, children: PlayScreen['tree'][] = [], goTo?: string): PlayScreen['tree'] => ({
    id,
    type,
    children,
    ...(goTo ? { goTo } : {}),
  })
  const home: PlayScreen = {
    id: 'home',
    tree: {
      ...node('h', 'Stack', [
        node('h-menu', 'InteractivityMenu', [
          node('h-c0', 'InteractivityButton', [], 'rail'),
          node('h-c1', 'InteractivityButton'),
          node('h-c2', 'InteractivityButton'),
        ]),
        node('h-main', 'MainMenu'),
      ]),
      screen: { model: 'home' },
    },
  }
  const rail: PlayScreen = {
    id: 'rail',
    tree: {
      ...node('r', 'Stack', [
        node('r-menu', 'InteractivityMenu', [node('r-c0', 'InteractivityButton', [], 'stats'), node('r-c1', 'InteractivityButton')]),
      ]),
      screen: { model: 'interactivity-buttons-right' },
    },
  }
  const stats: PlayScreen = {
    id: 'stats',
    tree: { ...node('s', 'Stack', [node('s-close', 'CloseButton', [], 'home')]), screen: { model: 'interactivity-cards-right' } },
  }
  const screens = [home, rail, stats]

  it('focusing an interactivity button on Home opens the second level, on the same card', () => {
    expect(focusEntersLevel(S, screens, 'home', 'h-c0')).toEqual({ screenId: 'rail', nodeId: 'r-c0' })
    expect(focusEntersLevel(S, screens, 'home', 'h-c1')).toEqual({ screenId: 'rail', nodeId: 'r-c1' })
    // More cards on Home than on the rail: the last one takes it.
    expect(focusEntersLevel(S, screens, 'home', 'h-c2')).toEqual({ screenId: 'rail', nodeId: 'r-c1' })
  })

  it('moving the focus along the menu, or along the rail itself, stays on the page', () => {
    expect(focusEntersLevel(S, screens, 'home', 'h-main')).toBeNull()
    expect(focusEntersLevel(S, screens, 'rail', 'r-c1')).toBeNull()
    expect(focusEntersLevel(S, screens, 'stats', 's-close')).toBeNull()
  })

  it('stays when the document has no second-level page', () => {
    expect(focusEntersLevel(S, [home], 'home', 'h-c0')).toBeNull()
  })

  it('down and off the rail goes back to Home; off the third level it does not', () => {
    expect(focusLeavesLevel(S, screens, 'rail', 'home')).toBe(true)
    expect(focusLeavesLevel(S, screens, 'stats', 'rail')).toBe(false)
    expect(focusLeavesLevel(S, screens, 'rail', undefined)).toBe(false)
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
