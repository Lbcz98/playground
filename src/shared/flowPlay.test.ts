import { describe, expect, it } from 'vitest'
import type { FlowFile } from './export/flowFile'
import { PRESS, playStep, remoteKey } from './flowPlay'

// The walk of web/protos/standards/flow.md, one key at a time. The rail is above Home and opens a page with Enter.
const flow: FlowFile = {
  start: 'home',
  transitions: [
    { from: 'home', key: 'up', to: 'rail' },
    { from: 'rail', key: 'down', to: 'home' },
    { from: 'rail', key: 'enter', to: 'detail' },
  ],
}

describe('playStep: what a key does to the walk', () => {
  it('a declared transition shows its state, on top of the trail', () => {
    expect(playStep(flow, ['home'], 'up')).toEqual(['home', 'rail'])
  })

  it('a key with no transition does nothing', () => {
    expect(playStep(flow, ['home'], 'left')).toEqual(['home'])
    expect(playStep(flow, ['home', 'rail'], 'right')).toEqual(['home', 'rail'])
  })

  it('a row never wraps: the last item stops, it does not come back to the first', () => {
    const row: FlowFile = { start: 'a', transitions: [{ from: 'a', key: 'right', to: 'b' }, { from: 'b', key: 'left', to: 'a' }] }
    expect(playStep(row, ['a', 'b'], 'right')).toEqual(['a', 'b'])
    expect(playStep(row, ['a'], 'left')).toEqual(['a'])
  })

  it('a state that comes again closes the loop: the trail goes back to its first visit', () => {
    expect(playStep(flow, ['home', 'rail'], 'down')).toEqual(['home'])
  })

  it('Back retraces the states visited, one step; at the start it does nothing', () => {
    expect(playStep(flow, ['home', 'rail', 'detail'], 'back')).toEqual(['home', 'rail'])
    expect(playStep(flow, ['home', 'rail'], 'back')).toEqual(['home'])
    expect(playStep(flow, ['home'], 'back')).toEqual(['home'])
  })

  it('a declared Back wins over the retrace (the Home bar: an item goes to the bug, not to where it came from)', () => {
    const bar: FlowFile = {
      start: 'bug',
      transitions: [
        { from: 'bug', key: 'left', to: 'program' },
        { from: 'program', key: 'back', to: 'bug' },
        { from: 'bug', key: 'back', to: 'hidden' },
      ],
    }
    expect(playStep(bar, ['bug', 'program'], 'back')).toEqual(['bug'])
    expect(playStep(bar, ['bug'], 'back')).toEqual(['bug', 'hidden'])
  })

  it('hidden is level 0: any arrow returns to the start, Enter and Back leave it as it is', () => {
    const trail = ['home', 'hidden']
    for (const arrow of ['up', 'down', 'left', 'right'] as const) expect(playStep(flow, trail, arrow)).toEqual(['home'])
    expect(playStep(flow, trail, 'enter')).toEqual(trail)
    expect(playStep(flow, trail, 'back')).toEqual(trail)
  })

  it('restart goes back to the start from anywhere, hidden included', () => {
    expect(playStep(flow, ['home', 'rail', 'detail'], 'restart')).toEqual(['home'])
    expect(playStep(flow, ['home', 'hidden'], 'restart')).toEqual(['home'])
  })
})

describe('the remote: which key of the keyboard is which key of the flow', () => {
  const key = (name: string, keyCode = 0) => remoteKey({ key: name, keyCode })

  it('arrows and Enter', () => {
    expect([key('ArrowUp'), key('ArrowDown'), key('ArrowLeft'), key('ArrowRight'), key('Enter')]).toEqual(['up', 'down', 'left', 'right', 'enter'])
  })

  it('Back is Esc, Backspace, GoBack, BrowserBack, Back, or the key codes of a TV remote', () => {
    for (const name of ['Escape', 'Backspace', 'GoBack', 'BrowserBack', 'Back']) expect(key(name)).toBe('back')
    for (const code of [4, 8, 27, 461, 10009]) expect(key('Unidentified', code)).toBe('back')
  })

  it('R restarts; any other key is not the remote', () => {
    expect(key('r')).toBe('restart')
    expect(key('a')).toBeNull()
    expect(key('Unidentified', 13)).toBeNull()
  })

  it('PRESS is the inverse: the key a test presses for each flow key reads back as that key', () => {
    expect(PRESS).toMatchObject({ up: 'ArrowUp', back: 'Escape', restart: 'r' })
    for (const [play, name] of Object.entries(PRESS)) expect(key(name)).toBe(play)
  })
})
