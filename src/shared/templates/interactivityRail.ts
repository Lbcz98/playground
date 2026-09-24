/**
 * Interatividades · Botões Direita — nível 2, the rail once the viewer enters it.
 *
 * The screen clears around the one rail: the main menu is gone, and the rail is
 * everything that is left. Entering it expands the whole row — the card the
 * viewer is on takes the focus, every other card goes `selected` rather than
 * back to rest, which is how the row reads as one entered thing.
 *
 * The rail stays on the right, so the model shades the right corner and the
 * bottom edge, and the menu keeps its content on that side (`align: "end"`).
 */

import type { ScreenTemplate } from './types'

export const interactivityRailTemplate: ScreenTemplate = {
  id: 'interactivity-buttons-right',
  name: 'Interatividades · Botões Direita',
  when: 'The interactivity rail after the viewer enters it: no menu, the whole row expanded, one card focused and the rest selected.',
  blueprint: {
    version: 1,
    screen: { model: 'interactivity-buttons-right', level: 2 },
    root: {
      type: 'Stack',
      props: {
        direction: 'vertical',
        justify: 'end',
        align: 'stretch',
        gap: 'sm',
        padding: 'none',
        grow: true,
      },
      children: [
        {
          type: 'InteractivityMenu',
          props: { align: 'end' },
          children: [
            { type: 'InteractivityCard', props: { title: 'Opções de áudio', interactionState: 'selected' } },
            { type: 'InteractivityCard', props: { title: 'Lances da partida', interactionState: 'selected' } },
            { type: 'InteractivityCard', props: { title: 'Vote no Craque do Jogo', interactionState: 'focus' } },
            { type: 'InteractivityCard', props: { title: 'Estatísticas', interactionState: 'selected' } },
          ],
        },
      ],
    },
  },
}
