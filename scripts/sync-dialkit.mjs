import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { build, version } from 'esbuild'

const repository = 'https://github.com/Lbcz98/dialkit.git'
const revision = '1ef9fe8c3abfe7fd3338b45e5f4350407d49ac2c'
const target = fileURLToPath(new URL('./explore-dialkit/', import.meta.url))
const scratch = await mkdtemp(join(tmpdir(), 'playground-dialkit-build-'))
const check = process.argv.includes('--check')

try {
  const git = (...args) => execFileSync('git', ['-C', scratch, '-c', 'core.hooksPath=/dev/null', ...args], {
    stdio: 'pipe',
    env: { ...process.env, GIT_CONFIG_GLOBAL: '/dev/null', GIT_CONFIG_NOSYSTEM: '1', GIT_TERMINAL_PROMPT: '0' },
  }).toString().trim()
  git('init', '--quiet', '--template=')
  git('fetch', '--quiet', '--depth=1', repository, revision)
  git('checkout', '--quiet', '--detach', 'FETCH_HEAD')
  if (git('rev-parse', 'HEAD') !== revision) throw new Error('DialKit source revision mismatch')
  const result = await build({
    absWorkingDir: scratch,
    entryPoints: ['src/vanilla/index.ts'],
    bundle: true,
    format: 'iife',
    globalName: 'DialKit',
    platform: 'browser',
    target: 'es2020',
    define: { 'import.meta': '{}' },
    write: false,
    legalComments: 'inline',
  })
  const files = {
    'browser.global.js': result.outputFiles[0].text,
    'styles.css': (await readFile(join(scratch, 'src/styles/theme.css'), 'utf8')).replace(/^@import\s+url\([^\n]+\);\s*\n/gm, ''),
    'LICENSE.txt': await readFile(join(scratch, 'LICENSE'), 'utf8'),
  }
  files['source.json'] = JSON.stringify({
    repository, revision, version: JSON.parse(await readFile(join(scratch, 'package.json'), 'utf8')).version,
    build: { tool: 'esbuild', version, entry: 'src/vanilla/index.ts', target: 'es2020', format: 'iife' },
    sha256: Object.fromEntries(Object.entries(files).map(([name, content]) => [name, createHash('sha256').update(content).digest('hex')])),
  }, null, 2) + '\n'
  if (!check) await mkdir(target, { recursive: true })
  for (const [name, content] of Object.entries(files)) {
    if (check) {
      if (await readFile(join(target, name), 'utf8') !== content) throw new Error(`DialKit artifact differs: ${name}`)
    } else await writeFile(join(target, name), content)
  }
  console.log(`DialKit ${revision}: ${check ? 'verified' : 'built'} vanilla assets`)
} finally {
  await rm(scratch, { recursive: true, force: true })
}
