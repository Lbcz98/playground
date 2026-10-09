import type { FlowFile, FlowKey } from './export/flowFile'

export type PlayKey = FlowKey | 'restart'

/** The keyboard names of each key; the first is the one a test presses. Back is also the key codes of a TV remote. */
const NAMES: Record<PlayKey, string[]> = {
  up: ['ArrowUp'],
  down: ['ArrowDown'],
  left: ['ArrowLeft'],
  right: ['ArrowRight'],
  enter: ['Enter'],
  back: ['Escape', 'Backspace', 'GoBack', 'BrowserBack', 'Back'],
  restart: ['r'],
}
const BACK_CODES = [4, 8, 27, 461, 10009]

/** What to press for each key (`KeyboardEvent.key`): the inverse of `remoteKey`. */
export const PRESS = Object.fromEntries(Object.entries(NAMES).map(([key, names]) => [key, names[0]])) as Record<PlayKey, string>

const KEY_OF = new Map(Object.entries(NAMES).flatMap(([key, names]) => names.map((name) => [name, key as PlayKey])))

/** The key of the flow a keydown is, or null when it is not on the remote. */
export function remoteKey(e: { key: string; keyCode: number }): PlayKey | null {
  return KEY_OF.get(e.key) ?? (BACK_CODES.includes(e.keyCode) ? 'back' : null)
}

/** The level-0 state a Back from the bug leads to; it has no file. */
export const HIDDEN_STATE = 'hidden'

export function playStep(flow: FlowFile, trail: string[], key: PlayKey): string[] {
  const current = trail[trail.length - 1]
  if (key === 'restart') return [flow.start]
  // `hidden` is level 0 (video only): any arrow brings the flow back to its start.
  if (current === HIDDEN_STATE) return key === 'enter' || key === 'back' ? trail : [flow.start]
  const hop = flow.transitions.find((x) => x.from === current && x.key === key)
  // Back retraces to the previous state (focus memory) unless the state declares its own `back`.
  if (key === 'back' && !hop) return trail.length > 1 ? trail.slice(0, -1) : trail
  if (!hop) return trail
  const behind = trail.lastIndexOf(hop.to)
  return behind >= 0 ? trail.slice(0, behind + 1) : [...trail, hop.to]
}
