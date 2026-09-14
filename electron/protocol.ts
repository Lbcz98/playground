/**
 * The `design-system://` protocol — Phase 8A.
 *
 * Serves EXACTLY ONE thing: `design-system://<id>/bundle.js`, and only when
 * `<id>` already has both a persisted manifest AND a saved bundle on disk
 * (`electron/storage.ts`). Every other path, host, or missing file 404s. This
 * is not a general file server — it is the sole, narrow bridge that lets the
 * sandboxed renderer load a live component bundle the user explicitly
 * attached to an already-imported design system.
 *
 * `contextIsolation` / `nodeIntegration` / `sandbox` on the BrowserWindow are
 * untouched by this — a script loaded through this protocol runs with the
 * same privileges any web page's own JS has (DOM, fetch, localStorage), never
 * Node.js or Electron APIs.
 */

import { access } from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { net, protocol } from 'electron'
import { designSystemsDir, safeId } from './storage'

export const DESIGN_SYSTEM_SCHEME = 'design-system'

/**
 * MUST run before `app.whenReady()` — Electron only honours privileged-scheme
 * registration synchronously at module load, ahead of the ready event.
 */
export function registerDesignSystemProtocolSchemes(): void {
  protocol.registerSchemesAsPrivileged([
    {
      scheme: DESIGN_SYSTEM_SCHEME,
      privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: false },
    },
  ])
}

/** Call once, inside `app.whenReady().then(...)`. */
export function installDesignSystemProtocolHandler(): void {
  protocol.handle(DESIGN_SYSTEM_SCHEME, async (request) => {
    let url: URL
    try {
      url = new URL(request.url)
    } catch {
      return new Response(null, { status: 400 })
    }

    if (url.pathname !== '/bundle.js') return new Response(null, { status: 404 })

    let id: string
    try {
      id = safeId(url.hostname)
    } catch {
      return new Response(null, { status: 400 })
    }

    const manifestPath = path.join(designSystemsDir(), `${id}.json`)
    const bundlePath = path.join(designSystemsDir(), `${id}.bundle.js`)
    if (!(await fileExists(manifestPath)) || !(await fileExists(bundlePath))) {
      return new Response(null, { status: 404 })
    }

    return net.fetch(pathToFileURL(bundlePath).toString())
  })
}

async function fileExists(p: string): Promise<boolean> {
  try {
    await access(p)
    return true
  } catch {
    return false
  }
}
