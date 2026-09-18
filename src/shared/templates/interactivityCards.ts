/**
 * Interatividades · Cards — nível 3, one interactivity with the screen to itself.
 *
 * The third level clears everything else: one interactivity holds the screen, and
 * the only other thing on it is the `<CloseButton>` that closes it, anchored in
 * the corner the focus is on — closing, not stepping back, which is why it is
 * that control and not the back arrow. The side matters twice over — the model
 * shades that edge and its bottom corner, and the frame puts the anchored
 * cluster there.
 *
 * The panel's own contents stand in for the interactivity: the statistics, the
 * line-up and the rest are their own components in Figma and are not ported yet,
 * so a template shows the shape of a nível 3 screen rather than pretending to be
 * one of them. Text sits in `inverse` so it reads over the shade.
 *
 * Both sides are the same screen mirrored, which is the point: a template per
 * side, because the side is a design decision the model has to agree with.
 */

import type { BlueprintNode } from '@/shared/blueprint'
import type { ScreenTemplate } from './types'

type Side = 'left' | 'right'

function statRow(label: string, value: string, side: Side): BlueprintNode {
  return {
    type: 'Stack',
    props: { direction: 'horizontal', justify: 'between', gap: 'lg', align: 'center' },
    children: [
      { type: 'Text', props: { content: label, variant: 'body', tone: 'inverse', align: side === 'right' ? 'end' : 'start' } },
      { type: 'Text', props: { content: value, variant: 'body', tone: 'inverse' } },
    ],
  }
}

function panel(side: Side): BlueprintNode {
  return {
    type: 'Stack',
    props: { direction: 'vertical', gap: 'sm', align: side === 'right' ? 'end' : 'start' },
    children: [
      {
        type: 'Text',
        props: {
          content: 'Estatísticas',
          variant: 'title',
          tone: 'inverse',
          align: side === 'right' ? 'end' : 'start',
        },
      },
      statRow('Posse de bola', '62% · 38%', side),
      statRow('Finalizações', '11 · 7', side),
      statRow('Escanteios', '5 · 3', side),
    ],
  }
}

function cardsTemplate(side: Side): ScreenTemplate {
  const isRight = side === 'right'
  return {
    id: `interactivity-cards-${side}`,
    name: `Interatividades · Cards ${isRight ? 'Direita' : 'Esquerda'}`,
    when: `A single interactivity holding the screen on the ${side}, with its anchored control in that corner — nível 3, nothing else on screen.`,
    blueprint: {
      version: 1,
      screen: { model: `interactivity-cards-${side}`, level: 3 },
      root: {
        type: 'Stack',
        props: {
          direction: 'vertical',
          justify: 'end',
          align: isRight ? 'end' : 'start',
          gap: 'sm',
          padding: 'none',
          grow: true,
        },
        children: [
          panel(side),
          { type: 'CloseButton', props: { label: 'Fechar', interactionState: 'focus' }, anchor: true },
        ],
      },
    },
  }
}

export const interactivityCardsRightTemplate = cardsTemplate('right')
export const interactivityCardsLeftTemplate = cardsTemplate('left')
