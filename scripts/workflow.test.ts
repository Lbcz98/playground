import { existsSync, readFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const ROOT = join(__dirname, '..')
const yml = readFileSync(join(ROOT, '.github/workflows/protos.yml'), 'utf8')
const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as { scripts: Record<string, string> }
const webPkg = JSON.parse(readFileSync(join(ROOT, 'web/package.json'), 'utf8')) as { scripts: Record<string, string> }

const kitJob = yml.slice(yml.indexOf('\n  kit:'), yml.indexOf('\n  protos:'))
const protosJob = yml.slice(yml.indexOf('\n  protos:'))

describe('.github/workflows/protos.yml', () => {
  it('holds the checks themselves to typecheck, tests and the token checks, on every pull request and on main', () => {
    expect(yml.indexOf('\n  kit:')).toBeGreaterThan(0)
    for (const script of ['typecheck', 'test', 'lint:tokens', 'tokens:check']) expect(kitJob, script).toMatch(new RegExp(`npm (run )?${script}$`, 'm'))
    // No path filter: a required check that never starts leaves the pull request pending forever.
    expect(yml).toMatch(/^on:\n  pull_request:\n  push:\n    branches: \[main\]$/m)
    expect(protosJob).toMatch(/^    if: github\.event_name == 'pull_request'$/m)
  })
  it('parses (ruby\'s YAML, or actionlint, when installed)', () => {
    const lint = spawnSync('actionlint', [join(ROOT, '.github/workflows/protos.yml')], { encoding: 'utf8' })
    if (!lint.error) expect(lint.stdout).toBe('')
    const ruby = spawnSync('ruby', ['-ryaml', '-e', 'YAML.load_file(ARGV[0])', join(ROOT, '.github/workflows/protos.yml')], { encoding: 'utf8' })
    if (!ruby.error) expect(ruby.stderr).toBe('')
    // Least privilege: read-only by default; only the job that posts the comment may write to the pull request.
    expect(yml).toMatch(/^permissions:\n  contents: read\n\n/m)
    expect(protosJob).toMatch(/^    permissions:\n      contents: read\n      pull-requests: write$/m)
    expect(kitJob).not.toContain('pull-requests: write')
  })
  it('never pastes pull request text into a shell, and leaves no token behind for the code it runs', () => {
    // A branch name is the author's text: inside `run:` it would be executed. It arrives through `env:` instead.
    const scripts = [...yml.matchAll(/^ +run: (\|\n(?: {10,}.*\n|\n)+|.*\n)/gm)].map((m) => m[1]).join('')
    expect(scripts).not.toContain('${{')
    expect(protosJob).toMatch(/HEAD_REF: \$\{\{ github\.head_ref \}\}/)
    // The jobs run the pull request's own code (render harness, next build): checkout must not keep the token on disk.
    expect(yml.match(/uses: actions\/checkout@v4/g)?.length).toBe(yml.match(/persist-credentials: false/g)?.length)
  })
  it('only runs npm scripts and files that exist', () => {
    // `--prefix web` runs a script of web/package.json, anything else one of the root's.
    for (const m of yml.matchAll(/npm run ([\w:.-]+)([^\n]*)/g)) expect(/--prefix web\b/.test(m[2]) ? webPkg.scripts : pkg.scripts, `npm run ${m[0]}`).toHaveProperty(m[1])
    for (const script of ['check:laws', 'pr:report', 'pr:comment']) {
      expect(yml).toContain(`npm run ${script}`)
      expect(existsSync(join(ROOT, pkg.scripts[script].match(/scripts\/[\w-]+\.ts/)![0])), script).toBe(true)
    }
  })
  it('asks the folder model (ci:protos) which paths are the designer’s, which are screens and which are flows; no awk, find or glob of its own', () => {
    for (const mode of ['outside "$designer"', 'screens', 'flows']) expect(protosJob).toMatch(new RegExp(`npm run ci:protos --silent -- ${mode.replace('$', '\\$')}`))
    expect(protosJob).not.toMatch(/\bawk\b|\bfind\b|'web\/protos/)
    // The script runs from node_modules, so the install comes before the first step that uses it.
    expect(protosJob.indexOf('run: npm ci\n')).toBeLessThan(protosJob.indexOf('npm run ci:protos'))
  })
  it('hands paths around NUL-separated, so a name with a space or an accent is one path: git diff -z, then xargs -0 or read -d', () => {
    const diffs = [...protosJob.matchAll(/git diff [^|\n]*/g)].map((m) => m[0])
    expect(diffs.length).toBeGreaterThan(0)
    for (const d of diffs) expect(d, d).toMatch(/ -z /)
    expect(protosJob).not.toMatch(/\$screens|\$flows/)
    expect(protosJob).toMatch(/xargs -0/)
    expect(protosJob).toMatch(/read -r -d ''/)
  })
  it('does not spell out the report schema: every step writes its own findings file, and pr:report reads the folder', () => {
    expect(yml).not.toContain('schemaVersion')
    expect(yml).toMatch(/npm run check:flow [^\n]*--json/)
    expect(yml).toMatch(/npm run pr:report --silent -- findings\b/)
  })
  it('runs the laws with --json and --require-render, and fails the job last', () => {
    expect(yml).toMatch(/npm run check:laws [^\n]*--json[^\n]*--require-render|npm run check:laws [^\n]*--require-render[^\n]*--json/)
    expect(yml.lastIndexOf('Fail when the laws failed')).toBeGreaterThan(yml.indexOf('npm run pr:comment'))
    expect(yml).toContain('Only web/protos/<designer>/')
    expect(yml).toContain('npm run build --prefix web')
  })
})
