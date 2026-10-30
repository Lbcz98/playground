import { browserDescribe } from './browser'
import { afterAll, expect, it } from 'vitest'
import { CASES } from './corpus/cases'
import { rmSync } from 'node:fs'
import { join } from 'node:path'
import { OUT, writeCase } from './run'
import { renderAuditFiles } from '../../scripts/render-audit'

// Only our own two folders: other test files share OUT and may be rendering from it.
afterAll(() => ['link-render-with', 'link-render-without'].forEach((d) => rmSync(join(OUT, d), { recursive: true, force: true })))

/** Missing Chromium must fail unless browser coverage was explicitly disabled locally. */
browserDescribe('<Link> around a presentation-mode kit control', () => {
  it('keeps the kit-node rectangles identical to the unwrapped control', async () => {
    const withLink = CASES.find((c) => c.id === 'link-home-to-rail')!
    const source = withLink.files['home.tsx'].replace('<InteractivityButton ', '<InteractivityButton as="span" ')
    const linked = { ...withLink, id: 'link-render-with', files: { ...withLink.files, 'home.tsx': source.replace('<Link href=', '<Link style={{ display: "inline-block" }} href=') } }
    const plain = { ...withLink, id: 'link-render-without', files: { ...withLink.files, 'home.tsx': source.replace(/<Link[^>]*>(.*?)<\/Link>/, '$1').replace("import Link from 'next/link'\n", '') } }
    const [a, b] = await renderAuditFiles([writeCase(linked), writeCase(plain)])
    expect(a.error ?? b.error).toBeUndefined()
    const rects = (r: typeof a) => r.measured!.nodes.map(({ id: _id, clip: _c, paints: _p, ...rest }) => rest)
    expect(rects(a).length).toBeGreaterThan(3)
    expect(rects(a)).toEqual(rects(b))
  }, 180_000)
})
