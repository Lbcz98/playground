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
