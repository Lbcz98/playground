/**
 * User-chosen generation settings — model + effort — persisted to localStorage so
 * they survive a reload. Read by `chatStore.send()` and sent with every request.
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

interface SettingsState {
  model: string
  effort: EffortLevel
  setModel: (model: string) => void
  setEffort: (effort: EffortLevel) => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      model: DEFAULT_MODEL_ID,
      effort: DEFAULT_EFFORT,
      setModel: (model) => set({ model: isModelId(model) ? model : DEFAULT_MODEL_ID }),
      setEffort: (effort) =>
        set({ effort: EFFORT_LEVELS.includes(effort) ? effort : DEFAULT_EFFORT }),
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
        }
      },
    },
  ),
)
