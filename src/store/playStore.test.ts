import { beforeEach, describe, expect, it } from 'vitest'
import { currentPlayScreenId, usePlayStore } from './playStore'
import { useFlowStore } from './flowStore'
import { screenTemplate } from '@/shared/templates'
import type { BlueprintDocument } from '@/shared/blueprint'

const play = () => usePlayStore.getState()

function loadFlow(): void {
  const home = structuredClone(screenTemplate('home')!.blueprint)
  const rail = structuredClone(screenTemplate('interactivity-buttons-right')!.blueprint)
  const doc: BlueprintDocument = {
    ...home,
    id: 'home',
    screens: [{ id: 'rail', name: 'Rail', screen: rail.screen, root: rail.root }],
  }
  useFlowStore.getState().applyAgentBlueprint(doc, 'flow')
}

beforeEach(() => {
  useFlowStore.getState().reset()
  play().edit()
})

describe('the prototype player', () => {
  it('starts on the open screen, follows links, and Back retraces them', () => {
    loadFlow()
    play().play()
    expect(play().trail).toEqual(['home'])
    play().go('rail')
    expect(play().trail).toEqual(['home', 'rail'])
    expect(play().back()).toBe(true)
    expect(play().trail).toEqual(['home'])
    expect(play().back()).toBe(false)
  })

  it('ignores a link to a screen that does not exist, and re-opening the same screen', () => {
    loadFlow()
    play().play()
    play().go('ghost')
    play().go('home')
    expect(play().trail).toEqual(['home'])
  })

  it('restarts to where it began, and Edit leaves nothing behind', () => {
    loadFlow()
    play().play()
    play().go('rail')
    play().focus('n_1')
    play().restart()
    expect(play().trail).toEqual(['home'])
    expect(play().focusId).toBeNull()
    play().edit()
    expect(play().mode).toBe('edit')
    expect(play().trail).toEqual([])
  })

  it('never edits the document', () => {
    loadFlow()
    const before = useFlowStore.getState().past.length
    play().play()
    play().go('rail')
    expect(useFlowStore.getState().past).toHaveLength(before)
  })

  it('falls back to the first screen when the trail points at one that is gone', () => {
    expect(currentPlayScreenId(['gone'], ['a', 'b'])).toBe('a')
    expect(currentPlayScreenId(['a', 'b'], ['a', 'b'])).toBe('b')
    expect(currentPlayScreenId([], ['a'])).toBe('a')
  })
})

describe('the remote — moving the TV focus while playing', () => {
  it('keeps the node and the part of it that holds the focus, and clears both on every screen change', () => {
    loadFlow()
    play().play()
    play().focus('n_menu', 'program')
    expect([play().focusId, play().focusItem]).toEqual(['n_menu', 'program'])
    play().focus('n_card')
    expect([play().focusId, play().focusItem]).toEqual(['n_card', null])
    play().go('rail')
    expect([play().focusId, play().focusItem]).toEqual([null, null])
  })
})

describe('focus on an interactivity button is the second level', () => {
  it('focusing a Home card opens the rail, focused on that card; focusing the menu does not', () => {
    loadFlow()
    play().play()
    const [home, rail] = useFlowStore.getState().screens
    const cards = (tree: typeof home.tree) => {
      const out: string[] = []
      const walk = (n: typeof home.tree): void => {
        if (n.type === 'InteractivityButton') out.push(n.id)
        n.children.forEach(walk)
      }
      walk(tree)
      return out
    }
    const mainMenu = home.tree.children[0].children.find((n) => n.type === 'MainMenu')!

    play().focus(mainMenu.id, 'program')
    expect(play().trail).toEqual(['home'])

    play().focus(cards(home.tree)[1])
    expect(play().trail).toEqual(['home', 'rail'])
    expect(play().focusId).toBe(cards(rail.tree)[1])

    // Moving along the rail stays on it.
    play().focus(cards(rail.tree)[2])
    expect(play().trail).toEqual(['home', 'rail'])
  })
})

describe('Back returns the focus to where you left', () => {
  it('pressing a rail card opens its screen; Back lands on that same card', () => {
    loadFlow()
    useFlowStore.getState().setActiveScreen('rail')
    play().play()
    expect(play().trail).toEqual(['rail']) // Play starts on the frame open in the editor
    const railCard = useFlowStore.getState().screens[1].tree.children[0].children[1].id
    play().focus(railCard)
    play().go('home')
    expect(play().focusId).toBeNull()
    play().back()
    expect([play().trail, play().focusId]).toEqual([['rail'], railCard])
  })

  it('a page entered by the focus goes back to its own rule, not to a remembered focus', () => {
    loadFlow()
    play().play()
    const home = useFlowStore.getState().screens[0].tree
    const menu = home.children[0].children.find((n) => n.type === 'MainMenu')!
    play().focus(menu.id, 'weather')
    const card = home.children[0].children.find((n) => n.type === 'InteractivityMenu')!.children[0]
    play().focus(card.id) // enters the rail
    expect(play().trail).toEqual(['home', 'rail'])
    play().back()
    expect([play().trail, play().focusId, play().focusItem]).toEqual([['home'], null, null])
  })
})
