import { existsSync, readFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const ROOT = join(__dirname, '..')
const yml = readFileSync(join(ROOT, '.github/workflows/protos.yml'), 'utf8')
const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as { scripts: Record<string, string> }

describe('.github/workflows/protos.yml', () => {
  it('parses (ruby\'s YAML, or actionlint, when installed)', () => {
    const lint = spawnSync('actionlint', [join(ROOT, '.github/workflows/protos.yml')], { encoding: 'utf8' })
    if (!lint.error) expect(lint.stdout).toBe('')
    const ruby = spawnSync('ruby', ['-ryaml', '-e', 'YAML.load_file(ARGV[0])', join(ROOT, '.github/workflows/protos.yml')], { encoding: 'utf8' })
    if (!ruby.error) expect(ruby.stderr).toBe('')
    expect(yml).toMatch(/^permissions:\n(  .*\n)*  pull-requests: write$/m)
  })
  it('only runs npm scripts and files that exist', () => {
    for (const m of yml.matchAll(/npm run ([\w:.-]+)/g)) expect(pkg.scripts, `npm run ${m[1]}`).toHaveProperty(m[1].replace(/ .*/, ''))
    for (const script of ['check:laws', 'pr:report', 'pr:comment']) {
      expect(yml).toContain(`npm run ${script}`)
      expect(existsSync(join(ROOT, pkg.scripts[script].match(/scripts\/[\w-]+\.ts/)![0])), script).toBe(true)
    }
  })
  it('runs the laws with --json and --require-render, and fails the job last', () => {
    expect(yml).toMatch(/npm run check:laws [^\n]*--json[^\n]*--require-render|npm run check:laws [^\n]*--require-render[^\n]*--json/)
    expect(yml.lastIndexOf('Fail when the laws failed')).toBeGreaterThan(yml.indexOf('npm run pr:comment'))
    expect(yml).toContain('Only web/protos/<designer>/')
    expect(yml).toContain('npm run build --prefix web')
  })
})
