import { mkdirSync, mkdtempSync, renameSync, rmSync, writeFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import { flowsOf, outsideOf } from './protos-ci'
import type { Tree } from '../src/shared/protoFolders'

// What protos.yml asks of a pull request's changed paths (`git diff --name-only`, one per line).
const CHANGED = [
  'README.md',
  'src/a.ts',
  'sub/web/protos/ana/x.tsx',
  'web/protos/CLAUDE.md',
  'web/protos/top.tsx',
  'web/protos/flow.ts',
  'web/protos/generated/tokens.md',
  'web/protos/ana/home.tsx',
  'web/protos/ana/components/X.tsx',
  'web/protos/ana/data.ts',
  'web/protos/ana/flow1/flow.ts',
  'web/protos/ana/flow.ts',
  'web/protos/ana/xflow.ts',
  'web/protos/ana2/x.tsx',
  'web/protos/bia/b.tsx',
]

describe('the folder lock', () => {
  it('lists what is not under web/protos/<designer>/, another designer whose name starts the same included', () => {
    expect(outsideOf('ana', CHANGED)).toEqual([
      'README.md',
      'src/a.ts',
      'sub/web/protos/ana/x.tsx',
      'web/protos/CLAUDE.md',
      'web/protos/top.tsx',
      'web/protos/flow.ts',
      'web/protos/generated/tokens.md',
      'web/protos/ana2/x.tsx',
      'web/protos/bia/b.tsx',
    ])
  })
  it('locks everything out for a designer that is not there, and for an empty name', () => {
    expect(outsideOf('nobody', CHANGED)).toEqual(CHANGED)
    expect(outsideOf('', ['web/protos/ana/home.tsx'])).toEqual(['web/protos/ana/home.tsx'])
  })
})

describe('the flows to play', () => {
  const tree: Tree = {
    list: (dir) =>
      ({
        'web/protos': ['ana/', 'ana2/', 'bia/'],
        'web/protos/ana': ['flow.ts', 'flow1/', 'deep/', 'home.tsx'],
        'web/protos/ana/flow1': ['flow.ts', 'a.tsx'],
        'web/protos/ana/deep': ['nested/'],
        'web/protos/ana/deep/nested': ['flow.ts'],
        'web/protos/bia': ['b.tsx'],
        'web/protos/ana2': ['x.tsx'],
      })[dir] ?? [],
    read: () => '',
  }
  it('are every flow, at any depth, of every designer folder the pull request touches', () => {
    expect(flowsOf(CHANGED.filter((p) => p.startsWith('web/protos/')), tree)).toEqual(['web/protos/ana', 'web/protos/ana/deep/nested', 'web/protos/ana/flow1'])
  })
  it('are none when the changes are not in a designer folder', () => {
    expect(flowsOf(['README.md', 'web/protos/top.tsx', 'sub/web/protos/ana/x.tsx'], tree)).toEqual([])
  })
})

describe('the command', () => {
  const dir = mkdtempSync(join(tmpdir(), 'protos-ci-'))
  afterAll(() => rmSync(dir, { recursive: true, force: true }))
  beforeEach(() => {
    rmSync(join(dir, 'web'), { recursive: true, force: true })
    mkdirSync(join(dir, 'web/protos/ana'), { recursive: true })
  })
  const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
  // From the folder of the checkout, as the workflow runs it.
  const run = (args: string[], stdin: string) =>
    spawnSync(join(ROOT, 'node_modules/.bin/vite-node'), ['--config', join(ROOT, 'vitest.config.ts'), join(ROOT, 'scripts/protos-ci.ts'), '--', ...args], {
      cwd: dir,
      input: stdin,
      encoding: 'utf8',
      env: { ...process.env, VITEST: '' },
    })

  it('reads NUL-separated paths (git diff -z) and prints screens and flows NUL-terminated, so spaces and accents survive', () => {
    mkdirSync(join(dir, 'web/protos/ana/buy'), { recursive: true })
    writeFileSync(join(dir, 'web/protos/ana/buy/flow.ts'), '')
    writeFileSync(join(dir, 'web/protos/ana/ação final.tsx'), '<Screen />')
    const paths = 'web/protos/ana/ação final.tsx\0docs/é.md\0'
    expect(run(['screens'], paths)).toMatchObject({ status: 0, stdout: 'web/protos/ana/ação final.tsx\0web/protos/ana/buy/flow.ts\0' })
    expect(run(['outside', 'ana'], paths)).toMatchObject({ status: 0, stdout: 'docs/é.md\n' })
    expect(run(['flows'], paths)).toMatchObject({ status: 0, stdout: 'web/protos/ana/buy\0' })
  }, 60_000)
  it('reads the changed paths on stdin and prints the answer', () => {
    mkdirSync(join(dir, 'web/protos/ana/buy'), { recursive: true })
    writeFileSync(join(dir, 'web/protos/ana/buy/flow.ts'), '')
    writeFileSync(join(dir, 'web/protos/ana/buy/cart.tsx'), '<Screen />')
    const paths = 'src/a.ts\0web/protos/ana/buy/cart.tsx\0web/protos/ana/data.ts\0'
    expect(run(['outside', 'ana'], paths)).toMatchObject({ status: 0, stdout: 'src/a.ts\n' })
    expect(run(['screens'], paths)).toMatchObject({ status: 0, stdout: 'web/protos/ana/buy/cart.tsx\0web/protos/ana/buy/flow.ts\0' })
    expect(run(['flows'], paths)).toMatchObject({ status: 0, stdout: 'web/protos/ana/buy\0' })
    expect(run(['screens'], '')).toMatchObject({ status: 0, stdout: '' })
  }, 60_000)
  it.each(['web/protos/ana/data.ts', 'web/protos/ana/data.json', 'web/protos/ana/components/Pick.tsx'])('expands %s through the real stdin command', (changed) => {
    mkdirSync(join(dir, 'web/protos/bia'), { recursive: true })
    writeFileSync(join(dir, 'web/protos/ana/home.tsx'), '<Screen />')
    writeFileSync(join(dir, 'web/protos/bia/home.tsx'), '<Screen />')
    expect(run(['screens'], changed + '\0')).toMatchObject({ status: 0, stdout: 'web/protos/ana/home.tsx\0' })
  }, 60_000)

  it.each(['src/ui-kit/Screen.tsx', 'tokens/tokens.json', 'src/shared/design-system/rules.ts', 'scripts/check-laws.ts'])('checks every prototype for shared change %s', (changed) => {
    mkdirSync(join(dir, 'web/protos/bia/buy'), { recursive: true })
    writeFileSync(join(dir, 'web/protos/ana/home.tsx'), '<Screen />')
    writeFileSync(join(dir, 'web/protos/bia/buy/flow.ts'), '')
    writeFileSync(join(dir, 'web/protos/bia/buy/cart.tsx'), '<Screen />')
    expect(run(['screens'], changed + '\0')).toMatchObject({ status: 0, stdout: 'web/protos/ana/home.tsx\0web/protos/bia/buy/cart.tsx\0web/protos/bia/buy/flow.ts\0' })
    expect(run(['flows'], changed + '\0')).toMatchObject({ status: 0, stdout: 'web/protos/bia/buy\0' })
  }, 60_000)

  it.each(['delete', 'rename'])('keeps %s impact from a real Git diff, including both designer boundaries', (action) => {
    const git = (...args: string[]) => {
      const r = spawnSync('git', args, { cwd: dir, encoding: 'utf8' })
      expect(r.status, r.stderr).toBe(0)
      return r.stdout
    }
    // Reset only this isolated fixture's Git metadata between the two cases.
    rmSync(join(dir, '.git'), { recursive: true, force: true })
    mkdirSync(join(dir, 'web/protos/ana/buy'), { recursive: true })
    mkdirSync(join(dir, 'web/protos/bia'), { recursive: true })
    writeFileSync(join(dir, 'web/protos/ana/home.tsx'), '<Screen />')
    writeFileSync(join(dir, 'web/protos/ana/buy/flow.ts'), '')
    writeFileSync(join(dir, 'web/protos/ana/buy/old.tsx'), '<Screen />')
    git('init', '-q', '-b', 'main')
    git('config', 'user.email', 'test@example.test')
    git('config', 'user.name', 'Test')
    git('add', '.')
    git('commit', '-qm', 'base')
    if (action === 'delete') rmSync(join(dir, 'web/protos/ana/buy/old.tsx'))
    else renameSync(join(dir, 'web/protos/ana/buy/old.tsx'), join(dir, 'web/protos/bia/new.tsx'))
    git('add', '-A')
    const paths = git('diff', '--cached', '-z', '--name-only', '--no-renames')
    expect(paths).toContain('web/protos/ana/buy/old.tsx\0')
    const selected = run(['screens'], paths)
    expect(selected.status, selected.stderr).toBe(0)
    expect(selected.stdout).toBe('web/protos/ana/home.tsx\0' + (action === 'rename' ? 'web/protos/bia/new.tsx\0' : '') + 'web/protos/ana/buy/flow.ts\0')
    expect(run(['flows'], paths)).toMatchObject({ status: 0, stdout: 'web/protos/ana/buy\0' })
    if (action === 'rename') expect(run(['outside', 'bia'], paths).stdout).toBe('web/protos/ana/buy/old.tsx\n')
  }, 60_000)

  it('says how to call it and exits 2 when the mode is not one of the three', () => {
    expect(run(['nope'], '')).toMatchObject({ status: 2, stdout: '' })
    expect(run(['outside'], '')).toMatchObject({ status: 2, stdout: '' })
  }, 60_000)
})
