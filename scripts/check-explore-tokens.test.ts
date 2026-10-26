import { spawnSync } from 'node:child_process'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, it } from 'vitest'

it('advises on literal sizes equal or near a kit size, and still passes', () => {
  const dir = mkdtempSync(join(tmpdir(), 'explore-'))
  writeFileSync(join(dir, 'index.html'), '<style>.a { width: 288px; max-height: 200px; height: 500px; } .b { width: var(--dimension-size-semantic-icon-lg); }</style>')
  const run = spawnSync('node', [fileURLToPath(new URL('check-explore-tokens.mjs', import.meta.url)), dir], { encoding: 'utf8' })
  expect(run.status).toBe(0)
  expect(run.stdout).toContain('width: 288px is kit size content-card-width')
  expect(run.stdout).toContain('max-height: 200px is near kit size card-expanded-width (208px)')
  expect(run.stdout).not.toContain('500px')
  expect(run.stdout.trim().endsWith('ok')).toBe(true)
})

it('ignores px inside calc(), uses a 5% band, and flags a family mismatch', () => {
  const dir = mkdtempSync(join(tmpdir(), 'explore-'))
  writeFileSync(join(dir, 'index.html'), '<style>.a { width: calc(100% - 288px); } .b { height: 224px; } .c { width: 208px; border-radius: var(--dimension-radius-semantic-card); } .d { width: 208px; border-radius: var(--dimension-radius-semantic-card-expanded); }</style>')
  const run = spawnSync('node', [fileURLToPath(new URL('check-explore-tokens.mjs', import.meta.url)), dir], { encoding: 'utf8' })
  expect(run.status).toBe(0)
  expect(run.stdout).not.toContain('288px is kit size')
  expect(run.stdout).not.toContain("224px")
  expect(run.stdout).toContain('width 208px is the card-expanded family (radius 40px) but border-radius is 24px')
  expect(run.stdout.match(/the .* family/g)).toHaveLength(1)
})

it('treats a tuned option as data: spec colors and `/* tune */` values are advised, never failed', () => {
  const dir = mkdtempSync(join(tmpdir(), 'explore-'))
  writeFileSync(join(dir, 'index.html'), `<style>
/* tune:vars */
[data-option="2"] {
  --radius: 14px; /* tune */
  --bg: #112233; /* tune */
  --pad: var(--dimension-spacing-semantic-card-inset-expanded);
}
/* /tune:vars */
[data-option="2"] .card { border-radius: var(--radius); background: var(--bg); padding: var(--pad); }
</style><article data-option="2" data-tuned><script type="application/json" data-tune="2">{"folders":[{"controls":[{"value":"#3f3f3f"}]}]}</script></article>`)
  const run = spawnSync('node', [fileURLToPath(new URL('check-explore-tokens.mjs', import.meta.url)), dir], { encoding: 'utf8' })
  expect(run.status).toBe(0)
  expect(run.stdout).toContain('advisory: tuned off-token --radius: 14px')
  expect(run.stdout).toContain('advisory: tuned off-token --bg: #112233')
  expect(run.stdout).not.toContain('--pad')
  // The same literal without the marker is still a failure.
  writeFileSync(join(dir, 'index.html'), '<style>.a { background: #112233; padding: 14px; }</style>')
  const bad = spawnSync('node', [fileURLToPath(new URL('check-explore-tokens.mjs', import.meta.url)), dir], { encoding: 'utf8' })
  expect(bad.status).toBe(1)
})
