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
 */

import type { DesignSystemManifest, ManifestComponent } from './manifest'
import { mergeTokens, parseDesignTokens } from './token-adapter'
import { W3C_TOKEN_SOURCE } from './w3c-token-source'

export const W3C_MANIFEST_ID = 'global-css-tokens'

const tokens = mergeTokens(parseDesignTokens(W3C_TOKEN_SOURCE))

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
      defaultValue: 'spacing-core-md',
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
      defaultValue: 'core-primary-night-dark',
      tokenGroup: 'colors',
      control: 'select',
    },
    textColor: {
      name: 'textColor',
      type: { name: 'enum' },
      required: false,
      defaultValue: 'core-neutral-white',
      tokenGroup: 'colors',
      control: 'select',
    },
  },
}

export const W3C_MANIFEST: DesignSystemManifest = {
  id: W3C_MANIFEST_ID,
  name: 'Global CSS Tokens',
  version: '1.0.0',
  tokens,
  components: { Container, Text, Button },
}
