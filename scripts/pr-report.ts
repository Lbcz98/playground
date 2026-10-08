/**
 * `npm run pr:report -- report.json` — the markdown a pull request shows for `check:laws --json`.
 * Pure: the same JSON gives the same bytes, whatever the order of the reports or of what is inside them.
 */
import { readFileSync } from 'node:fs'
import type { LawReport } from './check-laws'

export const MARKER = '<!-- protos-report -->'
export const MAX_CHARS = 60_000

export interface LawsJson {
  schemaVersion: number
  reports: LawReport[]
}

const cmp = (a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0)
const oneLine = (s: string): string => s.replace(/\s+/g, ' ').trim()

export function renderReport(json: LawsJson, root = process.cwd()): string {
  if (json?.schemaVersion !== 1 || !Array.isArray(json.reports)) throw new Error(`pr-report: expected { schemaVersion: 1, reports } from check:laws --json, got schemaVersion ${json?.schemaVersion}`)
  root = root.replace(/\/$/, '')
  const rel = (f: string): string => (f.startsWith(root + '/') ? f.slice(root.length + 1) : f)
  const reports = [...json.reports].sort((a, b) => cmp(rel(a.file), rel(b.file)))
  const blocking: string[] = []
  const legibility: string[] = []
  const deviations: string[] = []
  const prims: string[] = []
  const notRead: string[] = []
  const edges: string[] = []
  let read = 0
  let unread = 0
  for (const r of reports) {
    const f = rel(r.file)
    for (const p of r.problems) blocking.push(`- \`${p.file ? rel(p.file) : f}${p.line ? `:${p.line}` : ''}\` [${p.law}] ${oneLine(p.message)}`)
    for (const a of r.advisories) legibility.push(`- \`${f}\` [${a.law}] ${oneLine(a.message)}`)
    for (const d of r.deviations) deviations.push(`- \`${d.ruleId}\` — ${oneLine(d.why)} (\`${f}\`)`)
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
    `${reports.length} screens checked · ${blocking.length} blocking problems · ${legibility.length} advisories · ${deviations.length} deviations · ${reuses} reuses · ${prims.length - reuses} proposals · ${unread} constructs not read (${read} read, ${read + unread ? Math.round((100 * read) / (read + unread)) : 100}% coverage)`,
    '',
    ...section('Blocking problems', blocking),
    ...section('Legibility warnings', legibility),
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

if (!process.env.VITEST && process.argv.some((a) => a.endsWith('pr-report.ts'))) {
  const file = process.argv.slice(2).find((a) => a !== '--')
  if (!file) {
    console.error('usage: npm run pr:report -- report.json')
    process.exit(2)
  }
  process.stdout.write(renderReport(JSON.parse(readFileSync(file, 'utf8'))))
}
