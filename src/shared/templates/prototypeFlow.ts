/**
 * Fluxo clicável — the whole way through the three levels as one document.
 *
 * Home (nível 1) → the rail (nível 2) → one interactivity (nível 3), and back one
 * level at a time. It is the three reference screens above, joined by `goTo` links: the rail
 * cards resting on Home open the second page, a card of the rail opens the third,
 * and the third level's back button returns to the rail. Each page keeps where its
 * focus starts (the channel button, a rail card, the rounded button).
 */

import type { BlueprintDocument, BlueprintNode } from '@/shared/blueprint'
import { homeTemplate } from './home'
import { interactivityCardsRightTemplate } from './interactivityCards'
import { interactivityRailTemplate } from './interactivityRail'
import type { ScreenTemplate } from './types'

function first(node: BlueprintNode, type: string): BlueprintNode {
  if (node.type === type) return node
  for (const child of node.children ?? []) {
    const hit = search(child, type)
    if (hit) return hit
  }
  throw new Error(`prototypeFlow: no <${type}> in the template`)
}

function search(node: BlueprintNode, type: string): BlueprintNode | null {
  try {
    return first(node, type)
  } catch {
    return null
  }
}

function build(): BlueprintDocument {
  const home = structuredClone(homeTemplate.blueprint)
  const rail = structuredClone(interactivityRailTemplate.blueprint)
  const stats = structuredClone(interactivityCardsRightTemplate.blueprint)

  first(home.root, 'InteractivityButton').goTo = 'rail'
  first(rail.root, 'InteractivityButton').goTo = 'stats'
  first(stats.root, 'RoundedButton').goTo = 'rail'

  return {
    version: 1,
    id: 'home',
    name: 'Home',
    screen: home.screen,
    root: home.root,
    screens: [
      { id: 'rail', name: 'Trilho', screen: rail.screen, root: rail.root },
      { id: 'stats', name: 'Estatísticas', screen: stats.screen, root: stats.root },
    ],
  }
}

export const prototypeFlowTemplate: ScreenTemplate = {
  id: 'prototype-flow',
  name: 'Fluxo clicável · Home → Trilho → Estatísticas',
  when: 'A clickable prototype across the levels: Home, the rail the viewer enters, one interactivity whose back button returns to the rail. Use it for any flow or "what happens when I click" request; drop the screens the request does not need.',
  blueprint: build(),
}
