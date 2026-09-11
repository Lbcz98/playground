/**
 * DesignSystemProvider — the runtime seam for the active design system.
 *
 * It hydrates the library from disk once, on mount (spec §9 Step 3). It does
 * NOT touch CSS custom properties — spec §7b requires the app shell (this
 * provider wraps the whole app) to stay completely insulated from whichever
 * design system is active. Token injection is scoped to the canvas surface
 * alone; see `Canvas.tsx` / `cssVars.ts`.
 *
 * State itself lives in `useDesignSystemStore`; the hooks below are the read API
 * the Canvas and the Property Inspector use.
 */

import { useEffect, type ReactNode } from 'react'
import {
  selectActiveManifest,
  selectRegistry,
  useDesignSystemStore,
} from '@/store/designSystemStore'

export function DesignSystemProvider({ children }: { children: ReactNode }): JSX.Element {
  const hydrate = useDesignSystemStore((s) => s.hydrate)

  useEffect(() => {
    void hydrate()
  }, [hydrate])

  return <>{children}</>
}

/** The active `DesignSystemManifest`. */
export const useActiveDesignSystem = () => useDesignSystemStore(selectActiveManifest)

/** The active manifest hydrated with React renderers + compiled schemas. */
export const useHydratedRegistry = () => useDesignSystemStore(selectRegistry)
