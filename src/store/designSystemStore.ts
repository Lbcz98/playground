/**
 * The active design system + the imported library.
 *
 * The Canvas, the Property Inspector and the AI orchestrator all read the *active*
 * manifest from here. `DesignSystemProvider` drives `hydrate()` on startup and
 * re-injects the token CSS variables whenever `active` changes.
 *
 * Persistence is the Electron filesystem (spec §9) via `window.flow.designSystems`.
 * With no bridge (plain browser / tests) the library is just the built-in system.
 */

import { create } from 'zustand'
import type { DesignSystemManifest } from '@/shared/design-system/manifest'
import { manifestZodSchema } from '@/shared/design-system/manifest'
import {
  SCREENFLOW_MANIFEST,
  SCREENFLOW_MANIFEST_ID,
} from '@/shared/design-system/screenflow-manifest'
import { parseStorybookDocgen, type StorybookAdapterMeta } from '@/shared/design-system/storybook-adapter'
import { mergeTokens, parseDesignTokens } from '@/shared/design-system/token-adapter'
import { hydrateRegistry, type HydratedRegistry } from '@/design-system/registry'

export type ImportResult = { ok: true; id: string } | { ok: false; error: string }

interface DesignSystemState {
  library: DesignSystemManifest[]
  activeId: string
  active: DesignSystemManifest
  registry: HydratedRegistry
  hydrated: boolean

  hydrate: () => Promise<void>
  setActive: (id: string) => Promise<void>
  importStorybook: (rawJson: unknown, meta?: StorybookAdapterMeta) => Promise<ImportResult>
  importManifest: (raw: unknown) => Promise<ImportResult>
  /** Merge design tokens (DTCG / Style Dictionary / grouped) into the active imported system. */
  importTokens: (rawJson: unknown) => Promise<ImportResult>
  remove: (id: string) => Promise<void>
}

/** The persistence bridge, when running inside Electron. */
function ds() {
  return typeof window !== 'undefined' ? window.flow?.designSystems : undefined
}

/** Built-in first, then imported systems sorted by name; de-duped by id. */
function composeLibrary(imported: DesignSystemManifest[]): DesignSystemManifest[] {
  const byId = new Map<string, DesignSystemManifest>()
  byId.set(SCREENFLOW_MANIFEST_ID, SCREENFLOW_MANIFEST)
  for (const m of imported) if (m.id !== SCREENFLOW_MANIFEST_ID) byId.set(m.id, m)
  const rest = [...byId.values()]
    .filter((m) => m.id !== SCREENFLOW_MANIFEST_ID)
    .sort((a, b) => a.name.localeCompare(b.name))
  return [SCREENFLOW_MANIFEST, ...rest]
}

function derive(library: DesignSystemManifest[], wantId: string) {
  const active = library.find((m) => m.id === wantId) ?? SCREENFLOW_MANIFEST
  return { activeId: active.id, active, registry: hydrateRegistry(active) }
}

const INITIAL_LIBRARY = composeLibrary([])

export const useDesignSystemStore = create<DesignSystemState>((set, get) => ({
  library: INITIAL_LIBRARY,
  ...derive(INITIAL_LIBRARY, SCREENFLOW_MANIFEST_ID),
  hydrated: false,

  hydrate: async () => {
    const bridge = ds()
    if (!bridge) {
      set({ hydrated: true })
      return
    }
    try {
      const [rawList, savedActive] = await Promise.all([bridge.list(), bridge.getActiveId()])
      const imported = (Array.isArray(rawList) ? rawList : [])
        .map((m) => manifestZodSchema.safeParse(m))
        .filter((r): r is { success: true; data: DesignSystemManifest } => r.success)
        .map((r) => r.data)
      const library = composeLibrary(imported)
      set({ library, ...derive(library, savedActive ?? get().activeId), hydrated: true })
    } catch (err) {
      console.error('[designSystemStore] hydrate failed', err)
      set({ hydrated: true })
    }
  },

  setActive: async (id) => {
    const next = derive(get().library, id)
    set(next)
    try {
      await ds()?.setActiveId(next.activeId)
    } catch (err) {
      console.error('[designSystemStore] setActiveId failed', err)
    }
  },

  importManifest: async (raw) => {
    const parsed = manifestZodSchema.safeParse(raw)
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid manifest' }
    }
    return persistAndAdd(parsed.data, set, get)
  },

  importStorybook: async (rawJson, meta) => {
    let manifest: DesignSystemManifest
    try {
      manifest = parseStorybookDocgen(rawJson, meta)
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : String(err) }
    }
    const parsed = manifestZodSchema.safeParse(manifest)
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? 'Adapter produced an invalid manifest' }
    }
    return persistAndAdd(parsed.data, set, get)
  },

  importTokens: async (rawJson) => {
    const target = get().active
    if (target.id === SCREENFLOW_MANIFEST_ID) {
      return { ok: false, error: 'The built-in ScreenFlow system cannot be re-themed.' }
    }
    const parsed = parseDesignTokens(rawJson)
    if (Object.keys(parsed).length === 0) {
      return { ok: false, error: 'No design tokens found (expected DTCG or Style Dictionary JSON).' }
    }
    const next: DesignSystemManifest = {
      ...target,
      tokens: mergeTokens(target.tokens, parsed),
    }
    const valid = manifestZodSchema.safeParse(next)
    if (!valid.success) {
      return { ok: false, error: valid.error.issues[0]?.message ?? 'Merged manifest is invalid' }
    }
    return persistAndAdd(valid.data, set, get)
  },

  remove: async (id) => {
    if (id === SCREENFLOW_MANIFEST_ID) return
    const library = get().library.filter((m) => m.id !== id)
    const wantId = get().activeId === id ? SCREENFLOW_MANIFEST_ID : get().activeId
    set({ library, ...derive(library, wantId) })
    try {
      await ds()?.remove(id)
      if (get().activeId !== id) await ds()?.setActiveId(get().activeId)
    } catch (err) {
      console.error('[designSystemStore] remove failed', err)
    }
  },
}))

async function persistAndAdd(
  manifest: DesignSystemManifest,
  set: (partial: Partial<DesignSystemState>) => void,
  get: () => DesignSystemState,
): Promise<ImportResult> {
  try {
    await ds()?.save(manifest)
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) }
  }
  const library = composeLibrary([
    ...get().library.filter((m) => m.id !== manifest.id && m.id !== SCREENFLOW_MANIFEST_ID),
    manifest,
  ])
  set({ library, ...derive(library, manifest.id) })
  try {
    await ds()?.setActiveId(manifest.id)
  } catch {
    /* non-fatal */
  }
  return { ok: true, id: manifest.id }
}

// Selectors
export const selectActiveManifest = (s: DesignSystemState) => s.active
export const selectRegistry = (s: DesignSystemState) => s.registry
