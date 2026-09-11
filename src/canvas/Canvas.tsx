import { useEffect, useRef } from 'react'
import { useFlowStore } from '@/store/flowStore'
import { useActiveDesignSystem } from '@/design-system/DesignSystemProvider'
import { applyTokens, manifestTokensToCssVars, purgeTokens, screenflowBaseVars } from '@/design-system/cssVars'
import { NodeRenderer } from './NodeRenderer'

/**
 * The canvas stage. It renders the flow tree inside a fixed-width "device" frame.
 * There is no absolute positioning and no drag-to-place — structure comes only
 * from nested Stacks. Clicking the stage background clears the selection.
 *
 * `data-canvas-theme="active"` is the ONLY place the active design system's
 * tokens land as CSS custom properties (spec §7b — tool/artifact isolation):
 * the app shell (toolbar, sidebars, Property Inspector controls) never sees
 * them and stays on its static Tailwind classes. The built-in ScreenFlow
 * values are seeded first so every `--sfs-*` var the generic renderer reads
 * is always defined, even when an imported system supplies only a partial
 * token set.
 */
export function Canvas(): JSX.Element {
  const tree = useFlowStore((s) => s.tree)
  const select = useFlowStore((s) => s.select)
  const active = useActiveDesignSystem()
  const surfaceRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = surfaceRef.current
    if (!el) return
    applyTokens(el, { ...screenflowBaseVars(), ...manifestTokensToCssVars(active.tokens) })
    return () => purgeTokens(el)
  }, [active])

  return (
    <div
      className="flex h-full flex-1 justify-center overflow-auto bg-page p-2xl"
      onClick={() => select(null)}
    >
      <div
        ref={surfaceRef}
        data-canvas-theme="active"
        className="sfs-canvas-surface w-full max-w-device-lg font-sans"
      >
        <NodeRenderer node={tree} />
      </div>
    </div>
  )
}
