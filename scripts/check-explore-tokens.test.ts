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
  writeFileSync(join(dir, 'index.html'), '<style>.a { width: calc(100% - 288px); } .b { height: 260px; } .c { width: 208px; border-radius: var(--dimension-radius-semantic-card); } .d { width: 208px; border-radius: var(--dimension-radius-semantic-card-expanded); }</style>')
  const run = spawnSync('node', [fileURLToPath(new URL('check-explore-tokens.mjs', import.meta.url)), dir], { encoding: 'utf8' })
  expect(run.status).toBe(0)
  expect(run.stdout).not.toContain('288px is kit size')
  expect(run.stdout).not.toContain("260px")
  expect(run.stdout).toContain('width 208px is the card-expanded family (radius 40px) but border-radius is 24px')
  expect(run.stdout.match(/the .* family/g)).toHaveLength(1)
})
