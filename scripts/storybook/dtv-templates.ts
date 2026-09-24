/**
 * Reference screens for the DTV Storybook export (`export-dtv.ts`) — the same six
 * screens `src/shared/templates` authors for the built-in catalog, translated to
 * the DTV import's own component and prop names:
 *
 *   - the interactivity card is `UiKitButton` (the name it imports under, since
 *     it shares "Button" with the primitive — `storybookComponentSources`);
 *   - `direction` is `'row'` / `'column'`, not `'vertical'` / `'horizontal'`;
 *   - `TableCell` uses its own real fields (`name`, `values`, `stats`), not the
 *     catalog's flattened `stat1-3` / `leftValue` / `rightValue`.
 *
 * `export-dtv.ts` feeds these through the real importer after building the
 * export, so a drift in the kit's real props or in this file's naming fails the
 * export loudly rather than shipping a broken reference screen.
 */
import type { BlueprintDocument, BlueprintNode } from '../../src/shared/blueprint'
import type { ManifestScreenTemplate } from '../../src/shared/design-system/manifest'

/**
 * The interactivity rail. At rest (`entered: false`) its cards carry no focus —
 * the home screen's focus is the menu's programme button — so each is set to
 * `default` explicitly: unlike the catalog's InteractivityCard, the real
 * `UiKitButton` defaults its `interactionState` to `focus`. Entered, the row
 * expands: the card the viewer is on takes the focus, the rest go `selected`.
 */
function menu(entered = false): BlueprintNode {
  const rest = { interactionState: entered ? ('selected' as const) : ('default' as const) }
  const card = (title: string, isFocused: boolean): BlueprintNode => ({
    type: 'UiKitButton',
    props: { title, interactionState: isFocused ? 'focus' : rest.interactionState },
  })
  return {
    type: 'InteractivityMenu',
    props: { align: 'end' },
    children: [
      card('Opções de áudio', false),
      card('Lances da partida', false),
      card('Vote no Craque do Jogo', entered),
      card('Estatísticas', false),
    ],
  }
}

function mainMenu(): BlueprintNode {
  return {
    type: 'MainMenu',
    props: {
      focusedItem: 'channel-bug',
      weatherTitle: 'Previsão do tempo',
      weatherSubtitle: 'São Paulo, SP',
      programTitle: 'Copa do Mundo: Equador x Argentina',
      programSubtitle: 'A seguir Central da Copa',
    },
  }
}

const home: BlueprintDocument = {
  version: 1,
  screen: { model: 'home', level: 1 },
  root: {
    type: 'Stack',
    props: { direction: 'column', justify: 'end', gap: 'sm', padding: 'none', grow: true },
    children: [{ type: 'Stack', props: { direction: 'column', justify: 'end', gap: '2xl' }, children: [menu(), mainMenu()] }],
  },
}

const homeNotification: BlueprintDocument = {
  version: 1,
  screen: { model: 'home-notification', level: 1 },
  root: {
    type: 'Stack',
    props: { direction: 'column', justify: 'between', gap: 'sm', padding: 'none', grow: true },
    children: [
      {
        type: 'Stack',
        props: { direction: 'row', justify: 'end', gap: 'sm' },
        children: [
          {
            type: 'Notification',
            props: { kind: 'message', title: 'Paredão formado!\nVote agora para eliminar', interactionState: 'default' },
          },
        ],
      },
      { type: 'Stack', props: { direction: 'column', justify: 'end', gap: '2xl' }, children: [menu(), mainMenu()] },
    ],
  },
}

const interactivityButtonsRight: BlueprintDocument = {
  version: 1,
  screen: { model: 'interactivity-buttons-right', level: 2 },
  root: {
    type: 'Stack',
    props: { direction: 'column', justify: 'end', align: 'stretch', gap: 'sm', padding: 'none', grow: true },
    children: [menu(true)],
  },
}

function statsCard(): BlueprintNode {
  return {
    type: 'ContentCard',
    props: { interactionState: 'default', height: 272 },
    children: [
      { type: 'ContentCardHeader', props: { title: 'Estatísticas', subtitle: '1º tempo' } },
      {
        type: 'ContentCardBody',
        children: [
          { type: 'TableCell', props: { type: 'scout', label: 'Posse de bola', values: ['62%', '38%'], divider: true } },
          { type: 'TableCell', props: { type: 'team', name: 'EQU', position: '1', stats: ['11', '5', '2'] } },
          { type: 'TableCell', props: { type: 'team', name: 'ARG', position: '2', stats: ['7', '3', '1'] } },
        ],
      },
      { type: 'ContentCardFooter', props: { caption: 'Atualizado há 1 min' } },
    ],
  }
}

function interactivityCards(side: 'left' | 'right'): BlueprintDocument {
  const isRight = side === 'right'
  return {
    version: 1,
    screen: { model: `interactivity-cards-${side}`, level: 3 },
    root: {
      type: 'Stack',
      props: {
        direction: 'column',
        justify: 'end',
        align: 'stretch',
        gap: 'sm',
        padding: 'none',
        grow: true,
      },
      children: [
        {
          type: 'Stack',
          props: { direction: 'row', justify: isRight ? 'end' : 'start', align: 'end', gap: 'sm' },
          children: [statsCard()],
        },
        { type: 'CloseButton', props: { label: 'Fechar', interactionState: 'focus' }, anchor: true },
      ],
    },
  }
}

const alert: BlueprintDocument = {
  version: 1,
  screen: { model: 'alert', level: 0 },
  root: {
    type: 'Stack',
    props: { direction: 'column', justify: 'end', align: 'stretch', gap: 'sm', padding: 'none', grow: true },
    children: [
      {
        type: 'Stack',
        props: { direction: 'row', justify: 'end', align: 'end', gap: 'sm' },
        children: [{ type: 'AlertBug', props: { bugStyle: 'interface', interactionState: 'default', label: 'Conteúdo interativo' } }],
      },
    ],
  },
}

export const DTV_TEMPLATES: ManifestScreenTemplate[] = [
  {
    id: 'home',
    name: 'Home',
    when: 'The home screen after login: the main menu along the bottom and the interactivity rail resting above it, focus on the channel button.',
    blueprint: home,
  },
  {
    id: 'home-notification',
    name: 'Home + Notificação',
    when: 'The home screen while a notification shows in the top-right corner — same menu and rail, one extra shade.',
    blueprint: homeNotification,
  },
  {
    id: 'interactivity-buttons-right',
    name: 'Interatividades · Botões Direita',
    when: 'The interactivity rail after the viewer enters it: no menu, the whole row expanded, one card focused and the rest selected.',
    blueprint: interactivityButtonsRight,
  },
  {
    id: 'interactivity-cards-right',
    name: 'Interatividades · Cards Direita',
    when: 'A single interactivity holding the screen on the right, with its anchored control in that corner — nível 3, nothing else on screen.',
    blueprint: interactivityCards('right'),
  },
  {
    id: 'interactivity-cards-left',
    name: 'Interatividades · Cards Esquerda',
    when: 'A single interactivity holding the screen on the left, with its anchored control in that corner — nível 3, nothing else on screen.',
    blueprint: interactivityCards('left'),
  },
  {
    id: 'alert',
    name: 'Alerta',
    when: 'The clean broadcast with an interactivity alert bug in the bottom-right corner — no menu, no rail, nothing else on screen.',
    blueprint: alert,
  },
]
