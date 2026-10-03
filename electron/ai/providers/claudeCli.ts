import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { existsSync, mkdirSync, readdirSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import type { AiProvider, CompleteArgs, CompleteResult, RenderResult } from './types'
import { extractBlueprintJson, unwrapBlueprint } from './types'

/**
 * Provider: the local `claude` CLI (Claude Code) in headless mode. It runs on
 * whatever the user logged Claude Code into — including a Pro/Max subscription —
 * so generation is billed to that plan, not an API key.
 *
 * There is no forced tool call, so `renderUi` is `complete` + JSON extraction;
 * the orchestrator's validation loop catches malformed output.
 */

const execFileAsync = promisify(execFile)
const RUN_TIMEOUT_MS = 120_000

// Scan ~/.nvm/versions/node/<version>/bin/claude — GUI apps rarely inherit nvm's PATH.
function nvmBinaries(home: string): string[] {
  const base = path.join(home, '.nvm', 'versions', 'node')
  try {
    return readdirSync(base)
      .map((v) => path.join(base, v, 'bin', 'claude'))
      .filter(existsSync)
  } catch {
    return []
  }
}

function candidateBinaries(): string[] {
  const home = os.homedir()
  return [
    process.env.CLAUDE_CLI_PATH,
    'claude', // PATH
    path.join(home, '.claude', 'local', 'claude'),
    path.join(home, '.local', 'bin', 'claude'),
    path.join(home, '.bun', 'bin', 'claude'),
    '/opt/homebrew/bin/claude',
    '/usr/local/bin/claude',
    path.join(home, '.npm-global', 'bin', 'claude'),
    path.join(home, '.volta', 'bin', 'claude'),
    ...nvmBinaries(home),
  ].filter((p): p is string => !!p)
}

let resolved: string | null | undefined

async function resolveBinary(): Promise<string | null> {
  if (resolved !== undefined) return resolved
  for (const bin of candidateBinaries()) {
    const isPath = bin.includes(path.sep)
    if (isPath && !existsSync(bin)) continue
    try {
      await execFileAsync(bin, ['--version'], { timeout: 5000 })
      resolved = bin
      return bin
    } catch {
      // try next
    }
  }
  resolved = null
  return null
}

/** `claude -p` takes one prompt string — fold the conversation into it. */
function foldMessages(messages: CompleteArgs['messages']): string {
  const clean = messages.filter((t) => t.content.trim().length > 0)
  if (clean.length <= 1) return clean[0]?.content ?? ''
  const prior = clean.slice(0, -1)
  const last = clean[clean.length - 1]
  const transcript = prior
    .map((t) => `${t.role === 'user' ? 'User' : 'You'}: ${t.content}`)
    .join('\n')
  return `Conversation so far:\n${transcript}\n\nNow: ${last.content}`
}

const GUARD =
  'You are NOT a coding assistant here. Do not use any tools. Do not read or write files.'

/**
 * Isolation (default; escape hatch SFS_CLI_ISOLATE=0): the CLI otherwise loads the user's settings, hooks, plugins, skills and MCP definitions into every
 * call (~4k tokens written per call, and their hook text leaks into the model's context). `--setting-sources ""` skips
 * user/project/local settings (and with them hooks and plugins), `--safe-mode` also drops CLAUDE.md and memory;
 * `--system-prompt` stays a full replacement.
 */
export const isolated = (): boolean => process.env.SFS_CLI_ISOLATE?.trim() !== '0'

const ISOLATION_FLAGS = [
  '--tools', '',
  '--disable-slash-commands',
  '--strict-mcp-config',
  '--setting-sources', '',
  '--safe-mode',
  '--no-session-persistence',
]

/** An empty directory, so no CLAUDE.md or project settings in a real cwd can leak in. */
function cleanCwd(): string {
  const dir = path.join(os.tmpdir(), 'sfs-cli-clean')
  mkdirSync(dir, { recursive: true })
  return dir
}

function buildCliArgs(prompt: string, system: string, model?: string, effort?: string): string[] {
  const cliArgs = ['-p', prompt, '--output-format', 'json', '--system-prompt', system]
  if (model) cliArgs.push('--model', model)
  if (effort) cliArgs.push('--effort', effort)
  if (isolated()) cliArgs.push(...ISOLATION_FLAGS)
  return cliArgs
}

async function runClaude(args: CompleteArgs): Promise<CompleteResult> {
  const bin = await resolveBinary()
  if (!bin) {
    throw new Error(
      'The `claude` CLI was not found. Install Claude Code and sign in, or set CLAUDE_CLI_PATH.',
    )
  }

  const model = args.model || process.env.AI_CLI_MODEL?.trim() || undefined
  const effort = args.effort || process.env.AI_EFFORT?.trim() || undefined

  const cliArgs = buildCliArgs(foldMessages(args.messages), `${GUARD}\n\n${args.system}`, model, effort)

  let stdout: string
  try {
    ;({ stdout } = await execFileAsync(bin, cliArgs, {
      timeout: RUN_TIMEOUT_MS,
      maxBuffer: 10 * 1024 * 1024,
      ...(isolated() ? { cwd: cleanCwd() } : {}),
    }))
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    if (/not logged in|authenticate|unauthor/i.test(message)) {
      throw new Error('Claude Code is not signed in — run `claude` once and log in.')
    }
    throw new Error(`claude CLI failed: ${message}`)
  }

  let envelope: {
    subtype?: string
    is_error?: boolean
    result?: string
    total_cost_usd?: number
    usage?: { input_tokens?: number; output_tokens?: number; cache_read_input_tokens?: number; cache_creation_input_tokens?: number }
  }
  try {
    envelope = JSON.parse(stdout)
  } catch {
    throw new Error('Could not parse the claude CLI JSON output')
  }

  if (envelope.is_error || typeof envelope.result !== 'string') {
    throw new Error(`claude CLI returned an error (${envelope.subtype ?? 'unknown'})`)
  }

  return {
    text: envelope.result,
    model,
    usage: {
      inputTokens: envelope.usage?.input_tokens,
      outputTokens: envelope.usage?.output_tokens,
      costUsd: typeof envelope.total_cost_usd === 'number' ? envelope.total_cost_usd : undefined,
      costEstimated: false,
      cacheReadTokens: envelope.usage?.cache_read_input_tokens,
      cacheWriteTokens: envelope.usage?.cache_creation_input_tokens,
    },
  }
}

export const claudeCliProvider: AiProvider = {
  id: 'claude-cli',
  label: 'Claude Code (your subscription)',

  isAvailable: async () => (await resolveBinary()) !== null,

  complete: runClaude,

  async renderUi(args): Promise<RenderResult> {
    const { text, model, usage } = await runClaude(args)
    return { blueprint: unwrapBlueprint(extractBlueprintJson(text)), model, usage }
  },
}

/** Test seam. */
export function __resetBinaryCache(): void {
  resolved = undefined
}
