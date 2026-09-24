import type { ScreenTemplate } from './types'
import { alertTemplate } from './alert'
import { homeTemplate } from './home'
import { homeNotificationTemplate } from './homeNotification'
import { interactivityCardsLeftTemplate, interactivityCardsRightTemplate } from './interactivityCards'
import { interactivityRailTemplate } from './interactivityRail'
import { prototypeFlowTemplate } from './prototypeFlow'

export type { ScreenTemplate } from './types'
export { chooseTemplate, parseScreenModel, parseTemplateLine, type TemplateChoice } from './choose'

/** Every reference screen, in the order a person meets them. */
export const SCREEN_TEMPLATES: readonly ScreenTemplate[] = [
  homeTemplate,
  homeNotificationTemplate,
  interactivityRailTemplate,
  interactivityCardsRightTemplate,
  interactivityCardsLeftTemplate,
  alertTemplate,
  prototypeFlowTemplate,
]

export const TEMPLATE_IDS: readonly string[] = SCREEN_TEMPLATES.map((template) => template.id)

export function screenTemplate(id: unknown): ScreenTemplate | undefined {
  return typeof id === 'string' ? SCREEN_TEMPLATES.find((template) => template.id === id) : undefined
}
