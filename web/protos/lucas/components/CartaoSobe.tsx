import { useEffect, type ReactNode } from 'react'
import { Box } from '@/primitives'
import { CardBoasVindasRepouso } from './CardBoasVindas'
import { estiloUnico } from './estiloUnico'

const ALVO = 'bv-sobe'
const ESPERA_MS = 4000

// O cartão sobe de baixo com ease simples. O estado default apaga o miolo; aqui ele fica inteiro, sem ser foco.
estiloUnico(
  'boas-vindas-sobe',
  '@keyframes bv-sobe { from { transform: translate(0, 100%); } to { transform: translate(0, 0); } }' +
    '#bv-sobe .sfs-content-card[data-state=default] > .sfs-content-card-zones { opacity: 1; }',
)

/**
 * @proposal
 * why: o kit não tem uma transição que sobe um cartão e segue sozinha para a próxima tela
 * description: o cartão de boas-vindas sobe de baixo com ease e, 4s depois, dispara o Enter da Home logada
 * proposedApi:
 *   esperaMs: "number"
 */
export function CartaoSobe(): ReactNode {
  useEffect(() => {
    const reduzido = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const alvo = document.getElementById(ALVO)
    if (alvo && !reduzido) alvo.style.animation = 'bv-sobe 250ms ease both'
    const espera = window.setTimeout(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', keyCode: 13, bubbles: true }))
    }, ESPERA_MS)
    return () => window.clearTimeout(espera)
  }, [])
  return (
    <Box id={ALVO}>
      <CardBoasVindasRepouso />
    </Box>
  )
}
