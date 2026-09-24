import { useFlowStore } from '@/store/flowStore'
import { useActiveDesignSystem } from '@/design-system/DesignSystemProvider'
import { describeScreen, screenLayersOf, screenModel } from '@/shared/design-system/screen-layers'
import { FRAME } from '@/shared/layout/frame'
import { cx } from '@/lib/cx'
import { NodeRenderer } from './NodeRenderer'
import { NodeModeContext } from './nodeMode'
import { ScreenFrame } from './ScreenFrame'

const THUMB_SCALE = 0.2

/**
 * Every frame of the document, live and small, under the open one — the three
 * options of a "give me three versions", or the steps of a flow. Clicking one
 * opens it for editing; the × removes it (to keep the option you picked).
 */
export function ScreenStrip(): JSX.Element {
  const screens = useFlowStore((s) => s.screens)
  const activeId = useFlowStore((s) => s.activeId)
  const setActive = useFlowStore((s) => s.setActiveScreen)
  const remove = useFlowStore((s) => s.deleteScreen)
  const active = useActiveDesignSystem()
  const layers = screenLayersOf(active)

  return (
    <div
      className="flex max-w-full shrink-0 items-start gap-2xs overflow-x-auto pb-3xs"
      onClick={(event) => event.stopPropagation()}
    >
      {screens.map((entry) => {
        const open = entry.id === activeId
        const side = screenModel(layers, entry.tree.screen?.model)?.side ?? 'neutral'
        return (
          <div key={entry.id} className="flex shrink-0 flex-col gap-3xs">
            <button
              type="button"
              onClick={() => setActive(entry.id)}
              aria-label={`Open ${entry.name}`}
              aria-current={open}
              className={cx(
                'overflow-hidden rounded-sm border-2 p-none',
                open ? 'border-brand' : 'border-line hover:border-brand-subtle',
              )}
              style={{ width: FRAME.base.width * THUMB_SCALE, height: FRAME.base.height * THUMB_SCALE }}
            >
              <div className="pointer-events-none">
                <NodeModeContext.Provider value="inert">
                  <ScreenFrame
                    tree={entry.tree}
                    layers={layers}
                    tokens={active.tokens}
                    focusSide={side === 'left' ? 'left' : 'neutral'}
                    scale={THUMB_SCALE}
                    renderNode={(node) => <NodeRenderer node={node} />}
                  />
                </NodeModeContext.Provider>
              </div>
            </button>
            <div className="flex items-center justify-between gap-2xs text-xs">
              <span className={cx('truncate font-medium', open ? 'text-ink' : 'text-ink-muted')} title={describeScreen(active, entry.tree.screen) ?? undefined}>
                {entry.name}
              </span>
              <button
                type="button"
                onClick={() => remove(entry.id)}
                aria-label={`Delete ${entry.name}`}
                className="text-ink-muted hover:text-danger"
              >
                ×
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
