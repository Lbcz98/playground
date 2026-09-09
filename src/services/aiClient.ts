import type { ChatTurn, GenerateOptions, GenerateUIResponse } from '@/shared/blueprint'
import type { DesignSystemManifest } from '@/shared/design-system/manifest'
import { PRICING_CARD_BLUEPRINT } from '@/shared/fixtures/pricingCard'

/**
 * Renderer-side wrapper around the `window.flow` IPC bridge.
 *
 * Inside Electron this always goes through `ipcRenderer.invoke` -> main process.
 * When the app is opened as a plain web page (e.g. `vite dev` in a browser, with
 * no preload), `window.flow` is undefined; we fall back to the local fixture so
 * the UI is still demoable, and tag the response `source: 'web-fallback'`.
 */

export function isBridgeAvailable(): boolean {
  return typeof window !== 'undefined' && typeof window.flow?.generateUI === 'function'
}

export async function generateUI(
  prompt: string,
  history: ChatTurn[] = [],
  options: GenerateOptions = {},
  manifest?: DesignSystemManifest,
): Promise<GenerateUIResponse> {
  if (isBridgeAvailable()) {
    return window.flow.generateUI(prompt, history, options, manifest)
  }

  return {
    ok: true,
    blueprint: PRICING_CARD_BLUEPRINT,
    meta: {
      source: 'web-fallback',
      durationMs: 0,
      steps: ['window.flow bridge unavailable — served local fixture'],
    },
  }
}
