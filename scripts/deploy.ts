/**
 * `/deploy` — what a designer wants ("put my screen in the repo for review") with the
 * Git underneath it hidden: branch, commit, push, pull request, CI.
 *
 *   npm run deploy -- [--message "what changed"] [--designer ana] [--base main] [--no-wait]
 *
 * It only ever publishes `web/protos/<designer>/`. Changes anywhere else (the kit, the
 * tokens, another designer's folder) stop it before any branch is made, and the checks
 * (`check:laws` on every changed screen) must pass before anything is committed. It
 * never touches the base branch: the work goes on `proto/<designer>/<slug>` and opens a PR.
 *
 * Needs `git` with an `origin`, and the GitHub CLI (`gh`) signed in.
 */
import { spawnSync } from 'node:child_process'
import { resolve } from 'node:path'
import { diskTree, inDesigner, type Tree } from '../src/shared/protoFolders'
import { screensOf } from './protos-ci'
import { reportLines, runChecks } from './check-laws'

const PROTOS = 'web/protos'

// ── Pure parts ───────────────────────────────────────────────────────────────

/** Paths a `git status --porcelain=v1 -z` lists, renames and copies counting both ends. */
export function changedPaths(porcelainZ: string): string[] {
  const parts = porcelainZ.split('\0').filter(Boolean)
  const out: string[] = []
  for (let i = 0; i < parts.length; i++) {
    const entry = parts[i]
    out.push(entry.slice(3))
    if (/[RC]/.test(entry.slice(0, 2))) out.push(parts[++i]) // the original path follows
  }
  return out
}

const isScreenFile = (p: string): boolean => /\.tsx$|(^|\/)flow\.ts$/.test(p)

interface Classified {
  designers: string[]
  /** Surviving screens and flow.ts files affected by the changes: what the gate checks. */
  screens: string[]
  /** What the designer changed, the screens if any: what the branch, commit and PR are named after. */
  changed: string[]
  /** Anything under `web/protos/` at all. */
  inside: string[]
  /** Everything else: not the designer's to publish. */
  outside: string[]
}

export function classify(paths: string[], tree: Tree = diskTree): Classified {
  const inside: string[] = []
  const outside: string[] = []
  const designers = new Set<string>()
  for (const p of paths) {
    const d = inDesigner(p)
    if (d) {
      inside.push(p)
      designers.add(d.designer)
    } else outside.push(p)
  }
  const changedScreens = inside.filter(isScreenFile)
  return { designers: [...designers].sort(), screens: screensOf(paths, tree), changed: changedScreens.length > 0 ? changedScreens : inside, inside, outside }
}

/** The name a screen goes by: its file, or for a flow's `flow.ts` the folder. */
const screenName = (p: string): string => {
  const parts = p.split('/')
  return parts[parts.length - 1] === 'flow.ts' ? parts[parts.length - 2] : parts[parts.length - 1].replace(/\.[^.]+$/, '')
}

export function slugify(text: string): string {
  return (
    text
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40) || 'tela'
  )
}

export const stamp = (d: Date): string => d.toISOString().slice(0, 16).replace(/[-:]/g, '').replace('T', '-')

export function branchName(designer: string, slug: string, now: Date): string {
  return `proto/${designer}/${slug}-${stamp(now)}`
}

// ── The run ──────────────────────────────────────────────────────────────────

type Gate = { ok: boolean; output: string }

export interface Options {
  root: string
  message?: string
  designer?: string
  base: string
  wait: boolean
  now?: Date
  /** The gate. Default: `check:laws` on the affected screens. */
  checks?: (screens: string[], root: string) => Gate | Promise<Gate>
  /** How long to wait for CI, ms. */
  ciTimeoutMs?: number
  ciPollMs?: number
  log?: (line: string) => void
}

export type Outcome =
  | { ok: true; branch: string; pr: string; created: boolean; ci: 'passed' | 'failed' | 'none' | 'pending' | 'skipped'; ciDetail?: string }
  | { ok: false; stage: string; reason: string }

const fail = (stage: string, reason: string): Outcome => ({ ok: false, stage, reason })

function sh(cmd: string, args: string[], cwd: string): { ok: boolean; out: string; err: string } {
  const r = spawnSync(cmd, args, { cwd, encoding: 'utf8' })
  return { ok: r.status === 0, out: (r.stdout ?? '').trim(), err: ((r.stderr ?? '') || (r.error?.message ?? '')).trim() }
}

/** The checks `npm run check:laws` runs, in this process; what it would print is what the designer is told. */
export async function defaultChecks(screens: string[], root: string): Promise<Gate> {
  try {
    const run = await runChecks(screens.map((s) => resolve(root, s)), { requireRender: true })
    return { ok: run.exitCode === 0, output: [...reportLines(run), ...run.notes].join('\n') }
  } catch (e) {
    return { ok: false, output: e instanceof Error ? e.message : String(e) }
  }
}

export async function deploy(options: Options): Promise<Outcome> {
  const { root, base } = options
  const log = options.log ?? (() => undefined)
  const git = (...args: string[]) => sh('git', args, root)

  // 1. The tools are there.
  if (!git('remote', 'get-url', 'origin').ok) return fail('setup', 'Este repositório não tem um remoto "origin".')
  const auth = sh('gh', ['auth', 'status'], root)
  if (!auth.ok) return fail('setup', `O GitHub CLI não está pronto (rode "gh auth login"): ${auth.err || auth.out}`)

  // 2. What changed, and whether it is the designer's to publish.
  const status = spawnSync('git', ['status', '--porcelain=v1', '-z', '-uall'], { cwd: root, encoding: 'utf8' })
  if (status.status !== 0) return fail('changes', status.stderr || 'git status falhou.')
  const dirty = changedPaths(status.stdout)
  const currentResult = git('symbolic-ref', '--quiet', '--short', 'HEAD')
  if (!currentResult.ok) return fail('branch', 'Publique a partir de uma branch, não de um HEAD destacado.')
  const current = currentResult.out
  const branchDesigner = /^proto\/([^/]+)\//.exec(current)?.[1]
  if (dirty.length === 0 && !branchDesigner) return fail('changes', 'Não há nada para publicar.')
  const tree: Tree = { list: (p) => diskTree.list(resolve(root, p)), read: (p) => diskTree.read(resolve(root, p)) }
  // Refresh branch state even with a clean worktree: a previous run may have committed, then failed to push/open a PR.
  const fetched = git('fetch', '--prune', 'origin')
  if (!fetched.ok) return fail('branch', `Não consegui buscar origin: ${fetched.err}`)
  const baseRef = `refs/remotes/origin/${base}`
  if (!git('rev-parse', '--verify', baseRef).ok) return fail('branch', `Não encontrei origin/${base}.`)
  const branchDiff = branchDesigner ? git('diff', '-z', '--name-only', '--no-renames', `${baseRef}...HEAD`) : undefined
  if (branchDiff && !branchDiff.ok) return fail('branch', branchDiff.err)
  const paths = [...new Set([...dirty, ...(branchDiff?.out.split('\0').filter(Boolean) ?? [])])]
  const found = classify(paths, tree)
  if (paths.length === 0) return fail('changes', 'Não há nada para publicar.')
  if (found.outside.length > 0) {
    return fail(
      'changes',
      `Há alterações fora de ${PROTOS}/<designer>/, que o /deploy não publica:\n${found.outside.map((p) => `  ${p}`).join('\n')}\nDesfaça-as, ou peça a quem cuida do kit.`,
    )
  }
  if (found.designers.length > 1) return fail('changes', `As alterações estão em mais de uma pasta de designer (${found.designers.join(', ')}). Publique uma por vez.`)
  const designer = found.designers[0]
  if (branchDesigner && branchDesigner !== designer) {
    return fail('changes', `A branch é de "${branchDesigner}", mas as alterações estão em ${PROTOS}/${designer}/.`)
  }
  if (options.designer && options.designer !== designer) {
    return fail('changes', `Você pediu "${options.designer}", mas as alterações estão em ${PROTOS}/${designer}/.`)
  }

  // 3. The gate: the laws, before anything is committed.
  const gate = await (options.checks ?? defaultChecks)(found.screens, root)
  if (!gate.ok) return fail('checks', gate.output || 'check:laws falhou.')
  log(`checks: ${found.screens.length} tela(s) dentro das leis`)

  // 4. Branch: keep working on this designer's own branch, else start one from the base.
  const now = options.now ?? new Date()
  let branch = current
  if (!current.startsWith(`proto/${designer}/`)) {
    const slug = slugify(options.message ?? found.changed.map(screenName).join('-'))
    branch = branchName(designer, slug, now)
    const before = git('rev-parse', 'HEAD').out
    const made = git('switch', '-c', branch, baseRef)
    if (!made.ok) return fail('branch', `Não consegui criar a branch ${branch} a partir de origin/${base}: ${made.err}`)
    if (git('rev-parse', 'HEAD').out !== before) {
      // Switching to an updated base can change the kit and the other screens used by the gate.
      found.screens = screensOf(paths, tree)
      const again = await (options.checks ?? defaultChecks)(found.screens, root)
      if (!again.ok) return fail('checks', again.output || 'check:laws falhou.')
    }
  }
  if (branch === base || branch === 'main' || branch === 'master') return fail('branch', `Recusei publicar direto em "${branch}".`)

  // 5. Commit only the designer's folder.
  const title = options.message ?? `atualiza ${found.changed.length} ${found.changed.every(isScreenFile) ? 'tela(s)' : 'arquivo(s)'}`
  if (dirty.length > 0) {
    const added = git('add', '-A', '--', `${PROTOS}/${designer}`)
    if (!added.ok) return fail('commit', added.err)
    // --no-verify: the gate above (check:laws) is this flow's own; the repo's pre-commit hook is for people committing by hand.
    const committed = git('commit', '--no-verify', '-m', `proto(${designer}): ${title}`)
    if (!committed.ok) return fail('commit', committed.err || committed.out)
  }

  // 6. Push and open (or update) the pull request.
  const remoteHead = git('rev-parse', '--verify', `refs/remotes/origin/${branch}`)
  const head = git('rev-parse', 'HEAD').out
  if (!remoteHead.ok || remoteHead.out !== head) {
    // A normal push refuses divergence; recovery never force-pushes someone else's work.
    const pushed = git('push', '-u', 'origin', branch)
    if (!pushed.ok) return fail('push', pushed.err)
  }
  const existing = sh('gh', ['pr', 'list', '--head', branch, '--base', base, '--state', 'open', '--json', 'url'], root)
  if (!existing.ok) return fail('pr', existing.err || existing.out)
  let pr: string
  try {
    const prs: { url: string }[] = JSON.parse(existing.out)
    if (!Array.isArray(prs) || prs.some((p) => typeof p.url !== 'string')) throw new Error('invalid PR response')
    pr = prs[0]?.url ?? ''
  } catch {
    return fail('pr', 'Não consegui ler a lista de pull requests abertos.')
  }
  const created = pr === ''
  if (created) {
    const body = [
      `Mudanças de **${designer}**:`,
      ...found.changed.map((p) => `- \`${p.replace(`${PROTOS}/`, '')}\``),
      '',
      'Passou no `check:laws` antes de subir.',
    ].join('\n')
    const opened = sh('gh', ['pr', 'create', '--base', base, '--head', branch, '--title', `proto(${designer}): ${title}`, '--body', body], root)
    if (!opened.ok) return fail('pr', opened.err)
    pr = opened.out.split('\n').pop()!.trim()
  }
  log(`pull request: ${pr}`)

  // 7. CI.
  if (!options.wait) return { ok: true, branch, pr, created, ci: 'skipped' }
  const timeout = options.ciTimeoutMs ?? 15 * 60_000
  const poll = options.ciPollMs ?? 15_000
  const t0 = Date.now()
  for (;;) {
    const r = sh('gh', ['pr', 'checks', branch, '--json', 'name,state,link'], root)
    let checks: { name: string; state: string; link?: string }[] = []
    try {
      checks = JSON.parse(r.out || '[]')
    } catch {
      // not ready
    }
    if (checks.length > 0) {
      const bad = checks.filter((c) => /FAIL|ERROR|CANCEL|TIMED/i.test(c.state))
      const pending = checks.filter((c) => /PENDING|QUEUED|IN_PROGRESS|WAITING/i.test(c.state))
      if (bad.length > 0) return { ok: true, branch, pr, created, ci: 'failed', ciDetail: bad.map((c) => `${c.name} (${c.link ?? ''})`).join('\n') }
      if (pending.length === 0) return { ok: true, branch, pr, created, ci: 'passed' }
    } else if (Date.now() - t0 > 60_000) {
      return { ok: true, branch, pr, created, ci: 'none' }
    }
    if (Date.now() - t0 > timeout) return { ok: true, branch, pr, created, ci: 'pending' }
    spawnSync('sleep', [String(poll / 1000)])
  }
}

// ── CLI ──────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const args = process.argv.slice(2).filter((a) => a !== '--')
  const value = (name: string): string | undefined => {
    const i = args.indexOf(`--${name}`)
    return i >= 0 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : undefined
  }
  const root = sh('git', ['rev-parse', '--show-toplevel'], process.cwd()).out || process.cwd()
  const out = await deploy({
    root,
    message: value('message'),
    designer: value('designer'),
    base: value('base') ?? 'main',
    wait: !args.includes('--no-wait'),
    log: (line) => console.log(line),
  })
  if (!out.ok) {
    console.error(`✗ ${out.stage}: ${out.reason}`)
    process.exit(1)
  }
  console.log(`${out.created ? 'Pull request aberto' : 'Pull request atualizado'}: ${out.pr}`)
  console.log(`Branch: ${out.branch}`)
  const ci = { passed: '✓ CI passou', failed: '✗ CI falhou', none: 'Esse repositório não rodou nenhuma checagem de CI', pending: 'CI ainda rodando (o tempo de espera acabou)', skipped: 'CI não aguardada' }[out.ci]
  console.log(ci)
  if (out.ciDetail) console.log(out.ciDetail)
  if (out.ci === 'failed') process.exit(2)
}

if (!process.env.VITEST) void main()
