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
 * Framework-free — runs in the Electron main process.
 */

import { z } from 'zod'
import type { DesignSystemManifest, ManifestComponent, ManifestProp } from './manifest'
import { rootContainerId } from './manifest'

const SUPPORTED_VERSION = 1

// ---------------------------------------------------------------------------
// Per-prop → Zod
// ---------------------------------------------------------------------------

function propToZod(prop: ManifestProp): z.ZodTypeAny {
  let schema: z.ZodTypeAny

  if (prop.options && prop.options.length > 0) {
    schema = z.enum(prop.options as [string, ...string[]])
  } else {
    switch (prop.type.name) {
      case 'boolean':
        schema = z.boolean()
        break
      case 'number':
        schema = z.number()
        break
      default:
        schema = z.string()
    }
  }

  if (prop.defaultValue !== undefined) {
    schema = schema.default(prop.defaultValue as never)
  } else if (!prop.required) {
    schema = schema.optional()
  }

  return schema
}

/** One `.strict()` object schema per component, keyed by component id. */
export function compileManifestSchemas(
  manifest: DesignSystemManifest,
): Record<string, z.ZodObject<z.ZodRawShape>> {
  const out: Record<string, z.ZodObject<z.ZodRawShape>> = {}
  for (const component of Object.values(manifest.components)) {
    const shape: z.ZodRawShape = {}
    for (const prop of Object.values(component.props)) {
      shape[prop.name] = propToZod(prop)
    }
    out[component.id] = z.object(shape).strict()
  }
  return out
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
  if (input.version !== SUPPORTED_VERSION) {
    errors.push(`"version" must be ${SUPPORTED_VERSION} (got ${JSON.stringify(input.version)}).`)
  }
  if (!isObject(input.root)) {
    return { ok: false, errors: [...errors, 'Blueprint must have a "root" node object.'] }
  }
  if (rootType && input.root.type !== rootType) {
    errors.push(`The root node must be a <${rootType}> (got ${JSON.stringify(input.root.type)}).`)
  }

  validateNode(input.root, 'root', { schemas, manifest, allowed }, errors)

  return errors.length === 0 ? { ok: true } : { ok: false, errors }
}

interface Ctx {
  schemas: Record<string, z.ZodObject<z.ZodRawShape>>
  manifest: DesignSystemManifest
  allowed: string[]
}

function validateNode(raw: unknown, path: string, ctx: Ctx, errors: string[]): void {
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

  const props = isObject(raw.props) ? raw.props : {}
  const schema = ctx.schemas[type]

  for (const key of Object.keys(props)) {
    if (!(key in component.props)) {
      errors.push(`${path} <${type}>: unknown prop "${key}".`)
      continue
    }
    const field = (schema.shape as Record<string, z.ZodTypeAny>)[key]
    if (field && !field.safeParse(props[key]).success) {
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
    children.forEach((child, i) => validateNode(child, `${path} › ${type}[${i}]`, ctx, errors))
  }
}
