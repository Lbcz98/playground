/**
 * User-chosen generation settings — model, effort and mode — persisted to
 * localStorage so they survive a reload. Read by `chatStore.send()` and sent with
 * every request.
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  DEFAULT_EFFORT,
  DEFAULT_MODEL_ID,
  isModelId,
  type EffortLevel,
  EFFORT_LEVELS,
} from '@/shared/models'

/**
 * Exploratório (and "Os dois") are offered only with `VITE_EXPLORATORY_PREVIEW=1`
 * until phase 9D gives them their own pipeline; before that they run one Faithful
 * generation. Auto and Fidedigno always ship.
 */
export const EXPLORATORY_PREVIEW = import.meta.env?.VITE_EXPLORATORY_PREVIEW === '1'

/** The modes the selector offers; "Os dois" is only ever a button. */
export type ChosenMode = 'auto' | 'faithful' | 'exploratory'

export function selectableModes(): ChosenMode[] {
  return EXPLORATORY_PREVIEW ? ['auto', 'faithful', 'exploratory'] : ['auto', 'faithful']
}

interface SettingsState {
  model: string
  effort: EffortLevel
  mode: ChosenMode
  setModel: (model: string) => void
  setEffort: (effort: EffortLevel) => void
  setMode: (mode: ChosenMode) => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      model: DEFAULT_MODEL_ID,
      effort: DEFAULT_EFFORT,
      // Faithful by default: Auto costs a classifier call per request, so it is opt-in.
      mode: 'faithful',
      setModel: (model) => set({ model: isModelId(model) ? model : DEFAULT_MODEL_ID }),
      setEffort: (effort) =>
        set({ effort: EFFORT_LEVELS.includes(effort) ? effort : DEFAULT_EFFORT }),
      setMode: (mode) => set({ mode: selectableModes().includes(mode) ? mode : 'faithful' }),
    }),
    {
      name: 'sfs.ai-settings',
      // Guard against a stale persisted model id after the option list changes.
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<SettingsState>
        return {
          ...current,
          model: p.model && isModelId(p.model) ? p.model : current.model,
          effort:
            p.effort && EFFORT_LEVELS.includes(p.effort) ? p.effort : current.effort,
          mode: p.mode && selectableModes().includes(p.mode) ? p.mode : current.mode,
        }
      },
    },
  ),
)
