import { useFlowStore, selectCanUndo, selectCanRedo } from '@/store/flowStore'
import { usePlayStore } from '@/store/playStore'
import { cx } from '@/lib/cx'

function ToolbarButton({
  onClick,
  disabled,
  children,
}: {
  onClick: () => void
  disabled?: boolean
  children: React.ReactNode
}): JSX.Element {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cx(
        'rounded-md border border-line bg-surface px-sm py-3xs text-sm font-medium text-ink',
        'hover:bg-subtle disabled:opacity-50 disabled:pointer-events-none',
      )}
    >
      {children}
    </button>
  )
}

export function Toolbar(): JSX.Element {
  const undo = useFlowStore((s) => s.undo)
  const redo = useFlowStore((s) => s.redo)
  const reset = useFlowStore((s) => s.reset)
  const canUndo = useFlowStore(selectCanUndo)
  const canRedo = useFlowStore(selectCanRedo)
  const lastActionLabel = useFlowStore((s) => s.lastActionLabel)
  const mode = usePlayStore((s) => s.mode)
  const play = usePlayStore((s) => s.play)
  const edit = usePlayStore((s) => s.edit)

  return (
    <header className="flex items-center justify-between border-b border-line bg-surface px-lg py-2xs">
      <div className="flex items-center gap-2xs">
        <span className="text-md font-semibold text-ink">ScreenFlow Studio</span>
      </div>

      <div role="group" aria-label="Mode" className="flex overflow-hidden rounded-md border border-line text-sm font-medium">
        {(['edit', 'play'] as const).map((m) => (
          <button
            key={m}
            type="button"
            aria-pressed={mode === m}
            onClick={m === 'play' ? play : edit}
            className={cx(
              'px-sm py-3xs',
              mode === m ? 'bg-brand text-ink-inverse' : 'bg-surface text-ink hover:bg-subtle',
            )}
          >
            {m === 'edit' ? 'Edit' : '▶ Play'}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2xs">
        <span className="text-xs text-ink-muted">
          {lastActionLabel ? `Last: ${lastActionLabel}` : 'No edits yet'}
        </span>
        <ToolbarButton onClick={undo} disabled={!canUndo}>
          Undo
        </ToolbarButton>
        <ToolbarButton onClick={redo} disabled={!canRedo}>
          Redo
        </ToolbarButton>
        <ToolbarButton onClick={reset}>Reset</ToolbarButton>
      </div>
    </header>
  )
}
