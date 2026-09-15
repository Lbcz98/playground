/**
 * The canvas frame: its size — a user setting, persisted to localStorage — and the
 * canvas's live reading of the TV focus, which `Canvas.tsx` derives from the
 * rendered screen and nobody sets by hand. The focus side is what places the
 * anchored element group. Neither is document history, so neither is undoable.
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  DEFAULT_FOCUS,
  DEFAULT_FRAME_SIZE,
  type FocusSide,
  type FrameSizeId,
  isFrameSizeId,
} from '@/shared/layout/frame'

export interface FocusReading {
  side: FocusSide
  /** A short name for the focused element (its label or text), or null when nothing is focusable. */
  label: string | null
}

interface FrameState {
  size: FrameSizeId
  focus: FocusReading
  setSize: (size: FrameSizeId) => void
  setFocusReading: (focus: FocusReading) => void
}

export const useFrameStore = create<FrameState>()(
  persist(
    (set, get) => ({
      size: DEFAULT_FRAME_SIZE,
      focus: { side: DEFAULT_FOCUS, label: null },
      setSize: (size) => set({ size: isFrameSizeId(size) ? size : DEFAULT_FRAME_SIZE }),
      setFocusReading: (focus) => {
        const current = get().focus
        if (current.side !== focus.side || current.label !== focus.label) set({ focus })
      },
    }),
    {
      name: 'sfs.frame-settings',
      partialize: (s) => ({ size: s.size }),
      // Guard against a stale persisted size after the preset list changes.
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<FrameState>
        return { ...current, size: isFrameSizeId(p.size) ? p.size : current.size }
      },
    },
  ),
)
