/**
 * Home + Notificação — nível 1, the home screen while a notification is showing.
 *
 * Home, unchanged, with the notification arriving in the top-right corner. The
 * screen's shades gain that corner (`home-notification` = the home model plus the
 * top-right shade), which is the whole reason a notification needs its own model:
 * the corner it lands in has to be dark enough to read it.
 *
 * Focus stays on the programme button — a notification announces itself, it does
 * not steal the focus. Reaching it is what turns its `interactionState` to focus.
 */

import type { ScreenTemplate } from './types'

export const homeNotificationTemplate: ScreenTemplate = {
  id: 'home-notification',
  name: 'Home + Notificação',
  when: 'The home screen while a notification shows in the top-right corner — same menu and rail, one extra shade.',
  blueprint: {
    version: 1,
    screen: { model: 'home-notification', level: 1 },
    root: {
      type: 'Stack',
      props: { direction: 'vertical', justify: 'between', gap: 'sm', padding: 'none', grow: true },
      children: [
        {
          type: 'Stack',
          props: { direction: 'horizontal', justify: 'end', gap: 'sm' },
          children: [
            {
              type: 'Notification',
              props: {
                kind: 'message',
                title: 'Paredão formado!\nVote agora para eliminar',
                interactionState: 'default',
              },
            },
          ],
        },
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
