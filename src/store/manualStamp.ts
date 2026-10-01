/**
 * The manual-edit stamp (phase 9F). A person's edit is held to the same validation as a generation: on an
 * Exploratory screen, a pattern the edit breaks is declared with its real rule and origin 'user' — never a generic
 * "manual override" — and a stamp made by hand goes away with its break. A law is never stamped, a Faithful screen
 * is never stamped on its own (only through "Declare as my deviation", which switches it), and the model's
 * declarations are never touched: one a manual edit made unused stays, and shows as Unused.
 */

import type { CanvasNode } from '@/model/nodeTree'
import { treeToBlueprint } from '@/interpreter/interpret'
import type { ScreenMode } from '@/shared/blueprint'
import type { DesignSystemManifest, RuleDeviation } from '@/shared/design-system/manifest'
import type { IssuePath } from '@/shared/design-system/rules'
import { deviationReport, type DeviationEntry } from '@/shared/design-system/deviationReport'

export const MANUAL_WHY = 'Edited by hand'

const reportOf = (tree: CanvasNode, manifest: DesignSystemManifest): DeviationEntry[] => {
  const doc = treeToBlueprint(tree)
  return deviationReport(doc.root, doc.screen, manifest)
}

/** The canvas node a report path points at: follow its `children` indices; a prop path stops at its node. */
function nodeAt(tree: CanvasNode, path: IssuePath): CanvasNode {
  let node = tree
  for (let i = 1; i + 1 < path.length && path[i] === 'children'; i += 2) {
    const next = node.children[Number(path[i + 1])]
    if (!next) break
    node = next
  }
  return node
}

/**
 * Declare one break as the person's: a node-level rule on its node, a screen-level one in the screen's list (on the
 * root when the screen has no layer spec). Never replaces a node's existing declaration: one per node.
 */
export function declareAsMine(tree: CanvasNode, entry: Pick<DeviationEntry, 'ruleId' | 'scope' | 'path'>): void {
  const stamp: RuleDeviation = { ruleId: entry.ruleId, why: MANUAL_WHY, origin: 'user' }
  if (entry.scope === 'screen' && tree.screen) {
    const list = tree.screen.deviation ?? []
    if (!list.some((d) => d.ruleId === entry.ruleId)) tree.screen = { ...tree.screen, deviation: [...list, stamp] }
    return
  }
  const node = entry.scope === 'screen' ? tree : nodeAt(tree, entry.path)
  if (!node.deviation) node.deviation = stamp
}

/** Take away a stamp made by hand that nothing breaks any more. */
function clearStamp(tree: CanvasNode, entry: DeviationEntry): void {
  if (entry.path.length === 0 && tree.screen?.deviation) {
    const list = tree.screen.deviation.filter((d) => !(d.ruleId === entry.ruleId && d.origin === 'user'))
    const { deviation: _drop, ...rest } = tree.screen
    tree.screen = list.length > 0 ? { ...rest, deviation: list } : rest
    return
  }
  const node = nodeAt(tree, entry.path)
  if (node.deviation?.origin === 'user' && node.deviation.ruleId === entry.ruleId) delete node.deviation
}

const key = (e: DeviationEntry): string => `${e.ruleId}@${e.path.join('.')}`

/**
 * Stamp `after` (mutated) for the edit that turned `before` into it. Exploratory only: first a stamp made by hand
 * whose break went away is cleared; then each pattern break the edit introduced — undeclared now, not before, so a
 * break the model left is never blamed on the person — is declared as theirs, unless its node already declares
 * another rule.
 */
export function stampManualEdit(before: CanvasNode, after: CanvasNode, mode: ScreenMode, manifest: DesignSystemManifest): void {
  if (mode !== 'exploratory') return
  // ponytail: breaks are matched by rule and path, so a move that shifts an old undeclared break to a new path stamps it as the person's; key by node id if that shows up.
  for (const e of reportOf(after, manifest)) if (e.status === 'unused' && e.origin === 'user') clearStamp(after, e)
  const old = new Set(reportOf(before, manifest).filter((e) => e.status === 'undeclared').map(key))
  for (const e of reportOf(after, manifest)) {
    if (e.status === 'undeclared' && !old.has(key(e)) && !e.blockedBy) declareAsMine(after, e)
  }
}
