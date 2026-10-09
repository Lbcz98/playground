/**
 * The flow of a prototype written as code: a folder `web/protos/<designer>/<flow>/` with one
 * `.tsx` per state (a screen, with the focus drawn by `interactionState`) and a `flow.ts` that
 * says which remote-control key leads from one state to another.
 *
 *   export default {
 *     start: 'home',
 *     transitions: [
 *       { from: 'home', key: 'up', to: 'rail' },       // the focus moves onto the rail
 *       { from: 'rail', key: 'enter', to: 'detail' },  // a card opens its page
 *     ],
 *   }
 *
 * Back is not declared: it retraces the states visited, like the remote's Back key. The one
 * exception is the home bar's two-step, declared with `key: 'back'`: an item goes to the bug,
 * the bug goes to `hidden` (level 0, no file needed).
 *
 * Plain data on purpose, so this module can read it back from source (like `fromTsx` does for a
 * screen) and hold it to the layer rule — a link opens the next level or goes back up, never
 * skips one — and to the rail rule, with no second copy of either (`flow.ts` in design-system).
 * Pure: no files, no React; the folder walk lives in `scripts/check-laws.ts`.
 */
import ts from 'typescript'
import { flowIssues, levelJumpProblem, levelKeyProblem, levelOfScreen, type FlowKeyName, type FlowScreen } from '../design-system/flow'
import type { DesignSystemManifest } from '../design-system/manifest'
import type { RuleProblem } from '../design-system/rules'
import { literal } from './fromTsx'

/** The keys a flow can bind. Back is automatic, except as the home bar's explicit two-step. */
export const FLOW_KEYS = ['up', 'down', 'left', 'right', 'enter', 'back'] as const satisfies readonly FlowKeyName[]
export type FlowKey = (typeof FLOW_KEYS)[number]

/** The level-0 state a Back from the bug leads to; it has no file. */
export const HIDDEN_STATE = 'hidden'

export interface FlowTransition {
  from: string
  key: FlowKey
  to: string
}

export interface FlowFile {
  start: string
  transitions: FlowTransition[]
}

export interface FlowParse {
  flow?: FlowFile
  /** What is wrong with the file itself (shape, not meaning). */
  problems: string[]
}

/** Read `export default { start, transitions }` off the source of a `flow.ts`. */
export function parseFlowFile(source: string): FlowParse {
  const sf = ts.createSourceFile('flow.ts', source, ts.ScriptTarget.ES2022, true, ts.ScriptKind.TS)
  const problems: string[] = []

  let expr: ts.Expression | undefined
  sf.forEachChild((n) => {
    if (ts.isExportAssignment(n) && !n.isExportEquals) expr = n.expression
  })
  // `export default {…} satisfies X` / `as X` / `(…)` wrap the object; look through them.
  while (expr && (ts.isSatisfiesExpression(expr) || ts.isAsExpression(expr) || ts.isParenthesizedExpression(expr))) expr = expr.expression
  if (!expr) return { problems: ['flow.ts needs `export default { start, transitions }`.'] }

  const read = literal(expr)
  if (!read || typeof read.value !== 'object' || read.value === null || Array.isArray(read.value)) {
    return {
      problems: ['`export default` of flow.ts must be a plain object literal ({ start: \'…\', transitions: [{ from, key, to }] }) — no variables, spreads or calls, so the check can read it.'],
    }
  }
  const raw = read.value as Record<string, unknown>
  for (const key of Object.keys(raw)) {
    if (key !== 'start' && key !== 'transitions') problems.push(`flow.ts: unknown key "${key}" — a flow has \`start\` and \`transitions\` only.`)
  }
  if (typeof raw.start !== 'string' || raw.start === '') problems.push('flow.ts: `start` must be the name of the first state (a file of this folder, without .tsx).')
  if (!Array.isArray(raw.transitions)) problems.push('flow.ts: `transitions` must be a list of { from, key, to }.')
  if (problems.length > 0) return { problems }

  const transitions: FlowTransition[] = []
  ;(raw.transitions as unknown[]).forEach((t, i) => {
    const at = `flow.ts transition ${i + 1}`
    if (typeof t !== 'object' || t === null) return void problems.push(`${at}: must be { from, key, to }.`)
    const { from, key, to, ...rest } = t as Record<string, unknown>
    for (const extra of Object.keys(rest)) problems.push(`${at}: unknown key "${extra}".`)
    if (typeof from !== 'string' || typeof to !== 'string') return void problems.push(`${at}: \`from\` and \`to\` must be state names (strings).`)
    if (typeof key !== 'string' || !(FLOW_KEYS as readonly string[]).includes(key)) {
      return void problems.push(`${at}: key ${JSON.stringify(key)} is not one of ${FLOW_KEYS.join(', ')}.`)
    }
    transitions.push({ from, key: key as FlowKey, to })
  })
  if (problems.length > 0) return { problems }
  return { flow: { start: raw.start as string, transitions }, problems: [] }
}

export interface FlowStateScreen extends FlowScreen {
  /** The state's name — the file name without `.tsx`. */
  id: string
}

/**
 * Everything wrong with a flow once its states are known: a name with no file, two bindings for
 * one key, a state nothing leads to, a jump past the next level, and the rail rule across
 * the states. Each as a sentence the author (or Claude Code) can act on.
 */
export function flowFileIssues(flow: FlowFile, states: FlowStateScreen[], manifest: DesignSystemManifest): RuleProblem[] {
  const out: RuleProblem[] = []
  const add = (message: string, ruleId: RuleProblem['ruleId'] = 'blueprint.dsl'): void => void out.push({ ruleId, message, path: ['root'] })
  const ids = new Set(states.map((s) => s.id))
  const list = [...ids].map((id) => `"${id}"`).join(', ')

  if (!ids.has(flow.start)) add(`flow.ts: start "${flow.start}" is not a state of this folder. States: ${list}.`)

  const bound = new Set<string>()
  for (const t of flow.transitions) {
    const where = `flow.ts: ${t.from} —${t.key}→ ${t.to}`
    const hiddenBack = t.key === 'back' && t.to === HIDDEN_STATE
    if (!ids.has(t.from)) {
      add(`${where}: "${t.from}" is not a state of this folder. States: ${list}.`)
      continue
    }
    if (!ids.has(t.to) && !hiddenBack) {
      add(`${where}: "${t.to}" is not a state of this folder. States: ${list}.`)
      continue
    }
    if (t.from === t.to) add(`${where}: a transition to the same state does nothing — draw the change as another state.`)
    const slot = `${t.from}/${t.key}`
    if (bound.has(slot)) add(`flow.ts: "${t.from}" binds ${t.key} twice — one key, one destination.`)
    bound.add(slot)
    const fromLevel = levelOfScreen(manifest, states.find((s) => s.id === t.from)?.screen)
    const toLevel = levelOfScreen(manifest, states.find((s) => s.id === t.to)?.screen)
    if (t.key === 'back') {
      // Only the home bar's two-step is declared: an item to the bug, the bug to hidden.
      if (fromLevel !== 1 || (!hiddenBack && toLevel !== 1)) {
        add(`${where}: a declared Back is only the home bar's two-step (an item to the bug, the bug to "${HIDDEN_STATE}") — from any other level Back retraces by itself.`, 'flow.back-steps')
      }
      continue
    }
    const jump = levelJumpProblem(fromLevel, toLevel)
    if (jump) add(`${where}: ${jump}.`, 'flow.next-level')
    const wrongKey = levelKeyProblem(fromLevel, toLevel, t.key)
    if (wrongKey) add(`${where}: ${wrongKey}.`, 'flow.level-keys')
  }

  // A row never wraps: following only left (or only right) must never come back to where it began.
  for (const key of ['left', 'right'] as const) {
    const next = new Map(flow.transitions.filter((t) => t.key === key).map((t) => [t.from, t.to]))
    const flagged = new Set<string>()
    for (const start of next.keys()) {
      if (flagged.has(start)) continue
      const path = [start]
      for (let at = next.get(start); at !== undefined && !path.includes(at); at = next.get(at)) path.push(at)
      const last = path[path.length - 1]
      if (next.get(last) === start) {
        path.forEach((p) => flagged.add(p))
        add(`flow.ts: ${path.join(` —${key}→ `)} —${key}→ ${start} wraps around — a row stops at its last item, so end ${key} there.`, 'flow.no-wrap')
      }
    }
  }

  // Back from an interactivity returns to the card that opened it, so a level-3 state must be opened by Enter from a rail.
  for (const s of states) {
    if (s.id === flow.start || levelOfScreen(manifest, s.screen) !== 3) continue
    const into = flow.transitions.filter((t) => t.to === s.id && ids.has(t.from))
    const fromLevel = (t: FlowTransition): number | undefined => levelOfScreen(manifest, states.find((x) => x.id === t.from)?.screen)
    // Moving the focus inside the interactivity (back button to card) opens no new page: the state it leaves is checked on its own.
    const opened = into.some((t) => (t.key === 'enter' && fromLevel(t) === 2) || fromLevel(t) === 3)
    if (into.length > 0 && !opened) add(`State "${s.id}" is never opened by Enter from a rail card, so Back has no card to return the focus to.`, 'flow.focus-memory')
  }

  // Reachability: every state is somewhere the viewer can get to from `start` (Back included
  // only as the way home, so it adds no edge here).
  const seen = new Set<string>()
  const queue = ids.has(flow.start) ? [flow.start] : []
  while (queue.length > 0) {
    const id = queue.pop()!
    if (seen.has(id)) continue
    seen.add(id)
    for (const t of flow.transitions) if (t.from === id && ids.has(t.to)) queue.push(t.to)
  }
  for (const id of ids) {
    if (!seen.has(id) && ids.has(flow.start)) add(`State "${id}" is never reached from "${flow.start}" — bind a key that leads to it, or delete the file.`)
  }

  // The rail rule (same cards on Home and in the second-level page) and unique names, from the book.
  for (const issue of flowIssues(states, manifest)) out.push({ ruleId: issue.ruleId, message: issue.message, path: issue.path })
  return out
}
