/**
 * Frame — the right-panel section for the canvas frame. Every screen is laid out
 * on the 1280×720 TV canvas (the only size the AI agent designs for); this picks
 * how it is shown — at that size, or upscaled 1.5× to 1920×1080. It also shows,
 * read-only, where the canvas reads the TV focus to be, which is what places the
 * anchored group, and picks the screen's layer model (the layer rule, Camadas):
 * the shade combination the canvas paints between the video and the content.
 */

import { FRAME, FRAME_SIZES, FRAME_SIZE_IDS, anchorZone } from '@/shared/layout/frame'
import { screenLayersOf, screenModel } from '@/shared/design-system/screen-layers'
import { useActiveDesignSystem } from '@/design-system/DesignSystemProvider'
import { useFlowStore } from '@/store/flowStore'
import { useFrameStore } from '@/store/frameStore'
import { cx } from '@/lib/cx'

export function FramePanel(): JSX.Element {
  const size = useFrameStore((s) => s.size)
  const setSize = useFrameStore((s) => s.setSize)
  const focus = useFrameStore((s) => s.focus)
  const screen = useFlowStore((s) => s.tree.screen)
  const setScreen = useFlowStore((s) => s.setScreen)
  const layers = screenLayersOf(useActiveDesignSystem())
  const model = screenModel(layers, screen?.model)

  return (
    <section className="flex shrink-0 flex-col gap-2xs border-b border-line p-lg">
      <h2 className="text-xs font-semibold text-ink-muted">Frame</h2>

      <div role="radiogroup" aria-label="Frame size" className="grid grid-cols-2 gap-3xs">
        {FRAME_SIZE_IDS.map((id) => {
          const option = FRAME_SIZES[id]
          const checked = id === size
          return (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={checked}
              onClick={() => setSize(id)}
              className={cx(
                'flex flex-col items-start gap-3xs rounded-md border px-2xs py-3xs text-left',
                checked
                  ? 'border-brand bg-brand-subtle text-brand-strong'
                  : 'border-line bg-surface text-ink hover:bg-subtle',
              )}
            >
              <span className="text-sm font-semibold">{option.label}</span>
              <span className="text-xs text-ink-muted">{option.description}</span>
            </button>
          )
        })}
      </div>

      <p className="m-none text-xs text-ink-muted">
        Layout {FRAME.base.width}×{FRAME.base.height} · {FRAME.margin}px safe area · {FRAME.gutter}px
        gutters · {FRAME.grid}pt grid
      </p>
      <p className="m-none text-xs text-ink-muted">
        {focus.label ? (
          <>
            Focus on <span className="font-medium text-ink">“{focus.label}”</span> ({focus.side} side)
          </>
        ) : (
          'Nothing focusable on screen'
        )}{' '}
        → anchored group {anchorZone(focus.side)}
      </p>

      {layers.models.length > 0 ? (
        <label className="flex flex-col gap-3xs text-xs font-medium text-ink">
          Layer model (Camadas)
          <select
            value={model?.id ?? ''}
            onChange={(e) => {
              const next = screenModel(layers, e.target.value)
              if (next) setScreen({ model: next.id, level: next.level })
            }}
            className="rounded-md border border-line bg-surface px-2xs py-3xs text-sm font-normal text-ink focus:outline-none focus:ring focus:ring-brand"
          >
            {model ? null : <option value="">No layer model</option>}
            {layers.levels.map((level) => (
              <optgroup key={level.level} label={`Nível ${level.level} · ${level.name}`}>
                {layers.models
                  .filter((m) => m.level === level.level)
                  .map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
              </optgroup>
            ))}
          </select>
          <span className="font-normal text-ink-muted">
            {model
              ? `Video → ${model.shades.join(' + ')} → content. ${model.use}`
              : 'Pick the model whose shades sit between the video and this content.'}
          </span>
        </label>
      ) : null}
    </section>
  )
}
