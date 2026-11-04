import type { ReactNode } from 'react'
import { ContentCard, ContentCardHeader } from '@/ui-kit/ContentCard'
import { CODIGO_ATIVACAO, QR_IMAGEM, QR_LOGO } from '../dados-login'

/**
 * @proposal
 * why: o kit tem a variante de QR do ContentCard, mas não o conteúdo fixo do login por QR code; esta é a versão sem foco do CardLogin (o checador só lê o foco quando ele é literal)
 * description: a mesma variante de QR do CardLogin em repouso, com o QR e o logo da página de login do staging, o código de ativação e a instrução em ativar.globo.com
 * proposedApi:
 *   codigo: "string"
 */
export function CardLoginRepouso({ codigo = CODIGO_ATIVACAO }: { codigo?: string }): ReactNode {
  return (
    <ContentCard interactionState="default" qr={QR_IMAGEM} qrLogo={QR_LOGO} qrIntro="Entre ou cadastre-se para acessar essa interatividade" qrBadge="APROVEITE GRÁTIS">
      <ContentCardHeader title={codigo} subtitle="Leia o QR Code ou acesse:" address="ativar.globo.com" />
    </ContentCard>
  )
}
