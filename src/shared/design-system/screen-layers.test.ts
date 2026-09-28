import { describe, expect, it } from 'vitest'
import {
  DTV_SCREEN_LAYERS,
  auditScreenLayers,
  defaultScreen,
  screenLayersOf,
  staticContentSide,
} from './screen-layers'
import { type DesignSystemManifest, manifestZodSchema } from './manifest'
import { SCREENFLOW_MANIFEST } from './screenflow-manifest'
import { W3C_MANIFEST } from '@/shared/fixtures/w3cManifest'
import { CSS_VARS } from '@/styles/global-tokens'
import { homeTemplate } from '@/shared/templates/home'
import { interpretBlueprint } from '@/interpreter/interpret'
import { frameLayoutErrors } from '@/shared/layout/frame'
import { homeNotificationTemplate } from '@/shared/templates/homeNotification'
import { homeScheduleTemplate } from '@/shared/templates/homeSchedule'

const S = SCREENFLOW_MANIFEST
const doc = (screen: unknown, root: Record<string, unknown>) => ({ version: 1, screen, root: { type: 'Stack', ...root } })
const clear = { surface: 'none' }

describe('the DTV layer rule', () => {
  it('stacks video → overlay → content', () => {
    expect(DTV_SCREEN_LAYERS.stack).toEqual(['video', 'overlay', 'content'])
  })

  it('carries the Figma Modelos table, shade for shade', () => {
    const table = Object.fromEntries(DTV_SCREEN_LAYERS.models.map((m) => [m.id, [m.level, m.side ?? null, m.shades]]))
    expect(table).toEqual({
      alert: [0, 'right', ['bottom-right']],
      notification: [0, 'right', ['top-right']],
      home: [1, null, ['scrim', 'bottom', 'bottom-right', 'bottom-left']],
      'home-notification': [1, null, ['scrim', 'bottom', 'top-right', 'bottom-right', 'bottom-left']],
      'home-buttons-right': [1, 'right', ['scrim', 'bottom', 'bottom-right']],
      'home-buttons-left': [1, 'left', ['scrim', 'bottom', 'bottom-left']],
      // Not in the Figma table: the left rail's shades plus the notification's corner.
      'home-buttons-left-notification': [1, 'left', ['scrim', 'bottom', 'top-right', 'bottom-left']],
      'interactivity-buttons-right': [2, 'right', ['scrim', 'bottom-right', 'bottom']],
      'interactivity-buttons-left': [2, 'left', ['scrim', 'bottom-left', 'bottom']],
      'interactivity-cards-right': [3, 'right', ['scrim', 'bottom-right', 'right']],
      'interactivity-cards-left': [3, 'left', ['scrim', 'bottom-left', 'left']],
    })
  })

  it('has a model for the left rail with a notification, and that Home passes the whole audit', () => {
    const schedule = structuredClone(homeScheduleTemplate.blueprint)
    const notificationRow = homeNotificationTemplate.blueprint.root.children![0]
    const screen = {
      ...schedule,
      screen: { model: 'home-buttons-left-notification', level: 1 as const },
      root: { ...schedule.root, props: { ...schedule.root.props, justify: 'between' }, children: [notificationRow, ...schedule.root.children!] },
    }
    expect(frameLayoutErrors(screen, S)).toEqual([])
  })

  it('paints every shade with a real semantic token from global.css', () => {
    for (const name of Object.values(DTV_SCREEN_LAYERS.shades)) {
      expect(CSS_VARS).toContain(name)
      expect(name).toContain('-semantic-')
    }
  })

  it('has the three navigation levels, plus the clean broadcast', () => {
    expect(DTV_SCREEN_LAYERS.levels.map((l) => [l.level, l.name, l.maxModules])).toEqual([
      [0, 'Transmissão limpa', 1],
      [1, 'Home', null],
      [2, 'Trilho focado', 1],
      [3, 'Interatividade única', 1],
    ])
  })

  it('is declared by both built-in systems, and is the fallback for any other', () => {
    expect(SCREENFLOW_MANIFEST.screenLayers).toBe(DTV_SCREEN_LAYERS)
    expect(W3C_MANIFEST.screenLayers).toBe(DTV_SCREEN_LAYERS)
    const imported: DesignSystemManifest = { ...W3C_MANIFEST, screenLayers: undefined }
    expect(screenLayersOf(imported)).toBe(DTV_SCREEN_LAYERS)
    expect(defaultScreen(DTV_SCREEN_LAYERS)).toEqual({ model: 'home', level: 1 })
  })
})

describe('the layer rule in the manifest schema', () => {
  it('accepts the DTV rule and rejects a broken one', () => {
    expect(manifestZodSchema.safeParse(SCREENFLOW_MANIFEST).success).toBe(true)
    const withModels = (models: unknown[]) => ({ ...W3C_MANIFEST, screenLayers: { ...DTV_SCREEN_LAYERS, models } })
    const home = DTV_SCREEN_LAYERS.models[2]
    expect(manifestZodSchema.safeParse(withModels([home, home])).success).toBe(false) // duplicate id
    expect(manifestZodSchema.safeParse(withModels([{ ...home, shades: ['glow'] }])).success).toBe(false)
    expect(manifestZodSchema.safeParse(withModels([{ ...home, level: 4 }])).success).toBe(false)
    const noLevel2 = { ...W3C_MANIFEST, screenLayers: { ...DTV_SCREEN_LAYERS, levels: DTV_SCREEN_LAYERS.levels.filter((l) => l.level !== 2) } }
    expect(manifestZodSchema.safeParse(noLevel2).success).toBe(false) // models on level 2 remain
  })

  it('still loads a manifest saved with the token tiers under the old `layers` key', () => {
    const { tokenTiers, ...rest } = W3C_MANIFEST
    const parsed = manifestZodSchema.safeParse({ ...rest, layers: tokenTiers })
    expect(parsed.success).toBe(true)
    if (parsed.success) expect(parsed.data.tokenTiers).toEqual(tokenTiers)
  })
})

describe('auditScreenLayers', () => {
  it('passes the home template', () => {
    expect(auditScreenLayers(homeTemplate.blueprint, S)).toEqual([])
  })

  it('requires a real model, listing the choices', () => {
    expect(auditScreenLayers({ version: 1, root: { type: 'Stack' } }, S)).toEqual([
      expect.stringMatching(/^The screen names no layer model\. Add "screen": .* "home" \(level 1\)/),
    ])
    expect(auditScreenLayers(doc({ model: 'hero', level: 1 }, { props: clear }), S)).toEqual([
      expect.stringMatching(/^screen\.model "hero" is not a layer model\. Use one of "alert" \(level 0\)/),
    ])
  })

  it('ties the level to the model', () => {
    expect(auditScreenLayers(doc({ model: 'interactivity-cards-right', level: 1 }, { props: { ...clear, align: 'end' } }), S)).toEqual([
      expect.stringMatching(/^screen\.level 1 doesn't match "interactivity-cards-right" .* a level 3 screen \(Interatividade única\) — set "level": 3/),
    ])
  })

  it('keeps levels 2 and 3 to one content module, with an optional anchored cluster', () => {
    const card = { type: 'Stack' }
    const close = { type: 'Button', anchor: true }
    const screen = { model: 'interactivity-cards-right', level: 3 }
    const props = { ...clear, align: 'end' }
    expect(auditScreenLayers(doc(screen, { props, children: [card, close] }), S)).toEqual([])
    expect(auditScreenLayers(doc(screen, { props, children: [card, card, close] }), S)).toEqual([
      expect.stringMatching(/^A level 3 screen \(Interatividade única\) shows a single content module: the outermost container has 2 un-anchored children/),
    ])
  })

  it('anchors nothing on the clean broadcast', () => {
    const problems = auditScreenLayers(
      doc({ model: 'alert', level: 0 }, { props: { ...clear, align: 'end' }, children: [{ type: 'Stack' }, { type: 'Button', anchor: true }] }),
      S,
    )
    expect(problems).toEqual([expect.stringMatching(/^A level 0 screen \(Transmissão limpa\) anchors nothing/)])
  })

  it('puts the content on the side the model shades', () => {
    const screen = { model: 'home-buttons-right', level: 1 }
    expect(auditScreenLayers(doc(screen, { props: { ...clear, align: 'start' } }), S)).toEqual([
      expect.stringMatching(/shades the right side, but the outermost container puts its content on the left — set align "end", or pick a left model/),
    ])
    expect(auditScreenLayers(doc(screen, { props: { ...clear, align: 'end' } }), S)).toEqual([])
    // Stretched content can't be judged from props — the canvas reads the focus instead.
    expect(auditScreenLayers(doc(screen, { props: { ...clear, align: 'stretch' } }), S)).toEqual([])
    const row = { ...clear, direction: 'horizontal', justify: 'start' }
    expect(auditScreenLayers(doc(screen, { props: row }), S)).toEqual([
      expect.stringMatching(/set justify "end"/),
    ])
  })

  it('keeps the content layer transparent', () => {
    expect(auditScreenLayers(doc({ model: 'home', level: 1 }, { props: { surface: 'surface' } }), S)).toEqual([
      expect.stringMatching(/^The content layer is transparent .* sets surface "none" \(got "surface"\)/),
    ])
  })

  it('reads the content side from the root props alone', () => {
    expect(staticContentSide(S, { type: 'Stack', props: { align: 'end' } })).toBe('right')
    expect(staticContentSide(S, { type: 'Stack', props: { direction: 'horizontal', justify: 'between' } })).toBeNull()
    expect(staticContentSide(S, { type: 'Stack' })).toBeNull() // align defaults to stretch
    expect(staticContentSide(W3C_MANIFEST, { type: 'Container' })).toBeNull()
  })

  it('asks nothing of a system that declares no models', () => {
    const none: DesignSystemManifest = { ...S, screenLayers: { ...DTV_SCREEN_LAYERS, models: [] } }
    expect(auditScreenLayers({ version: 1, root: { type: 'Stack' } }, none)).toEqual([])
  })
})

describe('the interpreter repairs the layer rule', () => {
  it('falls back to Home when the screen names no model, or an unknown one', () => {
    for (const screen of [undefined, { model: 'hero', level: 2 }]) {
      const result = interpretBlueprint({ version: 1, screen, root: { type: 'Stack' } }, S)
      expect(result.ok).toBe(true)
      if (!result.ok) continue
      expect(result.tree.screen).toEqual({ model: 'home', level: 1 })
      expect(result.issues.some((i) => i.path === 'screen' && /used Home \(level 1\)/.test(i.message))).toBe(true)
    }
  })

  it('sets the level from the model', () => {
    const result = interpretBlueprint({ version: 1, screen: { model: 'notification', level: 2 }, root: { type: 'Stack' } }, S)
    expect(result.ok && result.tree.screen).toEqual({ model: 'notification', level: 0 })
    expect(result.issues.map((i) => i.message)).toContain('Set the level to 0 — Notificação is a level 0 screen (was 2).')
  })

  it('clears a root that paints over the video and the overlay', () => {
    const result = interpretBlueprint({ version: 1, screen: { model: 'home', level: 1 }, root: { type: 'Stack', props: { surface: 'subtle' } } }, S)
    expect(result.ok && result.tree.props.surface).toBe('none')
    expect(result.issues.some((i) => /Set surface to "none" on the root/.test(i.message))).toBe(true)
  })
})
