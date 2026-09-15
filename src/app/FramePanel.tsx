/**
 * Frame — the right-panel section for the canvas frame. Every screen is laid out
 * on the 1280×720 TV canvas (the only size the AI agent designs for); this picks
 * how it is shown — at that size, or upscaled 1.5× to 1920×1080. It also shows,
 * read-only, where the canvas reads the TV focus to be, which is what places the
 * anchored group.
 */

import { FRAME, FRAME_SIZES, FRAME_SIZE_IDS, anchorZone } from '@/shared/layout/frame'
import { useFrameStore } from '@/store/frameStore'
import { cx } from '@/lib/cx'

export function FramePanel(): JSX.Element {
  const size = useFrameStore((s) => s.size)
  const setSize = useFrameStore((s) => s.setSize)
  const focus = useFrameStore((s) => s.focus)

  return (
    <section className="flex shrink-0 flex-col gap-sm border-b border-line p-lg">
      <h2 className="text-xs font-semibold text-ink-muted">Frame</h2>

      <div role="radiogroup" aria-label="Frame size" className="grid grid-cols-2 gap-xs">
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
                'flex flex-col items-start gap-xs rounded-md border px-sm py-xs text-left',
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
    </section>
  )
}
