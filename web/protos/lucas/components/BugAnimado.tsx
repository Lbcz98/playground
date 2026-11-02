import type { ReactNode } from 'react'
import { AlertBug } from '@/ui-kit/AlertBug'
import { BUG_GLOBO_SRC } from '../dados-bug-globo'

/**
 * @proposal
 * why: a tela não pode passar o `motion` do AlertBug (o kit o trata como fase tocada pelo canvas), e o designer quer ver a entrada do bug acontecendo
 * description: o AlertBug de interface do kit, com a marca da Globo, tocando a entrada de 800 ms (o halo e o texto "Conteúdo interativo" aparecem) e ficando em repouso
 * proposedApi:
 *   label: "string"
 */
export function BugAnimado({ label = 'Conteúdo interativo' }: { label?: string }): ReactNode {
  return <AlertBug bugStyle="interface" motion="enter" label={label} src={BUG_GLOBO_SRC} />
}
