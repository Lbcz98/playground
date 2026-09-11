/**
 * Turns a Design System Manifest into (a) a machine-readable spec and (b) the LLM
 * system prompt.
 *
 * Spec §6 Step 3 ("Dynamic AI Schema Injection"): the Planner and Generator agents
 * must NEVER see a hardcoded schema. Every prompt here is compiled from the *active*
 * `DesignSystemManifest` that the orchestrator passes in, so the model can only ever
 * be told about components and token values that the active system actually has.
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
    const names = prop.tokenGroup ? tokenNames(manifest, prop.tokenGroup) : []
    return {
      name: prop.name,
      control: inferControl(prop),
      options: prop.options,
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
// Prompt rendering
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
 * Every token name the active manifest declares, grouped, for the "named
 * tokens only" line in both prompts (Phase 7B). Falls back to a plain
 * admonition when a group is empty (e.g. tokens haven't been imported yet).
 */
function tokenVocabulary(manifest: DesignSystemManifest): string {
  const groups: Array<[string, string[]]> = [
    ['spacing', tokenNames(manifest, 'spacing')],
    ['colors', tokenNames(manifest, 'colors')],
    ['radius', tokenNames(manifest, 'radius')],
    ['shadow', tokenNames(manifest, 'shadow')],
  ]
  const parts = groups
    .filter(([, names]) => names.length > 0)
    .map(([group, names]) => `${group} [${names.join(', ')}]`)
  return parts.length > 0 ? parts.join('; ') : 'named tokens only — never raw numbers'
}

/**
 * Step 1 of the pipeline — the Planner. Given the user's request and the "Product
 * Blueprint" (guidelines + a11y + layout patterns), it writes a short structural
 * plan in prose. It does NOT emit JSON.
 */
export function buildPlannerPrompt(
  manifest: DesignSystemManifest = SCREENFLOW_MANIFEST,
): string {
  const spec = getRegistrySpec(manifest)
  const container = rootContainerId(manifest) ?? spec.find((c) => c.acceptsChildren)?.type ?? 'Stack'
  const tokens = tokenVocabulary(manifest)

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

Accessibility rules:
- Heading hierarchy must be logical: one prominent heading as the screen title,
  smaller headings for sections, body/caption for supporting copy.
- Every text input must have a label.
- Every button label must say what it does ("Create account", not "Submit").
- Use a muted tone for secondary text, never a faint custom color.

Common layout patterns:
- Card: a vertical container with padding, gap, a surface, a border, a radius and
  a small shadow.
- Form: a vertical container with one input per field, then a primary button,
  grouped in a card.
- Equal columns / tiers: a horizontal container (align stretch) of child
  containers that each grow.
- Page header: a centered vertical container with a title then a muted body line.
- Section: a vertical container with a heading then its content.

# Output format

A numbered list. Each line: the component, its role, its nesting, and its text
content. Keep it under ~15 lines. Example:

1. Root ${container} (vertical, gap lg, padding xl) — the screen.
2.   Header ${container} (vertical, gap xs, align center).
3.     A prominent title: "Create your account".
4.     A muted body line: "It takes less than a minute.".
5.   Card ${container} (vertical, gap md, padding lg, surface, bordered, radius lg, shadow sm).
6.     Input, label "Full name".
7.     Input, label "Email".
8.     Primary button, full width: "Create account".`
}

export type PromptOutputMode = 'tool' | 'json'

/**
 * Step 2 of the pipeline — the Generator's system prompt. It translates the
 * Planner's prose into the strict Blueprint JSON, constrained to the manifest.
 */
export function buildSystemPrompt(
  mode: PromptOutputMode = 'tool',
  manifest: DesignSystemManifest = SCREENFLOW_MANIFEST,
): string {
  const spec = getRegistrySpec(manifest)
  const container = rootContainerId(manifest) ?? spec.find((c) => c.acceptsChildren)?.type ?? 'Stack'
  const containers = spec.filter((c) => c.acceptsChildren).map((c) => c.type)
  const leaves = spec.filter((c) => !c.acceptsChildren).map((c) => c.type)
  const tokens = tokenVocabulary(manifest)

  const intro =
    mode === 'tool'
      ? `You do NOT write HTML, CSS, or code. You describe a UI as a JSON tree ("Blueprint")
built ONLY from the components below, and you return it by calling the ${RENDER_TOOL_NAME} tool.`
      : `You do NOT write HTML, CSS, or code. You describe a UI as a JSON tree ("Blueprint")
built ONLY from the components below.`

  const output =
    mode === 'tool'
      ? `Call ${RENDER_TOOL_NAME} exactly once with:
{
  "blueprint": {
    "version": 1,
    "root": { "type": "${container}", "props": { ... }, "children": [ ... ] }
  }
}`
      : `Respond with ONLY this JSON object and nothing else — no prose, no explanation,
no markdown fences:
{
  "version": 1,
  "root": { "type": "${container}", "props": { ... }, "children": [ ... ] }
}`

  return `You generate screen-flow UI for ScreenFlow Studio, an internal design tool.
Active design system: ${manifest.name} (v${manifest.version}).

${intro}

# Hard rules
- Use ONLY these component types: ${spec.map((c) => c.type).join(', ')}.
- Use ONLY the listed prop values. Never invent a prop, a token, a color, or a pixel size.
- There is NO absolute positioning. Every layout is built by nesting container
  components (${containers.join(', ') || container}). A container is a flexbox row or
  column; use its "gap" for spacing between children and "padding" for inner spacing.
  Use "direction: horizontal" for rows.
- Only containers can hold children.${leaves.length ? ` ${leaves.join(', ')} are leaves.` : ''}
- Every appearance-affecting value is a named token, never a raw number or hex
  color: ${tokens}. A prop listed below as "a token name" must be set to exactly
  one of its listed names, or omitted.
- Prefer semantic structure: group related content in a container, give cards a
  surface + border + radius + shadow, use text "variant" for hierarchy.

# Components
${spec.map(describeComponent).join('\n\n')}

# Output
${output}
The root MUST be a <${container}>. Omit props you don't need — defaults are applied.
Do not include an "id" field on any node.`
}
