import { existsSync } from 'node:fs'
import { describe, expect, it, vi } from 'vitest'
import { isDesignerCode as rule } from '../src/shared/protoFolders'
// @ts-expect-error plain .mjs without types: a hook must run on a bare node
import { isDesignerCode, runHook } from './hook-check-protos.mjs'

const call = (file: unknown) => JSON.stringify({ tool_name: 'Write', tool_input: { file_path: file } })
const spawn = () => vi.fn(() => ({ status: 0 }))

describe('the pre-filter of the edit hook', () => {
  it('does not start the checker for a path outside web/protos/<designer>/ code', () => {
    for (const f of ['/r/src/ui-kit/Screen.tsx', '/r/web/protos/ana/notes.md', '/r/web/protos/ana/data.json', '/r/web/protos/x.tsx']) {
      const s = spawn()
      expect(runHook(call(f), s), f).toBe(0)
      expect(s, f).not.toHaveBeenCalled()
    }
  })
  it('starts the checker for a designer .tsx, with the original stdin', () => {
    const s = spawn()
    const input = call('/r/web/protos/ana/home.tsx')
    expect(runHook(input, s)).toBe(0)
    expect(s).toHaveBeenCalledOnce()
    expect((s.mock.calls[0] as unknown[])[2]).toMatchObject({ input })
  })
  it('starts an entry that is installed', () => {
    const s = spawn()
    runHook(call('/r/web/protos/ana/a.tsx'), s)
    const [, args] = s.mock.calls[0] as unknown as [string, string[]]
    expect(existsSync(args[0]), args[0]).toBe(true)
  })
  it('starts the checker when the path cannot be read, so nothing is skipped silently', () => {
    for (const input of ['not json', '{}', call(42)]) {
      const s = spawn()
      runHook(input, s)
      expect(s, input).toHaveBeenCalledOnce()
    }
  })
  it('applies the same rule as isDesignerCode', () => {
    for (const f of ['/r/web/protos/ana/a.tsx', '/r/web/protos/ana/a.ts', '/r/web/protos/ana/a.md', '/r/web/protos/ana', 'web/protos/ana/b/c.tsx', '/r/src/a.tsx', '/r/web/protos/ana/a.tsx.bak']) expect(isDesignerCode(f), f).toBe(rule(f))
  })
})
