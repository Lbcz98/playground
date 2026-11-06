import { useLayoutEffect, type ReactNode } from 'react'
import { BugAnimado } from './BugAnimado'
import { reiniciaTooltip } from './tooltipLogin'

/**
 * @proposal
 * why: o passeio recomeça pelo bug (inclusive com R), e o tooltip de login precisa voltar ao começo junto
 * description: o BugAnimado do kit, que ao entrar zera o estado do tooltip de login
 * proposedApi:
 *   label: "string"
 */
export function BugAnimadoReinicia({ label }: { label?: string }): ReactNode {
  useLayoutEffect(() => {
    reiniciaTooltip()
  }, [])
  return <BugAnimado label={label} />
}
