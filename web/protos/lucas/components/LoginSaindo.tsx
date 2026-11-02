import { useEffect, useState, type ReactNode } from 'react'
import { Box, Stack } from '@/primitives'
import { BugAnimado } from './BugAnimado'
import { CardLoginRepouso } from './CardLoginRepouso'

const ALVO = 'login-saindo'
const KEYFRAMES = 'login-saindo-fade'
const DURACAO_MS = 800 // espelha --motion-semantic-duration (800ms): os dois valores andam juntos

/**
 * @proposal
 * why: o kit não tem uma saída com fade para os itens da tela; o designer pediu que Enter no card de login faça os itens sumirem antes de o bug recomeçar
 * description: o card de login (sem foco) some com fade de 800 ms, e então o bug do kit anima a entrada; o fade é uma animação CSS posta no DOM por efeito (o kit e as telas não aceitam style, className nem elemento nativo)
 * proposedApi:
 *   fadeMs: "number"
 */
export function LoginSaindo(): ReactNode {
  const [fase, setFase] = useState<'fade' | 'bug'>('fade')

  useEffect(() => {
    const reduzido = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const alvo = document.getElementById(ALVO)
    let tag: HTMLStyleElement | null = null
    if (alvo && !reduzido) {
      tag = document.createElement('style')
      tag.textContent = `@keyframes ${KEYFRAMES} { from { opacity: 1; } to { opacity: 0; } }`
      document.head.appendChild(tag)
      alvo.style.animation = `${KEYFRAMES} var(--motion-semantic-duration) ease-out both`
    }
    const espera = window.setTimeout(() => setFase('bug'), reduzido ? 0 : DURACAO_MS)
    return () => {
      window.clearTimeout(espera)
      tag?.remove()
    }
  }, [])

  if (fase === 'fade') {
    return (
      <Stack direction="row" justify="start" align="end" gap="sm" padding="none">
        {/* @reuse ContentCard: o Box só dá um id para o efeito achar o card e aplicar o fade; nenhum componente do kit anima a saída */}
        <Box id={ALVO}>
          <CardLoginRepouso />
        </Box>
      </Stack>
    )
  }
  return (
    <Stack direction="row" justify="end" align="end" gap="sm" padding="none">
      <BugAnimado />
    </Stack>
  )
}
