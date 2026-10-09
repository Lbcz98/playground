/**
 * `npm run pr:report -- <report.json | folder>` — the markdown a pull request shows for `check:laws --json` and `check:flow --json`.
 * Pure: the same JSON gives the same bytes, whatever the order of the reports or of what is inside them.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import type { LawReport } from './check-laws'
import { MARKER, SCHEMA_VERSION, type Finding } from './findings'

export const MAX_CHARS = 60_000

export interface LawsJson {
  schemaVersion: number
  reports: LawReport[]
  findings: Finding[]
  /** What `check:flow --json` warns about (the conventions of a flow); absent from `check:laws --json`. Never blocks. */
  advisories?: Finding[]
}

const cmp = (a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0)
const oneLine = (s: string): string => s.replace(/\s+/g, ' ').trim()

/** One or several `--json` outputs (check:laws, one check:flow per flow folder), read as one. */
export function renderReport(input: LawsJson | LawsJson[], root = process.cwd()): string {
  const parts = [input].flat()
  for (const json of parts)
    if (json?.schemaVersion !== SCHEMA_VERSION || !Array.isArray(json.reports) || !Array.isArray(json.findings))
      throw new Error(`pr-report: expected { schemaVersion: ${SCHEMA_VERSION}, reports, findings } from check:laws or check:flow --json, got schemaVersion ${json?.schemaVersion}`)
  const json = { reports: parts.flatMap((p) => p.reports), findings: parts.flatMap((p) => p.findings), advisories: parts.flatMap((p) => p.advisories ?? []) }
  root = root.replace(/\/$/, '')
  const rel = (f: string): string => (f.startsWith(root + '/') ? f.slice(root.length + 1) : f)
  const reports = [...json.reports].sort((a, b) => cmp(rel(a.file), rel(b.file)))
  const blocking: string[] = []
  const legibility: string[] = []
  const flowWarnings: string[] = []
  const deviations: string[] = []
  const prims: string[] = []
  const notRead: string[] = []
  const edges: string[] = []
  let read = 0
  let unread = 0
  for (const f of json.advisories) flowWarnings.push(`- \`${rel(f.file)}${f.line ? `:${f.line}` : ''}\` [${f.rule}] ${oneLine(f.message)}`)
  for (const f of json.findings) blocking.push(`- \`${rel(f.file)}${f.line ? `:${f.line}` : ''}\` [${f.rule}] ${oneLine(f.message)}`)
  for (const r of reports) {
    const f = rel(r.file)
    for (const p of r.problems) blocking.push(`- \`${p.file ? rel(p.file) : f}${p.line ? `:${p.line}` : ''}\` [${p.law}] ${oneLine(p.message)}`)
    for (const a of r.advisories) legibility.push(`- \`${f}\` [${a.law}] ${oneLine(a.message)}`)
    for (const d of r.deviations) deviations.push(`- \`${d.ruleId}\` — ${oneLine(d.why)} (\`${f}:${d.line}\`)`)
    for (const u of r.reuses) prims.push(`- reuse \`${f}:${u.line}\` — \`${u.primitive}\` considered \`${u.considered}\`: ${oneLine(u.why)}`)
    for (const p of r.proposals) prims.push(`- proposal \`${rel(p.file)}\` — \`${p.name}\`: ${oneLine(p.why)} (API: ${Object.keys(p.api).sort().join(', ') || 'none'})`)
    for (const n of r.notRead) notRead.push(`- \`${f}:${n.line}\` [${n.kind}] ${oneLine(n.message)}`)
    for (const e of r.flow.edges) edges.push(`- \`${rel(e.from)}\` → \`${rel(e.to)}\` (line ${e.line})`)
    read += r.coverage.read
    unread += r.coverage.notRead
  }
  const reuses = prims.filter((p) => p.startsWith('- reuse')).length
  const section = (title: string, items: string[]): string[] => [`### ${title} (${items.length})`, '', ...(items.length ? [...items].sort(cmp) : ['None.']), '']
  const lines = [
    MARKER,
    `## Protos laws`,
    '',
    `${reports.length} screens checked · ${blocking.length} blocking problems · ${legibility.length + flowWarnings.length} advisories · ${deviations.length} deviations · ${reuses} reuses · ${prims.length - reuses} proposals · ${unread} constructs not read (${read} read, ${read + unread ? Math.round((100 * read) / (read + unread)) : 100}% coverage)`,
    '',
    ...section('Blocking problems', blocking),
    ...section('Legibility warnings', legibility),
    ...section('Flow warnings', flowWarnings),
    ...section('Declared deviations', deviations),
    ...section('Primitives and proposals', prims),
    ...section('Not read', notRead),
    ...section('Flow edges', edges),
  ]
  let out = lines.join('\n')
  if (out.length > MAX_CHARS) {
    let keep = lines.length
    const room = MAX_CHARS - 120
    while (keep > 0 && lines.slice(0, keep).join('\n').length > room) keep--
    out = `${lines.slice(0, keep).join('\n')}\n\n…and ${lines.length - keep} more lines (see the job summary or report.json)`
  }
  return out + '\n'
}

if (!process.env.VITEST) {
  const path = process.argv.slice(2).find((a) => a !== '--')
  if (!path) {
    console.error('usage: npm run pr:report -- <report.json | folder of them>')
    process.exit(2)
  }
  const files = statSync(path).isDirectory() ? readdirSync(path).filter((f) => f.endsWith('.json')).sort().map((f) => join(path, f)) : [path]
  process.stdout.write(renderReport(files.map((f) => JSON.parse(readFileSync(f, 'utf8')))))
}
