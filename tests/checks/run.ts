import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { runChecks, type LawReport } from '../../scripts/check-laws'
import type { CorpusCase } from './corpus/cases'

/**
 * Inside the repo so `@/…` and the kit resolve; git-ignored; removed afterwards. One folder per test
 * worker: two corpus test files run at the same time, and one cleaning up used to delete the files the
 * other was still reading (a data module gone mid-check reads as a broken import).
 */
export const OUT = join(fileURLToPath(new URL('../..', import.meta.url)), '.checks-corpus', `w${process.env.VITEST_POOL_ID ?? process.pid}`)

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

/** What `npm run check:laws -- <entry>` decides, as data: the real run (`runChecks`) and its verdict. */
export async function runCase(c: CorpusCase, render: boolean): Promise<CaseResult> {
  const run = await runChecks([writeCase(c)], { render })
  const all = <K extends 'problems' | 'advisories' | 'warnings' | 'deviations' | 'reuses' | 'proposals'>(k: K): LawReport[K] => run.reports.flatMap((r) => r[k] as never[]) as LawReport[K]
  return {
    exit: run.exitCode,
    laws: [...new Set(all('problems').map((p) => p.law))].sort(),
    notRead: all('warnings').length,
    deviations: all('deviations').map((d) => d.ruleId),
    problems: all('problems').map((p) => `[${p.law}] ${p.message}`),
    advisories: all('advisories').map((p) => `[${p.law}] ${p.message}`),
    advisoryLaws: [...new Set(all('advisories').map((p) => p.law))].sort(),
    reuses: all('reuses').length,
    proposals: all('proposals').length,
    problemFiles: all('problems').flatMap((p) => (p.file ? [p.file] : [])),
    // Without a browser the run says so in its notes: the case skips itself.
    skipped: run.notes[0],
  }
}
