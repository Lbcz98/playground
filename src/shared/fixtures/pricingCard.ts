import type { BlueprintDocument, BlueprintNode } from '@/shared/blueprint'

/**
 * Hardcoded "dummy LLM" output for Phase 2 — a 3-tier pricing card expressed
 * purely in registry components (Stack / Text / Button) and design tokens.
 *
 * This is the exact payload the Electron main process returns over IPC so we can
 * prove the renderer <-> main round-trip before any real model is involved. In
 * Phase 3 the interpreter will validate and render it; in Phase 4 the real LLM
 * replaces it.
 */

function tier(opts: {
  name: string
  price: string
  cadence: string
  features: string[]
  cta: string
  ctaVariant: 'primary' | 'secondary'
  highlighted?: boolean
}): BlueprintNode {
  return {
    type: 'Stack',
    props: {
      direction: 'vertical',
      gap: 'md',
      padding: 'lg',
      align: 'stretch',
      surface: opts.highlighted ? 'brand-subtle' : 'surface',
      radius: 'lg',
      shadow: opts.highlighted ? 'md' : 'sm',
      bordered: true,
      grow: true,
    },
    children: [
      { type: 'Text', props: { content: opts.name, variant: 'heading', tone: 'default' } },
      {
        type: 'Stack',
        props: { direction: 'horizontal', gap: 'xs', align: 'end', justify: 'start' },
        children: [
          { type: 'Text', props: { content: opts.price, variant: 'display', tone: 'default' } },
          { type: 'Text', props: { content: opts.cadence, variant: 'caption', tone: 'muted' } },
        ],
      },
      ...opts.features.map(
        (feature): BlueprintNode => ({
          type: 'Text',
          props: { content: `• ${feature}`, variant: 'body', tone: 'muted' },
        }),
      ),
      {
        type: 'Button',
        props: { label: opts.cta, variant: opts.ctaVariant, size: 'md', fullWidth: true },
      },
    ],
  }
}

// Frame-compliant: the root adds no padding (the frame supplies the outer margin)
// and the root and the tier row both sit one gutter ("md") apart.
export const PRICING_CARD_BLUEPRINT: BlueprintDocument = {
  version: 1,
  // Two modules spanning the frame: a level 1 Home screen, shaded on both sides.
  screen: { model: 'home', level: 1 },
  root: {
    type: 'Stack',
    props: {
      direction: 'vertical',
      gap: 'md',
      padding: 'none',
      align: 'stretch',
      surface: 'none',
    },
    children: [
      {
        type: 'Stack',
        props: { direction: 'vertical', gap: 'xs', align: 'center' },
        children: [
          { type: 'Text', props: { content: 'Simple, transparent pricing', variant: 'title', align: 'center' } },
          {
            type: 'Text',
            props: {
              content: 'Choose the plan that fits your team. Change or cancel anytime.',
              variant: 'body',
              tone: 'muted',
              align: 'center',
            },
          },
        ],
      },
      {
        type: 'Stack',
        props: { direction: 'horizontal', gap: 'md', align: 'stretch', justify: 'between' },
        children: [
          tier({
            name: 'Starter',
            price: '$0',
            cadence: '/ month',
            features: ['1 project', 'Community support', '7-day history'],
            cta: 'Start free',
            ctaVariant: 'secondary',
          }),
          tier({
            name: 'Team',
            price: '$29',
            cadence: '/ month',
            features: ['Unlimited projects', 'Priority support', '1-year history', 'SSO'],
            cta: 'Choose Team',
            ctaVariant: 'primary',
            highlighted: true,
          }),
          tier({
            name: 'Enterprise',
            price: 'Custom',
            cadence: '',
            features: ['Dedicated support', 'Audit logs', 'Custom contracts', 'On-prem option'],
            cta: 'Contact sales',
            ctaVariant: 'secondary',
          }),
        ],
      },
    ],
  },
}
