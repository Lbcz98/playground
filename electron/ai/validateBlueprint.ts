/**
 * Step 3 of the pipeline — the strict Zod validator, in the Electron main process.
 *
 * Unlike the renderer's `interpretBlueprint` (which *repairs* a payload so it can
 * always render), this *rejects*: any unknown component, unknown prop, or
 * non-token value is an error. The orchestrator feeds these error strings back to
 * the Generator agent for a retry.
 */

import type { z } from 'zod'
import { getCatalogEntry } from '@/design-system/catalog'

export type BlueprintValidation = { ok: true } | { ok: false; errors: string[] }

const ROOT_CONTAINER_TYPE = 'Stack'

function shapeOf(schema: z.ZodTypeAny): Record<string, z.ZodTypeAny> {
  return (schema as unknown as { shape?: Record<string, z.ZodTypeAny> }).shape ?? {}
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

export function validateBlueprint(input: unknown): BlueprintValidation {
  const errors: string[] = []

  if (!isObject(input)) return { ok: false, errors: ['Blueprint must be a JSON object.'] }
  if (input.version !== 1) {
    errors.push(`"version" must be 1 (got ${JSON.stringify(input.version)}).`)
  }
  if (!isObject(input.root)) {
    return { ok: false, errors: [...errors, 'Blueprint must have a "root" node object.'] }
  }
  if (input.root.type !== ROOT_CONTAINER_TYPE) {
    errors.push(`The root node must be a <${ROOT_CONTAINER_TYPE}> (got ${JSON.stringify(input.root.type)}).`)
  }

  validateNode(input.root, 'root', errors)

  return errors.length === 0 ? { ok: true } : { ok: false, errors }
}

function validateNode(raw: unknown, path: string, errors: string[]): void {
  if (!isObject(raw)) {
    errors.push(`${path}: node must be an object.`)
    return
  }

  const type = raw.type
  if (typeof type !== 'string') {
    errors.push(`${path}: node is missing a string "type".`)
    return
  }

  const entry = getCatalogEntry(type)
  if (!entry) {
    errors.push(`${path}: <${type}> is not a real component. Allowed: Stack, Text, Button, Input.`)
    return
  }

  const props = isObject(raw.props) ? raw.props : {}
  const shape = shapeOf(entry.schema)

  for (const key of Object.keys(props)) {
    if (!(key in shape)) {
      errors.push(`${path} <${type}>: unknown prop "${key}".`)
      continue
    }
    const result = shape[key].safeParse(props[key])
    if (!result.success) {
      errors.push(
        `${path} <${type}>: prop "${key}" = ${JSON.stringify(props[key])} is not an allowed value.`,
      )
    }
  }

  const children = Array.isArray(raw.children) ? raw.children : []
  if (children.length > 0 && !entry.acceptsChildren) {
    errors.push(`${path} <${type}>: cannot have children.`)
  }
  if (entry.acceptsChildren) {
    children.forEach((child, i) => validateNode(child, `${path} › ${type}[${i}]`, errors))
  }
}
