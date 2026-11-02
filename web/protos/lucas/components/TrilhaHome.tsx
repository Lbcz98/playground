import type { ReactNode } from 'react'
import { InteractivityButton } from '@/ui-kit/InteractivityButton'
import { InteractivityMenu } from '@/ui-kit/InteractivityMenu'
import { programasDoRail } from '../dados-menu-perfil'

interface TrilhaHomeProps {
  /** O botão redondo focado: decide o hint. */
  item: 'schedule' | 'miscellaneous'
}

/**
 * @proposal
 * why: o foco num botão redondo da Home revela a trilha acima dele (flow.md); só o Login tinha o hint
 * description: trilha horizontal de hint de Schedule (programa no ar e os quatro seguintes, com hora, nome e pôster) e de Miscellaneous (previsão do tempo), com os componentes do kit
 * proposedApi:
 *   item: "'schedule' | 'miscellaneous'"
 */
export function TrilhaHome({ item }: TrilhaHomeProps): ReactNode {
  if (item === 'miscellaneous') {
    return (
      <InteractivityMenu align="start">
        <InteractivityButton interactionState="default" title="Previsão do tempo" />
      </InteractivityMenu>
    )
  }
  return (
    <InteractivityMenu align="start">
      {programasDoRail().map(({ hora, nome, poster, aoVivo }) => (
        <InteractivityButton key={hora} interactionState="default" overline={hora} title={nome} posterSrc={poster} live={aoVivo} />
      ))}
    </InteractivityMenu>
  )
}
