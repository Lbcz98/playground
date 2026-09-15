/**
 * Turns a Design System Manifest into (a) a machine-readable spec and (b) the LLM
 * system prompts.
 *
 * The Generator's system prompt opens with the GLOBAL KERNEL (`buildGlobalKernel`)
 * — the agent's unbreakable, design-system-agnostic laws: Blueprint JSON + tokens,
 * the 8pt grid, the 1280×720 canvas with its safe area / gutters / focus
 * alignment, and registry strictness. It is kept lean, and every number in it
 * comes from `shared/layout/frame.ts`, so the laws can never drift from what the
 * validator enforces. Everything specific to the active design system follows it,
 * compiled from the manifest (`designSystemBinding`, the component list).
 *
 * Spec §6 Step 3 ("Dynamic AI Schema Injection"): the Planner and Generator agents
 * must NEVER see a hardcoded schema. Every design-system detail here is compiled
 * from the *active* `DesignSystemManifest` that the orchestrator passes in, so the
 * model can only ever be told about components and token values that the active
 * system actually has.
 *
 * When no manifest is supplied we fall back to the built-in ScreenFlow manifest
 * (itself derived from `catalog.ts`), so existing callers are unaffected.
 *
 * Imported by the Electron main process — must stay free of React / DOM.
 */

import { RENDER_TOOL_NAME } from '@/shared/blueprint'
import type { DesignSystemManifest, ManifestComponent } from '@/shared/design-system/manifest'
import { inferControl, rootContainerId, tokenNames } from '@/shared/design-system/manifest'
import { SCREENFLOW_MANIFEST } from '@/shared/design-system/screenflow-manifest'
import {
  FRAME,
  allowedSpacingNames,
  centeringPropsFor,
  onGridSpacingNames,
  spacingNameForPx,
  spacingPropFor,
  spacingPx,
} from '@/shared/layout/frame'

export interface PropSpec {
  name: string
  control: 'text' | 'textarea' | 'select' | 'boolean' | 'number'
  /** Allowed values for a `select` prop. */
  options?: readonly string[]
  /** Phase 7B: real token names, when this prop draws from a token scale. */
  tokenNames?: string[]
  default: unknown
}

export interface ComponentSpec {
  type: string
  category: string
  summary: string
  acceptsChildren: boolean
  props: PropSpec[]
}

function specForComponent(component: ManifestComponent, manifest: DesignSystemManifest): ComponentSpec {
  const props: PropSpec[] = Object.values(component.props).map((prop) => {
    // Spacing values are cut to the 8pt grid, exactly as the validator compiles them.
    const spacing = prop.tokenGroup === 'spacing'
    const allNames = prop.tokenGroup ? tokenNames(manifest, prop.tokenGroup) : []
    const names = spacing ? onGridSpacingNames(manifest, allNames) : allNames
    const options = spacing && prop.options ? onGridSpacingNames(manifest, prop.options) : prop.options
    return {
      name: prop.name,
      control: inferControl(prop),
      options,
      ...(names.length > 0 ? { tokenNames: names } : {}),
      default: prop.defaultValue,
    }
  })

  return {
    type: component.id,
    category: component.category ?? 'component',
    summary: component.description,
    acceptsChildren: component.acceptsChildren,
    props,
  }
}

export function getRegistrySpec(
  manifest: DesignSystemManifest = SCREENFLOW_MANIFEST,
): ComponentSpec[] {
  return Object.values(manifest.components).map((c) => specForComponent(c, manifest))
}

// ---------------------------------------------------------------------------
// Global kernel — the agent's unbreakable laws, design-system agnostic
// ---------------------------------------------------------------------------

const px = (n: number): string => `${n}px`

function kernelIntro(): string {
  return `You are an expert UI Engineering Agent. Your primary directive is to generate valid Blueprint JSON (DSL) layouts that strictly adhere to our design system's physical constraints and component registry.

You must never violate the following global architectural laws:`
}

function tokensLaw(): string {
  return `### 1. BLUEPRINT JSON FORMAT & TOKENS
* **Output:** You must generate valid Blueprint JSON DSL. Do not output React components, JSX, or raw HTML.
* **Tokens:** You are strictly forbidden from using raw pixel values (e.g., \`${px(FRAME.gutter)}\`) or HEX/RGB color codes for styling. All typography, colors, radii, spacing, and dimensions must be assigned using our global design tokens.`
}

function spatialLaw(): string {
  const [halfStep, oneAndHalfStep] = FRAME.offGridAllowed
  const examples = [1, 2, 3, 4, 5, 6, 8].map((n) => n * FRAME.grid).join(', ')
  return `### 2. THE SPATIAL PHYSICS & EXCEPTIONS
The application operates on a strict mathematical ${FRAME.grid}-point grid.
* Standard dimensions, margins, paddings, heights, and offsets MUST evaluate to a multiple of ${FRAME.grid} (e.g., ${examples}).
* **Exceptions:** \`${px(halfStep)}\` (half-step) and \`${px(oneAndHalfStep)}\` (1.5 step) are explicitly permitted for micro-spacing and tight component internals.
* Never output fractional pixels or any other off-grid values outside of the allowed ${FRAME.grid}pt scale and the ${px(halfStep)}/${px(oneAndHalfStep)} exceptions.`
}

/**
 * §3 as specified, with three bullets reworded to match the engine (approved by
 * the product owner): the engine locks the viewport and applies the safe area, and
 * it READS the TV focus — the model never declares a focus side, it only marks
 * the secondary group that follows it. A live run showed the model anchoring the
 * screen's primary CTAs to "give them focus", so the bullets say plainly that the
 * anchored group leaves the content flow and never holds initial focus.
 */
function macroLayoutLaw(): string {
  const { width, height } = FRAME.base
  return `### 3. MACRO-LAYOUT & ${width}×${height} CANVAS BOUNDARIES
When generating full screens or master containers, you must target the base HD canvas (the engine will handle the upscale switch).
* **Master Viewport:** The outermost container is strictly locked to **${px(width)} by ${px(height)}** by the engine — never try to size it yourself.
* **Safe Area Margins:** A strict **${px(FRAME.margin)} margin** applies on all outer edges (Top, Bottom, Left, Right). The engine applies it as the canvas safe area, so the outermost container adds no padding of its own. Content cannot breach this safe area.
* **Gutters:** The space between structural columns or module stacks must be exactly **${px(FRAME.gutter)}**.
* **Dynamic Focus Alignment:** Master layouts do not use static center alignment. This is a TV canvas: something always holds focus, and the engine reads where it is — you never declare a focus side.
  * Initial focus lands on the first focusable element (a button or an input) in reading order — top to bottom, then left to right — within the screen's content. Keep the screen's primary actions (e.g. "Play", "Watch now", "Continue") in the content, placed where focus should start.
  * Optionally, mark ONE secondary floating cluster — quick actions or utility controls such as options, filters or help, never the screen's primary actions — with "anchor": true on a direct child of the outermost container. The engine lifts it out of the content flow into a bottom corner of the frame, and an anchored element never holds initial focus. If the focus is on the right — or nothing is focusable — the engine anchors it to the **Bottom-Right** (respecting the ${px(FRAME.margin)} margin); if the focus is on the left, it mirrors the alignment and anchors it to the **Left** margin, at the bottom.`
}

function registryLaw(): string {
  return `### 4. COMPONENT REGISTRY STRICTNESS
You must construct the UI using ONLY the provided Blueprint component definitions (which have been imported and mapped from our Storybook registry).
* Rely exclusively on the Blueprint schema properties provided in your context.
* Never invent new UI elements or inject unsupported properties into the Blueprint JSON.`
}

/** The Generator's global kernel: identity + the four laws. No design-system specifics. */
export function buildGlobalKernel(): string {
  return [kernelIntro(), tokensLaw(), spatialLaw(), macroLayoutLaw(), registryLaw()].join('\n\n')
}

// ---------------------------------------------------------------------------
// Design-system binding — the laws mapped onto the active manifest's real names
// ---------------------------------------------------------------------------

function describeProp(p: PropSpec): string {
  const def = JSON.stringify(p.default)
  if (p.options) return `      - ${p.name}: one of [${p.options.join(', ')}] (default ${def})`
  if (p.tokenNames) {
    return `      - ${p.name}: a token name, one of [${p.tokenNames.join(', ')}] (default ${def})`
  }
  if (p.control === 'boolean') return `      - ${p.name}: boolean (default ${def})`
  if (p.control === 'number') return `      - ${p.name}: number (default ${def})`
  return `      - ${p.name}: string (default ${def})`
}

function describeComponent(c: ComponentSpec): string {
  return [
    `  <${c.type}> — ${c.summary}`,
    `    accepts children: ${c.acceptsChildren ? 'yes' : 'no'}`,
    `    props:`,
    ...c.props.map(describeProp),
  ].join('\n')
}

function componentCatalogBrief(spec: ComponentSpec[]): string {
  return spec
    .map((c) => `  - <${c.type}>${c.acceptsChildren ? ' (container)' : ''}: ${c.summary}`)
    .join('\n')
}

/**
 * Every token name the active manifest declares, grouped (Phase 7B). Spacing is
 * cut to the 8pt grid and shows each step's size, so the model can map the
 * kernel's pixel laws onto token names. Falls back to a plain admonition when
 * every group is empty.
 */
function tokenVocabulary(manifest: DesignSystemManifest): string {
  const spacing = onGridSpacingNames(manifest, tokenNames(manifest, 'spacing')).map((name) => {
    const size = spacingPx(manifest, name)
    return size === null ? name : `${name} = ${px(size)}`
  })
  const groups: Array<[string, string[]]> = [
    ['spacing', spacing],
    ['colors', tokenNames(manifest, 'colors')],
    ['radius', tokenNames(manifest, 'radius')],
    ['shadow', tokenNames(manifest, 'shadow')],
  ]
  const parts = groups
    .filter(([, names]) => names.length > 0)
    .map(([group, names]) => `${group} [${names.join(', ')}]`)
  return parts.length > 0 ? parts.join('; ') : 'named tokens only — never raw numbers'
}

/** The frame laws in the active system's own prop and token names — shared by both agents. */
function frameSpecifics(manifest: DesignSystemManifest, container: string): string[] {
  const component = manifest.components[container]
  const padding = component ? spacingPropFor(component, 'margin') : undefined
  const gap = component ? spacingPropFor(component, 'gutter') : undefined
  const zero = padding ? spacingNameForPx(manifest, allowedSpacingNames(manifest, padding), 0) : undefined
  const gutter = gap ? spacingNameForPx(manifest, allowedSpacingNames(manifest, gap), FRAME.gutter) : undefined
  const centering = component ? centeringPropsFor(component).map((prop) => prop.name) : []

  return [
    `* **Safe area:** ${
      padding && zero
        ? `the outermost <${container}> sets ${padding.name} "${zero}".`
        : `the outermost <${container}> sets no padding.`
    }`,
    `* **Gutters:** ${
      gap && gutter
        ? `the outermost <${container}>, and any container whose children are all containers (stacked modules, columns), set ${gap.name} "${gutter}".`
        : `stacked modules and columns sit ${px(FRAME.gutter)} apart.`
    }`,
    `* **No static centering:** ${
      centering.length > 0
        ? `the outermost <${container}> never sets ${centering.join(' or ')} to "center".`
        : `the outermost <${container}> is never centered.`
    }`,
    `* **Anchoring:** "anchor": true goes on a direct child of the outermost <${container}> — at most one per screen, and only on a secondary floating cluster, never the screen's primary actions.`,
  ]
}

function designSystemBinding(
  manifest: DesignSystemManifest,
  spec: ComponentSpec[],
  container: string,
): string {
  const containers = spec.filter((c) => c.acceptsChildren).map((c) => c.type)
  const leaves = spec.filter((c) => !c.acceptsChildren).map((c) => c.type)

  return [
    `### 5. ACTIVE DESIGN SYSTEM — ${manifest.name} (v${manifest.version})`,
    `The laws above, mapped onto this system's registry and tokens.`,
    `* **Components:** only ${spec.map((c) => c.type).join(', ')}. The outermost container MUST be a <${container}>.`,
    `* **Layout:** there is no absolute positioning. Every layout is nested containers (${containers.join(', ') || container}), each a flexbox row or column: "gap" spaces its children, "padding" is inner spacing, "direction": "horizontal" makes a row. Only containers hold children${leaves.length ? `; ${leaves.join(', ')} are leaves` : ''}.`,
    `* **Tokens:** ${tokenVocabulary(manifest)}. A prop listed below as "a token name" takes exactly one of its listed names, or is omitted.`,
    ...frameSpecifics(manifest, container),
    `* **Structure:** group related content in a container, give cards a surface + border + radius + shadow, use text "variant" for hierarchy.`,
  ].join('\n')
}

// ---------------------------------------------------------------------------
// Prompts
// ---------------------------------------------------------------------------

/**
 * Step 1 of the pipeline — the Planner. Given the user's request and the "Product
 * Blueprint" (guidelines + a11y + layout patterns), it writes a short structural
 * plan in prose that already obeys the kernel's spatial and macro-layout laws. It
 * does NOT emit JSON.
 */
export function buildPlannerPrompt(
  manifest: DesignSystemManifest = SCREENFLOW_MANIFEST,
): string {
  const spec = getRegistrySpec(manifest)
  const container = rootContainerId(manifest) ?? spec.find((c) => c.acceptsChildren)?.type ?? 'Stack'
  const tokens = tokenVocabulary(manifest)
  const component = manifest.components[container]
  const padding = component ? spacingPropFor(component, 'margin') : undefined
  const gap = component ? spacingPropFor(component, 'gutter') : undefined
  const zero = padding ? spacingNameForPx(manifest, allowedSpacingNames(manifest, padding), 0) : undefined
  const gutter = gap ? spacingNameForPx(manifest, allowedSpacingNames(manifest, gap), FRAME.gutter) : undefined

  return `You are the PLANNER for ScreenFlow Studio. Given a request for a screen,
you write a short, concrete build plan — which components to use and how to nest
them in ${container}s. You do NOT write JSON or code; the next agent does that.

# Product Blueprint

Design system: ${manifest.name} (v${manifest.version})
- The primary layout tool is <${container}> — a flex row ("direction: horizontal")
  or column. Build every layout by nesting them. There is no absolute positioning,
  no grid.
- Design tokens available (spacing, colors, radius, shadow): ${tokens}.
- Components available:
${componentCatalogBrief(spec)}

# Global laws your plan must obey

${spatialLaw()}

${macroLayoutLaw()}

In ${manifest.name}:
${frameSpecifics(manifest, container).join('\n')}

Accessibility rules:
- Heading hierarchy must be logical: one prominent heading as the screen title,
  smaller headings for sections, body/caption for supporting copy.
- Every text input must have a label.
- Every button label must say what it does ("Create account", not "Submit").
- Use a muted tone for secondary text, never a faint custom color.

Common layout patterns:
- Card: a vertical container with padding, gap, a surface, a border, a radius and
  a small shadow.
- Form: a vertical container with one input per field, grouped in a card, with its
  primary button in the card after the last field.
- Equal columns / tiers: a horizontal container (align stretch) of child
  containers that each grow.
- Page header: a vertical container with a title then a muted body line.
- Section: a vertical container with a heading then its content.
- Floating action cluster: a horizontal container of secondary quick actions
  (options, help), anchored so it follows focus — never the screen's primary actions.

# Output format

A numbered list. Each line: the component, its role, its nesting, and its text
content; mark the anchored group. Keep it under ~15 lines. Example:

1. Root ${container} (vertical, gap ${gutter ?? 'md'}, padding ${zero ?? 'none'}, align start) — the screen.
2.   Header ${container} (vertical, gap xs).
3.     A prominent title: "Create your account".
4.     A muted body line: "It takes less than a minute.".
5.   Card ${container} (vertical, gap md, padding lg, surface, bordered, radius lg, shadow sm).
6.     Input, label "Full name" — first focusable, so it holds initial focus.
7.     Input, label "Email".
8.     Primary button: "Create account".
9.   Help ${container} (horizontal, gap sm) — anchored, a secondary floating cluster.
10.    Ghost button: "Need help?".`
}

export type PromptOutputMode = 'tool' | 'json'

/**
 * Step 2 of the pipeline — the Generator's system prompt: the global kernel, then
 * the active design system's binding and component definitions, then the output
 * contract. It translates the Planner's prose into the strict Blueprint JSON.
 */
export function buildSystemPrompt(
  mode: PromptOutputMode = 'tool',
  manifest: DesignSystemManifest = SCREENFLOW_MANIFEST,
): string {
  const spec = getRegistrySpec(manifest)
  const container = rootContainerId(manifest) ?? spec.find((c) => c.acceptsChildren)?.type ?? 'Stack'

  const blueprint = `"version": 1,
  "root": { "type": "${container}", "props": { ... }, "children": [ ... ] }`
  const output =
    mode === 'tool'
      ? `Return the Blueprint by calling the ${RENDER_TOOL_NAME} tool exactly once with:
{
  "blueprint": {
    ${blueprint.replace('\n', '\n  ')}
  }
}`
      : `Respond with ONLY this JSON object and nothing else — no prose, no explanation,
no markdown fences:
{
  ${blueprint}
}`

  return `${buildGlobalKernel()}

${designSystemBinding(manifest, spec, container)}

# Components
${spec.map(describeComponent).join('\n\n')}

# Output
${output}
Omit props you don't need — defaults are applied. Do not include an "id" field on
any node — besides "type", "props" and "children", the only node field is "anchor".`
}
