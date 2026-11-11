import type { ReactNode } from 'react'
import { ContentCard, ContentCardHeader } from '@/ui-kit/ContentCard'
import { CODIGO_ATIVACAO, QR_IMAGEM, QR_LOGO } from '../dados-login'

/**
 * @proposal
 * why: o kit tem a variante de QR do ContentCard, mas não o conteúdo fixo do login por QR code (Figma 7852:12714)
 * description: a variante de QR do ContentCard em foco, com o QR e o logo da página de login do staging, o código de ativação e a instrução em ativar.globo.com
 * proposedApi:
 *   codigo: "string"
 */
export function CardLogin({ codigo = CODIGO_ATIVACAO, topo = true }: { codigo?: string; topo?: boolean }): ReactNode {
  return (
    <ContentCard interactionState="focus" qr={QR_IMAGEM} qrLogo={QR_LOGO} qrIntro={topo ? 'Entre ou cadastre-se para acessar essa interatividade' : undefined} qrBadge={topo ? 'APROVEITE GRÁTIS' : undefined}>
      <ContentCardHeader title={codigo} subtitle="Leia o QR Code ou acesse:" address="ativar.globo.com" />
    </ContentCard>
  )
}
