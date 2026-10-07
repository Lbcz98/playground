import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { addRenderResult, checkLaws } from '../../scripts/check-laws'
import { renderAuditFiles, RenderAuditUnavailable } from '../../scripts/render-audit'
import type { CorpusCase } from './corpus/cases'

/** Inside the repo so `@/…` and the kit resolve; git-ignored; removed afterwards. */
export const OUT = join(fileURLToPath(new URL('../..', import.meta.url)), '.checks-corpus')

export interface CaseResult {
  exit: 0 | 1
  laws: string[]
  notRead: number
  deviations: string[]
  problems: string[]
  advisories: string[]
  advisoryLaws: string[]
  reuses: number
  proposals: number
  problemFiles: string[]
  skipped?: string
}

export function writeCase(c: CorpusCase): string {
  const dir = join(OUT, c.id)
  for (const [name, code] of Object.entries(c.files)) {
    mkdirSync(dirname(join(dir, name)), { recursive: true })
    writeFileSync(join(dir, name), code)
  }
  return join(dir, c.entry)
}
export const cleanCorpus = (): void => rmSync(OUT, { recursive: true, force: true })

/** What `npm run check:laws -- <entry>` decides, as data: static + validator, then the render audit when asked. */
export async function runCase(c: CorpusCase, render: boolean): Promise<CaseResult> {
  const entry = writeCase(c)
  const report = checkLaws(entry)
  let skipped: string | undefined
  if (render) {
    try {
      const [r] = await renderAuditFiles([entry])
      addRenderResult(report, r)
    } catch (e) {
      if (!(e instanceof RenderAuditUnavailable)) throw e
      skipped = e.message
    }
  }
  return {
    exit: report.problems.length > 0 ? 1 : 0,
    laws: [...new Set(report.problems.map((p) => p.law))].sort(),
    notRead: report.warnings.length,
    deviations: report.deviations.map((d) => d.ruleId),
    problems: report.problems.map((p) => `[${p.law}] ${p.message}`),
    advisories: report.advisories.map((p) => `[${p.law}] ${p.message}`),
    advisoryLaws: [...new Set(report.advisories.map((p) => p.law))].sort(),
    reuses: report.reuses.length,
    proposals: report.proposals.length,
    problemFiles: report.problems.flatMap((p) => (p.file ? [p.file] : [])),
    skipped,
  }
}
