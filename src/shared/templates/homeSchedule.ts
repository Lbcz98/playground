/**
 * Home · Programação — nível 1, the Home screen with the schedule rail.
 *
 * Each menu button owns a rail (the menu roles, `screenLayers.menu`): Program's
 * sits on the right, Miscellaneous', Schedule's and Login's on the left. This is
 * Schedule's: the rail moves to the left and the focus to the Schedule button
 * that owns it. Each card stands for a programme — its time as the overline, the
 * live badge on the one on air, and its name as the title — which is the one
 * place a card carries more than a title.
 *
 * Its overlay is the `home-buttons-left` model: the scrim, the bottom and the
 * bottom-left corner the rail sits in.
 */

import type { ScreenTemplate } from './types'

export const homeScheduleTemplate: ScreenTemplate = {
  id: 'home-schedule',
  name: 'Home · Programação',
  when: 'Home with the schedule rail on the left: focus on the Schedule button, one card per programme with its time, whether it is live, and its name.',
  blueprint: {
    version: 1,
    screen: { model: 'home-buttons-left', level: 1 },
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
              props: { align: 'start' },
              children: [
                { type: 'InteractivityButton', props: { overline: '13:00', live: true, title: 'Jornal da Tarde' } },
                { type: 'InteractivityButton', props: { overline: '14:30', title: 'Cinema em Casa' } },
                { type: 'InteractivityButton', props: { overline: '16:00', title: 'Novela das Seis' } },
              ],
            },
            {
              type: 'MainMenu',
              props: {
                focusedItem: 'schedule',
                miscellaneousTitle: 'Previsão do tempo',
                miscellaneousSubtitle: 'São Paulo, SP',
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
