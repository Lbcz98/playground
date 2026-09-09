import { useFlowStore } from '@/store/flowStore'
import { NodeRenderer } from './NodeRenderer'

/**
 * The canvas stage. It renders the flow tree inside a fixed-width "device" frame.
 * There is no absolute positioning and no drag-to-place — structure comes only
 * from nested Stacks. Clicking the stage background clears the selection.
 */
export function Canvas(): JSX.Element {
  const tree = useFlowStore((s) => s.tree)
  const select = useFlowStore((s) => s.select)

  return (
    <div
      className="flex h-full flex-1 justify-center overflow-auto bg-page p-2xl"
      onClick={() => select(null)}
    >
      <div className="sfs-canvas-surface w-full max-w-device-lg font-sans">
        <NodeRenderer node={tree} />
      </div>
    </div>
  )
}
