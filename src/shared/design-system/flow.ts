/**
 * The prototype flow — how a document's screens link to each other.
 *
 * A click on an element with `goTo` opens the screen it names. The layer rule
 * (Camadas) shapes those links: from a screen on level N a link opens level N + 1
 * (Home → the focused rail → one interactivity) or goes back up to any lower
 * level, never skipping a level down. Kept here, free of React and of any store,
 * so the strict validator (main process), the interpreter and the player agree.
 */

import { modelOfScreen, screenLayersOf } from './screen-layers'
import type { DesignSystemManifest } from './manifest'
import type { IssuePath, RuleProblem } from './rules'

/** A tree in either shape — a raw Blueprint node or a canvas node. */
interface LinkNode {
  type?: unknown
  goTo?: unknown
  children?: unknown
}

export interface FlowLink {
  /** Where the link sits, e.g. `root › Stack[1] › InteractivityButton[0]`. */
  path: string
  /** The component that carries it. */
  type: string
  target: unknown
}

/** Every `goTo` in a tree, with where it sits. */
export function collectLinks(root: unknown, rootPath = 'root'): FlowLink[] {
  return linksWithPaths(root, rootPath).map(({ at: _, ...link }) => link)
}

/** `collectLinks`, plus each link's structured path from the screen (`['root', 'children', 0, …]`). */
function linksWithPaths(root: unknown, rootPath = 'root'): (FlowLink & { at: IssuePath })[] {
  const links: (FlowLink & { at: IssuePath })[] = []
  const walk = (raw: unknown, path: string, at: IssuePath): void => {
    if (typeof raw !== 'object' || raw === null) return
    const node = raw as LinkNode
    if (node.goTo !== undefined) links.push({ path, type: String(node.type), target: node.goTo, at })
    if (Array.isArray(node.children)) {
      node.children.forEach((child, i) => {
        const type = typeof child === 'object' && child !== null ? String((child as LinkNode).type) : '?'
        walk(child, `${path} › ${type}[${i}]`, [...at, 'children', i])
      })
    }
  }
  walk(root, rootPath, ['root'])
  return links
}

/**
 * Why a link from a level-`from` screen to a level-`to` screen breaks the layer
 * rule, or null. Unknown levels can't be judged, so they pass.
 */
export function levelJumpProblem(from: number | undefined, to: number | undefined): string | null {
  if (from === undefined || to === undefined) return null
  if (to <= from + 1) return null
  return `it jumps from level ${from} to level ${to} — a link opens the next level (${from + 1}) or goes back up, never skips one`
}

export type FlowKeyName = 'up' | 'down' | 'left' | 'right' | 'enter' | 'back'

const LEVEL_KEY: Record<string, FlowKeyName> = { '1>2': 'up', '2>1': 'down', '2>3': 'enter', '3>2': 'back' }

/** Why this key can't cross from one level to another (flow.level-keys), or null. Unknown levels and same-level moves pass. */
export function levelKeyProblem(fromLevel: number | undefined, toLevel: number | undefined, key: FlowKeyName): string | null {
  if (fromLevel === undefined || toLevel === undefined || fromLevel === toLevel) return null
  const want = LEVEL_KEY[`${fromLevel}>${toLevel}`]
  if (!want) return null // other jumps are levelJumpProblem's job; back-steps to 0/1 are declared, not keyed
  return key === want ? null : `going from level ${fromLevel} to level ${toLevel} takes "${want}", not "${key}" — use "${want}" on that transition`
}

/**
 * Why a link on this component breaks its role, or null: the main menu carries
 * no link, a back control goes up exactly one level, a close control closes
 * everything and returns to Home (level 1).
 */
export function linkRoleProblem(
  manifest: DesignSystemManifest,
  type: string,
  from: number | undefined,
  to: number | undefined,
): string | null {
  const rules = screenLayersOf(manifest).links
  if (!rules) return null
  if (rules.none?.includes(type)) return `<${type}> carries no link — link the element that opens the next page (an interactivity button)`
  if (from === undefined || to === undefined) return null
  if (rules.back?.includes(type) && to !== from - 1) {
    return `<${type}> is a back control: it returns exactly one level (from level ${from} to level ${from - 1}), never further — closing everything back to Home is the close button's job`
  }
  if (rules.close?.includes(type) && to !== 1) {
    return `<${type}> is a close control: it closes everything and returns to Home (level 1), not to level ${to} — stepping back one level is the back button's job`
  }
  return null
}

/** The navigation level of a screen spec, or undefined when its model is unknown. */
export function levelOfScreen(manifest: DesignSystemManifest, screen: unknown): number | undefined {
  if (typeof screen !== 'object' || screen === null) return undefined
  return modelOfScreen(screenLayersOf(manifest), screen)?.level
}

export interface FlowScreen {
  id: string
  /** The screen spec (`{ model, level }`) as written. */
  screen?: unknown
  root: unknown
}

/**
 * Every way the links of a set of screens are broken, as sentences the
 * Generator can act on: a duplicate id, a target that isn't a screen, a link to
 * itself, a jump past the next level.
 */
export function flowProblems(screens: FlowScreen[], manifest: DesignSystemManifest): string[] {
  return flowIssues(screens, manifest).map((issue) => issue.message)
}

/** The same, each naming its rule, the index of the screen it is on, and where on that screen. */
export function flowIssues(screens: FlowScreen[], manifest: DesignSystemManifest): (RuleProblem & { screen: number })[] {
  const problems: (RuleProblem & { screen: number })[] = []
  const ids = new Set<string>()
  screens.forEach((s, i) => {
    if (ids.has(s.id)) {
      problems.push({ ruleId: 'blueprint.dsl', screen: i, path: ['id'], message: `Two screens share the id "${s.id}" — every screen id is unique.` })
    }
    ids.add(s.id)
  })
  const list = [...ids].map((id) => `"${id}"`).join(', ')
  screens.forEach((from, screen) => {
    const fromLevel = levelOfScreen(manifest, from.screen)
    for (const link of linksWithPaths(from.root)) {
      const where = `screen "${from.id}" ${link.path}`
      const path = [...link.at, 'goTo']
      if (typeof link.target !== 'string' || !ids.has(link.target)) {
        problems.push({
          ruleId: 'blueprint.dsl',
          screen,
          path,
          message: `${where}: goTo ${JSON.stringify(link.target)} is not a screen of this document. Screens: ${list}.`,
        })
        continue
      }
      if (link.target === from.id) {
        problems.push({ ruleId: 'blueprint.dsl', screen, path, message: `${where}: goTo "${link.target}" links the screen to itself.` })
        continue
      }
      const target = screens.find((s) => s.id === link.target)
      const toLevel = levelOfScreen(manifest, target?.screen)
      const jump = levelJumpProblem(fromLevel, toLevel)
      const role = jump ? null : linkRoleProblem(manifest, link.type, fromLevel, toLevel)
      if (jump) problems.push({ ruleId: 'flow.next-level', screen, path, message: `${where}: goTo "${link.target}" — ${jump}.` })
      else if (role) problems.push({ ruleId: 'flow.link-roles', screen, path, message: `${where}: goTo "${link.target}" — ${role}.` })
    }
  })
  problems.push(...railProblems(screens, manifest))
  return problems
}

/**
 * Entering the rail doesn't change what's in it: every second-level page shows
 * as many interactivity buttons as the Home rail it is entered from.
 */
function railProblems(screens: FlowScreen[], manifest: DesignSystemManifest): (RuleProblem & { screen: number })[] {
  const on = screenLayersOf(manifest).levels.find((l) => l.level === 2)?.initialFocus?.on ?? []
  if (on.length === 0) return []
  const count = (root: unknown): number => {
    let n = 0
    const walk = (raw: unknown): void => {
      if (typeof raw !== 'object' || raw === null) return
      const node = raw as LinkNode
      if (typeof node.type === 'string' && on.includes(node.type)) n += 1
      if (Array.isArray(node.children)) node.children.forEach(walk)
    }
    walk(root)
    return n
  }
  const home = screens.find((s) => levelOfScreen(manifest, s.screen) === 1 && count(s.root) > 0)
  if (!home) return []
  const expected = count(home.root)
  return screens.flatMap((s, screen) =>
    levelOfScreen(manifest, s.screen) === 2 && count(s.root) !== expected
      ? [
          {
            ruleId: 'flow.rail-consistency' as const,
            screen,
            path: ['root'],
            message: `Screen "${s.id}": the rail shows ${count(s.root)} interactivity button(s), but the Home rail it is entered from ("${home.id}") shows ${expected} — the second level is the same rail, entered; keep the same cards.`,
          },
        ]
      : [],
  )
}
