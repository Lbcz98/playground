/**
 * Dynamic Zod generation — the failsafe.
 *
 * Takes a `DesignSystemManifest` and compiles it, at runtime, into a per-component
 * Zod object schema. If the manifest says a Button has `size: ['sm','md','lg']`,
 * the compiled schema has `size: z.enum(['sm','md','lg'])` — so the LLM's output is
 * validated against the *live* extracted design system, not a hardcoded schema.
 *
 * `validateBlueprintAgainstManifest` is the strict gate used by the AI orchestrator
 * (pipeline step 3): it REJECTS anything the manifest doesn't allow and returns the
 * error strings that get fed back to the Generator agent for a retry.
 *
 * Phase 7B: a prop with `tokenGroup` set and no explicit `options` is compiled
 * to an enum of that group's REAL token names in the active manifest (falling
 * back to a plain string when the system doesn't have tokens for that group
 * yet). A hallucinated token name is therefore rejected and retried exactly
 * like any other invalid enum value — closing the loop between "this prop
 * draws from a token scale" and "the value must actually be one of them".
 *
 * The token tier rule (`manifest.ts`): those enums hold every token EXCEPT the core
 * tier, a core default is swapped for its semantic twin, and a screen that names
 * a core token (or a raw value) is rejected with a message pointing at the
 * semantic token to use instead.
 *
 * Framework-free — runs in the Electron main process.
 */

import { z } from 'zod'
import {
  BLUEPRINT_DOCUMENT_KEYS,
  BLUEPRINT_SCREEN_KEYS,
  DEVIATION_KEY,
  FIRST_SCREEN_ID,
  MAX_NOTE_LENGTH,
  MAX_NOTES,
  MAX_SCREENS,
  nodeKeysFor,
  unknownBlueprintKeyReason,
} from '../blueprint'
import { flowIssues, type FlowScreen } from './flow'
import type { IssueKind, IssuePath, RuleId, RuleProblem } from './rules'
import { auditDeviations, declarationProblem, type Declaration } from './deviations'
import type { DesignSystemManifest, ManifestComponent, ManifestProp, ManifestTokens } from './manifest'
import {
  assignableTokenNames,
  deriveDefaultProps,
  isCoreToken,
  rootContainerId,
  semanticEquivalents,
  placementError,
  slotOrderErrors,
} from './manifest'
import {
  describeGrid,
  isOnGrid,
  frameLayoutIssues,
  isOffGridSpacingToken,
  onGridSpacingNames,
  snapSpacingName,
} from '@/shared/layout/frame'

const SUPPORTED_VERSION = 1

// ---------------------------------------------------------------------------
// Per-prop → Zod
// ---------------------------------------------------------------------------

/** A component's props, or a list item's fields, as one strict object. */
function propsToZod(props: Record<string, ManifestProp>, manifest: DesignSystemManifest): z.ZodObject<z.ZodRawShape> {
  const shape: z.ZodRawShape = {}
  for (const prop of Object.values(props)) shape[prop.name] = propToZod(prop, manifest)
  return z.object(shape).strict()
}

function propToZod(prop: ManifestProp, manifest: DesignSystemManifest): z.ZodTypeAny {
  let schema: z.ZodTypeAny
  const group = prop.tokenGroup
  // The token tier rule: a token prop can name any tier but core.
  const tokenNames = group ? assignableTokenNames(manifest, group) : []
  const options = group && prop.options ? prop.options.filter((o) => !isCoreToken(manifest, group, o)) : prop.options
  const enumValues =
    options && options.length > 0 ? options : tokenNames.length > 0 ? tokenNames : null
  // Spacing scales are cut to the 8pt grid (`shared/layout/frame.ts`), so an
  // off-grid step is rejected and retried like any other invalid token.
  const spacing = prop.tokenGroup === 'spacing'
  const choices = enumValues && spacing ? onGridSpacingNames(manifest, enumValues) : enumValues

  if (choices) {
    schema = z.enum(choices as [string, ...string[]])
  } else {
    switch (prop.type.name) {
      case 'boolean':
        schema = z.boolean()
        break
      case 'number': {
        let n = z.number().finite()
        if (prop.min !== undefined) n = n.min(prop.min)
        if (prop.max !== undefined) n = n.max(prop.max)
        if (prop.step !== undefined) n = n.multipleOf(prop.step)
        schema = prop.grid ? n.refine(isOnGrid, { message: `must be on the 8pt scale: ${describeGrid()}` }) : n
        break
      }
      case 'array': {
        // A list of text, or of objects when the prop declares `fields`;
        // `min` / `max` bound how many items (a tuple sets both).
        const item = prop.fields ? propsToZod(prop.fields, manifest) : z.string()
        let list: z.ZodArray<z.ZodTypeAny> = z.array(item)
        if (prop.min !== undefined) list = list.min(prop.min)
        if (prop.max !== undefined) list = list.max(prop.max)
        schema = list
        break
      }
      default:
        schema = z.string()
    }
  }

  if (prop.nullable) schema = schema.nullable()

  let defaultValue = prop.defaultValue
  if (choices && group && isCoreToken(manifest, group, defaultValue)) {
    const twin = semanticEquivalents(manifest, group, String(defaultValue)).find((name) => choices.includes(name))
    defaultValue = twin ?? choices[0]
  }
  if (choices && spacing && isOffGridSpacingToken(manifest, defaultValue)) {
    defaultValue = snapSpacingName(manifest, choices, defaultValue) ?? defaultValue
  }

  if (defaultValue !== undefined) {
    schema = schema.default(defaultValue as never)
  } else if (!prop.required) {
    schema = schema.optional()
  }

  return schema
}

/**
 * A component's full default props, every value valid against its compiled
 * schema: a declared default the schema no longer accepts (an off-grid spacing
 * step) falls back to the schema's own snapped default.
 */
export function compiledDefaultProps(
  component: ManifestComponent,
  schema: z.ZodObject<z.ZodRawShape>,
): Record<string, unknown> {
  const out = deriveDefaultProps(component)
  for (const [name, field] of Object.entries(schema.shape as Record<string, z.ZodTypeAny>)) {
    if (field.safeParse(out[name]).success) continue
    const fallback = field.safeParse(undefined)
    if (fallback.success) out[name] = fallback.data
  }
  return out
}

/** Which rules a screen is held to: Faithful (every pattern) or Exploratory (declared patterns may bend). */
export type Policy = 'faithful' | 'exploratory'

type ComponentSchemas = Record<string, z.ZodObject<z.ZodRawShape>>

/**
 * Compiled once per manifest object and policy. The key is the manifest's
 * identity (the IPC handler parses a fresh one per request, so the gain is within
 * a request: screens × attempts); the policy is a string so the `Map` hits.
 * Schemas are never mutated after compilation, so sharing them is safe.
 */
const schemaCache = new WeakMap<DesignSystemManifest, Map<Policy, ComponentSchemas>>()

/** One `.strict()` object schema per component, keyed by component id. */
export function compileManifestSchemas(
  manifest: DesignSystemManifest,
  policy: Policy = 'faithful',
): ComponentSchemas {
  let byPolicy = schemaCache.get(manifest)
  if (!byPolicy) schemaCache.set(manifest, (byPolicy = new Map()))
  const cached = byPolicy.get(policy)
  if (cached) return cached
  // ponytail: both policies compile the same props today; Exploratory's vocabulary arrives in 9E.
  const out: ComponentSchemas = {}
  for (const component of Object.values(manifest.components)) out[component.id] = propsToZod(component.props, manifest)
  byPolicy.set(policy, out)
  return out
}

// ---------------------------------------------------------------------------
// The token tier rule's retry message
// ---------------------------------------------------------------------------

const RAW_VALUE = /^(#[0-9a-f]{3,8}|(rgb|rgba|hsl|hsla|oklch)\(.*\)|-?\d*\.?\d+(px|rem|em|%))$/i

const quoteList = (names: string[]): string => names.map((n) => `"${n}"`).join(' or ')

/**
 * Why `value` breaks the token tier rule on a prop drawing from `group`, as a sentence
 * the Generator can act on — or `null` when the token tier rule isn't what's wrong.
 */
export function tokenTierViolation(
  manifest: DesignSystemManifest,
  group: keyof ManifestTokens,
  value: unknown,
): string | null {
  if (typeof value !== 'string') return null
  const dict = manifest.tokens[group] ?? {}
  if (isCoreToken(manifest, group, value)) {
    const twins = semanticEquivalents(manifest, group, value)
    return twins.length > 0
      ? `is a core token. The token tier rule forbids core tokens in a screen — use the semantic token ${quoteList(twins)} (same value).`
      : `is a core token. The token tier rule forbids core tokens in a screen — use the semantic ${group} token that matches the element's role.`
  }
  if (!(value in dict) && RAW_VALUE.test(value.trim())) {
    const same = Object.keys(dict).filter(
      (name) => !isCoreToken(manifest, group, name) && dict[name].trim().toLowerCase() === value.trim().toLowerCase(),
    )
    return same.length > 0
      ? `is a raw value. The token tier rule only allows tokens — use ${quoteList(same)}.`
      : `is a raw value. The token tier rule only allows tokens — use the semantic ${group} token that matches the element's role.`
  }
  return null
}

/**
 * The rule a prop value its schema rejects breaks: the grid for an off-grid step,
 * the token tier rule for a core token or a raw value, else the component's API.
 * The validator and the interpreter both name rejected values with it.
 */
export function propRuleId(manifest: DesignSystemManifest, prop: ManifestProp, value: unknown): RuleId {
  const group = prop.tokenGroup
  if (group === 'spacing' && isOffGridSpacingToken(manifest, value)) return 'grid.8pt'
  if (group && tokenTierViolation(manifest, group, value)) {
    return isCoreToken(manifest, group, value) ? 'tokens.semantic-tier' : 'tokens.only'
  }
  if (prop.grid && typeof value === 'number' && !isOnGrid(value)) return 'grid.8pt'
  return 'component.api'
}

// ---------------------------------------------------------------------------
// Strict blueprint validation (pipeline step 3)
// ---------------------------------------------------------------------------

/** One problem the validator found: the rule it breaks, the retry sentence, and where in the document. */
export interface ValidationIssue {
  ruleId: RuleId
  message: string
  /** From the document: `['screens', 0, 'root', 'children', 1, 'props', 'items', 2, 'label']`. */
  path: IssuePath
  /** Set on a composition choice (an undeclared or unused deviation), which the orchestrator sends back to the planner. */
  kind?: IssueKind
}

export type BlueprintValidation =
  | { ok: true }
  | {
      ok: false
      /** @deprecated `issues.map((i) => i.message)`, kept for the current callers. Removed in 9D — read `issues`. */
      errors: string[]
      issues: ValidationIssue[]
    }

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function invalid(issues: ValidationIssue[]): BlueprintValidation {
  return issues.length === 0 ? { ok: true } : { ok: false, errors: issues.map((i) => i.message), issues }
}

/**
 * `policy` is the mode the caller generated for; a screen's own stamped `mode`
 * (the pipeline writes it, the model never does) takes precedence, so each screen
 * of a document is held to the rules of the mode it ran in.
 */
export function validateBlueprintAgainstManifest(
  input: unknown,
  manifest: DesignSystemManifest,
  policy: Policy = 'faithful',
): BlueprintValidation {
  if (!isObject(input)) return invalid([{ ruleId: 'blueprint.dsl', path: [], message: 'Blueprint must be a JSON object.' }])

  const issues: ValidationIssue[] = []
  const add = (ruleId: RuleId, path: IssuePath, message: string, kind?: IssueKind): void => {
    issues.push({ ruleId, message, path, ...(kind ? { kind } : {}) })
  }
  for (const key of Object.keys(input)) {
    if (!BLUEPRINT_DOCUMENT_KEYS.includes(key)) {
      add('blueprint.dsl', [key], `Unknown key "${key}" next to "root" — ${unknownBlueprintKeyReason(key)}. Remove it.`)
    }
  }
  if (input.version !== SUPPORTED_VERSION) {
    add('blueprint.dsl', ['version'], `"version" must be ${SUPPORTED_VERSION} (got ${JSON.stringify(input.version)}).`)
  }

  if (input.notes !== undefined) {
    const notes = input.notes
    if (
      !Array.isArray(notes) ||
      notes.length > MAX_NOTES ||
      notes.some((n) => typeof n !== 'string' || n.length === 0 || n.length > MAX_NOTE_LENGTH)
    ) {
      add(
        'blueprint.dsl',
        ['notes'],
        `"notes" must be a list of at most ${MAX_NOTES} short strings (each up to ${MAX_NOTE_LENGTH} characters) — what the user should know about the result.`,
      )
    }
  }

  // The document is its first screen plus every further one; each is held to the
  // same rules as a lone screen, then the links between them are checked.
  const screens: FlowScreen[] = [
    { id: typeof input.id === 'string' && input.id ? input.id : FIRST_SCREEN_ID, screen: input.screen, root: input.root },
  ]
  /** Where each of `screens` sits in the document: the first screen is the document itself. */
  const bases: IssuePath[] = [[]]
  /** The mode each screen is held to: its stamped `mode`, else `policy`. */
  const modes: Policy[] = []
  const modeOf = (raw: unknown, base: IssuePath): Policy => {
    if (raw === undefined) return policy
    if (raw === 'faithful' || raw === 'exploratory') return raw
    add('blueprint.dsl', [...base, 'mode'], '"mode" must be "faithful" or "exploratory" — and the pipeline sets it, not you.')
    return policy
  }
  modes.push(modeOf(input.mode, []))
  if (input.screens !== undefined) {
    if (!Array.isArray(input.screens)) {
      add('blueprint.dsl', ['screens'], '"screens" must be a list of screens: [{ "id", "name", "screen", "root" }].')
    } else {
      if (input.screens.length + 1 > MAX_SCREENS) {
        add('blueprint.dsl', ['screens'], `A document carries at most ${MAX_SCREENS} screens (got ${input.screens.length + 1}).`)
      }
      input.screens.slice(0, MAX_SCREENS - 1).forEach((raw: unknown, i: number) => {
        if (!isObject(raw)) {
          add('blueprint.dsl', ['screens', i], `screens[${i}]: a screen must be an object { "id", "name", "screen", "root" }.`)
          return
        }
        for (const key of Object.keys(raw)) {
          if (!BLUEPRINT_SCREEN_KEYS.includes(key)) {
            add('blueprint.dsl', ['screens', i, key], `screens[${i}]: unknown key "${key}" — the Blueprint DSL has no such key. Remove it.`)
          }
        }
        if (typeof raw.id !== 'string' || !raw.id) {
          add('blueprint.dsl', ['screens', i, 'id'], `screens[${i}]: every further screen needs a string "id" — that is what "goTo" names.`)
          return
        }
        screens.push({ id: raw.id, screen: raw.screen, root: raw.root })
        bases.push(['screens', i])
        modes.push(modeOf(raw.mode, ['screens', i]))
      })
    }
  }

  const many = screens.length > 1
  const emit = (i: number, found: RuleProblem): void =>
    add(found.ruleId, [...bases[i], ...found.path], many ? `Screen "${screens[i].id}": ${found.message}` : found.message, found.kind)
  const flow = flowIssues(screens, manifest)
  screens.forEach((s, i) => {
    const found = validateScreen({ version: SUPPORTED_VERSION, screen: s.screen, root: s.root }, manifest, modes[i])
    if (modes[i] === 'faithful') {
      found.issues.forEach((issue) => emit(i, issue))
      return
    }
    // Exploratory: the screen's issues, and the links leaving it, held to its declarations.
    const own = flow.filter((f) => f.screen === i)
    auditDeviations([...found.issues, ...own], found.declarations, manifest).forEach((issue) => emit(i, issue))
  })
  // Faithful screens: the cross-screen issues after the per-screen ones, as before.
  for (const found of flow) if (modes[found.screen] === 'faithful') emit(found.screen, found)

  return invalid(issues)
}

/**
 * One screen — `{ version, screen?, root }` — against the manifest, in `policy`.
 * Paths are relative to that screen. An Exploratory screen also returns the
 * deviations it declares, for `auditDeviations`.
 */
function validateScreen(
  input: Record<string, unknown>,
  manifest: DesignSystemManifest,
  policy: Policy,
): { issues: RuleProblem[]; declarations: Declaration[] } {
  const issues: RuleProblem[] = []
  const declarations: Declaration[] = []
  const schemas = compileManifestSchemas(manifest, policy)
  const allowed = Object.keys(manifest.components)
  const rootType = rootContainerId(manifest)

  if (!isObject(input.root)) {
    return {
      issues: [{ ruleId: 'blueprint.dsl', path: ['root'], message: 'Blueprint must have a "root" node object.' }],
      declarations,
    }
  }
  if (isObject(input.screen) && input.screen[DEVIATION_KEY] !== undefined) {
    const list = input.screen[DEVIATION_KEY]
    if (policy === 'faithful') {
      issues.push({
        ruleId: 'blueprint.dsl',
        path: ['screen', DEVIATION_KEY],
        message: 'A Faithful screen keeps every pattern, so its "screen" declares no "deviation". Remove it.',
      })
    } else if (!Array.isArray(list)) {
      issues.push({
        ruleId: 'blueprint.dsl',
        path: ['screen', DEVIATION_KEY],
        message: '"screen".deviation must be a list: [{ "ruleId": "<rule id>", "why": "<the reason>" }].',
      })
    } else {
      list.forEach((raw, j) => {
        const at = ['screen', DEVIATION_KEY, j]
        const problem = declarationProblem(manifest, raw)
        if (problem) issues.push({ ruleId: 'blueprint.dsl', path: at, message: `"screen".deviation[${j}]: ${problem}` })
        else {
          const { ruleId, why } = raw as { ruleId: string; why: string }
          declarations.push({ ruleId, why, path: [], scope: 'screen', at })
        }
      })
    }
  }
  if (rootType && input.root.type !== rootType) {
    issues.push({
      ruleId: 'frame.layout',
      path: ['root', 'type'],
      message: `The root node must be a <${rootType}> (got ${JSON.stringify(input.root.type)}).`,
    })
  }

  validateNode(input.root, 'root', ['root'], { schemas, manifest, allowed, policy, declarations }, issues, null)
  // Layout QA: frame margins, the 8pt grid + gutters, focus anchoring.
  issues.push(...frameLayoutIssues(input, manifest))

  return { issues, declarations }
}

interface Ctx {
  schemas: Record<string, z.ZodObject<z.ZodRawShape>>
  manifest: DesignSystemManifest
  allowed: string[]
  policy: Policy
  /** Filled by an Exploratory screen's valid `deviation`s while its nodes are walked. */
  declarations: Declaration[]
}

function validateNode(
  raw: unknown,
  path: string,
  at: IssuePath,
  ctx: Ctx,
  issues: RuleProblem[],
  parentType: string | null,
): void {
  const add = (ruleId: RuleId, where: IssuePath, message: string): void => {
    issues.push({ ruleId, message, path: where })
  }
  if (!isObject(raw)) {
    add('blueprint.dsl', at, `${path}: node must be an object.`)
    return
  }

  // A node the validator can't type is reported, and its children are still
  // checked, so every error in the tree reaches the Generator in one attempt.
  // Under an unknown parent no placement rule applies.
  const descend = (label: string): void => {
    if (!Array.isArray(raw.children)) return
    raw.children.forEach((child, i) => validateNode(child, `${path} › ${label}[${i}]`, [...at, 'children', i], ctx, issues, label))
  }
  const type = raw.type
  if (typeof type !== 'string') {
    add('blueprint.dsl', [...at, 'type'], `${path}: node is missing a string "type".`)
    descend('?')
    return
  }

  const component: ManifestComponent | undefined = ctx.manifest.components[type]
  if (!component) {
    add('component.api', [...at, 'type'], `${path}: <${type}> is not a real component. Allowed: ${ctx.allowed.join(', ')}.`)
    descend(type)
    return
  }
  const keys = nodeKeysFor(ctx.policy)
  for (const key of Object.keys(raw)) {
    if (keys.includes(key)) continue
    const why =
      key === DEVIATION_KEY
        ? 'a Faithful screen keeps every pattern, so it declares no deviation'
        : unknownBlueprintKeyReason(key)
    add('blueprint.dsl', [...at, key], `${path} <${type}>: unknown node key "${key}" — ${why}. Remove it.`)
  }
  if (ctx.policy === 'exploratory' && raw[DEVIATION_KEY] !== undefined) {
    const problem = declarationProblem(ctx.manifest, raw[DEVIATION_KEY])
    if (problem) add('blueprint.dsl', [...at, DEVIATION_KEY], `${path} <${type}>: ${problem}`)
    else {
      const { ruleId, why } = raw[DEVIATION_KEY] as { ruleId: string; why: string }
      ctx.declarations.push({ ruleId, why, path: at, scope: 'node', at: [...at, DEVIATION_KEY] })
    }
  }

  // A component that only lives inside another (a card's zones) can't stand alone.
  if (parentType === null && component.parents) {
    add('layout.slots', at, `${path}: <${type}> only goes directly inside ${component.parents.map((t) => `<${t}>`).join(' or ')}.`)
  } else if (parentType !== null) {
    const misplaced = placementError(ctx.manifest, parentType, type)
    if (misplaced) add('layout.slots', at, `${path}: ${misplaced}`)
  }

  const props = isObject(raw.props) ? raw.props : {}
  const schema = ctx.schemas[type]

  for (const key of Object.keys(props)) {
    const where: IssuePath = [...at, 'props', key]
    if (!(key in component.props)) {
      add('component.api', where, `${path} <${type}>: unknown prop "${key}".`)
      continue
    }
    const field = (schema.shape as Record<string, z.ZodTypeAny>)[key]
    const parsed = field?.safeParse(props[key])
    if (parsed && !parsed.success) {
      // A real spacing token rejected only for sitting off the grid is reported
      // by the frame audit, whose message explains the grid rule.
      const group = component.props[key].tokenGroup
      if (group === 'spacing' && isOffGridSpacingToken(ctx.manifest, props[key])) {
        continue
      }
      const violation = group ? tokenTierViolation(ctx.manifest, group, props[key]) : null
      if (violation) {
        add(propRuleId(ctx.manifest, component.props[key], props[key]), where, `${path} <${type}>: prop "${key}" = ${JSON.stringify(props[key])} ${violation}`)
        continue
      }
      const spec = component.props[key]
      if (spec.type.name === 'number' && (spec.min !== undefined || spec.max !== undefined || spec.step !== undefined || spec.grid)) {
        const range = [
          spec.step !== undefined ? `a multiple of ${spec.step}` : 'a number',
          spec.min !== undefined && spec.max !== undefined ? `from ${spec.min} to ${spec.max}` : '',
          spec.min !== undefined && spec.max === undefined ? `of at least ${spec.min}` : '',
          spec.max !== undefined && spec.min === undefined ? `of at most ${spec.max}` : '',
          spec.grid ? `on the 8pt scale (${describeGrid()})` : '',
        ].filter(Boolean).join(' ')
        add(propRuleId(ctx.manifest, spec, props[key]), where, `${path} <${type}>: prop "${key}" = ${JSON.stringify(props[key])} must be ${range}.`)
        continue
      }
      // A list item's bad field is pinned by Zod's own path (`[2].label`).
      add(
        'component.api',
        [...where, ...(parsed.error.issues[0]?.path ?? [])],
        `${path} <${type}>: prop "${key}" = ${JSON.stringify(props[key])} is not an allowed value.`,
      )
    }
  }

  if (raw.children !== undefined && !Array.isArray(raw.children)) {
    const text = 'children' in component.props
      ? ` To give <${type}> its words, set "props": { "children": ${JSON.stringify(raw.children)} }.`
      : ''
    add('component.api', [...at, 'children'], `${path} <${type}>: "children" is a list of nodes, not ${JSON.stringify(raw.children)}.${text}`)
  }
  const children = Array.isArray(raw.children) ? raw.children : []
  if (children.length > 0 && !component.acceptsChildren) {
    add('component.api', [...at, 'children'], `${path} <${type}>: cannot have children.`)
  }
  if (component.acceptsChildren) {
    children.forEach((child, i) => validateNode(child, `${path} › ${type}[${i}]`, [...at, 'children', i], ctx, issues, type))
    const childTypes = children.map((c) => (isObject(c) && typeof c.type === 'string' ? c.type : ''))
    for (const problem of slotOrderErrors(component, childTypes)) add('layout.slots', [...at, 'children'], `${path}: ${problem}`)
  }
}
