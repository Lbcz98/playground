/**
 * Deviations (phase 9F) — the left-panel section that lists every deviation on the
 * open screen, from the one report the Layout QA badge also reads: what it declares
 * and the audit agrees with, a pattern it breaks without declaring, and a
 * declaration nothing breaks. Clicking an entry selects the node it sits on.
 */

import type { CanvasNode } from '@/model/nodeTree'
import { screenMode } from '@/shared/blueprint'
import type { DesignSystemManifest } from '@/shared/design-system/manifest'
import type { DeviationEntry } from '@/shared/design-system/deviationReport'
import type { IssuePath } from '@/shared/design-system/rules'
import { ruleById } from '@/shared/design-system/rules'
import { useActiveDesignSystem } from '@/design-system/DesignSystemProvider'
import { useDeviationReport } from '@/canvas/useDeviationReport'
import { useFlowStore } from '@/store/flowStore'
import { cx } from '@/lib/cx'

const GROUPS: { status: DeviationEntry['status']; label: string; hint: string; chip: string }[] = [
  { status: 'declared', label: 'Declared', hint: 'patterns this screen breaks, and says why', chip: 'border-dashed border-brand text-brand-strong' },
  { status: 'undeclared', label: 'Undeclared', hint: 'patterns broken without a declaration', chip: 'border-danger text-danger' },
  { status: 'unused', label: 'Unused', hint: 'declared, but nothing breaks them', chip: 'border-line text-ink-muted' },
]

/** The node an entry sits on: follow the `children` indices of its path; a screen-level entry is the root. */
export function nodeIdAtPath(tree: CanvasNode, path: IssuePath): string {
  let node = tree
  for (let i = 1; i + 1 < path.length && path[i] === 'children'; i += 2) {
    const next = node.children[Number(path[i + 1])]
    if (!next) break
    node = next
  }
  return node.id
}

export function DeviationList({
  entries,
  manifest,
  exploratory,
  onSelect,
  onDeclare,
}: {
  entries: DeviationEntry[]
  manifest: DesignSystemManifest
  exploratory: boolean
  onSelect: (entry: DeviationEntry) => void
  /** "Declare as my deviation" on an undeclared break (on a Faithful screen it switches the screen to Exploratory). */
  onDeclare: (entry: DeviationEntry) => void
}): JSX.Element {
  if (entries.length === 0) {
    return (
      <p className="m-none text-xs text-ink-muted">
        {exploratory ? 'No deviations — this screen keeps every pattern.' : 'Faithful screen — it keeps every pattern.'}
      </p>
    )
  }
  return (
    <div className="flex flex-col gap-sm">
      {GROUPS.map((group) => {
        const items = entries.filter((e) => e.status === group.status)
        if (items.length === 0) return null
        return (
          <div key={group.status} className="flex flex-col gap-3xs">
            <h3 className="m-none text-xs font-medium text-ink" title={group.hint}>
              {group.label} · {items.length}
            </h3>
            <ul className="m-none flex list-none flex-col gap-3xs p-none">
              {items.map((entry, i) => (
                <li key={`${entry.ruleId}-${entry.path.join('.')}-${i}`} className="flex flex-col gap-3xs">
                  <button
                    type="button"
                    data-status={entry.status}
                    onClick={() => onSelect(entry)}
                    className="flex w-full flex-col gap-3xs rounded-sm p-2xs text-left text-xs hover:bg-subtle"
                  >
                    <span className="flex flex-wrap items-center gap-3xs">
                      <span className="font-medium text-ink">{ruleById(manifest, entry.ruleId)?.title ?? entry.ruleId}</span>
                      <span className={cx('rounded-full border px-3xs', group.chip)}>{entry.scope}</span>
                      {entry.origin === 'user' ? <span className="rounded-full bg-subtle px-3xs text-ink-muted">by hand</span> : null}
                    </span>
                    <span className="text-ink-muted">{entry.ruleId}</span>
                    <span className="text-ink">{entry.why ?? entry.message}</span>
                  </button>
                  {entry.status === 'undeclared' ? (
                    <div className="flex flex-col gap-3xs px-2xs">
                      <button
                        type="button"
                        disabled={entry.blockedBy !== undefined}
                        onClick={() => onDeclare(entry)}
                        className="self-start rounded-sm border border-line px-2xs py-3xs text-xs text-ink hover:bg-subtle disabled:cursor-not-allowed disabled:text-ink-muted"
                      >
                        Declare as my deviation
                      </button>
                      {entry.blockedBy ? (
                        <span className="text-xs text-ink-muted">this node already declares {entry.blockedBy}; one declaration per node</span>
                      ) : !exploratory ? (
                        <span className="text-xs text-ink-muted">switches this screen to Exploratório</span>
                      ) : null}
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        )
      })}
    </div>
  )
}

export function DeviationsPanel(): JSX.Element {
  const tree = useFlowStore((s) => s.tree)
  const exploratory = useFlowStore((s) => screenMode(s.screens.find((entry) => entry.id === s.activeId)) === 'exploratory')
  const select = useFlowStore((s) => s.select)
  const declareDeviation = useFlowStore((s) => s.declareDeviation)
  const manifest = useActiveDesignSystem()
  // A Faithful screen lists its undeclared breaks too (a manual edit), so the person can declare one as theirs.
  const entries = useDeviationReport(tree, true)
  return (
    <section className="flex flex-col gap-2xs">
      <h2 className="text-xs font-semibold text-ink-muted">Deviations</h2>
      <DeviationList
        entries={entries}
        manifest={manifest}
        exploratory={exploratory} onSelect={(entry) => select(nodeIdAtPath(tree, entry.path))}
        onDeclare={declareDeviation}
      />
    </section>
  )
}
