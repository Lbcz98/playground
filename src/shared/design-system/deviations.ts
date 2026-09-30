/**
 * Declared deviations (phase 9D): what a declaration must look like, and the audit
 * that holds an Exploratory screen to it — the pattern rules it breaks must be
 * exactly the ones it declares. A law is never declarable, in any mode.
 */

import type { DesignSystemManifest } from './manifest'
import { ruleById, rulesOf, type IssuePath, type RuleProblem } from './rules'

export const MAX_WHY_LENGTH = 300

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

/** The rules 9D cannot honour, though they are patterns: composing an overlay needs 9E. */
const NOT_DECLARABLE_YET: Readonly<Record<string, string>> = {
  'layers.overlay-model':
    'composing a new overlay arrives in 9E — for now keep to one of the layer models',
}

/** Why `raw` is not a usable deviation, as a sentence the Generator can act on — or null. */
export function declarationProblem(manifest: DesignSystemManifest, raw: unknown): string | null {
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
    const patterns = rulesOf(manifest).filter((r) => r.flexibility === 'pattern' && !(r.id in NOT_DECLARABLE_YET))
    return `"${ruleId}" is not a rule of ${manifest.name}. Declare one of: ${patterns.map((r) => r.id).join(', ')}.`
  }
  if (rule.flexibility === 'law') {
    return `"${ruleId}" (${rule.title}) is a law — it holds in every mode and cannot be declared as a deviation.`
  }
  if (rule.flexibility === 'convention') {
    return `"${ruleId}" (${rule.title}) is a convention — breaking it only produces a note, so it needs no declaration.`
  }
  if (ruleId in NOT_DECLARABLE_YET) return `"${ruleId}" cannot be declared yet: ${NOT_DECLARABLE_YET[ruleId]}.`
  return null
}

const startsWith = (path: IssuePath, prefix: IssuePath): boolean =>
  prefix.length <= path.length && prefix.every((key, i) => key === path[i])

/** The declaration of `ruleId` that covers `path`: the deepest declaring node above it, else the screen's. */
function coveringDeclaration(declarations: Declaration[], ruleId: string, path: IssuePath): Declaration | undefined {
  const same = declarations.filter((d) => d.ruleId === ruleId)
  const nodes = same.filter((d) => d.scope === 'node' && startsWith(path, d.path)).sort((a, b) => b.path.length - a.path.length)
  return nodes[0] ?? same.find((d) => d.scope === 'screen')
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
  const used = new Set<Declaration>()
  const out: RuleProblem[] = []
  for (const issue of issues) {
    const rule = ruleById(manifest, issue.ruleId)
    // A rule the book doesn't know is treated like a law: nothing can waive it.
    if (!rule || rule.flexibility === 'law' || issue.ruleId in NOT_DECLARABLE_YET) {
      out.push(issue)
    } else if (rule.flexibility === 'pattern') {
      const covering = coveringDeclaration(declarations, issue.ruleId, issue.path)
      if (covering) used.add(covering)
      else {
        out.push({
          ...issue,
          kind: 'undeclared-deviation',
          message:
            `${issue.message} In an Exploratory screen either fix this, or declare it: "deviation": { "ruleId": "${issue.ruleId}", "why": "…" } ` +
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
  return out
}
