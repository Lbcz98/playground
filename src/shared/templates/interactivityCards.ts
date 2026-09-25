/**
 * Interatividades · Cards — nível 3, one interactivity with the screen to itself.
 *
 * The third level clears everything else: one interactivity holds the screen, and
 * the only other thing on it is the `<RoundedButton>` — the back arrow — anchored
 * in the corner the focus is on. Back returns exactly one level, to the rail the
 * interactivity was opened from; closing everything back to Home is the close
 * button's job, not this screen's default. The side matters twice over — the model
 * shades that edge and its bottom corner, and the frame puts the anchored
 * cluster there.
 *
 * The interactivity is a real `<ContentCard>`: a header naming it, a body of
 * `<TableCell>` rows — the scout row heading the two sides, then a row per side —
 * and a footer saying how fresh the numbers are. The card carries its own
 * surface, so the screen does not dress it: the template only decides which side
 * it sits on. Focus stays on the back button, because a TV screen has exactly
 * one focused element and on this level that is the way out.
 *
 * Both sides are the same screen mirrored, which is the point: a template per
 * side, because the side is a design decision the model has to agree with.
 */

import type { BlueprintNode } from '@/shared/blueprint'
import type { ScreenTemplate } from './types'

type Side = 'left' | 'right'

/** The heading row: the stat named between the two sides' values. */
function scoutRow(label: string, left: string, right: string): BlueprintNode {
  return {
    type: 'TableCell',
    props: { cellType: 'scout', label, leftValue: left, rightValue: right, divider: true },
  }
}

/** One side of the match: its position, short name and the columns beside it. */
function teamRow(name: string, position: string, stats: readonly [string, string, string]): BlueprintNode {
  return {
    type: 'TableCell',
    props: {
      cellType: 'team',
      label: name,
      lead: position,
      stat1: stats[0],
      stat2: stats[1],
      stat3: stats[2],
    },
  }
}

function card(): BlueprintNode {
  return {
    type: 'ContentCard',
    props: { interactionState: 'default', height: 272 },
    children: [
      {
        type: 'ContentCardHeader',
        props: { title: 'Estatísticas', subtitle: '1º tempo' },
      },
      {
        type: 'ContentCardBody',
        children: [
          scoutRow('Posse de bola', '62%', '38%'),
          teamRow('EQU', '1', ['11', '5', '2']),
          teamRow('ARG', '2', ['7', '3', '1']),
        ],
      },
      { type: 'ContentCardFooter', props: { caption: 'Atualizado há 1 min' } },
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
          align: 'stretch',
          gap: 'sm',
          padding: 'none',
          grow: true,
        },
        children: [
          {
            type: 'Stack',
            props: { direction: 'horizontal', justify: isRight ? 'end' : 'start', align: 'end', gap: 'sm' },
            children: [card()],
          },
          { type: 'RoundedButton', props: { label: 'Voltar', interactionState: 'focus' }, anchor: true },
        ],
      },
    },
  }
}

export const interactivityCardsRightTemplate = cardsTemplate('right')
export const interactivityCardsLeftTemplate = cardsTemplate('left')
