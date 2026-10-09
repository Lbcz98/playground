/**
 * What the render harness page and the scripts that drive it (`render-audit.ts`, `flow-probe.ts`, through
 * `harness-page.ts`) agree on: which address shows what, and the `window.__…` the page answers with.
 * Imported by `main.tsx` in the browser and by the scripts in Node, so it holds no code from either.
 */

import type { RenderMeasurement } from '../../src/shared/layout/renderAudit'

/** The frame of the screen on the page: what is measured, and what tells a screen is on show. */
export const FRAME = '[data-screen-layer="video"]'
/** The viewport the screens are laid out in (they are 1280x720). */
export const VIEWPORT = { width: 1280, height: 720 }

/** What to show: a screen file (its default export) or a flow folder (in the app's player), as a path from the repo root. */
export type Target = { file: string } | { flow: string }

const PAGE = '/scripts/render-harness/index.html'

export const harnessUrl = (target: Target): string => `${PAGE}?${'flow' in target ? `flow=/${target.flow}` : `file=/${target.file}`}`

export function targetOf(search: string): Target | undefined {
  const params = new URLSearchParams(search)
  const flow = params.get('flow')
  const file = params.get('file')
  if (flow) return { flow: flow.slice(1) }
  if (file) return { file: file.slice(1) }
  return undefined
}

export interface FocusReading {
  model: string | null
  level: string | null
  focused: { component: string; text: string }[]
  /** The side of the frame the back control (BACK_CONTROL) is drawn on; null when the screen has none. */
  back: 'left' | 'right' | null
}
export interface Watched {
  blank: boolean
  rebuilt: string[]
}

/** What `main.tsx` puts on `window`. `__ready`/`__error`: the page rendered, or why not. The rest read the page; `__error`-shaped answers say there was nothing to read. */
export interface HarnessWindow {
  __ready?: boolean
  __error?: string
  __measure(): RenderMeasurement | { error: string }
  __focus(): FocusReading | { error: string }
  __watch(): void
  __watched(): Watched | { error: string }
}
