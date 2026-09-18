/**
 * Alerta — nível 0, the clean broadcast.
 *
 * Nothing but the picture and the bug in the bottom-right corner saying an
 * interactivity is waiting. Nível 0 shows at most one module and anchors nothing,
 * so this screen is the whole rule in one node.
 *
 * Its overlay is the `alert` model: the bottom-right shade and no scrim — the
 * picture must stay untouched, because the viewer is watching it.
 */

import type { ScreenTemplate } from './types'

export const alertTemplate: ScreenTemplate = {
  id: 'alert',
  name: 'Alerta',
  when: 'The clean broadcast with an interactivity alert bug in the bottom-right corner — no menu, no rail, nothing else on screen.',
  blueprint: {
    version: 1,
    screen: { model: 'alert', level: 0 },
    root: {
      type: 'Stack',
      props: {
        direction: 'vertical',
        justify: 'end',
        align: 'end',
        gap: 'sm',
        padding: 'none',
        grow: true,
      },
      children: [
        {
          type: 'AlertBug',
          props: { bugStyle: 'interface', interactionState: 'default', label: 'Conteúdo interativo' },
        },
      ],
    },
  },
}
