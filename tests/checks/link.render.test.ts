import { afterAll, describe, expect, it } from 'vitest'
import { CASES } from './corpus/cases'
import { rmSync } from 'node:fs'
import { join } from 'node:path'
import { OUT, writeCase } from './run'
import { renderAuditFiles, RenderAuditUnavailable } from '../../scripts/render-audit'

// Only our own two folders: other test files share OUT and may be rendering from it.
afterAll(() => ['link-render-with', 'link-render-without'].forEach((d) => rmSync(join(OUT, d), { recursive: true, force: true })))

/** Needs Chromium; without it the test says so and skips (a skip is not a pass). */
describe('<Link> does not change measured layout', () => {
  it('the kit-node rectangles are identical with and without the wrapper', async () => {
    const withLink = CASES.find((c) => c.id === 'link-home-to-rail')!
    const linked = { ...withLink, id: 'link-render-with', files: { ...withLink.files, 'home.tsx': withLink.files['home.tsx'].replaceAll('link-home-to-rail', 'link-render-with') } }
    const plain = { ...withLink, id: 'link-render-without', files: { ...withLink.files, 'home.tsx': withLink.files['home.tsx'].replace(/<Link href="[^"]*">(.*?)<\/Link>/, '$1').replace("import Link from 'next/link'\n", '') } }
    try {
      const [a, b] = await renderAuditFiles([writeCase(linked), writeCase(plain)])
      expect(a.error ?? b.error).toBeUndefined()
      const rects = (r: typeof a) => r.measured!.nodes.map(({ id: _id, clip: _c, paints: _p, ...rest }) => rest)
      expect(rects(a).length).toBeGreaterThan(3)
      expect(rects(a)).toEqual(rects(b))
    } catch (e) {
      if (!(e instanceof RenderAuditUnavailable)) throw e
      console.warn(`skipped: ${e.message}`)
    }
  }, 180_000)
})
