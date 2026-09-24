/**
 * Home — nível 1, the first screen after login.
 *
 * The live broadcast is the screen: nothing labels it, because on TV the picture
 * behind the UI is always on air. Above the menu sits the interactivity rail,
 * kept to the right and a `2xl` step clear of it, each card at rest with its
 * title alone — a card here is the way into its nível 3 interactivity, not a
 * programme.
 *
 * Focus is on the programme button in the menu, the way the viewer first meets
 * the screen, so every card is `default` rather than focus/selected.
 *
 * Its overlay is the `home` model: the scrim plus the bottom and both bottom
 * corners.
 */

import type { ScreenTemplate } from './types'

export const homeTemplate: ScreenTemplate = {
  id: 'home',
  name: 'Home',
  when: 'The home screen after login: the main menu along the bottom and the interactivity rail resting above it, focus on the programme button.',
  blueprint: {
    version: 1,
    screen: { model: 'home', level: 1 },
    root: {
      type: 'Stack',
      props: { direction: 'vertical', justify: 'end', gap: 'sm', padding: 'none', grow: true },
      children: [
        {
          type: 'Stack',
          props: { direction: 'vertical', justify: 'end', gap: '2xl' },
          children: [
            {
              type: 'InteractivityMenu',
              props: { align: 'end' },
              children: [
                { type: 'InteractivityButton', props: { title: 'Opções de áudio' } },
                { type: 'InteractivityButton', props: { title: 'Lances da partida' } },
                { type: 'InteractivityButton', props: { title: 'Vote no Craque do Jogo' } },
                { type: 'InteractivityButton', props: { title: 'Estatísticas' } },
              ],
            },
            {
              type: 'MainMenu',
              props: {
                focusedItem: 'channel-bug',
                weatherTitle: 'Previsão do tempo',
                weatherSubtitle: 'São Paulo, SP',
                programTitle: 'Copa do Mundo: Equador x Argentina',
                programSubtitle: 'A seguir Central da Copa',
              },
            },
          ],
        },
      ],
    },
  },
}
