/**
 * A second, always-available design system whose tokens are the SAME W3C
 * values behind `src/styles/global.css` (via `w3c-token-source.ts` +
 * `token-adapter.ts`'s `parseDesignTokens` — the Phase 7A adapter already
 * built and tested for this exact DTCG shape).
 *
 * Unlike `SCREENFLOW_MANIFEST` (rendered by hand-written, Tailwind-classed
 * components — `manifest.id === 'screenflow'` is hardcoded to that path in
 * `registry.tsx`), this manifest's id is NOT 'screenflow', so every one of
 * its components renders through the generic, token-driven renderer: real
 * `--sfs-*` custom properties resolved from THESE tokens, not a static
 * stylesheet. Selecting it in the DesignSystemSwitcher is what closes the
 * loop between `global.css` and the canvas/AI-generation pipeline.
 *
 * A hand-authored component set (not `catalog.ts`'s) because that catalog's
 * default prop values are hardcoded to ScreenFlow's own token names (e.g.
 * `background: 'surface'`) and reusing it here would produce a manifest that
 * either fails validation or silently renders the ScreenFlow base colors —
 * see the "Global tokens gotcha" project memory for the full reasoning.
 *
 * The token tier rule comes from the same file: tokens.json's `core` groups (and
 * `color.opacity`, a raw group beside `color.semantic`) are core, its `semantic`
 * groups are semantic, and the raw spacing and radius steps are layout scales.
 * Every default below is semantic or a layout step — never core.
 *
 * The layer rule (Camadas) is the DTV rule, whose shades are the same file's
 * `gradient.semantic.overlay.*` tokens.
 */

import { TOKEN_TIER_RULE, type DesignSystemManifest, type ManifestComponent } from './manifest'
import { mergeTokens, parseDesignTokenTiers, parseDesignTokens } from './token-adapter'
import { W3C_TOKEN_SOURCE } from './w3c-token-source'
import { DTV_SCREEN_LAYERS } from './screen-layers'

export const W3C_MANIFEST_ID = 'global-css-tokens'

const tokens = mergeTokens(parseDesignTokens(W3C_TOKEN_SOURCE))
const tiers = parseDesignTokenTiers(W3C_TOKEN_SOURCE)

const Container: ManifestComponent = {
  id: 'Container',
  name: 'Container',
  description: 'A generic box, themed from the active token set.',
  category: 'Layout',
  acceptsChildren: true,
  props: {
    background: {
      name: 'background',
      type: { name: 'enum' },
      required: false,
      defaultValue: 'semantic-functional-background-elevated',
      tokenGroup: 'colors',
      control: 'select',
    },
    padding: {
      name: 'padding',
      type: { name: 'enum' },
      required: false,
      // `spacing-core-md` sits off the 8pt grid, so the default is the gutter step.
      defaultValue: 'spacing-core-sm',
      tokenGroup: 'spacing',
      control: 'select',
    },
    cornerRadius: {
      name: 'cornerRadius',
      type: { name: 'enum' },
      required: false,
      defaultValue: 'radius-core-md',
      tokenGroup: 'radius',
      control: 'select',
    },
  },
}

const Text: ManifestComponent = {
  id: 'Text',
  name: 'Text',
  description: 'A text node, colored from the active token set.',
  category: 'Content',
  acceptsChildren: false,
  props: {
    content: {
      name: 'content',
      type: { name: 'string' },
      required: false,
      defaultValue: 'Text',
      control: 'textarea',
    },
    textColor: {
      name: 'textColor',
      type: { name: 'enum' },
      required: false,
      defaultValue: 'semantic-functional-text-primary',
      tokenGroup: 'colors',
      control: 'select',
    },
  },
}

const Button: ManifestComponent = {
  id: 'Button',
  name: 'Button',
  description: 'A button, themed from the active token set.',
  category: 'Content',
  acceptsChildren: false,
  props: {
    label: {
      name: 'label',
      type: { name: 'string' },
      required: false,
      defaultValue: 'Button',
      control: 'text',
    },
    background: {
      name: 'background',
      type: { name: 'enum' },
      required: false,
      // The kit's primary button surface (src/primitives/Button.tsx).
      defaultValue: 'semantic-functional-background-elevated',
      tokenGroup: 'colors',
      control: 'select',
    },
    textColor: {
      name: 'textColor',
      type: { name: 'enum' },
      required: false,
      // White text is text-primary — the token tier rule never names core-neutral-white.
      defaultValue: 'semantic-functional-text-primary',
      tokenGroup: 'colors',
      control: 'select',
    },
  },
}

export const W3C_MANIFEST: DesignSystemManifest = {
  id: W3C_MANIFEST_ID,
  name: 'Global CSS Tokens',
  version: '1.1.0',
  tokens,
  components: { Container, Text, Button },
  tokenTiers: { rule: TOKEN_TIER_RULE, tiers },
  screenLayers: DTV_SCREEN_LAYERS,
}
