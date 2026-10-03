import { beforeEach, describe, expect, it, vi } from 'vitest'
import { promisify } from 'node:util'

const execFileImpl = vi.fn()

vi.mock('node:child_process', () => {
  const execFile = (...args: unknown[]) => execFileImpl(...args)
  ;(execFile as unknown as Record<symbol, unknown>)[promisify.custom] = (
    file: string,
    args: string[],
    opts: unknown,
  ) => execFileImpl(file, args, opts)
  return { execFile }
})

const { claudeCliProvider, __resetBinaryCache } = await import('./claudeCli')

function envelope(result: string, extra: Record<string, unknown> = {}) {
  return { stdout: JSON.stringify({ type: 'result', subtype: 'success', result, ...extra }) }
}

describe('claudeCliProvider', () => {
  beforeEach(() => {
    execFileImpl.mockReset()
    __resetBinaryCache()
    delete process.env.CLAUDE_CLI_PATH
    delete process.env.AI_CLI_MODEL
    delete process.env.SFS_CLI_ISOLATE
  })

  it('is available when `claude --version` succeeds', async () => {
    execFileImpl.mockResolvedValue({ stdout: '1.2.3' })
    expect(await claudeCliProvider.isAvailable()).toBe(true)
  })

  it('is unavailable when no binary resolves', async () => {
    execFileImpl.mockRejectedValue(new Error('ENOENT'))
    expect(await claudeCliProvider.isAvailable()).toBe(false)
  })

  it('complete(): runs `claude -p` with --system-prompt and returns text', async () => {
    execFileImpl
      .mockResolvedValueOnce({ stdout: '1.2.3' })
      .mockResolvedValueOnce(envelope('1. Root Stack\n2. Button', { total_cost_usd: 0.0009 }))

    const res = await claudeCliProvider.complete({
      system: 'PLAN THIS',
      messages: [{ role: 'user', content: 'a login screen' }],
      model: 'claude-sonnet-5',
      effort: 'high',
    })
    expect(res.text).toBe('1. Root Stack\n2. Button')
    expect(res.usage?.costUsd).toBe(0.0009)
    expect(res.usage?.costEstimated).toBe(false)

    const args = execFileImpl.mock.calls[1][1] as string[]
    expect(args).toContain('--output-format')
    expect(args).toContain('json')
    expect(args[args.indexOf('--system-prompt') + 1]).toContain('PLAN THIS')
    expect(args[args.indexOf('--model') + 1]).toBe('claude-sonnet-5')
    expect(args[args.indexOf('--effort') + 1]).toBe('high')
  })

  it('renderUi(): extracts a fenced blueprint from the reply', async () => {
    execFileImpl
      .mockResolvedValueOnce({ stdout: '1.2.3' })
      .mockResolvedValueOnce(
        envelope('```json\n{"version":1,"root":{"type":"Stack","children":[]}}\n```'),
      )
    const res = await claudeCliProvider.renderUi({
      system: 'gen',
      messages: [{ role: 'user', content: 'plan' }],
    })
    expect(res.blueprint).toEqual({ version: 1, root: { type: 'Stack', children: [] } })
  })

  it('folds a multi-turn conversation into the prompt', async () => {
    execFileImpl
      .mockResolvedValueOnce({ stdout: '1.2.3' })
      .mockResolvedValueOnce(envelope('ok'))
    await claudeCliProvider.complete({
      system: 's',
      messages: [
        { role: 'user', content: 'a pricing page' },
        { role: 'assistant', content: 'done' },
        { role: 'user', content: 'make it dark' },
      ],
    })
    const promptArg = execFileImpl.mock.calls[1][1][1] as string
    expect(promptArg).toContain('a pricing page')
    expect(promptArg).toContain('Now: make it dark')
  })

  it('maps an auth failure to a sign-in hint', async () => {
    execFileImpl
      .mockResolvedValueOnce({ stdout: '1.2.3' })
      .mockRejectedValueOnce(new Error('not logged in'))
    await expect(
      claudeCliProvider.complete({ system: 's', messages: [{ role: 'user', content: 'x' }] }),
    ).rejects.toThrow(/sign(ed)? in/i)
  })
})

describe('claudeCliProvider — cache tokens (before 9G)', () => {
  it('reports the envelope’s cache reads and writes, which input_tokens leaves out', async () => {
    __resetBinaryCache()
    execFileImpl.mockReset()
    execFileImpl
      .mockResolvedValueOnce({ stdout: '1.2.3' })
      .mockResolvedValueOnce(
        envelope('plan', { total_cost_usd: 0.2, usage: { input_tokens: 4, output_tokens: 900, cache_read_input_tokens: 12000, cache_creation_input_tokens: 21000 } }),
      )
    const res = await claudeCliProvider.complete({ system: 's', messages: [{ role: 'user', content: 'x' }] })
    expect(res.usage).toMatchObject({ inputTokens: 4, outputTokens: 900, cacheReadTokens: 12000, cacheWriteTokens: 21000 })
  })

  it('isolates the CLI by default and not with SFS_CLI_ISOLATE=0', async () => {
    const run = async () => {
      execFileImpl.mockReset()
      __resetBinaryCache()
      execFileImpl.mockResolvedValueOnce({ stdout: '1.2.3' }).mockResolvedValueOnce(envelope('ok'))
      await claudeCliProvider.complete({ system: 's', messages: [{ role: 'user', content: 'x' }] })
      return { args: execFileImpl.mock.calls[1][1] as string[], opts: execFileImpl.mock.calls[1][2] as { cwd?: string } }
    }
    const on = await run()
    for (const f of ['--disable-slash-commands', '--strict-mcp-config', '--safe-mode', '--no-session-persistence'])
      expect(on.args).toContain(f)
    expect(on.args[on.args.indexOf('--tools') + 1]).toBe('')
    expect(on.args[on.args.indexOf('--setting-sources') + 1]).toBe('')
    expect(on.args[on.args.indexOf('--system-prompt') + 1]).toBe('s') // still a full replace, never --append; no guard: no tools to guard
    expect(on.args).not.toContain('--append-system-prompt')
    expect(on.opts.cwd).toMatch(/sfs-cli-clean$/)

    process.env.SFS_CLI_ISOLATE = '0'
    const off = await run()
    for (const f of ['--tools', '--disable-slash-commands', '--strict-mcp-config', '--setting-sources', '--safe-mode', '--no-session-persistence'])
      expect(off.args).not.toContain(f)
    expect(off.opts.cwd).toBeUndefined()
    expect(off.args[off.args.indexOf('--system-prompt') + 1]).toMatch(/^This is a design task, not a coding task: .*\n\ns$/)
  })
})
