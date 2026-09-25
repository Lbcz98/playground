import { useEffect, useState } from 'react'
import { useFlowStore } from '@/store/flowStore'
import { usePlayStore } from '@/store/playStore'
import { useActiveDesignSystem } from '@/design-system/DesignSystemProvider'
import { describeScreen } from '@/shared/design-system/screen-layers'

/** How long a play-bar note stays up. */
const NOTE_MS = 2500

/**
 * The player's status line: which screen is on, where you came from, and Back /
 * Restart. Escape and Backspace are the remote's Back key.
 */
export function PlayBar({ screenId }: { screenId: string }): JSX.Element {
  const screens = useFlowStore((s) => s.screens)
  const trail = usePlayStore((s) => s.trail)
  const back = usePlayStore((s) => s.back)
  const restart = usePlayStore((s) => s.restart)
  const edit = usePlayStore((s) => s.edit)
  const active = useActiveDesignSystem()
  const note = usePlayStore((s) => s.note)
  const [, tick] = useState(0)
  useEffect(() => {
    if (!note) return
    const t = setTimeout(() => tick((n) => n + 1), NOTE_MS)
    return () => clearTimeout(t)
  }, [note])
  const showNote = note && Date.now() - note.at < NOTE_MS

  useEffect(() => {
    const onKey = (event: KeyboardEvent): void => {
      const target = event.target as HTMLElement | null
      if (target && /^(input|textarea|select)$/i.test(target.tagName)) return
      if (event.key === 'Escape' || event.key === 'Backspace') {
        event.preventDefault()
        back()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [back])

  const entry = screens.find((s) => s.id === screenId)
  const names = trail.map((id) => screens.find((s) => s.id === id)?.name ?? id)
  const links = countLinks(entry?.tree)

  return (
    <div
      className="flex w-full flex-wrap items-center justify-center gap-2xs text-xs text-ink-muted"
      onClick={(event) => event.stopPropagation()}
    >
      <span className="rounded-full bg-brand-subtle px-2xs py-3xs font-medium text-brand-strong">Playing</span>
      <span className="font-medium text-ink">{entry?.name}</span>
      <span>{describeScreen(active, entry?.tree.screen) ?? 'No layer model'}</span>
      {names.length > 1 ? <span>{names.join(' › ')}</span> : null}
      <span>{links > 0 ? `${links} clickable` : 'nothing here links anywhere'}</span>
      {showNote ? <span className="font-medium text-ink">{note.text}</span> : null}
      <button
        type="button"
        onClick={back}
        disabled={trail.length < 2}
        className="rounded-md border border-line bg-surface px-2xs py-3xs font-medium text-ink hover:bg-subtle disabled:pointer-events-none disabled:opacity-50"
      >
        Back (Esc)
      </button>
      <button
        type="button"
        onClick={restart}
        disabled={trail.length < 2}
        className="rounded-md border border-line bg-surface px-2xs py-3xs font-medium text-ink hover:bg-subtle disabled:pointer-events-none disabled:opacity-50"
      >
        Restart
      </button>
      <button
        type="button"
        onClick={edit}
        className="rounded-md border border-line bg-surface px-2xs py-3xs font-medium text-ink hover:bg-subtle"
      >
        Edit
      </button>
    </div>
  )
}

function countLinks(node: { goTo?: string; children: unknown[] } | undefined): number {
  if (!node) return 0
  const kids = node.children as Array<{ goTo?: string; children: unknown[] }>
  return (node.goTo ? 1 : 0) + kids.reduce((sum, child) => sum + countLinks(child), 0)
}
