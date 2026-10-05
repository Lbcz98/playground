import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createElement, Fragment, type ComponentType, type ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import ts from 'typescript'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { DTV_TEMPLATES } from '../../../scripts/storybook/dtv-templates'
import type { BlueprintDocument, BlueprintNode } from '@/shared/blueprint'
import { DTV_SCREEN_LAYERS, screenModel } from '@/shared/design-system/screen-layers'
import { Screen } from '@/ui-kit/Screen'
import { DTV_KIT } from './kit'
import { exportBlueprintToTsx, TsxExportError } from './toTsx'

const ROOT = fileURLToPath(new URL('../../..', import.meta.url))
/** Inside the repo so `react` and the kit resolve; git-ignored; removed afterwards. */
const OUT = join(ROOT, '.export-test')

const home = DTV_TEMPLATES.find((t) => t.id === 'home')!.blueprint as BlueprintDocument

/** The same document with a deviation declared on a node and on the screen. */
function withDeviations(): BlueprintDocument {
  const doc = structuredClone(home)
  doc.screen = {
    ...doc.screen!,
    deviation: [{ ruleId: 'layers.overlay-model', why: 'The overlay is a custom mix */ not in the table' }],
  }
  doc.root.children![0].children![0].deviation = { ruleId: 'layout.slots', why: 'The rail sits\nabove the menu' }
  doc.notes = ['Uma nota da geração.']
  return doc
}

type Entry = { file: string; doc: BlueprintDocument; label: string }
const entries: Entry[] = [
  ...DTV_TEMPLATES.map((t) => ({ file: `${t.id}.tsx`, doc: t.blueprint as BlueprintDocument, label: t.id })),
  { file: 'deviations.tsx', doc: withDeviations(), label: 'home with declared deviations' },
]

const exported = new Map<string, ReturnType<typeof exportBlueprintToTsx>>()
const modules = new Map<string, Record<string, unknown>>()
let components: Record<string, ComponentType<Record<string, unknown>>> = {}

beforeAll(async () => {
  rmSync(OUT, { recursive: true, force: true })
  mkdirSync(OUT, { recursive: true })
  for (const entry of entries) {
    // Like the script: a document that names itself keeps its name; the rest take the label.
    const result = exportBlueprintToTsx(entry.doc, { componentName: entry.doc.name ? undefined : entry.label.replace(/[^a-z]+/gi, ' ') })
    exported.set(entry.file, result)
    writeFileSync(join(OUT, entry.file), result.code)
  }
  for (const entry of entries) modules.set(entry.file, await import(/* @vite-ignore */ join(OUT, entry.file)))

  const loaded = await Promise.all(
    Object.entries(DTV_KIT).map(async ([type, kit]) => [type, (await import(/* @vite-ignore */ kit.module))[kit.name]] as const),
  )
  components = Object.fromEntries(loaded)
}, 60_000)

afterAll(() => rmSync(OUT, { recursive: true, force: true }))

// ---------------------------------------------------------------------------
// The reference: the same blueprint, built straight from the kit with no code in between
// ---------------------------------------------------------------------------

function direct(node: BlueprintNode, key?: number): ReactNode {
  const component = components[node.type]
  const children = (node.children ?? []).map((child, index) => direct(child, index))
  return createElement(component, { ...node.props, key }, ...children)
}

function directScreen(spec: BlueprintDocument['screen'], root: BlueprintNode): ReactNode {
  const model = screenModel(DTV_SCREEN_LAYERS, spec!.model)!
  const anchored = (root.children ?? []).filter((child) => child.anchor)
  const content = { ...root, children: (root.children ?? []).filter((child) => !child.anchor) }
  return createElement(
    Screen,
    {
      model: model.id,
      level: spec!.level,
      focusSide: model.side === 'left' ? 'left' : 'right',
      anchored: anchored.length > 0 ? createElement(Fragment, null, ...anchored.map((n, i) => direct(n, i))) : undefined,
    },
    direct(content),
  )
}

function screensOf(doc: BlueprintDocument): { spec: BlueprintDocument['screen']; root: BlueprintNode }[] {
  return [{ spec: doc.screen, root: doc.root }, ...(doc.screens ?? []).map((s) => ({ spec: s.screen, root: s.root }))]
}

// ---------------------------------------------------------------------------

describe('the kit map', () => {
  it('names a real export for every type', () => {
    for (const [type, kit] of Object.entries(DTV_KIT)) {
      expect(typeof components[type], `${type} → ${kit.module}`).toBe('function')
    }
  })
})

describe('exported code, per screen', () => {
  for (const entry of entries) {
    it(`renders exactly what the blueprint says — ${entry.label}`, () => {
      const result = exported.get(entry.file)!
      const mod = modules.get(entry.file)!
      screensOf(entry.doc).forEach((screen, index) => {
        const Exported = mod[result.screens[index].component] as ComponentType
        const html = renderToStaticMarkup(createElement(Exported))
        expect(html.length).toBeGreaterThan(500) // a real screen, so equality is not two empty strings
        expect(html).toBe(renderToStaticMarkup(directScreen(screen.spec, screen.root) as never))
      })
    })
  }

  it('is the frame, three layers in order, then the anchored zone', () => {
    const html = renderToStaticMarkup(createElement(modules.get('interactivity-cards-left.tsx')!.default as ComponentType))
    const order = ['data-screen-layer="video"', 'data-screen-layer="overlay"', 'data-screen-layer="content"', 'data-anchor-zone="bottom-left"']
    const at = order.map((needle) => html.indexOf(needle))
    expect(at.every((i) => i >= 0)).toBe(true)
    expect([...at].sort((a, b) => a - b)).toEqual(at)
    expect(html).toContain('data-screen-model="interactivity-cards-left"')
    expect(html).toContain('data-screen-level="3"')
  })

  it('pins the anchored group to the right unless the model favours the left', () => {
    const right = renderToStaticMarkup(createElement(modules.get('interactivity-cards-right.tsx')!.default as ComponentType))
    expect(right).toContain('data-anchor-zone="bottom-right"')
  })
})

describe('exported code, as source', () => {
  for (const entry of entries) {
    it(`carries no raw value, no style and no class — ${entry.label}`, () => {
      const { code } = exported.get(entry.file)!
      expect(code).not.toMatch(/#[0-9a-fA-F]{3,8}\b/)
      expect(code).not.toMatch(/\b\d+px\b/)
      expect(code).not.toMatch(/\b(style|className)=/)
    })
  }

  it('imports only the kit and React', () => {
    for (const { code } of exported.values()) {
      const modulesUsed = [...code.matchAll(/from '([^']+)'/g)].map((m) => m[1])
      for (const module of modulesUsed) expect(module === 'react' || module === '@/primitives' || module.startsWith('@/ui-kit/')).toBe(true)
    }
  })

  it('compiles against the real props of every kit component', () => {
    const files = entries.map((e) => join(OUT, e.file))
    const configPath = ts.findConfigFile(ROOT, ts.sys.fileExists, 'tsconfig.json')!
    const config = ts.parseJsonConfigFileContent(ts.readConfigFile(configPath, ts.sys.readFile).config, ts.sys, ROOT)
    const program = ts.createProgram(files, { ...config.options, noEmit: true })
    const problems = ts
      .getPreEmitDiagnostics(program)
      .filter((d) => d.file && files.includes(d.file.fileName))
      .map((d) => `${d.file!.fileName.split('/').pop()}: ${ts.flattenDiagnosticMessageText(d.messageText, '\n')}`)
    expect(problems).toEqual([])
  }, 120_000)
})

describe('declared deviations and the flow', () => {
  it('travel as comments the lint can read, and cannot close the comment they sit in', () => {
    const { code } = exported.get('deviations.tsx')!
    expect(code).toContain('@deviation layers.overlay-model: The overlay is a custom mix * / not in the table')
    expect(code).toContain('{/* @deviation layout.slots: The rail sits above the menu */}')
    expect(code).toContain('Uma nota da geração.')
  })

  it('lists each link with the component it opens', () => {
    const { code, screens } = exported.get('prototype-flow.tsx')!
    expect(screens.map((s) => [s.id, s.component])).toEqual([
      ['home', 'Home'],
      ['rail', 'Trilho'],
      ['stats', 'Estatisticas'],
    ])
    expect(code).toContain('→ rail (Trilho)')
    expect(code).toContain('→ stats (Estatisticas)')
    expect(code.match(/→ rail \(Trilho\)/g)).toHaveLength(2) // Home's card and the back button
  })
})

describe('what it refuses', () => {
  const doc = (root: BlueprintNode, screen: BlueprintDocument['screen'] = { model: 'home', level: 1 }): BlueprintDocument => ({
    version: 1,
    screen,
    root,
  })

  it('a primitive, with a way out', () => {
    expect(() => exportBlueprintToTsx(doc({ type: 'Stack', children: [{ type: 'primitive:Box' }] }))).toThrow(/Exploratory vocabulary/)
  })

  it('a Proposal', () => {
    expect(() => exportBlueprintToTsx(doc({ type: 'Stack', children: [{ type: 'Proposal' }] }))).toThrow(TsxExportError)
  })

  it('a type the kit map does not know, and says to translate a catalog blueprint', () => {
    expect(() => exportBlueprintToTsx(doc({ type: 'Button' }))).toThrow(/not in the kit map.*translated/s)
  })

  it('a composed overlay and an unknown layer model', () => {
    expect(() => exportBlueprintToTsx(doc({ type: 'Stack' }, { model: 'composed', level: 1, shades: ['scrim'] }))).toThrow(/composed overlay/)
    expect(() => exportBlueprintToTsx(doc({ type: 'Stack' }, { model: 'nope', level: 1 }))).toThrow(/not a layer model/)
  })
})

describe('options', () => {
  it('rewrites module paths for the app that consumes the kit', () => {
    const { code } = exportBlueprintToTsx(home, { resolveModule: (m) => m.replace('@/ui-kit/', '@globo/dtv-kit/').replace('@/primitives', '@globo/dtv-kit') })
    expect(code).toContain("from '@globo/dtv-kit/MainMenu'")
    expect(code).toContain("from '@globo/dtv-kit/Screen'")
    expect(code).toContain("import { Stack } from '@globo/dtv-kit'")
  })

  it('never names a component after something it imports', () => {
    const { screens } = exportBlueprintToTsx({ ...home, name: 'Main Menu' })
    expect(screens[0].component).toBe('MainMenuView')
    expect(exportBlueprintToTsx({ ...home, name: 'Screen' }).screens[0].component).toBe('ScreenView')
  })
})
