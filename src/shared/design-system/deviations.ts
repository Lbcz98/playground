/**
 * Declared deviations (phase 9D): what a declaration must look like, and the audit
 * that holds an Exploratory screen to it — the pattern rules it breaks must be
 * exactly the ones it declares. A law is never declarable, in any mode.
 */

import type { DesignSystemManifest } from './manifest'
import { ruleById, rulesOf, type IssuePath, type RuleProblem } from './rules'
import type { PatternRule } from './manifest'

export const MAX_WHY_LENGTH = 300

/** Where the audit's instruction to the Generator starts in an undeclared break's message — the report shows only what comes before. */
export const UNDECLARED_HINT = ' In an Exploratory screen either fix this, or declare it:'

/** A valid declaration, and where it sits: on a node (covers its subtree) or on the screen (covers it all). */
export interface Declaration {
  ruleId: string
  why: string
  /** The declaring node's path in the screen; `[]` for a screen-level declaration. */
  path: IssuePath
  scope: 'node' | 'screen'
  /** Where the declaration itself is written, for the "declared for nothing" issue. */
  at: IssuePath
}

/**
 * Where a pattern's violations are reported, which decides where it may be declared:
 *   - `node`: reported at a node below the root (a misplaced slot, one link). Only a
 *     declaration on that node covers it; a screen-level one would cover every such
 *     break on the screen, which says more than the screen means (seen in the first
 *     real Exploratory runs, r09). A screen-level declaration is an error.
 *   - `screen`: reported at the root or the screen, never deeper (the root's layout,
 *     a level's module limit, where focus starts, the anchored groups, the layer
 *     model, the rail count). It may be declared on the screen, or on the root node.
 * `deviations.test.ts` holds this table to where the validator really reports each
 * rule, and to every declarable pattern having an entry.
 */
export const RULE_SCOPE: Readonly<Record<string, DeclarationScope>> = {
  'layout.slots': 'node',
  'flow.next-level': 'node',
  'flow.link-roles': 'node',
  'flow.rail-consistency': 'screen',
  'level.module-limit': 'screen',
  'level.root-direction': 'screen',
  'level.initial-focus': 'screen',
  'layout.root-align': 'screen',
  'layout.no-static-center': 'screen',
  'layout.anchor': 'screen',
  // Reported on the screen itself (["screen", …]), not under the root: only the screen's own list covers it.
  'layers.overlay-model': 'screen',
  // A Proposal is the break, at its own node.
  'registry.new-component': 'node',
}

/** A rule with no entry (an imported system's own) is treated as screen-wide. */
export const ruleScope = (ruleId: string): DeclarationScope => RULE_SCOPE[ruleId] ?? 'screen'

/** Where a declaration is written: on a node, or in the screen's own list. */
export type DeclarationScope = 'node' | 'screen'

/** The pattern rules a screen may declare: every pattern of the book. */
export function declarableRules(manifest: DesignSystemManifest): PatternRule[] {
  return rulesOf(manifest).filter((r) => r.flexibility === 'pattern')
}

/** Why `raw` is not a usable deviation, as a sentence the Generator can act on — or null. */
export function declarationProblem(
  manifest: DesignSystemManifest,
  raw: unknown,
  scope: DeclarationScope = 'node',
): string | null {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    return '"deviation" must be { "ruleId": "<rule id>", "why": "<the reason>" }.'
  }
  const { ruleId, why, ...rest } = raw as Record<string, unknown>
  const extra = Object.keys(rest)
  if (typeof ruleId !== 'string' || ruleId.length === 0 || typeof why !== 'string' || extra.length > 0) {
    return `"deviation" must be exactly { "ruleId": "<rule id>", "why": "<the reason>" }${extra.length > 0 ? ` (remove "${extra.join('", "')}")` : ''}.`
  }
  if (why.trim().length === 0 || why.length > MAX_WHY_LENGTH) {
    return `the "why" of the deviation from "${ruleId}" must say in one short sentence (up to ${MAX_WHY_LENGTH} characters) why the pattern is broken.`
  }
  const rule = ruleById(manifest, ruleId)
  if (!rule) {
    return `"${ruleId}" is not a rule of ${manifest.name}. Declare one of: ${declarableRules(manifest).map((r) => r.id).join(', ')}.`
  }
  if (rule.flexibility === 'law') {
    return `"${ruleId}" (${rule.title}) is a law — it holds in every mode and cannot be declared as a deviation.`
  }
  if (rule.flexibility === 'convention') {
    return `"${ruleId}" (${rule.title}) is a convention — breaking it only produces a note, so it needs no declaration.`
  }
  if (scope === 'screen' && ruleScope(ruleId) === 'node') {
    return `"${ruleId}" (${rule.title}) breaks at one node, so it is declared on that node — put "deviation" on the node where it happens, not on the screen.`
  }
  return null
}

/**
 * Whether a raw screen declares `ruleId` on its root node or in its `screen`
 * list, validly — for the pre-validation repairs, which must leave a declared
 * break alone (the pipeline's `stretchRoots` and `restStrayFocus`).
 */
export function declaresRule(manifest: DesignSystemManifest, root: unknown, screen: unknown, ruleId: string): boolean {
  const valid = (raw: unknown, scope: DeclarationScope): boolean =>
    declarationProblem(manifest, raw, scope) === null && (raw as { ruleId: string }).ruleId === ruleId
  const onRoot = typeof root === 'object' && root !== null && valid((root as { deviation?: unknown }).deviation, 'node')
  const list = typeof screen === 'object' && screen !== null ? (screen as { deviation?: unknown }).deviation : undefined
  return onRoot || (Array.isArray(list) && list.some((raw) => valid(raw, 'screen')))
}

const startsWith = (path: IssuePath, prefix: IssuePath): boolean =>
  prefix.length <= path.length && prefix.every((key, i) => key === path[i])

/** The declaration of `ruleId` that covers `path`: the deepest declaring node above it, else the screen's. */
function coveringDeclaration(declarations: Declaration[], ruleId: string, path: IssuePath): Declaration | undefined {
  const same = declarations.filter((d) => d.ruleId === ruleId)
  const nodes = same.filter((d) => d.scope === 'node' && startsWith(path, d.path)).sort((a, b) => b.path.length - a.path.length)
  return nodes[0] ?? same.find((d) => d.scope === 'screen')
}

/** Whether one of the declarations covers `issue`: a pattern the screen declared, at or above where it happens. */
export function coveredBy(issue: RuleProblem, declarations: readonly Declaration[], manifest: DesignSystemManifest): boolean {
  const rule = ruleById(manifest, issue.ruleId)
  if (!rule || rule.flexibility !== 'pattern') return false
  return coveringDeclaration(declarations as Declaration[], issue.ruleId, issue.path) !== undefined
}

/** A tree in either shape that carries deviations: a canvas node, or anything with `deviation` and `children`. */
export interface DeviationNode {
  deviation?: { ruleId: string; why: string }
  children?: readonly DeviationNode[]
}

/**
 * Every deviation a tree declares, with the path frame audit issues use
 * (`['root', 'children', 0, …]`), and the screen's own list.
 */
export function treeDeclarations(
  root: DeviationNode,
  screen?: { deviation?: readonly { ruleId: string; why: string }[] },
): Declaration[] {
  const out: Declaration[] = []
  const walk = (node: DeviationNode, at: IssuePath): void => {
    if (node.deviation) out.push({ ...node.deviation, path: at, scope: 'node', at: [...at, 'deviation'] })
    ;(node.children ?? []).forEach((child, i) => walk(child, [...at, 'children', i]))
  }
  walk(root, ['root'])
  ;(screen?.deviation ?? []).forEach((d, j) => out.push({ ...d, path: [], scope: 'screen', at: ['screen', 'deviation', j] }))
  return out
}

/**
 * Holds an Exploratory screen's issues to its declarations. A law breaks in every
 * mode; a pattern breaks only where declared (an undeclared one stays an error,
 * marked as a composition choice); a convention is a note, never an error. A
 * declaration nothing breaks is an error too: the screen's real deviations and its
 * declared ones must be the same set.
 */
export function auditDeviations(
  issues: RuleProblem[],
  declarations: Declaration[],
  manifest: DesignSystemManifest,
): RuleProblem[] {
  return auditDeclared(issues, declarations, manifest).errors
}

/** `auditDeviations`, and which of `issues` a declaration covered (the interpreter says so in a notice). */
export function auditDeclared(
  issues: RuleProblem[],
  declarations: Declaration[],
  manifest: DesignSystemManifest,
): { errors: RuleProblem[]; covered: RuleProblem[] } {
  const used = new Set<Declaration>()
  const out: RuleProblem[] = []
  const covered: RuleProblem[] = []
  for (const issue of issues) {
    const rule = ruleById(manifest, issue.ruleId)
    // A rule the book doesn't know is treated like a law: nothing can waive it.
    if (!rule || rule.flexibility === 'law') {
      out.push(issue)
    } else if (rule.flexibility === 'pattern') {
      const covering = coveringDeclaration(declarations, issue.ruleId, issue.path)
      if (covering) {
        used.add(covering)
        covered.push(issue)
      } else {
        out.push({
          ...issue,
          kind: 'undeclared-deviation',
          message:
            `${issue.message}${UNDECLARED_HINT} "deviation": { "ruleId": "${issue.ruleId}", "why": "…" } ` +
            'on the node where it happens (or in "screen".deviation for the whole screen).',
        })
      }
    }
  }
  for (const d of declarations) {
    if (used.has(d)) continue
    const rule = ruleById(manifest, d.ruleId)
    out.push({
      ruleId: 'blueprint.dsl',
      kind: 'unused-deviation',
      path: d.at,
      message: `A deviation from "${d.ruleId}"${rule ? ` (${rule.title})` : ''} is declared ${d.scope === 'screen' ? 'on the screen' : 'here'}, but nothing ${d.scope === 'screen' ? 'on it' : 'under it'} breaks that rule — remove the declaration, or make the break it describes.`,
    })
  }
  return { errors: out, covered }
}
