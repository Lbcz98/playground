import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { renderAuditFiles, RenderAuditUnavailable, type RenderResult } from '../../../scripts/render-audit'
import { DTV_TEMPLATES } from '../../../scripts/storybook/dtv-templates'
import type { BlueprintDocument } from '../blueprint'
import { exportBlueprintToTsx } from './toTsx'

/** The render check needs Playwright and a Chromium; where they are missing the suite skips instead of failing. */
const OUT = join(fileURLToPath(new URL('../../..', import.meta.url)), '.export-test-render')
const ref = (id: string): string => exportBlueprintToTsx(DTV_TEMPLATES.find((t) => t.id === id)!.blueprint as BlueprintDocument).code

let results: Map<string, RenderResult> | undefined
let unavailable: string | undefined

beforeAll(async () => {
  mkdirSync(OUT, { recursive: true })
  const files: Record<string, string> = {
    'ok.tsx': ref('interactivity-cards-right'),
    'ok-home.tsx': ref('home'),
    // a container inside the root that covers the frame with a surface
    'fill.tsx': ref('home').replace('<Stack direction="column"', '<Stack background="primary" direction="column"'),
    // more rows than the card holds
    'cut.tsx': ref('interactivity-cards-right').replace(/<TableCell type="team" name="ARG"[^>]*\/>/, (row) => row.repeat(12)),
  }
  for (const [name, code] of Object.entries(files)) writeFileSync(join(OUT, name), code)
  try {
    const out = await renderAuditFiles(Object.keys(files).map((name) => join(OUT, name)))
    results = new Map(out.map((r) => [r.file.split('/').pop()!, r]))
  } catch (e) {
    if (!(e instanceof RenderAuditUnavailable)) throw e
    unavailable = e.message
  }
}, 180_000)
afterAll(() => rmSync(OUT, { recursive: true, force: true }))

describe('the render check on screens written as TSX', () => {
  const messages = (r: RenderResult): string[] => r.issues.map((i) => i.message)
  const run = (name: string, check: (r: RenderResult) => void) => (): void => {
    if (!results) return void console.warn(`skipped: ${unavailable}`)
    check(results.get(name)!)
  }

  it('is silent on the exported reference screens', run('ok.tsx', (r) => expect(r.issues).toEqual([])))
  it('is silent on the home', run('ok-home.tsx', (r) => expect(r.issues).toEqual([])))
  it(
    'names a container that covers the frame with a background',
    run('fill.tsx', (r) => expect(messages(r).join('\n')).toMatch(/paints a background over the whole frame/)),
  )
  it('counts what a card cuts off', run('cut.tsx', (r) => expect(messages(r).join('\n')).toMatch(/cuts off/)))

  // The kit moves (a 3s carousel in the menu, a 12s focus cycle): a measurement taken mid-motion depends on when it was taken.
  it('measures with motion off, and only once the screen has stopped changing', run('ok-home.tsx', (r) => {
    expect(r.error).toBeUndefined()
    expect(r.motion).toBe('reduced')
    expect(r.settledAfter).toBeGreaterThanOrEqual(2)
  }))
  // Vite re-optimizes dependencies on a cold cache (every CI run) and reloads the page in the middle of the measurement.
  it('measures a screen whose page reloads once, after it was ready', async () => {
    if (!results) return void console.warn(`skipped: ${unavailable}`)
    const reload = "if (!sessionStorage.getItem('reloaded')) { sessionStorage.setItem('reloaded', '1'); setTimeout(() => location.reload(), 120) }\n"
    writeFileSync(join(OUT, 'reload.tsx'), reload + ref('home'))
    const [r] = await renderAuditFiles([join(OUT, 'reload.tsx')])
    expect(r.error).toBeUndefined()
    expect(r.measured).toEqual(results.get('ok-home.tsx')!.measured)
  }, 120_000)
  it('reads the same rectangles on a second run', async () => {
    if (!results) return void console.warn(`skipped: ${unavailable}`)
    const [again] = await renderAuditFiles([join(OUT, 'ok-home.tsx')])
    expect(again.measured).toEqual(results.get('ok-home.tsx')!.measured)
  }, 120_000)
})
