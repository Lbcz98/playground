/**
 * DesignSystemProvider — the runtime seam for the active design system.
 *
 * It owns two side effects:
 *   1. hydrate the library from disk once, on mount (spec §9 Step 3)
 *   2. whenever the active manifest changes, purge the previously-injected
 *      `--sfs-*` CSS custom properties and inject the new manifest's tokens
 *      (spec §6 Step 2)
 *
 * State itself lives in `useDesignSystemStore`; the hooks below are the read API
 * the Canvas and the Property Inspector use.
 */

import { useEffect, type ReactNode } from 'react'
import { applyTokens, manifestTokensToCssVars, purgeTokens } from './cssVars'
import {
  selectActiveManifest,
  selectRegistry,
  useDesignSystemStore,
} from '@/store/designSystemStore'

export function DesignSystemProvider({ children }: { children: ReactNode }): JSX.Element {
  const hydrate = useDesignSystemStore((s) => s.hydrate)
  const activeTokens = useDesignSystemStore((s) => s.active.tokens)
  const activeId = useDesignSystemStore((s) => s.activeId)

  useEffect(() => {
    void hydrate()
  }, [hydrate])

  useEffect(() => {
    const root = document.documentElement
    applyTokens(root, manifestTokensToCssVars(activeTokens))
    return () => purgeTokens(root)
  }, [activeId, activeTokens])

  return <>{children}</>
}

/** The active `DesignSystemManifest`. */
export const useActiveDesignSystem = () => useDesignSystemStore(selectActiveManifest)

/** The active manifest hydrated with React renderers + compiled schemas. */
export const useHydratedRegistry = () => useDesignSystemStore(selectRegistry)
