/**
 * The pre-delivery render check of the blueprint pipeline: the validated Blueprint is
 * exported to TSX, painted in a headless Chromium (`render-audit.ts`) and read by the
 * same `auditRender` the canvas runs. What it finds goes back to the generator
 * (`setRenderCheck` in `electron/ai/ai-orchestrator.ts`) before the screen is handed over.
 *
 * It paints through the DTV kit, so it applies to the DTV manifest only; for any other
 * manifest it throws (the orchestrator logs "render check did not run" and delivers the
 * validated screen — the canvas still audits it after the paint).
 */
import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { BlueprintDocument } from '../src/shared/blueprint'
import type { DesignSystemManifest } from '../src/shared/design-system/manifest'
import type { RenderCheck } from '../electron/ai/ai-orchestrator'
import { exportBlueprintToTsx } from '../src/shared/export/toTsx'
import type { RenderIssue } from '../src/shared/layout/renderAudit'
import { renderAuditFiles } from './render-audit'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
/** Inside the repo so `@/…` and the kit resolve; git-ignored. */
const TMP = join(ROOT, '.render-check')

let counter = 0

export const dtvRenderCheck: RenderCheck = async (blueprint: unknown, manifest: DesignSystemManifest): Promise<RenderIssue[]> => {
  if (manifest.id !== 'dtv') throw new Error(`the render check paints the DTV kit; "${manifest.id}" is not it`)
  const doc = blueprint as BlueprintDocument
  const entries = [{ spec: doc.screen, root: doc.root, name: doc.name }, ...(doc.screens ?? []).map((s) => ({ spec: s.screen, root: s.root, name: s.name ?? s.id }))]
  const dir = join(TMP, String(process.pid), String(++counter))
  mkdirSync(dir, { recursive: true })
  try {
    // One file per screen: the harness paints a file's default export.
    const files = entries.map((entry, i) => {
      const { code } = exportBlueprintToTsx({ version: 1, name: entry.name ?? `Screen${i + 1}`, screen: entry.spec, root: entry.root } as BlueprintDocument)
      const file = join(dir, `s${i + 1}.tsx`)
      writeFileSync(file, code)
      return file
    })
    const results = await renderAuditFiles(files)
    const issues: RenderIssue[] = []
    results.forEach((r, i) => {
      if (r.error) throw new Error(`screen ${i + 1} did not paint: ${r.error}`)
      const prefix = entries.length > 1 ? `Screen ${i + 1}: ` : ''
      issues.push(...r.issues.map((issue) => ({ ...issue, message: prefix + issue.message })))
    })
    return issues
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
}
