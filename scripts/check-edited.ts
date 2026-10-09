/**
 * Runs `check:laws` on the file Claude Code just wrote. Started by scripts/hook-check-protos.mjs, the PostToolUse
 * hook of `.claude/settings.json` (Write, Edit), with the tool call on stdin.
 * A file that is not a `.tsx` or `.ts` of `web/protos/<designer>/` is ignored; `check:laws` itself decides what
 * the file puts in question (a component or a data file: every screen of its folder).
 * Exit 2 hands the findings back to the agent; they block nothing by themselves.
 */
import { existsSync } from 'node:fs'
import { isDesignerCode } from '../src/shared/protoFolders'
import { reportLines, runChecks } from './check-laws'

/** The file a tool call wrote when it is one to check, else undefined. */
export function editedFile(input: string, exists: (file: string) => boolean): string | undefined {
  let file: unknown
  try {
    file = JSON.parse(input).tool_input?.file_path
  } catch {
    return undefined
  }
  return typeof file === 'string' && isDesignerCode(file) && exists(file) ? file : undefined
}

/** What the hook says about an edited file: nothing when its checks pass, else the lines of `check:laws` for the agent. */
export async function findingsFor(file: string): Promise<string | undefined> {
  const run = await runChecks([file])
  if (run.exitCode === 0) return undefined
  return `check:laws encontrou bloqueios depois desta edição. Uma lei se corrige; um padrão só se declara com @deviation quando o usuário pediu a quebra, citando o pedido (web/protos/CODING_STANDARDS.md).\n${[...reportLines(run), ...run.notes].join('\n')}`
}

async function main(): Promise<void> {
  // The findings are all the agent should read: Node's own deprecation notices stay out of stderr.
  process.noDeprecation = true
  let input = ''
  for await (const chunk of process.stdin) input += chunk
  const file = editedFile(input, existsSync)
  const said = file && (await findingsFor(file))
  if (!said) process.exit(0)
  console.error(said)
  process.exit(2)
}

if (!process.env.VITEST) void main()
