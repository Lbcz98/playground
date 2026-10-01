import { useMemo } from 'react'
import type { CanvasNode } from '@/model/nodeTree'
import { treeToBlueprint } from '@/interpreter/interpret'
import { useActiveDesignSystem } from '@/design-system/DesignSystemProvider'
import { deviationReport, type DeviationEntry } from '@/shared/design-system/deviationReport'

/** The deviation report of a canvas screen — empty on a Faithful one. The Layout QA badge and the Deviations panel read it. */
export function useDeviationReport(tree: CanvasNode, exploratory: boolean): DeviationEntry[] {
  const active = useActiveDesignSystem()
  return useMemo(() => {
    if (!exploratory) return []
    const doc = treeToBlueprint(tree)
    return deviationReport(doc.root, doc.screen, active)
  }, [tree, exploratory, active])
}
