/**
 * `npm run export:tsx -- <template-id|all> [--out=<dir>]` — the handoff exporter on the
 * DTV reference screens (`scripts/storybook/dtv-templates.ts`, in the kit's own names).
 *
 * Without `--out` it prints the file; with it, writes `<id>.tsx` per template.
 * The same function turns any validated Blueprint into code (`exportBlueprintToTsx`).
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import type { BlueprintDocument } from '../src/shared/blueprint'
import { exportBlueprintToTsx } from '../src/shared/export/toTsx'
import { DTV_TEMPLATES } from './storybook/dtv-templates'

const args = process.argv.slice(2).filter((arg) => arg !== '--')
const out = args.find((arg) => arg.startsWith('--out='))?.slice('--out='.length)
const wanted = args.find((arg) => !arg.startsWith('--')) ?? 'all'

const templates = wanted === 'all' ? DTV_TEMPLATES : DTV_TEMPLATES.filter((t) => t.id === wanted)
if (templates.length === 0) {
  console.error(`No template "${wanted}". Known: ${DTV_TEMPLATES.map((t) => t.id).join(', ')}`)
  process.exit(1)
}

if (out) mkdirSync(out, { recursive: true })
for (const template of templates) {
  // A document that names itself (a flow's first screen) keeps its own name; the rest take the template's.
  const blueprint = template.blueprint as BlueprintDocument
  const { code } = exportBlueprintToTsx(blueprint, {
    componentName: blueprint.name ? undefined : template.name,
  })
  if (out) {
    const file = join(out, `${template.id}.tsx`)
    writeFileSync(file, code)
    console.log(`wrote ${file}`)
  } else {
    console.log(`// ===== ${template.id} =====\n${code}`)
  }
}
