/**
 * The live component bundle contract (Phase 8B): a UMD build that, on load, sets
 * `window.__sfsDesignSystem` to a plain object mapping manifest component ids to
 * React components. The bundle is read by `scripts/storybook/export-dtv.ts`.
 */

import type { ComponentType } from 'react'

export const LIVE_BUNDLE_GLOBAL = '__sfsDesignSystem'

export type LiveComponentMap = Record<string, ComponentType<Record<string, unknown>>>
