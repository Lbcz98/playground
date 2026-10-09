import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterAll, describe, expect, it } from 'vitest'
import { flowsOf, outsideOf, screensOf } from './protos-ci'
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

describe('the changed screens', () => {
  it('are the .tsx and flow.ts of a designer folder, none of the rest', () => {
    expect(screensOf(CHANGED)).toEqual([
      'web/protos/ana/home.tsx',
      'web/protos/ana/components/X.tsx',
      'web/protos/ana/flow1/flow.ts',
      'web/protos/ana/flow.ts',
      'web/protos/ana2/x.tsx',
      'web/protos/bia/b.tsx',
    ])
  })
})

describe('the flows to play', () => {
  const tree: Tree = {
    list: (dir) =>
      ({
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
    expect(flowsOf(CHANGED, tree)).toEqual(['web/protos/ana', 'web/protos/ana/deep/nested', 'web/protos/ana/flow1'])
  })
  it('are none when the changes are not in a designer folder', () => {
    expect(flowsOf(['README.md', 'web/protos/top.tsx', 'sub/web/protos/ana/x.tsx'], tree)).toEqual([])
  })
})

describe('the command', () => {
  const dir = mkdtempSync(join(tmpdir(), 'protos-ci-'))
  afterAll(() => rmSync(dir, { recursive: true, force: true }))
  const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
  // From the folder of the checkout, as the workflow runs it.
  const run = (args: string[], stdin: string) =>
    spawnSync(join(ROOT, 'node_modules/.bin/vite-node'), ['--config', join(ROOT, 'vitest.config.ts'), join(ROOT, 'scripts/protos-ci.ts'), '--', ...args], {
      cwd: dir,
      input: stdin,
      encoding: 'utf8',
      env: { ...process.env, VITEST: '' },
    })

  it('reads the changed paths on stdin and prints the answer, one per line', () => {
    mkdirSync(join(dir, 'web/protos/ana/buy'), { recursive: true })
    writeFileSync(join(dir, 'web/protos/ana/buy/flow.ts'), '')
    const paths = 'src/a.ts\nweb/protos/ana/buy/cart.tsx\nweb/protos/ana/data.ts\n'
    expect(run(['outside', 'ana'], paths)).toMatchObject({ status: 0, stdout: 'src/a.ts\n' })
    expect(run(['screens'], paths)).toMatchObject({ status: 0, stdout: 'web/protos/ana/buy/cart.tsx\n' })
    expect(run(['flows'], paths)).toMatchObject({ status: 0, stdout: 'web/protos/ana/buy\n' })
    expect(run(['screens'], '')).toMatchObject({ status: 0, stdout: '' })
  }, 60_000)
  it('says how to call it and exits 2 when the mode is not one of the three', () => {
    expect(run(['nope'], '')).toMatchObject({ status: 2, stdout: '' })
    expect(run(['outside'], '')).toMatchObject({ status: 2, stdout: '' })
  }, 60_000)
})
