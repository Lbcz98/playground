/**
 * Runs the evaluation requests through the real pipeline and records, per run, what
 * phase 9G needs: the mode, the final validity, the declared deviations with their
 * scope (node or screen), every failed attempt (`meta.trace`), replans, the
 * interpreter's notices, the Layout QA line and the cost.
 *
 *   npm run eval:modes -- --runs 3                       # the 9G round: each request 3x, both modes
 *   npm run eval:modes -- --only r03,r05 --modes exploratory
 *
 * It calls a real model (Claude Code CLI or an API key: AI_PROVIDER, see
 * electron/ai/providers), so it costs money — US$ 0.17 to 0.65 per generation.
 * Results go to eval/results/ (gitignored); the requests and what a good run does
 * live in eval/seed-9d.json.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { generateUI } from '../electron/ai/ai-orchestrator'
import { treeDeclarations } from '@/shared/design-system/deviations'
import { interpretPrototype } from '@/interpreter/interpret'
import { validateBlueprintAgainstManifest } from '@/shared/design-system/manifest-zod'
import { ruleById } from '@/shared/design-system/rules'
import { auditFrameLayout, summarizeChecks } from '@/shared/layout/frame'
import { screenMode, type BlueprintDocument, type ScreenMode } from '@/shared/blueprint'
import { SCREENFLOW_MANIFEST as M } from '@/shared/design-system/screenflow-manifest'

interface Request {
  id: string
  prompt: string
  expected: { router?: string; declare: (string | { ruleId: string; on?: string })[]; note?: string; law?: string }
}

const args = process.argv.slice(2)
const flag = (name: string, fallback: string): string => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback
}
const RUNS = Math.max(1, Number.parseInt(flag('runs', '1'), 10) || 1)
const MODES = flag('modes', 'faithful,exploratory').split(',') as ScreenMode[]
const ONLY = flag('only', '').split(',').filter(Boolean)
const OUT = flag('out', fileURLToPath(new URL('./results', import.meta.url)))
const POOL = Math.max(1, Number.parseInt(flag('pool', '4'), 10) || 4)

const seed = JSON.parse(readFileSync(new URL('./seed-9d.json', import.meta.url), 'utf8')) as { requests: Request[] }
const requests = seed.requests.filter((r) => ONLY.length === 0 || ONLY.some((id) => r.id.startsWith(id)))
mkdirSync(OUT, { recursive: true })

type Deviation = { where: string; scope: 'node' | 'screen'; ruleId: string; why: string }

function declaredOf(doc: BlueprintDocument): Deviation[] {
  const out: Deviation[] = []
  const walk = (node: Record<string, any> | undefined, at: string): void => {
    if (!node || typeof node !== 'object') return
    if (node.deviation) out.push({ where: `${at} <${node.type}>`, scope: 'node', ruleId: node.deviation.ruleId, why: node.deviation.why })
    ;(Array.isArray(node.children) ? node.children : []).forEach((c: Record<string, any>, i: number) => walk(c, `${at}.${i}`))
  }
  const screens = [{ id: doc.id ?? 'first', screen: doc.screen, root: doc.root }, ...(doc.screens ?? [])] as Record<string, any>[]
  for (const s of screens) {
    walk(s.root, s.id)
    for (const d of s.screen?.deviation ?? []) out.push({ where: `${s.id} screen`, scope: 'screen', ruleId: d.ruleId, why: d.why })
  }
  return out
}

async function one(req: Request, mode: ScreenMode, n: number): Promise<void> {
  const file = join(OUT, `${req.id}.${mode}.${n}.json`)
  if (existsSync(file)) return
  const t0 = Date.now()
  const res = await generateUI(req.prompt, [], { mode, effort: 'medium' }, M)
  const out: Record<string, unknown> = { id: req.id, run: n, mode, prompt: req.prompt, expected: req.expected, ms: Date.now() - t0, ok: res.ok, meta: res.meta }
  if (res.ok) {
    const doc = res.blueprint
    const v = validateBlueprintAgainstManifest(doc, M, mode)
    const issues = v.ok ? [] : v.issues
    const interpreted = interpretPrototype(doc, M)
    Object.assign(out, {
      blueprint: doc,
      finalValid: v.ok,
      finalIssues: issues.map((i) => ({ ruleId: i.ruleId, level: ruleById(M, i.ruleId)?.flexibility, kind: i.kind, path: i.path.join('.'), message: i.message })),
      lawsBroken: issues.filter((i) => ruleById(M, i.ruleId)?.flexibility === 'law').map((i) => i.ruleId),
      declared: declaredOf(doc),
      interpreter: interpreted.ok
        ? { kept: interpreted.issues.filter((i) => i.message.startsWith('Kept ')).map((i) => i.message), warns: interpreted.issues.filter((i) => i.level === 'warn').map((i) => `${i.ruleId ?? '-'}: ${i.message}`), screens: interpreted.screens.length, links: interpreted.linkCount }
        : { error: interpreted.error },
      // The canvas adds a measured Render check (overflow, overlap) this script cannot see: judge r03 there.
      qa: interpreted.ok
        ? interpreted.screens.map((s) => {
            const checks = auditFrameLayout({ root: s.tree }, M, undefined, screenMode(s) === 'exploratory' ? treeDeclarations(s.tree, s.tree.screen) : [])
            return { id: s.id, ...summarizeChecks(checks), failing: checks.flatMap((c) => c.problems) }
          })
        : [],
    })
  }
  writeFileSync(file, JSON.stringify(out, null, 2))
  console.log(`done ${req.id} ${mode} #${n} ok=${res.ok} ${Math.round((Date.now() - t0) / 1000)}s`)
}

const jobs = requests.flatMap((r) => Array.from({ length: RUNS }, (_, n) => MODES.map((m) => () => one(r, m, n + 1))).flat())
let next = 0
await Promise.all(
  Array.from({ length: POOL }, async () => {
    while (next < jobs.length) {
      const job = jobs[next++]
      try {
        await job()
      } catch (err) {
        console.log('job failed:', err instanceof Error ? err.message : err)
      }
    }
  }),
)

// ── Summary: declared vs expected, per request and mode ────────────────────────────────────────
const ids = (r: Request): string[] => r.expected.declare.map((d) => (typeof d === 'string' ? d : d.ruleId)).sort()
console.log('\nrequest · mode · runs · declared (scope) vs expected · attempts failed · replans · laws broken · $')
for (const req of requests) {
  for (const mode of MODES) {
    const runs = Array.from({ length: RUNS }, (_, n) => join(OUT, `${req.id}.${mode}.${n + 1}.json`))
      .filter(existsSync)
      .map((f) => JSON.parse(readFileSync(f, 'utf8')))
      .filter((r) => r.ok)
    if (runs.length === 0) continue
    const want = mode === 'faithful' ? [] : ids(req)
    const got = runs.map((r) => [...new Set((r.declared as Deviation[]).map((d) => `${d.ruleId}(${d.scope})`))].sort().join('+') || '—')
    const match = runs.filter((r) => JSON.stringify([...new Set((r.declared as Deviation[]).map((d) => d.ruleId))].sort()) === JSON.stringify(want)).length
    const failed = runs.reduce((s, r) => s + (r.meta.trace?.length ?? 0), 0)
    const replans = runs.reduce((s, r) => s + (r.meta.steps as string[]).filter((x) => /replan/.test(x)).length, 0)
    const laws = runs.flatMap((r) => r.lawsBroken as string[])
    const cost = runs.reduce((s, r) => s + (r.meta.usage?.costUsd ?? 0), 0)
    console.log(`${req.id} · ${mode} · ${runs.length} · [${got.join(' | ')}] vs [${want.join('+') || '—'}] ${match}/${runs.length} match · ${failed} · ${replans} · ${laws.join(',') || '—'} · $${cost.toFixed(2)}`)
  }
}
