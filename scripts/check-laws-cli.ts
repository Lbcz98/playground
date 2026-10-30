/**
 * `npm run check:laws -- <file.tsx | flow-folder> [...] [--json] [--no-render] [--require-render]`: the command line
 * of scripts/check-laws.ts. It reads the arguments, runs the check (`runChecks`), prints it and exits with its verdict.
 */
import { existsSync } from 'node:fs'
import { reportLines, runChecks } from './check-laws'
import { SCHEMA_VERSION } from './findings'

/** An argument is something the user asked to check, so a typo must not pass as nothing to check. CI and /deploy hand over surviving paths only. */
export const missingTargets = (args: string[]): string[] => args.filter((a) => !existsSync(a))

async function main(): Promise<void> {
  const args = process.argv.slice(2).filter((a) => a !== '--' && !a.startsWith('--'))
  if (args.length === 0) {
    console.error('usage: npm run check:laws -- <file.tsx | flow-folder> [...] [--json]')
    process.exit(2)
  }
  const missing = missingTargets(args)
  if (missing.length > 0) {
    console.error(`no such file or folder: ${missing.join(', ')}`)
    process.exit(2)
  }
  const run = await runChecks(args, { render: !process.argv.includes('--no-render'), requireRender: process.argv.includes('--require-render') })
  for (const n of run.notes) console.error(n)
  if (process.argv.includes('--json')) console.log(JSON.stringify({ schemaVersion: SCHEMA_VERSION, reports: run.reports, findings: run.findings }, null, 1))
  else for (const line of reportLines(run)) console.log(line)
  process.exit(run.exitCode)
}

if (!process.env.VITEST) void main()
