import { mkdirSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { DTV_TEMPLATES } from '../../../scripts/storybook/dtv-templates'
import { loadDtvManifest } from '../../../scripts/dtv-manifest'
import { validateBlueprintAgainstManifest } from '../design-system/manifest-zod'
import type { BlueprintDocument } from '../blueprint'
import { exportBlueprintToTsx } from './toTsx'
import { parseTsx } from './fromTsx'

const manifest = loadDtvManifest
beforeAll(() => {
  manifest()
}, 120_000)

describe('TSX → blueprint, round trip', () => {
  for (const t of DTV_TEMPLATES) {
    const doc = t.blueprint as BlueprintDocument
    const screens = [{ screen: doc.screen, root: doc.root }, ...(doc.screens ?? []).map((s) => ({ screen: s.screen, root: s.root }))]
    it(`reads back the blueprint it was exported from — ${t.id}`, () => {
      const { code } = exportBlueprintToTsx(doc, { componentName: doc.name ? undefined : t.name })
      const parsed = parseTsx(code)
      expect(parsed.map((p) => p.warnings)).toEqual(parsed.map(() => []))
      expect(parsed).toHaveLength(screens.length)
      parsed.forEach((p, i) => {
        expect(p.doc.screen).toMatchObject({ model: screens[i].screen!.model, level: screens[i].screen!.level })
        // The tree, minus what the blueprint carries that code has no place for (goTo is a link, not JSX).
        const strip = (n: unknown): unknown => {
          const { goTo: _goTo, children, ...rest } = n as { goTo?: string; children?: unknown[] }
          void _goTo
          return children ? { ...rest, children: children.map(strip) } : rest
        }
        const norm = (n: unknown): unknown => JSON.parse(JSON.stringify(strip(n)))
        const order = (n: any): any => ({ ...n, children: n.children && [...n.children.filter((c: any) => !c.anchor), ...n.children.filter((c: any) => c.anchor)].map(order) })
        expect(norm(order(p.doc.root))).toEqual(norm(order(screens[i].root)))
      })
    })
  }

  it('holds every exported reference screen to the rules book with no issue', () => {
    for (const t of DTV_TEMPLATES) {
      const { code } = exportBlueprintToTsx(t.blueprint as BlueprintDocument, { componentName: (t.blueprint as BlueprintDocument).name ? undefined : t.name })
      for (const p of parseTsx(code)) {
        const result = validateBlueprintAgainstManifest(p.doc, manifest(), 'exploratory')
        expect(result.ok ? [] : result.issues.map((i) => `${t.id}: ${i.ruleId} ${i.message}`)).toEqual([])
      }
    }
  })
})

const OUT = join(fileURLToPath(new URL('../../..', import.meta.url)), '.export-test-from')
beforeAll(() => mkdirSync(OUT, { recursive: true }))
afterAll(() => rmSync(OUT, { recursive: true, force: true }))

describe('what it reads and what it says it cannot', () => {
  const src = `
import { Stack } from '@/primitives'
import { MainMenu } from '@/ui-kit/MainMenu'
import { Screen } from '@/ui-kit/Screen'
/**
 * @deviation layout.no-static-center: asked for
 */
export default function Home() {
  const gap = 'sm'
  return (
    <Screen model="home" level={1}>
      <Stack gap={gap} align="stretch">
        {/* @deviation layout.slots: why */}
        <MainMenu focusedItem={null} />
        {[1, 2].map((n) => <MainMenu key={n} />)}
        text
      </Stack>
    </Screen>
  )
}
`
  it('carries literals, screen and node declarations, and warns about the rest', () => {
    const [p] = parseTsx(src)
    expect(p.component).toBe('Home')
    expect(p.doc.screen).toEqual({ model: 'home', level: 1, deviation: [{ ruleId: 'layout.no-static-center', why: 'asked for' }] })
    expect(p.doc.root.children?.[0]).toEqual({ type: 'MainMenu', props: { focusedItem: null }, deviation: { ruleId: 'layout.slots', why: 'why' } })
    expect(p.doc.root.props).toEqual({ align: 'stretch' }) // gap={gap} is not a literal
    expect(p.warnings.join('\n')).toMatch(/gap=\{…\}> is not a literal/)
    expect(p.warnings.join('\n')).toMatch(/computed child/)
    expect(p.warnings.join('\n')).toMatch(/text "text"/)
  })

  it('an anchored group becomes root children marked anchor', () => {
    const [p] = parseTsx(`export default function S() { return <Screen model="interactivity-cards-right" level={3} anchored={<CloseButton />}><Stack /></Screen> }`)
    expect(p.doc.root.children).toEqual([{ type: 'CloseButton', anchor: true }])
  })
})
