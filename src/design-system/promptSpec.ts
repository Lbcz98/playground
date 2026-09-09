/**
 * Turns the component catalog into (a) a machine-readable spec and (b) the LLM
 * system prompt. Derived entirely from `catalog.ts`, so the model can never be
 * told about a component or token value that doesn't exist.
 *
 * Imported by the Electron main process — must stay free of React / DOM.
 */

import type { z } from 'zod'
import { CATALOG_TYPES, getCatalogEntry, type Control } from './catalog'
import { RENDER_TOOL_NAME } from '@/shared/blueprint'

export interface PropSpec {
  name: string
  control: Control['kind']
  /** Allowed values for a `select` prop. */
  options?: readonly string[]
  default: unknown
}

export interface ComponentSpec {
  type: string
  category: string
  summary: string
  acceptsChildren: boolean
  props: PropSpec[]
}

function shapeOf(schema: z.ZodTypeAny): Record<string, z.ZodTypeAny> {
  return (schema as unknown as { shape?: Record<string, z.ZodTypeAny> }).shape ?? {}
}

export function getRegistrySpec(): ComponentSpec[] {
  return CATALOG_TYPES.map((type) => {
    const entry = getCatalogEntry(type)!
    const shape = shapeOf(entry.schema)

    const props: PropSpec[] = Object.keys(shape).map((name) => {
      const control: Control | undefined = entry.controls[name]
      return {
        name,
        control: control?.kind ?? 'text',
        options: control?.kind === 'select' ? control.options : undefined,
        default: entry.defaultProps[name],
      }
    })

    return {
      type: entry.type,
      category: entry.category,
      summary: entry.summary,
      acceptsChildren: entry.acceptsChildren,
      props,
    }
  })
}

function describeProp(p: PropSpec): string {
  const def = JSON.stringify(p.default)
  if (p.options) return `      - ${p.name}: one of [${p.options.join(', ')}] (default ${def})`
  if (p.control === 'boolean') return `      - ${p.name}: boolean (default ${def})`
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

function componentCatalogBrief(): string {
  return getRegistrySpec()
    .map((c) => `  - <${c.type}>${c.acceptsChildren ? ' (container)' : ''}: ${c.summary}`)
    .join('\n')
}

/**
 * Step 1 of the pipeline — the Planner. Given the user's request and the "Product
 * Blueprint" (guidelines + a11y + layout patterns), it writes a short structural
 * plan in prose. It does NOT emit JSON.
 */
export function buildPlannerPrompt(): string {
  return `You are the PLANNER for ScreenFlow Studio. Given a request for a screen,
you write a short, concrete build plan — which components to use and how to nest
them in Stacks. You do NOT write JSON or code; the next agent does that.

# Product Blueprint

Design system:
- The only layout tool is <Stack> — a flex row ("direction: horizontal") or column.
  Build every layout by nesting Stacks. There is no absolute positioning, no grid.
- Spacing/radius/shadow are named tokens: none, xs, sm, md, lg, xl, 2xl, 3xl.
- Components available:
${componentCatalogBrief()}

Accessibility rules:
- Heading hierarchy must be logical: one Text "display" or "title" as the screen
  title, "heading" for section titles, "body"/"caption" for supporting copy.
- Every <Input> must have a "label".
- Every <Button> label must say what it does ("Create account", not "Submit").
- Use "tone: muted" for secondary text, never a faint custom color.

Common layout patterns:
- Card: Stack(direction vertical, padding lg, gap md, surface "surface", bordered,
  radius lg, shadow sm).
- Form: Stack(vertical, gap md) containing one <Input> per field, then a primary
  <Button>. Group the whole form in a card.
- Equal columns / tiers: Stack(horizontal, gap lg, align stretch) of child
  Stacks that each set "grow: true".
- Page header: Stack(vertical, gap xs, align center) with a title Text then a
  muted body Text.
- Section: Stack(vertical, gap sm) with a "heading" Text then its content.

# Output format

A numbered list. Each line: the component, its role, its nesting, and its text
content. Keep it under ~15 lines. Example:

1. Root Stack (vertical, gap lg, padding xl) — the screen.
2.   Header Stack (vertical, gap xs, align center).
3.     Text "title": "Create your account".
4.     Text "body", muted: "It takes less than a minute.".
5.   Card Stack (vertical, gap md, padding lg, surface, bordered, radius lg, shadow sm).
6.     Input, label "Full name".
7.     Input, label "Email".
8.     Button "primary", fullWidth: "Create account".`
}

export type PromptOutputMode = 'tool' | 'json'

/**
 * Step 2 of the pipeline — the Generator's system prompt. It translates the
 * Planner's prose into the strict Blueprint JSON, constrained to the catalog.
 */
export function buildSystemPrompt(mode: PromptOutputMode = 'tool'): string {
  const spec = getRegistrySpec()

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
    "root": { "type": "Stack", "props": { ... }, "children": [ ... ] }
  }
}`
      : `Respond with ONLY this JSON object and nothing else — no prose, no explanation,
no markdown fences:
{
  "version": 1,
  "root": { "type": "Stack", "props": { ... }, "children": [ ... ] }
}`

  return `You generate screen-flow UI for ScreenFlow Studio, an internal design tool.

${intro}

# Hard rules
- Use ONLY these component types: ${spec.map((c) => c.type).join(', ')}.
- Use ONLY the listed prop values. Never invent a prop, a token, a color, or a pixel size.
- There is NO absolute positioning. Every layout is built by nesting <Stack> components.
  A Stack is a flexbox row or column; use its "gap" for spacing between children and
  "padding" for inner spacing. Use "direction: horizontal" for rows.
- Only <Stack> can contain children. <Text>, <Button> and <Input> are leaves.
- Spacing, radius and shadow are named tokens (none, xs, sm, md, lg, xl, 2xl, 3xl) —
  never numbers.
- Prefer semantic structure: group related content in a Stack, give cards a surface +
  bordered + radius + shadow, use Text "variant" for hierarchy (display > title >
  heading > body > caption).

# Components
${spec.map(describeComponent).join('\n\n')}

# Output
${output}
The root MUST be a <Stack>. Omit props you don't need — defaults are applied.
Do not include an "id" field on any node.`
}
