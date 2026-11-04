import type { FlowFile, FlowKey, FlowNotice } from './export/flowFile'

export type PlayKey = FlowKey | 'restart'

/** The keyboard names of each key; the first is the one a test presses. Back is also the key codes of a TV remote. */
const NAMES: Record<PlayKey, string[]> = {
  up: ['ArrowUp'],
  down: ['ArrowDown'],
  left: ['ArrowLeft'],
  right: ['ArrowRight'],
  enter: ['Enter'],
  back: ['Escape', 'Backspace', 'GoBack', 'BrowserBack', 'Back'],
  restart: ['r', '1'],
}
const BACK_CODES = [4, 8, 27, 461, 10009]
/** TV browsers often report `key` as "Unidentified" or a vendor name: the key codes of the d-pad and OK are the fallback. Red (403) and the numeral 1 (49, numpad 97) restart. */
const CODE_KEYS: Record<number, PlayKey> = { 37: 'left', 38: 'up', 39: 'right', 40: 'down', 13: 'enter', 403: 'restart', 49: 'restart', 97: 'restart' }

/** What to press for each key (`KeyboardEvent.key`): the inverse of `remoteKey`. */
export const PRESS = Object.fromEntries(Object.entries(NAMES).map(([key, names]) => [key, names[0]])) as Record<PlayKey, string>

const KEY_OF = new Map(Object.entries(NAMES).flatMap(([key, names]) => names.map((name) => [name, key as PlayKey])))

/** The key of the flow a keydown is, or null when it is not on the remote. */
export function remoteKey(e: { key: string; keyCode: number }): PlayKey | null {
  return KEY_OF.get(e.key) ?? (BACK_CODES.includes(e.keyCode) ? 'back' : CODE_KEYS[e.keyCode] ?? null)
}

/**
 * The back control of a level-3 screen, as the player and the probe find it in the page: the kit's round button
 * drawn in the anchored group (the main menu's round buttons carry `data-focus-item`).
 */
export const BACK_CONTROL = '.sfs-round-button:not([data-focus-item])'

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

/**
 * Where a flow's notice is: `idle` until the walk reaches `startOn`, `counting` (unseen) for `after`
 * seconds, `open` while the message shows, `closed` once it left (it never comes back), `cancelled`
 * once the walk reached `cancelOn`. `badge` is what goes with the notice on a screen: on from the
 * moment the message arrives until the walk reaches `cancelOn`, so it outlasts the message.
 */
export interface NoticeState {
  phase: 'idle' | 'counting' | 'open' | 'closed' | 'cancelled'
  badge: boolean
}

export const NOTICE_IDLE: NoticeState = { phase: 'idle', badge: false }

/** The notice after the walk lands on a state: it starts the count, or is cancelled for good. */
export function noticeOnState(notice: FlowNotice | undefined, now: NoticeState, landedOn: string): NoticeState {
  if (!notice || now.phase === 'cancelled') return now
  if (landedOn === notice.cancelOn) return { phase: 'cancelled', badge: false }
  if (landedOn === notice.startOn && now.phase === 'idle') return { phase: 'counting', badge: false }
  return now
}

/** The notice after its count ends (`counting` → `open`) or its message leaves (`open` → `closed`). */
export function noticeOnTimer(now: NoticeState, event: 'arrive' | 'leave'): NoticeState {
  if (event === 'arrive') return now.phase === 'counting' ? { phase: 'open', badge: true } : now
  return now.phase === 'open' ? { phase: 'closed', badge: true } : now
}
