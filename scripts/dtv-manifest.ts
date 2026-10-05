/**
 * The DTV design system as a manifest — the one `npm run dtv:export` writes to
 * `dist-dtv/dtv-storybook.json`, re-imported the way the app does it. Built on demand
 * (about 15s) when the export is not there yet.
 */
import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { DesignSystemManifest } from '../src/shared/design-system/manifest'
import { parseStorybookDocgenWithReport } from '../src/shared/design-system/storybook-adapter'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const FILE = join(ROOT, 'dist-dtv', 'dtv-storybook.json')

let cached: DesignSystemManifest | undefined

export function loadDtvManifest(): DesignSystemManifest {
  if (cached) return cached
  if (!existsSync(FILE)) {
    const run = spawnSync('npm', ['run', 'dtv:export'], { cwd: ROOT, stdio: ['ignore', 'ignore', 'inherit'] })
    if (run.status !== 0 || !existsSync(FILE)) throw new Error('npm run dtv:export failed — the DTV manifest is not available.')
  }
  cached = parseStorybookDocgenWithReport(JSON.parse(readFileSync(FILE, 'utf8')), { id: 'dtv', name: 'DTV' }).manifest
  return cached
}
