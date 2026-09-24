/**
 * The prototype flow — how a document's screens link to each other.
 *
 * A click on an element with `goTo` opens the screen it names. The layer rule
 * (Camadas) shapes those links: from a screen on level N a link opens level N + 1
 * (Home → the focused rail → one interactivity) or goes back up to any lower
 * level, never skipping a level down. Kept here, free of React and of any store,
 * so the strict validator (main process), the interpreter and the player agree.
 */

import { screenLayersOf, screenModel } from './screen-layers'
import type { DesignSystemManifest } from './manifest'

/** A tree in either shape — a raw Blueprint node or a canvas node. */
interface LinkNode {
  type?: unknown
  goTo?: unknown
  children?: unknown
}

export interface FlowLink {
  /** Where the link sits, e.g. `root › Stack[1] › InteractivityCard[0]`. */
  path: string
  target: unknown
}

/** Every `goTo` in a tree, with where it sits. */
export function collectLinks(root: unknown, rootPath = 'root'): FlowLink[] {
  const links: FlowLink[] = []
  const walk = (raw: unknown, path: string): void => {
    if (typeof raw !== 'object' || raw === null) return
    const node = raw as LinkNode
    if (node.goTo !== undefined) links.push({ path, target: node.goTo })
    if (Array.isArray(node.children)) {
      node.children.forEach((child, i) => {
        const type = typeof child === 'object' && child !== null ? String((child as LinkNode).type) : '?'
        walk(child, `${path} › ${type}[${i}]`)
      })
    }
  }
  walk(root, rootPath)
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

/** The navigation level of a screen spec, or undefined when its model is unknown. */
export function levelOfScreen(manifest: DesignSystemManifest, screen: unknown): number | undefined {
  if (typeof screen !== 'object' || screen === null) return undefined
  return screenModel(screenLayersOf(manifest), (screen as { model?: unknown }).model)?.level
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
  const problems: string[] = []
  const ids = new Set<string>()
  for (const s of screens) {
    if (ids.has(s.id)) problems.push(`Two screens share the id "${s.id}" — every screen id is unique.`)
    ids.add(s.id)
  }
  const list = [...ids].map((id) => `"${id}"`).join(', ')
  for (const from of screens) {
    const fromLevel = levelOfScreen(manifest, from.screen)
    for (const link of collectLinks(from.root)) {
      const where = `screen "${from.id}" ${link.path}`
      if (typeof link.target !== 'string' || !ids.has(link.target)) {
        problems.push(`${where}: goTo ${JSON.stringify(link.target)} is not a screen of this document. Screens: ${list}.`)
        continue
      }
      if (link.target === from.id) {
        problems.push(`${where}: goTo "${link.target}" links the screen to itself.`)
        continue
      }
      const target = screens.find((s) => s.id === link.target)
      const jump = levelJumpProblem(fromLevel, levelOfScreen(manifest, target?.screen))
      if (jump) problems.push(`${where}: goTo "${link.target}" — ${jump}.`)
    }
  }
  return problems
}
