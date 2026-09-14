/**
 * Design-system persistence — Electron main process (spec §9).
 *
 * Imported `DesignSystemManifest`s are stored as individual JSON files under
 * `app.getPath('userData')/design-systems/`. A sibling `meta.json` remembers the
 * last active system id so the user doesn't re-select it every launch.
 *
 * Every read is validated with `manifestZodSchema`; corrupt files are skipped,
 * not fatal. Ids are sanitised before they touch the filesystem.
 *
 * Phase 8A: a system may also have a `<id>.bundle.js` sibling — a live
 * component bundle, served to the renderer ONLY via the `design-system://`
 * protocol (`protocol.ts`), and only for an id that already has a manifest.
 */

import { promises as fs } from 'node:fs'
import path from 'node:path'
import { app } from 'electron'
import { manifestZodSchema, type DesignSystemManifest } from '@/shared/design-system/manifest'

const DIR_NAME = 'design-systems'
const META_FILE = 'meta.json'

/** Exported so `protocol.ts` can serve exactly the same files this module writes. */
export function designSystemsDir(): string {
  return path.join(app.getPath('userData'), DIR_NAME)
}

function dir(): string {
  return designSystemsDir()
}

function metaPath(): string {
  return path.join(dir(), META_FILE)
}

/** Filesystem-safe id (defence in depth — the schema already bounds length). */
export function safeId(id: string): string {
  const cleaned = id.replace(/[^a-zA-Z0-9._-]/g, '_').replace(/^\.+/, '_').slice(0, 120)
  if (!cleaned) throw new Error('Empty design-system id')
  return cleaned
}

async function ensureDir(): Promise<void> {
  await fs.mkdir(dir(), { recursive: true })
}

async function exists(p: string): Promise<boolean> {
  try {
    await fs.access(p)
    return true
  } catch {
    return false
  }
}

export async function listDesignSystems(): Promise<DesignSystemManifest[]> {
  await ensureDir()
  let files: string[]
  try {
    files = await fs.readdir(dir())
  } catch {
    return []
  }

  const manifests: DesignSystemManifest[] = []
  for (const file of files) {
    if (!file.endsWith('.json') || file === META_FILE) continue
    try {
      const raw = JSON.parse(await fs.readFile(path.join(dir(), file), 'utf8'))
      const parsed = manifestZodSchema.safeParse(raw)
      if (parsed.success) manifests.push(parsed.data)
      else console.warn(`[storage] ignoring invalid design system: ${file}`)
    } catch (err) {
      console.warn(`[storage] failed to read ${file}:`, err)
    }
  }
  return manifests
}

export async function saveDesignSystem(rawManifest: unknown): Promise<DesignSystemManifest> {
  const manifest = manifestZodSchema.parse(rawManifest)
  await ensureDir()
  await fs.writeFile(
    path.join(dir(), `${safeId(manifest.id)}.json`),
    JSON.stringify(manifest, null, 2),
    'utf8',
  )
  return manifest
}

export async function deleteDesignSystem(id: unknown): Promise<void> {
  if (typeof id !== 'string' || !id) return
  const cleanId = safeId(id)
  await fs.rm(path.join(dir(), `${cleanId}.json`), { force: true })
  await fs.rm(path.join(dir(), `${cleanId}.bundle.js`), { force: true })
}

// ---------------------------------------------------------------------------
// Live component bundles (Phase 8A) — one `<id>.bundle.js` sibling per manifest
// that opted in. Never served for an id that doesn't already have a persisted
// manifest — see `protocol.ts`, which is the only thing that reads this file.
// ---------------------------------------------------------------------------

const MAX_BUNDLE_BYTES = 2 * 1024 * 1024

export async function saveBundle(id: unknown, code: unknown): Promise<void> {
  if (typeof id !== 'string' || !id) throw new Error('Missing design-system id')
  if (typeof code !== 'string' || code.trim().length === 0) {
    throw new Error('Bundle must be non-empty JavaScript source')
  }
  if (Buffer.byteLength(code, 'utf8') > MAX_BUNDLE_BYTES) {
    throw new Error(`Bundle exceeds the ${MAX_BUNDLE_BYTES / (1024 * 1024)} MB limit`)
  }

  const cleanId = safeId(id)
  // Defence in depth: a bundle can only be attached to a system that was
  // already legitimately imported — never staged ahead of a manifest.
  if (!(await exists(path.join(dir(), `${cleanId}.json`)))) {
    throw new Error(`No imported design system with id "${id}" — import its components first`)
  }

  await ensureDir()
  await fs.writeFile(path.join(dir(), `${cleanId}.bundle.js`), code, 'utf8')
}

export async function hasBundle(id: unknown): Promise<boolean> {
  if (typeof id !== 'string' || !id) return false
  return exists(path.join(dir(), `${safeId(id)}.bundle.js`))
}

async function readMeta(): Promise<{ activeId?: string }> {
  try {
    const parsed = JSON.parse(await fs.readFile(metaPath(), 'utf8'))
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

export async function getActiveDesignSystemId(): Promise<string | null> {
  const meta = await readMeta()
  return typeof meta.activeId === 'string' ? meta.activeId : null
}

export async function setActiveDesignSystemId(id: unknown): Promise<void> {
  if (typeof id !== 'string' || !id) return
  await ensureDir()
  await fs.writeFile(metaPath(), JSON.stringify({ activeId: id.slice(0, 120) }), 'utf8')
}
