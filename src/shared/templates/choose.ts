/**
 * Choosing the template a generation starts from.
 *
 * The planner names one on a `Template:` line, because it is the step that has
 * read the request — and `none` is an answer: a screen can sit on the `home`
 * layer model without being the home screen, so a refusal composes fresh rather
 * than being talked out of it.
 *
 * Everything else falls back to the screen model the plan named, which covers
 * both the plan that forgot the line and the one that named a template that does
 * not exist.
 */

import type { ManifestScreenTemplate } from '@/shared/design-system/manifest'

/** `Template: home` → `home`; `Template: none` → `none`; nothing → `undefined`. */
export function parseTemplateLine(planText: string): string | undefined {
  const match = /^[ \t]*template[ \t]*:[ \t]*([A-Za-z0-9-]+)/im.exec(planText)
  return match ? match[1].toLowerCase() : undefined
}

/** `Screen: model "home", level 1` → `home`. */
export function parseScreenModel(planText: string): string | undefined {
  const match = /^[ \t]*screen[ \t]*:.*?model[ \t]*["']?([A-Za-z0-9-]+)/im.exec(planText)
  return match ? match[1].toLowerCase() : undefined
}

export interface TemplateChoice<T extends ManifestScreenTemplate = ManifestScreenTemplate> {
  template?: T
  /** How it was chosen, for the pipeline's step log. */
  reason: 'named' | 'model' | 'none' | 'unavailable'
}

/**
 * The layer model a template's blueprint declares. Read defensively — a
 * template's `blueprint` is only a typed `BlueprintDocument` for the built-in
 * system (`ScreenTemplate`); an imported system's is whatever its export
 * carried, validated once at import time but not typed here.
 */
function screenModelOf(blueprint: object): string | undefined {
  const screen = (blueprint as Record<string, unknown>).screen
  if (typeof screen !== 'object' || screen === null) return undefined
  const model = (screen as Record<string, unknown>).model
  return typeof model === 'string' ? model : undefined
}

export function chooseTemplate<T extends ManifestScreenTemplate>(
  planText: string,
  templates: readonly T[],
): TemplateChoice<T> {
  if (templates.length === 0) return { reason: 'unavailable' }

  const named = parseTemplateLine(planText)
  if (named === 'none') return { reason: 'none' }
  if (named) {
    const match = templates.find((t) => t.id === named)
    if (match) return { template: match, reason: 'named' }
  }

  const model = parseScreenModel(planText)
  if (model) {
    const match = templates.find((t) => screenModelOf(t.blueprint) === model)
    if (match) return { template: match, reason: 'model' }
  }

  return { reason: 'none' }
}
