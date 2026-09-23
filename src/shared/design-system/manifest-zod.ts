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
import { BLUEPRINT_DOCUMENT_KEYS, BLUEPRINT_NODE_KEYS, unknownBlueprintKeyReason } from '../blueprint'
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
  frameLayoutErrors,
  isOffGridSpacingToken,
  onGridSpacingNames,
  snapSpacingName,
} from '@/shared/layout/frame'

const SUPPORTED_VERSION = 1

// ---------------------------------------------------------------------------
// Per-prop → Zod
// ---------------------------------------------------------------------------

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
        schema = n
        break
      }
      default:
        schema = z.string()
    }
  }

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

/** One `.strict()` object schema per component, keyed by component id. */
export function compileManifestSchemas(
  manifest: DesignSystemManifest,
): Record<string, z.ZodObject<z.ZodRawShape>> {
  const out: Record<string, z.ZodObject<z.ZodRawShape>> = {}
  for (const component of Object.values(manifest.components)) {
    const shape: z.ZodRawShape = {}
    for (const prop of Object.values(component.props)) {
      shape[prop.name] = propToZod(prop, manifest)
    }
    out[component.id] = z.object(shape).strict()
  }
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

// ---------------------------------------------------------------------------
// Strict blueprint validation (pipeline step 3)
// ---------------------------------------------------------------------------

export type BlueprintValidation = { ok: true } | { ok: false; errors: string[] }

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

export function validateBlueprintAgainstManifest(
  input: unknown,
  manifest: DesignSystemManifest,
): BlueprintValidation {
  const errors: string[] = []
  const schemas = compileManifestSchemas(manifest)
  const allowed = Object.keys(manifest.components)
  const rootType = rootContainerId(manifest)

  if (!isObject(input)) return { ok: false, errors: ['Blueprint must be a JSON object.'] }
  for (const key of Object.keys(input)) {
    if (!BLUEPRINT_DOCUMENT_KEYS.includes(key)) {
      errors.push(`Unknown key "${key}" next to "root" — ${unknownBlueprintKeyReason(key)}. Remove it.`)
    }
  }
  if (input.version !== SUPPORTED_VERSION) {
    errors.push(`"version" must be ${SUPPORTED_VERSION} (got ${JSON.stringify(input.version)}).`)
  }
  if (!isObject(input.root)) {
    return { ok: false, errors: [...errors, 'Blueprint must have a "root" node object.'] }
  }
  if (rootType && input.root.type !== rootType) {
    errors.push(`The root node must be a <${rootType}> (got ${JSON.stringify(input.root.type)}).`)
  }

  validateNode(input.root, 'root', { schemas, manifest, allowed }, errors, null)
  // Layout QA: frame margins, the 8pt grid + gutters, focus anchoring.
  errors.push(...frameLayoutErrors(input, manifest))

  return errors.length === 0 ? { ok: true } : { ok: false, errors }
}

interface Ctx {
  schemas: Record<string, z.ZodObject<z.ZodRawShape>>
  manifest: DesignSystemManifest
  allowed: string[]
}

function validateNode(
  raw: unknown,
  path: string,
  ctx: Ctx,
  errors: string[],
  parentType: string | null,
): void {
  if (!isObject(raw)) {
    errors.push(`${path}: node must be an object.`)
    return
  }

  const type = raw.type
  if (typeof type !== 'string') {
    errors.push(`${path}: node is missing a string "type".`)
    return
  }

  const component: ManifestComponent | undefined = ctx.manifest.components[type]
  if (!component) {
    errors.push(
      `${path}: <${type}> is not a real component. Allowed: ${ctx.allowed.join(', ')}.`,
    )
    return
  }
  for (const key of Object.keys(raw)) {
    if (!BLUEPRINT_NODE_KEYS.includes(key)) {
      errors.push(`${path} <${type}>: unknown node key "${key}" — ${unknownBlueprintKeyReason(key)}. Remove it.`)
    }
  }

  // A component that only lives inside another (a card's zones) can't stand alone.
  if (parentType === null && component.parents) {
    errors.push(`${path}: <${type}> only goes directly inside ${component.parents.map((t) => `<${t}>`).join(' or ')}.`)
  } else if (parentType !== null) {
    const misplaced = placementError(ctx.manifest, parentType, type)
    if (misplaced) errors.push(`${path}: ${misplaced}`)
  }

  const props = isObject(raw.props) ? raw.props : {}
  const schema = ctx.schemas[type]

  for (const key of Object.keys(props)) {
    if (!(key in component.props)) {
      errors.push(`${path} <${type}>: unknown prop "${key}".`)
      continue
    }
    const field = (schema.shape as Record<string, z.ZodTypeAny>)[key]
    if (field && !field.safeParse(props[key]).success) {
      // A real spacing token rejected only for sitting off the grid is reported
      // by the frame audit, whose message explains the grid rule.
      const group = component.props[key].tokenGroup
      if (group === 'spacing' && isOffGridSpacingToken(ctx.manifest, props[key])) {
        continue
      }
      const violation = group ? tokenTierViolation(ctx.manifest, group, props[key]) : null
      if (violation) {
        errors.push(`${path} <${type}>: prop "${key}" = ${JSON.stringify(props[key])} ${violation}`)
        continue
      }
      const spec = component.props[key]
      if (spec.type.name === 'number' && (spec.min !== undefined || spec.max !== undefined || spec.step !== undefined)) {
        const range = [
          spec.step !== undefined ? `a multiple of ${spec.step}` : 'a number',
          spec.min !== undefined && spec.max !== undefined ? `from ${spec.min} to ${spec.max}` : '',
          spec.min !== undefined && spec.max === undefined ? `of at least ${spec.min}` : '',
          spec.max !== undefined && spec.min === undefined ? `of at most ${spec.max}` : '',
        ].filter(Boolean).join(' ')
        errors.push(`${path} <${type}>: prop "${key}" = ${JSON.stringify(props[key])} must be ${range}.`)
        continue
      }
      errors.push(
        `${path} <${type}>: prop "${key}" = ${JSON.stringify(props[key])} is not an allowed value.`,
      )
    }
  }

  const children = Array.isArray(raw.children) ? raw.children : []
  if (children.length > 0 && !component.acceptsChildren) {
    errors.push(`${path} <${type}>: cannot have children.`)
  }
  if (component.acceptsChildren) {
    children.forEach((child, i) => validateNode(child, `${path} › ${type}[${i}]`, ctx, errors, type))
    const childTypes = children.map((c) => (isObject(c) && typeof c.type === 'string' ? c.type : ''))
    for (const problem of slotOrderErrors(component, childTypes)) errors.push(`${path}: ${problem}`)
  }
}
