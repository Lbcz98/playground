import type { ReactNode } from 'react'
import { useFlowNotice } from '@/ui-kit/flowNotice'
import { Notification } from '@/ui-kit/Notification'
import { AVATAR_ANONIMO } from '../dados-avatar-anonimo'

/**
 * @proposal
 * why: o aviso de login chega sozinho depois de um tempo (notice do flow.ts) e o kit só desenha a notificação aberta ou fechada; quem abre e fecha é o player
 * description: a Notification do kit com o aviso de login, que chega e sai conforme o estado do notice do fluxo; não recebe foco
 * proposedApi:
 *   title: "string"
 */
export function NotificacaoLogin({ title }: { title: string }): ReactNode {
  const { open } = useFlowNotice()
  return <Notification as="span" kind="message" title={title} logoSrc={AVATAR_ANONIMO} open={open} />
}
