/**
 * The layer rule (Camadas) for DTV+ — the rule the whole system is built on.
 *
 * Every screen is three layers, bottom to top: the video, an overlay combination
 * and the content. The engine draws the video and the overlay; a blueprint is the
 * content only, and names the model whose shades the engine paints under it.
 *
 * Sources in the Figma UI Kit (pJorqbzos2jKwZ2n9vaHEY):
 *   - "Camadas e profundidade", frame Camadas (2141:5679): the three navigation
 *     levels, and the way back from Home to the clean broadcast (level 0 here).
 *   - "Overlay", section Modelos (6147:23988): the shade combination of each
 *     screen type.
 *   - "Camadas e profundidade", set Sombras (2072:6605): the shade pieces — the
 *     standard their tokens follow (`gradient.overlay.*` in tokens.json).
 *
 * Framework-free — shared by the canvas, the interpreter and the AI pipeline.
 */

import {
  type DesignSystemManifest,
  type ManifestNavigationLevel,
  type ManifestScreenLayers,
  type ManifestScreenModel,
  type NavigationLevel,
  type ScreenSide,
  type ScreenSpec,
  NAVIGATION_LEVELS,
  SCREEN_LAYER_STACK,
  defaultForProp,
} from './manifest'

export const DTV_SCREEN_LAYERS: ManifestScreenLayers = {
  rule: 'Every screen is three layers, bottom to top: the video (the live broadcast or a VOD still), the overlay that keeps the content legible, and the content. The overlay is never free-form: each screen type uses one fixed combination of shade pieces, set by where its components occupy the screen, and each screen sits on a navigation level that limits what it shows.',
  stack: [...SCREEN_LAYER_STACK],
  shades: {
    scrim: '--color-semantic-overlay-scrim',
    bottom: '--gradient-semantic-overlay-bottom',
    'bottom-right': '--gradient-semantic-overlay-bottom-right',
    'bottom-left': '--gradient-semantic-overlay-bottom-left',
    right: '--gradient-semantic-overlay-right',
    left: '--gradient-semantic-overlay-left',
    'top-right': '--gradient-semantic-overlay-top-right',
  },
  levels: [
    {
      level: 0,
      name: 'Transmissão limpa',
      rule: 'The clean broadcast: only the video, plus at most one alert bug or one notification. No menu, no rail.',
      maxModules: 1,
      allowsAnchor: false,
    },
    {
      level: 1,
      name: 'Home',
      rule: 'The first navigation level, right after login: the main menu and the content rail. Everything on screen is reachable, and the channel logo leads back to the clean broadcast.',
      maxModules: null,
      allowsAnchor: true,
      initialFocus: {
        on: ['MainMenu'],
        value: 'channel-bug',
        hint: 'Focus starts on the channel rounded button (the main menu\'s channel-bug) and nowhere else — a focus on an interactivity button would already be the second level.',
      },
    },
    {
      level: 2,
      name: 'Trilho focado',
      rule: 'The second level: the viewer moved up into a content rail (or focused profile, schedule or alerts). The rest of the menu is hidden and the screen is cleared around that one rail.',
      maxModules: 1,
      allowsAnchor: true,
      initialFocus: {
        on: ['InteractivityCard', 'UiKitButton'],
        required: true,
        hint: 'Focus is on one of the interactivity buttons — that is what makes this the second level, a page of its own; the main menu is not on screen.',
      },
    },
    {
      level: 3,
      name: 'Interatividade única',
      rule: 'The third level: one interactivity needs more room (statistics, a line-up, a VOD page). Every other element is cleared; only that interactivity remains, with its close button as the anchored cluster.',
      maxModules: 1,
      allowsAnchor: true,
      initialFocus: {
        on: ['CloseButton', 'RoundedButton'],
        required: true,
        hint: 'Focus starts on the rounded button (the anchored close/back control), not on the interactivity itself.',
      },
    },
  ],
  models: [
    {
      id: 'alert',
      name: 'Alerta',
      level: 0,
      side: 'right',
      shades: ['bottom-right'],
      use: 'An interactivity alert bug in the bottom-right corner of the clean broadcast.',
    },
    {
      id: 'notification',
      name: 'Notificação',
      level: 0,
      side: 'right',
      shades: ['top-right'],
      use: 'A notification in the top-right corner of the clean broadcast — the one overlay without the scrim.',
    },
    {
      id: 'home',
      name: 'Home',
      level: 1,
      shades: ['scrim', 'bottom', 'bottom-right', 'bottom-left'],
      use: 'The home screen: the main menu along the bottom, with content on both sides.',
    },
    {
      id: 'home-notification',
      name: 'Home + Notificação',
      level: 1,
      shades: ['scrim', 'bottom', 'top-right', 'bottom-right', 'bottom-left'],
      use: 'The home screen while a notification shows in the top-right corner.',
    },
    {
      id: 'home-buttons-right',
      name: 'Home · Botões Direita',
      level: 1,
      side: 'right',
      shades: ['scrim', 'bottom', 'bottom-right'],
      use: 'The home screen with its buttons grouped on the right.',
    },
    {
      id: 'home-buttons-left',
      name: 'Home · Botões Esquerda',
      level: 1,
      side: 'left',
      shades: ['scrim', 'bottom', 'bottom-left'],
      use: 'The home screen with its buttons grouped on the left.',
    },
    {
      id: 'interactivity-buttons-right',
      name: 'Interatividades · Botões Direita',
      level: 2,
      side: 'right',
      shades: ['scrim', 'bottom-right', 'bottom'],
      use: 'A focused rail of interactivity buttons along the bottom, on the right.',
    },
    {
      id: 'interactivity-buttons-left',
      name: 'Interatividades · Botões Esquerda',
      level: 2,
      side: 'left',
      shades: ['scrim', 'bottom-left', 'bottom'],
      use: 'A focused rail of interactivity buttons along the bottom, on the left.',
    },
    {
      id: 'interactivity-cards-right',
      name: 'Interatividades · Cards Direita',
      level: 3,
      side: 'right',
      shades: ['scrim', 'bottom-right', 'right'],
      use: 'A single interactivity card or panel on the right (statistics, a line-up).',
    },
    {
      id: 'interactivity-cards-left',
      name: 'Interatividades · Cards Esquerda',
      level: 3,
      side: 'left',
      shades: ['scrim', 'bottom-left', 'left'],
      use: 'A single interactivity card or panel on the left.',
    },
  ],
}

/** The model a screen gets when it names none: Home. */
export const DEFAULT_SCREEN_MODEL = 'home'

/** The manifest's layer rule: its own, or the DTV rule. */
export function screenLayersOf(manifest: DesignSystemManifest): ManifestScreenLayers {
  return manifest.screenLayers ?? DTV_SCREEN_LAYERS
}

export function screenModel(layers: ManifestScreenLayers, id: unknown): ManifestScreenModel | undefined {
  return typeof id === 'string' ? layers.models.find((model) => model.id === id) : undefined
}

export function navigationLevel(
  layers: ManifestScreenLayers,
  level: unknown,
): ManifestNavigationLevel | undefined {
  return layers.levels.find((l) => l.level === level)
}

/** The default screen for a rule, or null when it has no models. */
export function defaultScreen(layers: ManifestScreenLayers): ScreenSpec | null {
  const model = screenModel(layers, DEFAULT_SCREEN_MODEL) ?? layers.models[0]
  return model ? { model: model.id, level: model.level } : null
}

export function isNavigationLevel(value: unknown): value is NavigationLevel {
  return (NAVIGATION_LEVELS as readonly unknown[]).includes(value)
}

// ---------------------------------------------------------------------------
// Where the content sits
// ---------------------------------------------------------------------------

interface LayerNode {
  type?: unknown
  props?: unknown
  children?: unknown
  anchor?: unknown
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

const START = new Set(['start', 'flex-start', 'left'])
const END = new Set(['end', 'flex-end', 'right'])

/**
 * The prop and values that put a container's content on one side: `align` on a
 * column, `justify` on a row. Null when the container can't place its content.
 */
export function sidePropFor(
  manifest: DesignSystemManifest,
  node: LayerNode,
): { prop: string; values: Record<ScreenSide, string> } | null {
  const component = typeof node.type === 'string' ? manifest.components[node.type] : undefined
  if (!component) return null
  const value = (name: string): unknown => {
    const prop = component.props[name]
    if (!prop) return undefined
    const props = isObject(node.props) ? node.props : {}
    return name in props ? props[name] : defaultForProp(prop)
  }
  const direction = value('direction')
  const name = direction === 'horizontal' || direction === 'row' ? 'justify' : 'align'
  const prop = component.props[name]
  if (!prop) return null
  const options = prop.options ?? []
  const left = options.find((o) => START.has(o)) ?? 'start'
  const right = options.find((o) => END.has(o)) ?? 'end'
  return { prop: name, values: { left, right } }
}

/**
 * The side the root puts its content on, read from its props alone: `left` or
 * `right`, or null when it spans the frame (stretch, space-between) or can't say.
 */
export function staticContentSide(manifest: DesignSystemManifest, root: LayerNode): ScreenSide | null {
  const side = sidePropFor(manifest, root)
  if (!side) return null
  const component = manifest.components[root.type as string]
  const props = isObject(root.props) ? root.props : {}
  const value = side.prop in props ? props[side.prop] : defaultForProp(component.props[side.prop])
  if (typeof value !== 'string') return null
  if (START.has(value)) return 'left'
  if (END.has(value)) return 'right'
  return null
}

/**
 * The side the content sits on when the root stretches (as it always should): the
 * first un-anchored module places itself — a menu's `align`, a row's `justify`.
 * `via` names the node whose prop to change.
 */
export function moduleContentSide(
  manifest: DesignSystemManifest,
  root: LayerNode,
): { side: ScreenSide; prop: string; type: string; values: Record<ScreenSide, string> } | null {
  const children = Array.isArray(root.children) ? root.children.filter(isObject) : []
  const module = children.find((child) => child.anchor !== true) as LayerNode | undefined
  if (!module || typeof module.type !== 'string') return null
  const side = staticContentSide(manifest, module)
  const prop = sidePropFor(manifest, module)
  return side && prop ? { side, prop: prop.prop, type: module.type, values: prop.values } : null
}

const BACKGROUND_PROP = /^(surface|background|bg|backgroundColor|fill)$/i
const CLEAR = ['none', 'transparent']

/**
 * The prop and value that leave a container unpainted, so the video and the
 * overlay show through the content layer. Null when the container can't be clear.
 */
export function clearBackgroundFor(
  manifest: DesignSystemManifest,
  node: LayerNode,
): { prop: string; clear: string } | null {
  const component = typeof node.type === 'string' ? manifest.components[node.type] : undefined
  if (!component) return null
  for (const prop of Object.values(component.props)) {
    if (!BACKGROUND_PROP.test(prop.name)) continue
    const clear = prop.options?.find((option) => CLEAR.includes(option))
    if (clear) return { prop: prop.name, clear }
  }
  return null
}

/** Whether the root paints over the video and the overlay. */
export function paintsBackground(manifest: DesignSystemManifest, root: LayerNode): string | null {
  const clear = clearBackgroundFor(manifest, root)
  if (!clear) return null
  const component = manifest.components[root.type as string]
  const props = isObject(root.props) ? root.props : {}
  const value = clear.prop in props ? props[clear.prop] : defaultForProp(component.props[clear.prop])
  return value === clear.clear ? null : String(value)
}

// ---------------------------------------------------------------------------
// The audit
// ---------------------------------------------------------------------------

function modelList(layers: ManifestScreenLayers): string {
  return layers.models.map((m) => `"${m.id}" (level ${m.level})`).join(', ')
}

/**
 * Every way a document breaks the layer rule, as sentences the Generator can act
 * on. `doc` is `{ screen?, root }` — a raw Blueprint, or the canvas tree whose
 * root carries `screen`.
 */
export function auditScreenLayers(doc: unknown, manifest: DesignSystemManifest): string[] {
  const layers = screenLayersOf(manifest)
  if (layers.models.length === 0) return []
  const d = isObject(doc) ? doc : {}
  const root = isObject(d.root) ? (d.root as LayerNode & { screen?: unknown }) : undefined
  const screen = d.screen ?? root?.screen
  const problems: string[] = []

  if (screen === undefined) {
    return [
      `The screen names no layer model. Add "screen": { "model": …, "level": … } next to "root" — one of ${modelList(layers)}.`,
    ]
  }
  if (!isObject(screen)) return ['"screen" must be an object: { "model": …, "level": … }.']

  const model = screenModel(layers, screen.model)
  if (!model) {
    return [`screen.model ${JSON.stringify(screen.model)} is not a layer model. Use one of ${modelList(layers)}.`]
  }
  const level = navigationLevel(layers, model.level)
  if (screen.level !== model.level) {
    problems.push(
      `screen.level ${JSON.stringify(screen.level)} doesn't match "${model.id}" (${model.name}), a level ${model.level} screen${level ? ` (${level.name})` : ''} — set "level": ${model.level}, or pick a model on level ${JSON.stringify(screen.level)}.`,
    )
  }
  if (!root) return problems

  const painted = paintsBackground(manifest, root)
  const clear = clearBackgroundFor(manifest, root)
  if (painted !== null && clear) {
    problems.push(
      `The content layer is transparent — the engine paints the video and the overlay under it, so the outermost container sets ${clear.prop} "${clear.clear}" (got ${JSON.stringify(painted)}). Give surfaces to the cards inside it instead.`,
    )
  }

  const children = Array.isArray(root.children) ? root.children.filter(isObject) : []
  const modules = children.filter((child) => child.anchor !== true)
  const anchored = children.length - modules.length
  if (level && level.maxModules !== null && modules.length > level.maxModules) {
    problems.push(
      `A level ${level.level} screen (${level.name}) shows ${level.maxModules === 1 ? 'a single content module' : `at most ${level.maxModules} content modules`}: the outermost container has ${modules.length} un-anchored children — group them into one container, or pick a level 1 model. ${level.rule}`,
    )
  }
  if (level && !level.allowsAnchor && anchored > 0) {
    problems.push(`A level ${level.level} screen (${level.name}) anchors nothing — remove "anchor". ${level.rule}`)
  }

  if (model.side) {
    const side = staticContentSide(manifest, root)
    const prop = sidePropFor(manifest, root)
    if (side && prop && side !== model.side) {
      problems.push(
        `"${model.id}" (${model.name}) shades the ${model.side} side, but the outermost container puts its content on the ${side} — set ${prop.prop} "${prop.values[model.side]}", or pick a ${side} model.`,
      )
    }
    // The root stretches, so the module is what places the content.
    const placed = side ? null : moduleContentSide(manifest, root)
    if (placed && placed.side !== model.side) {
      problems.push(
        `"${model.id}" (${model.name}) shades the ${model.side} side, but the <${placed.type}> puts its content on the ${placed.side} — set its ${placed.prop} "${placed.values[model.side]}", or pick a ${placed.side} model.`,
      )
    }
  }
  return problems
}

/** A one-line description of a screen's layers, for status lines. */
export function describeScreen(manifest: DesignSystemManifest, screen: ScreenSpec | undefined): string | null {
  if (!screen) return null
  const layers = screenLayersOf(manifest)
  const model = screenModel(layers, screen.model)
  const level = navigationLevel(layers, screen.level)
  return `${model?.name ?? screen.model} · nível ${screen.level}${level ? ` (${level.name})` : ''}`
}
