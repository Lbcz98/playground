import { type ReactNode, type RefObject, useEffect, useMemo, useRef } from 'react'
import type { CanvasNode } from '@/model/nodeTree'
import { applyTokens, manifestTokensToCssVars, purgeTokens, screenflowBaseVars } from '@/design-system/cssVars'
import type {
  ManifestScreenLayers,
  ManifestScreenModel,
  ManifestTokens,
} from '@/shared/design-system/manifest'
import { screenModel } from '@/shared/design-system/screen-layers'
import { type FocusSide, type FrameSizeId, anchorZone } from '@/shared/layout/frame'
import { cx } from '@/lib/cx'

/**
 * The 1280×720 TV frame itself — the three layers of the rule (Camadas) and the
 * two content zones, with nothing about editing in it.
 *
 * The frame surface stands in for the video, the screen's layer model paints its
 * shades over it (the only absolutely positioned layer — it fills the frame and
 * takes no pointer events), and the content sits on top. The frame owns the
 * safe-area margin and the gutter, and holds the root's un-anchored children in
 * the content zone and its anchored child in the corner the TV focus is on.
 *
 * The canvas renders this with selectable nodes; a template story renders the
 * same frame with plain ones, so a snapshot shows what the canvas shows.
 *
 * `data-canvas-theme="active"` is the ONLY place the active design system's
 * tokens land as CSS custom properties (spec §7b — tool/artifact isolation):
 * the app shell never sees them. The built-in ScreenFlow values are seeded
 * first so every `--sfs-*` var the generic renderer reads is always defined,
 * even when an imported system supplies only a partial token set.
 */
export interface ScreenFrameProps {
  /** The root node. Its `screen` names the layer model the frame paints. */
  tree: CanvasNode
  layers: ManifestScreenLayers
  tokens: ManifestTokens
  renderNode: (node: CanvasNode) => ReactNode
  /** Which corner the anchored group sits in. Default `neutral` → bottom-right. */
  focusSide?: FocusSide
  /** How the frame is shown; the layout itself is always 1280×720. Default 1. */
  scale?: number
  size?: FrameSizeId
  surfaceRef?: RefObject<HTMLDivElement>
  contentRef?: RefObject<HTMLDivElement>
}

export function ScreenFrame({
  tree,
  layers,
  tokens,
  renderNode,
  focusSide = 'neutral',
  scale = 1,
  size,
  surfaceRef,
  contentRef,
}: ScreenFrameProps): JSX.Element {
  const ownSurface = useRef<HTMLDivElement>(null)
  const surface = surfaceRef ?? ownSurface

  useEffect(() => {
    const el = surface.current
    if (!el) return
    applyTokens(el, { ...screenflowBaseVars(), ...manifestTokensToCssVars(tokens) })
    return () => purgeTokens(el)
  }, [surface, tokens])

  // The anchored group renders in its own zone. Ids are untouched, so selection,
  // the Layers panel and the Inspector still address the real tree.
  const { content, anchored } = useMemo(
    () => ({
      content: { ...tree, children: tree.children.filter((child) => !child.anchor) },
      anchored: tree.children.filter((child) => child.anchor),
    }),
    [tree],
  )
  const zone = anchorZone(focusSide)
  const model = screenModel(layers, tree.screen?.model)

  return (
    <div
      ref={surface}
      data-canvas-theme="active"
      data-frame-size={size}
      data-focus={focusSide}
      data-screen-layer="video"
      className="sfs-canvas-surface relative flex h-frame w-frame origin-top-left flex-col gap-frame-gutter overflow-hidden p-frame-margin font-sans"
      style={{ transform: `scale(${scale})`, backgroundColor: 'var(--sfs-color-surface)' }}
    >
      {model ? <ScreenShades layers={layers} model={model} /> : null}
      <div
        ref={contentRef}
        data-screen-layer="content"
        className="relative grid min-h-none flex-1 grid-cols-1 grid-rows-1"
      >
        {renderNode(content)}
      </div>
      {anchored.length > 0 ? (
        <div
          data-anchor-zone={zone}
          className={cx(
            'relative flex gap-frame-gutter',
            zone === 'bottom-left' ? 'justify-start' : 'justify-end',
          )}
        >
          {anchored.map((node) => (
            <span key={node.id} className="contents">
              {renderNode(node)}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  )
}

const FILL = { position: 'absolute', inset: 0 } as const

/**
 * The overlay layer: the model's shades, bottom to top. The scrim is a colour,
 * every other shade a gradient — each one the semantic token the rule names.
 */
function ScreenShades({
  layers,
  model,
}: {
  layers: ManifestScreenLayers
  model: ManifestScreenModel
}): JSX.Element {
  return (
    <div aria-hidden data-screen-layer="overlay" data-screen-model={model.id} className="pointer-events-none" style={FILL}>
      {model.shades.map((shade) => (
        <div
          key={shade}
          data-shade={shade}
          style={{
            ...FILL,
            ...(shade === 'scrim'
              ? { backgroundColor: `var(${layers.shades[shade]})` }
              : { backgroundImage: `var(${layers.shades[shade]})` }),
          }}
        />
      ))}
    </div>
  )
}
