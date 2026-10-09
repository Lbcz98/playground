/**
 * npm run check:flow -- <flow folder> [--json]
 *
 * Plays a flow folder (`flow.ts` + one .tsx per state) in a headless Chromium, in the player of the app
 * (`web/app/[designer]/[screen]/FlowPlayer.tsx`, served by the render harness), and reads what `check:laws`
 * cannot see file by file. Every state reachable from `start` is walked with the keys of `flow.ts`:
 *
 *   focus.single          exactly one element drawn focused (none is allowed on level 0)
 *   level.initial-focus   the focused element is the component the level starts on (screen-layers.ts);
 *                         a pattern: `@deviation level.initial-focus: <why>` in the state file declares it
 *   flow.transition       the key shows the state `flow.ts` names
 *   flow.back-steps       Back, where the state declares none, returns to the state the key was pressed on;
 *   flow.focus-memory     the same out of a state opened by Enter (the rail card that opened it is restored)
 *   flow.blank-frame      at no point of a key press is the stage without a <Screen>
 *   flow.remount          the frame (video, overlay and content layers) is updated in place, not rebuilt
 *
 * flow.transition, flow.blank-frame and flow.remount are this probe's own ids, about the player (the rules book has no entry for them yet).
 * Exit 1 on any problem, and when Chromium cannot start: a flow that was not played did not pass.
 */
import { existsSync, readFileSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { HIDDEN_STATE } from '../src/shared/export/flowFile'
import { diskTree, isFlowFolder } from '../src/shared/protoFolders'
import { DTV_SCREEN_LAYERS } from '../src/shared/design-system/screen-layers'
import { Reloaded, RELOADS, type HarnessPage } from './harness-page'
import { RenderAuditUnavailable, withHarness } from './render-audit'
import type { FocusReading } from './render-harness/protocol'
import { SCHEMA_VERSION, type Finding } from './findings'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const PLAYER = 'web/app/[designer]/[screen]/FlowPlayer.tsx'
const PRESS = { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight', enter: 'Enter', back: 'Escape' } as const

type Key = keyof typeof PRESS
interface FlowData {
  start: string
  transitions: { from: string; key: Key; to: string }[]
}

export interface FlowProblem {
  rule: string
  state: string
  /** `home —enter→ rail`, when the problem is about a key press. */
  transition?: string
  message: string
}
export interface ProbeReport {
  flow: string
  start: string
  states: string[]
  /** Key presses played, forward and back. */
  presses: number
  problems: FlowProblem[]
}

/** The two focus rules on one state, from what the page drew. */
export function focusProblems(state: string, read: FocusReading, source: string, entered = true): FlowProblem[] {
  const out: FlowProblem[] = []
  const model = DTV_SCREEN_LAYERS.models.find((m) => m.id === read.model)
  const level = DTV_SCREEN_LAYERS.levels.find((l) => l.level === (model?.level ?? (read.level === null ? undefined : Number(read.level))))
  const where = level ? `level ${level.level} (${level.name})` : 'no known level'
  const names = read.focused.map((f) => `<${f.component}>${f.text ? ` "${f.text}"` : ''}`).join(', ')
  const start = level?.initialFocus
  const n = read.focused.length

  if (n > 1) {
    const keep = start ? `Keep it on ${(entered ? start.on : [...start.on, ...(start.accepts ?? [])]).map((c) => `<${c}>`).join(' or ')}` : 'Keep one'
    out.push({
      rule: 'focus.single',
      state,
      message: `${n} elements are drawn focused (${names}) — a screen has exactly one. ${keep} and rest the others (interactionState="default"); a kit component focused inside a local component counts.`,
    })
  } else if (n === 0 && level?.level !== 0) {
    out.push({ rule: 'focus.single', state, message: `nothing is drawn focused on ${where} — a screen has exactly one focused element. ${start?.hint ?? 'Focus one.'}` })
  }

  const wrong = start ? read.focused.filter((f) => !start.on.includes(f.component) && !(!entered && start.accepts?.includes(f.component))) : []
  if (start && wrong.length > 0 && !/@deviation\s+level\.initial-focus\b/.test(source)) {
    out.push({
      rule: 'level.initial-focus',
      state,
      message: `${where}: focus is on ${wrong.map((f) => `<${f.component}>`).join(', ')}, not on ${start.on.map((c) => `<${c}>`).join(' or ')} — ${start.hint}`,
    })
  }
  return out
}

async function walk(page: HarnessPage, dir: string, data: FlowData): Promise<ProbeReport> {
  const problems: FlowProblem[] = []
  let presses = 0
  /** One key, watched: whether `to` came on screen, and what the press did to the frame. */
  const press = async (key: string, to: string, state: string, transition: string): Promise<boolean> => {
    await page.watch()
    await page.press(key)
    presses++
    if (!(await page.arrives(to))) return false
    const seen = await page.watched()
    if (seen.blank)
      problems.push({
        rule: 'flow.blank-frame',
        state,
        transition,
        message: `the stage was left without a <Screen> during this key press. The state on screen must stay until the next one is ready: every state is a component that returns a <Screen> on its first render, and the player (${PLAYER}) loads the states before they are asked for.`,
      })
    if (seen.rebuilt.length > 0)
      problems.push({
        rule: 'flow.remount',
        state,
        transition,
        message: `the frame was torn down and built again (${seen.rebuilt.join(', ')} did not survive the key press), so nothing can move between the two states. Each state returns the kit <Screen> itself as its root — not a wrapper around it, not a fragment — and the player (${PLAYER}) renders the states in one place, unkeyed.`,
      })
    return true
  }

  const failed = await page.open({ flow: relative(ROOT, dir) })
  if (failed) throw new Error(`the flow could not be loaded: ${failed}`)
  if (!(await page.arrives(data.start))) throw new Error(`the start state "${data.start}" never came on screen — is there a ${data.start}.tsx that returns a <Screen>?`)

  /** The level of each state read, so a state can tell whether the viewer entered it from another level or moved inside one. */
  const levels = new Map<string, number | undefined>()
  const focus = async (state: string, from?: string): Promise<string[]> => {
    const read = await page.focus()
    if ('error' in read) return void problems.push({ rule: 'flow.transition', state, message: read.error }), []
    const level = DTV_SCREEN_LAYERS.models.find((m) => m.id === read.model)?.level ?? (read.level === null ? undefined : Number(read.level))
    levels.set(state, level)
    const entered = from === undefined || levels.get(from) !== level
    problems.push(...focusProblems(state, read, existsSync(join(dir, `${state}.tsx`)) ? readFileSync(join(dir, `${state}.tsx`), 'utf8') : '', entered))
    return read.focused.map((f) => f.component)
  }

  // Breadth first from `start`: the keys that lead to each state, the shortest way.
  const route = new Map<string, Key[]>([[data.start, []]])
  const order = [data.start]
  await focus(data.start)
  for (const from of order) {
    for (const hop of data.transitions.filter((t) => t.from === from)) {
      const transition = `${from} —${hop.key}→ ${hop.to}`
      // Back to the start, then along the route to `from`: every hop is pressed from a known trail.
      await page.press('r')
      let at = (await page.arrives(data.start)) ? data.start : null
      for (const key of route.get(from)!) {
        if (!at) break
        const next = data.transitions.find((t) => t.from === at && t.key === key)!.to
        await page.press(PRESS[key])
        at = (await page.arrives(next)) ? next : null
      }
      if (at !== from) {
        problems.push({ rule: 'flow.transition', state: from, transition, message: `"${from}" could not be reached again from "${data.start}" to press ${hop.key} on it.` })
        continue
      }
      if (!(await press(PRESS[hop.key], hop.to, hop.to, transition))) {
        problems.push({
          rule: 'flow.transition',
          state: hop.to,
          transition,
          message: `${hop.key} on "${from}" did not show "${hop.to}" (the screen stayed on "${await page.shown()}"). Check that ${hop.to}.tsx exists, loads without an error and returns a <Screen>.`,
        })
        continue
      }
      if (route.has(hop.to)) continue // seen before: its focus was read then, and Esc from a state already behind is another trail
      route.set(hop.to, [...route.get(from)!, hop.key])
      order.push(hop.to)
      const focusedOn = await focus(hop.to, from)
      // Back by itself retraces to the state before. A state that declares its own `back` (the Home bar's two-step)
      // is walked as that transition, and `hidden` is the app closed: Back does nothing there.
      if (hop.to === HIDDEN_STATE || data.transitions.some((t) => t.from === hop.to && t.key === 'back')) continue
      const back = `${hop.to} —back→ ${from}`
      if (!(await press('Escape', from, hop.to, back)))
        problems.push({
          rule: hop.key === 'enter' ? 'flow.focus-memory' : 'flow.back-steps',
          state: hop.to,
          transition: back,
          message: `Back on "${hop.to}" showed "${await page.shown()}", not "${from}", the state it came from. Going back is the player's (${PLAYER}): a state does not handle keys or keep a history of its own.`,
        })
      // The back control (the anchored rounded button) is Back too, by Enter while it is focused and by a click.
      if (focusedOn.includes('RoundedButton')) {
        for (const how of ['Enter', 'click'] as const) {
          if (!(await press(PRESS[hop.key], hop.to, hop.to, transition))) break
          await page.watch()
          if (how === 'Enter') await page.press('Enter')
          else await page.click('.sfs-round-button:not([data-focus-item])')
          if (!(await page.arrives(from)))
            problems.push({
              rule: hop.key === 'enter' ? 'flow.focus-memory' : 'flow.back-steps',
              state: hop.to,
              transition: `${hop.to} —${how === 'Enter' ? 'Enter on' : 'click on'} the back button→ ${from}`,
              message: `${how === 'Enter' ? 'Enter on' : 'A click on'} the back button of "${hop.to}" showed "${await page.shown()}", not "${from}". The back control is Back: the player (${PLAYER}) answers it, so a state has nothing to wire.`,
            })
        }
      }
    }
  }
  return { flow: relative(ROOT, dir), start: data.start, states: order, presses, problems }
}

/** Plays the flow folder and returns what it found. Throws `RenderAuditUnavailable` when there is no Chromium. */
export async function probeFlow(folder: string): Promise<ProbeReport> {
  const dir = resolve(folder)
  if (!isFlowFolder(dir, diskTree)) throw new Error(`${folder} is not a flow folder: it has no flow.ts`)
  if (relative(ROOT, dir).startsWith('..')) throw new Error(`${folder} is outside the repo: the harness only serves files inside ${ROOT}`)
  const data = ((await import(/* @vite-ignore */ pathToFileURL(join(dir, 'flow.ts')).href)) as { default: FlowData }).default
  return withHarness(async (newPage) => {
    for (let attempt = 0; ; attempt++) {
      const page = await newPage()
      try {
        return await walk(page, dir, data)
      } catch (e) {
        if (!(e instanceof Reloaded) || attempt >= RELOADS) throw e
      } finally {
        await page.close()
      }
    }
  })
}

/** The problems of a probe as the findings `pr:report` lists: each on the file of its state, the key press in front of the message. */
export function findingsOf(report: ProbeReport): Finding[] {
  return report.problems.map((p) => ({ rule: p.rule, file: `${report.flow}/${p.state}.tsx`, message: p.transition ? `${p.transition}: ${p.message}` : p.message }))
}

async function main(): Promise<void> {
  const folders = process.argv.slice(2).filter((a) => !a.startsWith('--'))
  const json = process.argv.includes('--json')
  if (folders.length !== 1) {
    console.error('usage: npm run check:flow -- <flow folder> [--json]')
    process.exit(1)
  }
  let report: ProbeReport
  try {
    report = await probeFlow(folders[0])
  } catch (e) {
    const none = e instanceof RenderAuditUnavailable
    const message = `${none ? e.message.replace(/ — the render check was skipped\.$/, '') : String(e)}${none ? ' — the flow was NOT played, so it did not pass (npm run browsers:install).' : ''}`
    console.error(`check:flow: ${message}`)
    // A flow that was not played blocks, and the comment has to say so.
    if (json) console.log(JSON.stringify({ schemaVersion: SCHEMA_VERSION, reports: [], findings: [{ rule: 'flow.not-played', file: join(resolve(folders[0]), 'flow.ts'), message }] }, null, 2))
    process.exit(1)
  }
  if (json) console.log(JSON.stringify({ schemaVersion: SCHEMA_VERSION, reports: [], findings: findingsOf(report), ...report }, null, 2))
  else {
    console.log(`${report.flow}: ${report.states.length} states from "${report.start}" (${report.states.join(', ')}), ${report.presses} key presses`)
    for (const p of report.problems) console.log(`  [${p.rule}] ${p.transition ?? p.state}: ${p.message}`)
    console.log(report.problems.length === 0 ? '  ok — one focus per state, on the right component; back returns; no blank frame, no remount' : `  ${report.problems.length} problem(s)`)
  }
  process.exit(report.problems.length > 0 ? 1 : 0)
}

if (!process.env.VITEST) void main()
