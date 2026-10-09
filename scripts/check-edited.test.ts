import { afterAll, afterEach, describe, expect, it, vi } from 'vitest'
import { CASES } from '../tests/checks/corpus/cases'
import { cleanCorpus, writeCase } from '../tests/checks/run'
import { editedFile, findingsFor } from './check-edited'

const call = (file: unknown) => JSON.stringify({ tool_name: 'Write', tool_input: { file_path: file } })
const exists = (f: string) => f !== '/r/web/protos/ana/gone.tsx'

describe('the file the hook checks after an edit', () => {
  it('is any .tsx or .ts of a designer folder: a screen, a component, a flow.ts, data', () => {
    for (const f of ['/r/web/protos/ana/home.tsx', '/r/web/protos/ana/components/Card.tsx', '/r/web/protos/ana/buy/flow.ts', '/r/web/protos/ana/data.ts']) expect(editedFile(call(f), exists)).toBe(f)
  })
  it('is nothing for any other file: outside web/protos, not code of the folder, gone, or not a tool call', () => {
    for (const f of ['/r/src/ui-kit/Screen.tsx', '/r/web/protos/ana/notes.md', '/r/web/protos/ana/data.json', '/r/web/protos/ana/gone.tsx', 42]) expect(editedFile(call(f), exists), String(f)).toBeUndefined()
    expect(editedFile('not json', exists)).toBeUndefined()
    expect(editedFile('{}', exists)).toBeUndefined()
  })
})

describe('what the hook hands back to the agent', () => {
  afterAll(cleanCorpus)
  afterEach(() => void vi.unstubAllEnvs())
  it('is the lines of check:laws under one sentence of what to do, when the run blocks', async () => {
    vi.stubEnv('CHROMIUM_PATH', '/nonexistent')
    const said = await findingsFor(writeCase(CASES.find((c) => c.id === 'focus-two')!))
    expect(said?.split('\n')).toEqual([
      expect.stringMatching(/^check:laws encontrou bloqueios depois desta edição\. .*CODING_STANDARDS\.md\)\.$/),
      expect.stringMatching(/focus-two\/s\.tsx:\d+  \[focus\.single\] 2 focused elements/),
      expect.stringMatching(/focus-two\/s\.tsx  \[level\.initial-focus\] /),
      expect.stringMatching(/focus-two\/s\.tsx  not read: render check did not run: Chromium could not start/),
      expect.stringMatching(/^Chromium could not start/),
    ])
  }, 120_000)
})
