import { useFlowStore, selectCanUndo, selectCanRedo } from '@/store/flowStore'
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
        'rounded-md border border-line bg-surface px-md py-xs text-sm font-medium text-ink',
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

  return (
    <header className="flex items-center justify-between border-b border-line bg-surface px-lg py-sm">
      <div className="flex items-center gap-sm">
        <span className="text-md font-semibold text-ink">ScreenFlow Studio</span>
        <span className="rounded-full bg-brand-subtle px-sm py-xs text-xs font-medium text-brand-strong">
          Phase 1
        </span>
      </div>

      <div className="flex items-center gap-sm">
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
