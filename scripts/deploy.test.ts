import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, relative } from 'node:path'
import { spawnSync } from 'node:child_process'
import { afterAll, describe, expect, it } from 'vitest'
import { branchName, changedPaths, classify, defaultChecks, deploy, slugify, type Options } from './deploy'
import { type Tree } from '../src/shared/protoFolders'
import { CASES } from '../tests/checks/corpus/cases'
import { cleanCorpus, writeCase } from '../tests/checks/run'

describe('deploy — the pure parts', () => {
  it('reads porcelain -z, counting both ends of a rename', () => {
    expect(changedPaths(' M a.txt\0?? web/protos/ana/x.tsx\0R  new.tsx\0old.tsx\0')).toEqual(['a.txt', 'web/protos/ana/x.tsx', 'new.tsx', 'old.tsx'])
  })

  it('separates a designer’s folder from everything else', () => {
    const tree: Tree = { list: (p) => ({ 'web/protos': ['ana/', 'bia/'], 'web/protos/ana': ['home.tsx'], 'web/protos/bia': ['x.tsx'] })[p] ?? [], read: () => '<Screen />' }
    const c = classify(['web/protos/ana/home.tsx', 'web/protos/ana/notes.md', 'src/ui-kit/Screen.tsx', 'web/protos/bia/x.tsx'], tree)
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
  const failPr = join(dir, 'fail-pr')
  const closed = join(dir, 'pr-closed')
  writeFileSync(
    join(bin, 'gh'),
    `#!/bin/sh
echo "$@" >> "${calls}"
case "$1 $2" in
  "auth status") exit 0 ;;
  "pr list") [ -f "${made}" ] && [ ! -f "${closed}" ] && echo '[{"url":"https://github.com/o/r/pull/7"}]' && exit 0; echo '[]' ;;
  "pr create") [ -f "${failPr}" ] && echo "fake PR failure" >&2 && exit 1; touch "${made}"; echo "https://github.com/o/r/pull/7" ;;
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
  return { work, remote, calls, options, made, failPr, closed }
}

const write = (work: string, path: string, body = 'export default 2\n') => {
  mkdirSync(join(work, path, '..'), { recursive: true })
  writeFileSync(join(work, path), body)
}

describe('deploy — against a real repository', () => {
  it('puts the designer’s screen on its own branch, pushes it and opens a PR', async () => {
    const f = fixture()
    write(f.work, 'web/protos/ana/home.tsx')
    const out = await deploy(f.options({ message: 'Tela de início' }))
    expect(out).toMatchObject({ ok: true, created: true, ci: 'passed', pr: 'https://github.com/o/r/pull/7', branch: 'proto/ana/tela-de-inicio-20261005-1230' })
    // pushed, with exactly the screen, and main untouched
    expect(run(f.remote, 'git', 'branch', '--list')).toContain('proto/ana/tela-de-inicio-20261005-1230')
    expect(run(f.remote, 'git', 'show', '--stat', '--format=%s', 'proto/ana/tela-de-inicio-20261005-1230')).toContain('web/protos/ana/home.tsx')
    expect(run(f.remote, 'git', 'log', '--format=%s', 'main')).toBe('init')
    expect(readFileSync(f.calls, 'utf8')).toMatch(/pr create --base main --head proto\/ana\/tela-de-inicio-20261005-1230/)
  })

  it('stops, before any branch, on a change outside the designer’s folder', async () => {
    const f = fixture()
    write(f.work, 'web/protos/ana/home.tsx')
    write(f.work, 'src/kit.ts', 'export const x = 1\n')
    const out = await deploy(f.options())
    expect(out).toMatchObject({ ok: false, stage: 'changes' })
    expect(out.ok === false && out.reason).toContain('src/kit.ts')
    expect(run(f.work, 'git', 'rev-parse', '--abbrev-ref', 'HEAD')).toBe('main')
  })

  it('refuses two designers at once, and a name that is not the one that changed', async () => {
    const f = fixture()
    write(f.work, 'web/protos/ana/a.tsx')
    write(f.work, 'web/protos/bia/b.tsx')
    expect(await deploy(f.options())).toMatchObject({ ok: false, stage: 'changes' })
    rmSync(join(f.work, 'web/protos/bia'), { recursive: true })
    expect(await deploy(f.options({ designer: 'bia' }))).toMatchObject({ ok: false, stage: 'changes' })
  })

  it('does not commit when the laws fail, and says what failed', async () => {
    const f = fixture()
    write(f.work, 'web/protos/ana/home.tsx')
    const out = await deploy(f.options({ checks: () => ({ ok: false, output: 'home.tsx  focus.single: two focused' }) }))
    expect(out).toMatchObject({ ok: false, stage: 'checks', reason: 'home.tsx  focus.single: two focused' })
    expect(run(f.work, 'git', 'rev-parse', '--abbrev-ref', 'HEAD')).toBe('main')
    expect(run(f.work, 'git', 'log', '--format=%s')).toBe('init')
  })

  it('says there is nothing to publish', async () => {
    const f = fixture()
    expect(await deploy(f.options())).toMatchObject({ ok: false, stage: 'changes', reason: 'Não há nada para publicar.' })
  })

  it('a second deploy from the designer’s branch updates the same PR', async () => {
    const f = fixture()
    write(f.work, 'web/protos/ana/home.tsx')
    const first = await deploy(f.options({ message: 'home' }))
    expect(first.ok && first.created).toBe(true)
    write(f.work, 'web/protos/ana/home.tsx', 'export default 3\n')
    const second = await deploy(f.options({ message: 'ajuste' }))
    expect(second).toMatchObject({ ok: true, created: false, branch: first.ok ? first.branch : '' })
    expect(readFileSync(f.calls, 'utf8').match(/pr create/g)).toHaveLength(1)
  })

  it.each(['push', 'pr'] as const)('resumes a clean branch after %s failed, revalidating without another commit', async (stage) => {
    const f = fixture()
    const hook = join(f.remote, 'hooks/pre-receive')
    if (stage === 'push') {
      writeFileSync(hook, '#!/bin/sh\nexit 1\n')
      chmodSync(hook, 0o755)
    } else writeFileSync(f.failPr, '')
    write(f.work, 'web/protos/ana/home.tsx', '<Screen />')
    const first = await deploy(f.options({ wait: false }))
    expect(first).toMatchObject({ ok: false, stage })
    const head = run(f.work, 'git', 'rev-parse', 'HEAD')
    expect(run(f.work, 'git', 'status', '--porcelain')).toBe('')
    if (stage === 'push') rmSync(hook)
    else rmSync(f.failPr)
    const checked: string[][] = []
    const retry = await deploy(f.options({ wait: false, checks: (files) => {
      checked.push(files)
      return { ok: true, output: '' }
    } }))
    expect(retry).toMatchObject({ ok: true, created: true })
    expect(checked).toEqual([['web/protos/ana/home.tsx']])
    expect(run(f.work, 'git', 'rev-parse', 'HEAD')).toBe(head)
    expect(run(f.remote, 'git', 'rev-parse', retry.ok ? retry.branch : '')).toBe(head)
  })

  it('reuses only an OPEN PR on a clean retry, and refuses a failed revalidation', async () => {
    const f = fixture()
    write(f.work, 'web/protos/ana/home.tsx', '<Screen />')
    expect(await deploy(f.options({ wait: false }))).toMatchObject({ ok: true, created: true })
    const head = run(f.work, 'git', 'rev-parse', 'HEAD')
    expect(await deploy(f.options({ checks: () => ({ ok: false, output: 'changed laws' }) }))).toMatchObject({ ok: false, stage: 'checks' })
    expect(await deploy(f.options({ wait: false }))).toMatchObject({ ok: true, created: false })
    expect(readFileSync(f.calls, 'utf8')).toContain('--state open --json url')
    writeFileSync(f.closed, '')
    expect(await deploy(f.options({ wait: false }))).toMatchObject({ ok: true, created: true })
    expect(run(f.work, 'git', 'rev-parse', 'HEAD')).toBe(head)
  })

  it.each(['src/kit.ts', 'web/protos/bia/x.tsx'])('rejects committed out-of-boundary changes on recovery: %s', async (path) => {
    const f = fixture()
    run(f.work, 'git', 'switch', '-c', 'proto/ana/recovery')
    write(f.work, 'web/protos/ana/home.tsx', '<Screen />')
    write(f.work, path)
    run(f.work, 'git', 'add', '-A')
    run(f.work, 'git', 'commit', '-qm', 'unsafe prior commit')
    expect(await deploy(f.options())).toMatchObject({ ok: false, stage: 'changes' })
    expect(run(f.remote, 'git', 'branch', '--list')).not.toContain('proto/')
  })

  it.each(['data.ts', 'data.json', 'components/Pick.tsx'])('passes affected screens to the deploy gate for %s', async (path) => {
    const f = fixture()
    write(f.work, 'web/protos/ana/first.tsx', '<Screen />')
    run(f.work, 'git', 'add', '-A')
    run(f.work, 'git', 'commit', '-qm', 'screen')
    run(f.work, 'git', 'push', '-q', 'origin', 'main')
    write(f.work, `web/protos/ana/${path}`, path.endsWith('json') ? '{}' : 'export default {}')
    let selected: string[] = []
    const out = await deploy(f.options({ checks: (files) => { selected = files; return { ok: false, output: 'gate exercised' } } }))
    expect(out).toMatchObject({ ok: false, stage: 'checks' })
    expect(selected).toEqual(['web/protos/ana/first.tsx'])
    expect(run(f.work, 'git', 'branch', '--show-current')).toBe('main')
  })

  it('names the branch, commit and PR after what changed, while the gate checks the whole folder', async () => {
    const f = fixture()
    write(f.work, 'web/protos/ana/first.tsx', '<Screen />')
    run(f.work, 'git', 'add', '-A')
    run(f.work, 'git', 'commit', '-qm', 'screen')
    run(f.work, 'git', 'push', '-q', 'origin', 'main')
    write(f.work, 'web/protos/ana/second.tsx', '<Screen />')
    let selected: string[] = []
    const out = await deploy(f.options({ checks: (files) => { selected = files; return { ok: true, output: '' } } }))
    expect(selected).toEqual(['web/protos/ana/first.tsx', 'web/protos/ana/second.tsx'])
    expect(out).toMatchObject({ ok: true, branch: 'proto/ana/second-20261005-1230' })
    expect(run(f.work, 'git', 'log', '-1', '--format=%s')).toBe('proto(ana): atualiza 1 tela(s)')
    const created = readFileSync(f.calls, 'utf8')
    expect(created).toContain('ana/second.tsx')
    expect(created).not.toContain('ana/first.tsx')
  })

  it('calls a data-only change files, not screens', async () => {
    const f = fixture()
    write(f.work, 'web/protos/ana/first.tsx', '<Screen />')
    run(f.work, 'git', 'add', '-A')
    run(f.work, 'git', 'commit', '-qm', 'screen')
    run(f.work, 'git', 'push', '-q', 'origin', 'main')
    write(f.work, 'web/protos/ana/data.ts', 'export default {}')
    expect(await deploy(f.options())).toMatchObject({ ok: true, branch: 'proto/ana/data-20261005-1230' })
    expect(run(f.work, 'git', 'log', '-1', '--format=%s')).toBe('proto(ana): atualiza 1 arquivo(s)')
  })

  it.each(['delete', 'rename'])('checks surviving dependents on a %s-only deploy', async (action) => {
    const f = fixture()
    write(f.work, 'web/protos/ana/home.tsx', '<Screen />')
    write(f.work, 'web/protos/ana/buy/flow.ts', 'export default {}')
    write(f.work, 'web/protos/ana/buy/old.tsx', '<Screen />')
    run(f.work, 'git', 'add', '-A')
    run(f.work, 'git', 'commit', '-qm', 'screens')
    run(f.work, 'git', 'push', '-q', 'origin', 'main')
    if (action === 'delete') rmSync(join(f.work, 'web/protos/ana/buy/old.tsx'))
    else renameSync(join(f.work, 'web/protos/ana/buy/old.tsx'), join(f.work, 'web/protos/ana/buy/new.tsx'))
    let selected: string[] = []
    expect(await deploy(f.options({ checks: (files) => { selected = files; return { ok: false, output: 'gate exercised' } } }))).toMatchObject({ stage: 'checks' })
    expect(selected).toEqual([...(action === 'rename' ? ['web/protos/ana/buy/new.tsx'] : []), 'web/protos/ana/home.tsx', 'web/protos/ana/buy/flow.ts'])
    for (const file of selected) expect(existsSync(join(f.work, file))).toBe(true)
  })

  it('reports a failing CI with the check that failed', async () => {
    const f = fixture('[{"name":"protos","state":"FAILURE","link":"http://ci/9"}]')
    write(f.work, 'web/protos/ana/home.tsx')
    const out = await deploy(f.options())
    expect(out).toMatchObject({ ok: true, ci: 'failed' })
    expect(out.ok && out.ciDetail).toContain('http://ci/9')
  })

  it('does not wait for CI with --no-wait', async () => {
    const f = fixture()
    write(f.work, 'web/protos/ana/home.tsx')
    expect(await deploy(f.options({ wait: false }))).toMatchObject({ ok: true, ci: 'skipped' })
    expect(existsSync(f.calls)).toBe(true)
  })
})

describe('deploy — the real gate (check:laws on the changed screens)', () => {
  afterAll(cleanCorpus)
  // The paths come from the status of the repository, relative to its root, whatever the folder the command was run from.
  const gate = async (id: string) => {
    const root = join(__dirname, '..')
    return defaultChecks([relative(root, writeCase(CASES.find((c) => c.id === id)!))], root)
  }

  it('lets a screen that holds its laws through', async () => {
    expect(await gate('clean-home')).toMatchObject({ ok: true })
  }, 120_000)

  it('stops a broken screen and says which law, as check:laws prints it', async () => {
    const r = await gate('focus-two')
    expect(r.ok).toBe(false)
    expect(r.output).toMatch(/s\.tsx:\d+  \[focus\.single\] 2 focused elements/)
  }, 120_000)
})
