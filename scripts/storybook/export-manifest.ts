/**
 * `npm run storybook:manifest` — builds Storybook (test mode, into a temp dir),
 * reads `index.json` + `manifests/components.json`, and writes the normalized
 * snapshot to tests/storybook/manifest.snapshot.json. The catalog parity tests
 * (`src/shared/design-system/catalog-storybook-parity.test.ts`) diff catalog.ts
 * against that file, so `npm test` never has to build Storybook.
 *
 * `npm run storybook:manifest:check` (`--check`) writes nothing and exits 1 when
 * the committed snapshot has drifted from what Storybook documents now.
 *
 * `--from=<dir>` reads an existing build instead of building one.
 */
import { spawnSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync, mkdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { snapshotFromStorybook } from '../../src/shared/design-system/storybook-components-manifest'

export const SNAPSHOT_PATH = 'tests/storybook/manifest.snapshot.json'

const ROOT = fileURLToPath(new URL('../..', import.meta.url))
const check = process.argv.includes('--check')
const from = process.argv.find((arg) => arg.startsWith('--from='))?.slice('--from='.length)

function build(): string {
  const out = mkdtempSync(join(tmpdir(), 'sfs-storybook-'))
  const bin = join(ROOT, 'node_modules', '.bin', 'storybook')
  const result = spawnSync(bin, ['build', '--test', '--quiet', '-o', out], { cwd: ROOT, stdio: ['ignore', 'ignore', 'inherit'] })
  if (result.status !== 0) {
    rmSync(out, { recursive: true, force: true })
    console.error('storybook build failed.')
    process.exit(1)
  }
  return out
}

const dir = from ?? build()
try {
  const index = JSON.parse(readFileSync(join(dir, 'index.json'), 'utf8'))
  const manifest = JSON.parse(readFileSync(join(dir, 'manifests', 'components.json'), 'utf8'))
  const next = `${JSON.stringify(snapshotFromStorybook(index, manifest), null, 2)}\n`

  const file = join(ROOT, SNAPSHOT_PATH)
  let current = ''
  try {
    current = readFileSync(file, 'utf8')
  } catch {
    // Missing counts as stale.
  }

  if (check) {
    if (current !== next) {
      console.error(`Stale Storybook snapshot — run \`npm run storybook:manifest\`:\n  ${SNAPSHOT_PATH}`)
      process.exit(1)
    }
    console.log('Storybook snapshot is up to date.')
  } else if (current === next) {
    console.log('Storybook snapshot already up to date.')
  } else {
    mkdirSync(dirname(file), { recursive: true })
    writeFileSync(file, next)
    console.log(`Wrote ${SNAPSHOT_PATH}`)
  }
} finally {
  if (!from) rmSync(dir, { recursive: true, force: true })
}
