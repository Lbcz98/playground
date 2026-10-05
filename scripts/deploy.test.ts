import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { afterAll, describe, expect, it } from 'vitest'
import { branchName, changedPaths, classify, deploy, slugify, type Options } from './deploy'

describe('deploy — the pure parts', () => {
  it('reads porcelain -z, counting both ends of a rename', () => {
    expect(changedPaths(' M a.txt\0?? web/protos/ana/x.tsx\0R  new.tsx\0old.tsx\0')).toEqual(['a.txt', 'web/protos/ana/x.tsx', 'new.tsx', 'old.tsx'])
  })

  it('separates a designer’s folder from everything else', () => {
    const c = classify(['web/protos/ana/home.tsx', 'web/protos/ana/notes.md', 'src/ui-kit/Screen.tsx', 'web/protos/bia/x.tsx'])
    expect(c.designers).toEqual(['ana', 'bia'])
    expect(c.screens).toEqual(['web/protos/ana/home.tsx', 'web/protos/bia/x.tsx'])
    expect(c.outside).toEqual(['src/ui-kit/Screen.tsx'])
  })

  it('makes a branch name from words and the time', () => {
    expect(slugify('Tela de Início — nível 1!')).toBe('tela-de-inicio-nivel-1')
    expect(slugify('???')).toBe('tela')
    expect(branchName('ana', 'home', new Date('2026-10-05T12:30:00Z'))).toBe('proto/ana/home-20261005-1230')
  })
})

// A real repository with a real remote, and a `gh` that records what it was asked.
const ORIGINAL_PATH = process.env.PATH!
const tmp = mkdtempSync(join(tmpdir(), 'deploy-test-'))
afterAll(() => {
  process.env.PATH = ORIGINAL_PATH
  rmSync(tmp, { recursive: true, force: true })
})

const run = (cwd: string, cmd: string, ...args: string[]) => {
  const r = spawnSync(cmd, args, { cwd, encoding: 'utf8' })
  if (r.status !== 0) throw new Error(`${cmd} ${args.join(' ')}: ${r.stderr}`)
  return r.stdout.trim()
}

let n = 0
function fixture(ciJson = '[{"name":"protos","state":"SUCCESS","link":"http://ci/1"}]') {
  const dir = join(tmp, String(++n))
  const remote = join(dir, 'remote.git')
  const work = join(dir, 'work')
  const bin = join(dir, 'bin')
  mkdirSync(bin, { recursive: true })
  run(dir, 'git', 'init', '-q', '--bare', '-b', 'main', remote)
  run(dir, 'git', 'clone', '-q', remote, work)
  for (const [k, v] of [['user.email', 't@t'], ['user.name', 'T']]) run(work, 'git', 'config', k, v)
  mkdirSync(join(work, 'web/protos/ana'), { recursive: true })
  mkdirSync(join(work, 'src'), { recursive: true })
  writeFileSync(join(work, 'web/protos/ana/first.tsx'), 'export default 1\n')
  writeFileSync(join(work, 'src/kit.ts'), 'export {}\n')
  run(work, 'git', 'add', '-A')
  run(work, 'git', 'commit', '-q', '-m', 'init')
  run(work, 'git', 'push', '-q', 'origin', 'main')
  const calls = join(dir, 'gh-calls.txt')
  const made = join(dir, 'pr-made')
  writeFileSync(
    join(bin, 'gh'),
    `#!/bin/sh
echo "$@" >> "${calls}"
case "$1 $2" in
  "auth status") exit 0 ;;
  "pr view") [ -f "${made}" ] && echo "https://github.com/o/r/pull/7" && exit 0; exit 1 ;;
  "pr create") touch "${made}"; echo "https://github.com/o/r/pull/7" ;;
  "pr checks") echo '${ciJson}' ;;
esac
`,
  )
  chmodSync(join(bin, 'gh'), 0o755)
  process.env.PATH = `${bin}:${ORIGINAL_PATH}`
  const options = (extra: Partial<Options> = {}): Options => ({
    root: work,
    base: 'main',
    wait: true,
    ciPollMs: 0,
    ciTimeoutMs: 1000,
    checks: () => ({ ok: true, output: '' }),
    now: new Date('2026-10-05T12:30:00Z'),
    ...extra,
  })
  return { work, remote, calls, options }
}

const write = (work: string, path: string, body = 'export default 2\n') => {
  mkdirSync(join(work, path, '..'), { recursive: true })
  writeFileSync(join(work, path), body)
}

describe('deploy — against a real repository', () => {
  it('puts the designer’s screen on its own branch, pushes it and opens a PR', () => {
    const f = fixture()
    write(f.work, 'web/protos/ana/home.tsx')
    const out = deploy(f.options({ message: 'Tela de início' }))
    expect(out).toMatchObject({ ok: true, created: true, ci: 'passed', pr: 'https://github.com/o/r/pull/7', branch: 'proto/ana/tela-de-inicio-20261005-1230' })
    // pushed, with exactly the screen, and main untouched
    expect(run(f.remote, 'git', 'branch', '--list')).toContain('proto/ana/tela-de-inicio-20261005-1230')
    expect(run(f.remote, 'git', 'show', '--stat', '--format=%s', 'proto/ana/tela-de-inicio-20261005-1230')).toContain('web/protos/ana/home.tsx')
    expect(run(f.remote, 'git', 'log', '--format=%s', 'main')).toBe('init')
    expect(readFileSync(f.calls, 'utf8')).toMatch(/pr create --base main --head proto\/ana\/tela-de-inicio-20261005-1230/)
  })

  it('stops, before any branch, on a change outside the designer’s folder', () => {
    const f = fixture()
    write(f.work, 'web/protos/ana/home.tsx')
    write(f.work, 'src/kit.ts', 'export const x = 1\n')
    const out = deploy(f.options())
    expect(out).toMatchObject({ ok: false, stage: 'changes' })
    expect(out.ok === false && out.reason).toContain('src/kit.ts')
    expect(run(f.work, 'git', 'rev-parse', '--abbrev-ref', 'HEAD')).toBe('main')
  })

  it('refuses two designers at once, and a name that is not the one that changed', () => {
    const f = fixture()
    write(f.work, 'web/protos/ana/a.tsx')
    write(f.work, 'web/protos/bia/b.tsx')
    expect(deploy(f.options())).toMatchObject({ ok: false, stage: 'changes' })
    rmSync(join(f.work, 'web/protos/bia'), { recursive: true })
    expect(deploy(f.options({ designer: 'bia' }))).toMatchObject({ ok: false, stage: 'changes' })
  })

  it('does not commit when the laws fail, and says what failed', () => {
    const f = fixture()
    write(f.work, 'web/protos/ana/home.tsx')
    const out = deploy(f.options({ checks: () => ({ ok: false, output: 'home.tsx  focus.single: two focused' }) }))
    expect(out).toMatchObject({ ok: false, stage: 'checks', reason: 'home.tsx  focus.single: two focused' })
    expect(run(f.work, 'git', 'rev-parse', '--abbrev-ref', 'HEAD')).toBe('main')
    expect(run(f.work, 'git', 'log', '--format=%s')).toBe('init')
  })

  it('says there is nothing to publish', () => {
    const f = fixture()
    expect(deploy(f.options())).toMatchObject({ ok: false, stage: 'changes', reason: 'Não há nada para publicar.' })
  })

  it('a second deploy from the designer’s branch updates the same PR', () => {
    const f = fixture()
    write(f.work, 'web/protos/ana/home.tsx')
    const first = deploy(f.options({ message: 'home' }))
    expect(first.ok && first.created).toBe(true)
    write(f.work, 'web/protos/ana/home.tsx', 'export default 3\n')
    const second = deploy(f.options({ message: 'ajuste' }))
    expect(second).toMatchObject({ ok: true, created: false, branch: first.ok ? first.branch : '' })
    expect(readFileSync(f.calls, 'utf8').match(/pr create/g)).toHaveLength(1)
  })

  it('reports a failing CI with the check that failed', () => {
    const f = fixture('[{"name":"protos","state":"FAILURE","link":"http://ci/9"}]')
    write(f.work, 'web/protos/ana/home.tsx')
    const out = deploy(f.options())
    expect(out).toMatchObject({ ok: true, ci: 'failed' })
    expect(out.ok && out.ciDetail).toContain('http://ci/9')
  })

  it('does not wait for CI with --no-wait', () => {
    const f = fixture()
    write(f.work, 'web/protos/ana/home.tsx')
    expect(deploy(f.options({ wait: false }))).toMatchObject({ ok: true, ci: 'skipped' })
    expect(existsSync(f.calls)).toBe(true)
  })
})
