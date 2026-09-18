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

import type { ScreenTemplate } from './types'

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

export interface TemplateChoice {
  template?: ScreenTemplate
  /** How it was chosen, for the pipeline's step log. */
  reason: 'named' | 'model' | 'none' | 'unavailable'
}

export function chooseTemplate(
  planText: string,
  templates: readonly ScreenTemplate[],
): TemplateChoice {
  if (templates.length === 0) return { reason: 'unavailable' }

  const named = parseTemplateLine(planText)
  if (named === 'none') return { reason: 'none' }
  if (named) {
    const match = templates.find((t) => t.id === named)
    if (match) return { template: match, reason: 'named' }
  }

  const model = parseScreenModel(planText)
  if (model) {
    const match = templates.find((t) => t.blueprint.screen?.model === model)
    if (match) return { template: match, reason: 'model' }
  }

  return { reason: 'none' }
}
