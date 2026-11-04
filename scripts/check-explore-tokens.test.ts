import { spawnSync } from 'node:child_process'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, it } from 'vitest'

it('advises on literal sizes equal or near a kit size, and still passes', () => {
  const dir = mkdtempSync(join(tmpdir(), 'explore-'))
  writeFileSync(join(dir, 'index.html'), '<style>.a { width: 288px; max-height: 210px; height: 500px; } .b { width: var(--dimension-size-semantic-icon-lg); }</style>')
  const run = spawnSync('node', [fileURLToPath(new URL('check-explore-tokens.mjs', import.meta.url)), dir], { encoding: 'utf8' })
  expect(run.status).toBe(0)
  expect(run.stdout).toContain('width: 288px is kit size content-card-width')
  expect(run.stdout).toContain('max-height: 210px is near kit size card-expanded-width (208px)')
  expect(run.stdout).not.toContain('500px')
  expect(run.stdout.trim().endsWith('ok')).toBe(true)
})

it('ignores px inside calc(), uses a 5% band, and flags a family mismatch', () => {
  const dir = mkdtempSync(join(tmpdir(), 'explore-'))
  writeFileSync(join(dir, 'index.html'), '<style>.a { width: calc(100% - 288px); } .b { height: 224px; } .c { width: 208px; border-radius: var(--dimension-radius-semantic-pill); } .d { width: 208px; border-radius: var(--dimension-radius-semantic-card-expanded); }</style>')
  const run = spawnSync('node', [fileURLToPath(new URL('check-explore-tokens.mjs', import.meta.url)), dir], { encoding: 'utf8' })
  expect(run.status).toBe(0)
  expect(run.stdout).not.toContain('288px is kit size')
  expect(run.stdout).not.toContain("224px")
  expect(run.stdout).toContain('width 208px is the card-expanded family (radius 40px) but border-radius is 100px')
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

it('names the allowed token for a literal, a retyped value, an unknown var, and a banned token', () => {
  const dir = mkdtempSync(join(tmpdir(), 'explore-'))
  writeFileSync(join(dir, 'index.html'), `<style>
:root {
  --pad: 14px;
  --color-semantic-functional-text-primary: #eeeeee;
}
.a {
  padding: var(--pad);
  background: #112233;
  color: #000;
  font-size: 10px;
  font-weight: 800;
}
.b { color: var(--color-semantic-functional-text-inverse); font-size: var(--typography-font-size-xs); font-weight: var(--typography-font-weight-extra-bold); }
.c { color: var(--color-semantic-functional-text-primry); }
</style>
<p class="text-caption-bold text-body-sm-extra-bold">Oi</p>`)
  const run = spawnSync('node', [fileURLToPath(new URL('check-explore-tokens.mjs', import.meta.url)), dir], { encoding: 'utf8' })
  expect(run.status).toBe(1)
  const err = run.stderr
  expect(err).toContain('--color-semantic-functional-text-inverse is banned on TV (pure black #000000); use --color-semantic-functional-background-primary')
  expect(err).toContain('--typography-font-size-xs is banned on TV (min readable size); use --typography-font-size-sm')
  expect(err).toContain('--typography-font-weight-extra-bold is banned on TV (three weights only: regular, medium, bold); use --typography-font-weight-bold')
  expect(err).toContain('font-size: 10px is banned on TV (min readable size); use --typography-font-size-sm')
  expect(err).toContain('font-weight: 800 is banned on TV (three weights only: regular, medium, bold); use --typography-font-weight-bold')
  expect(err).toContain('.text-caption-bold is banned on TV (min readable size); use .text-footnote-bold for a secondary label, or .text-body-sm-bold otherwise')
  expect(err).toContain('.text-body-sm-extra-bold is banned on TV (three weights only: regular, medium, bold); use .text-body-sm-bold')
  expect(err).toContain('literal color #000: use var(--color-semantic-functional-background-primary)')
  expect(err).toMatch(/literal color #112233: use var\(--color-/)
  expect(err).toContain(':root redeclares --color-semantic-functional-text-primary: use var(--color-semantic-functional-text-primary)')
  expect(err).toContain(':root redeclares --pad: use var(--dimension-spacing-core-sm)')
  expect(err).toContain('var(--color-semantic-functional-text-primry) is not a kit token; use var(--color-semantic-functional-text-primary)')
  expect(err).not.toContain('--color-semantic-*')
})

it('stays fast on a page the size of a finished exploration (a backtracking regex once took 25 s on 250 KB)', () => {
  const dir = mkdtempSync(join(tmpdir(), 'explore-'))
  const rules = Array.from({ length: 2500 }, (_, i) => `[data-option="${(i % 4) + 1}"] .piece-${i} { display: block; width: 40%; padding: var(--dimension-spacing-core-sm); color: var(--color-semantic-functional-text-primary); }`).join('\n')
  writeFileSync(join(dir, 'index.html'), `<style>\n${rules}\n</style>${'<div class="x">texto</div>'.repeat(9000)}`)
  const start = Date.now()
  const run = spawnSync('node', [fileURLToPath(new URL('check-explore-tokens.mjs', import.meta.url)), dir], { encoding: 'utf8' })
  expect(run.status).toBe(0)
  expect(Date.now() - start).toBeLessThan(5000)
})
