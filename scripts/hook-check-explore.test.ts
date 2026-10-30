import { describe, expect, it, vi } from 'vitest'
// @ts-expect-error plain .mjs without types: a hook must run on a bare node
import { explorationFile, runHook } from './hook-check-explore.mjs'

const call = (file: unknown) => JSON.stringify({ tool_name: 'Write', tool_input: { file_path: file } })
const spawn = (status: number, stdout = '', stderr = '') => vi.fn(() => ({ status, stdout, stderr }))

describe('the exploration token hook', () => {
  it('checks only an exploration page or one of its parts', () => {
    expect(explorationFile(call('/r/docs/explorations/clima/index.html'))).toBe('/r/docs/explorations/clima/index.html')
    expect(explorationFile(call('docs/explorations/clima/parts/3.html'))).toBe('docs/explorations/clima/parts/3.html')
    for (const f of ['/r/docs/explorations/clima/brief.md', '/r/docs/explorations/clima/pack/1.md', '/r/docs/explorations/clima/tune-parts/9.html', '/r/docs/explorations/_template/x/y.html', '/r/web/protos/ana/home.tsx', 42])
      expect(explorationFile(call(f)), String(f)).toBeUndefined()
    expect(explorationFile('not json')).toBeUndefined()
  })

  it('does not start the checker for any other file', () => {
    const s = spawn(0)
    expect(runHook(call('/r/src/ui-kit/Screen.tsx'), s)).toEqual([0, '', ''])
    expect(s).not.toHaveBeenCalled()
  })

  it('is silent on ok, hands advice back as context, and blocks with the failures', () => {
    const file = '/r/docs/explorations/clima/parts/1.html'
    expect(runHook(call(file), spawn(0, 'ok'))).toEqual([0, '', ''])
    const [code, out] = runHook(call(file), spawn(0, 'advisory: width: 288px is kit size content-card-width\nok'))
    expect(code).toBe(0)
    expect(JSON.parse(out).hookSpecificOutput.additionalContext).toContain('288px is kit size')
    const [fail, , err] = runHook(call(file), spawn(1, '', 'literal color #fff: use --color-semantic-*'))
    expect(fail).toBe(2)
    expect(err).toContain('literal color #fff')
  })
})
