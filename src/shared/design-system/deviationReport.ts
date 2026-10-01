/**
 * The deviation report (phase 9F): every deviation on one Exploratory screen, in
 * one list — what it declares and the audit agrees with (`declared`), a pattern it
 * breaks without declaring (`undeclared`), and a declaration nothing breaks or that
 * is not valid (`unused`). Built from `treeDeclarations` and the validator's own
 * `undeclared-deviation` / `unused-deviation` issues, so the report and the
 * validator cannot disagree. The Deviations panel and the Layout QA badge read it.
 */

import type { DesignSystemManifest, ScreenSpec } from './manifest'
import type { IssuePath } from './rules'
import { UNDECLARED_HINT, declarationProblem, ruleScope, treeDeclarations, type DeviationNode } from './deviations'
import { validateBlueprintAgainstManifest } from './manifest-zod'

export interface DeviationEntry {
  ruleId: string
  /** Where it is declared; for an undeclared break, where it would have to be. */
  scope: 'node' | 'screen'
  /** The declaration's reason; absent on an undeclared break. */
  why?: string
  status: 'declared' | 'undeclared' | 'unused'
  /** Who made it: the model now; 'user' when a manual edit is stamped (9F). */
  origin: 'model' | 'user'
  /** The declaring node (`['root', 'children', 0, …]`, `[]` for the screen), or where an undeclared break happens. */
  path: IssuePath
  /** An undeclared break: the validator's message, without its instruction to the Generator. */
  message?: string
}

const samePath = (a: IssuePath, b: IssuePath): boolean => a.length === b.length && a.every((key, i) => key === b[i])

export function deviationReport(root: DeviationNode, screen: ScreenSpec | undefined, manifest: DesignSystemManifest): DeviationEntry[] {
  const v = validateBlueprintAgainstManifest({ version: 1, ...(screen ? { screen } : {}), root }, manifest, 'exploratory')
  const issues = v.ok ? [] : v.issues
  const unusedAt = issues.filter((i) => i.kind === 'unused-deviation').map((i) => i.path)

  const declared: DeviationEntry[] = treeDeclarations(root, screen).map((d) => ({
    ruleId: d.ruleId,
    scope: d.scope,
    why: d.why,
    status: declarationProblem(manifest, { ruleId: d.ruleId, why: d.why }, d.scope) !== null || unusedAt.some((at) => samePath(at, d.at)) ? 'unused' : 'declared',
    origin: 'model',
    path: d.path,
  }))
  const undeclared: DeviationEntry[] = issues
    .filter((i) => i.kind === 'undeclared-deviation')
    .map((i) => ({ ruleId: i.ruleId, scope: ruleScope(i.ruleId), status: 'undeclared', origin: 'model', path: i.path, message: i.message.split(UNDECLARED_HINT)[0] }))
  return [...declared, ...undeclared]
}
