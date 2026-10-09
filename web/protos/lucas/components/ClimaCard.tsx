import { Box, Text } from '@/primitives'
import { ContentCard, ContentCardBody, ContentCardFooter, ContentCardHeader } from '@/ui-kit/ContentCard'
import { TableCell } from '@/ui-kit/TableCell'

type Props = {
  cidade: string
  condicao: string
  temperatura: string
  maxima: string
  minima: string
  ar: { valor: string; rotulo: string; status: 'success' | 'warning' | 'error' }
  atualizado: string
}

/**
 * @proposal
 * why: o kit não tem linha rótulo/valor com chip de status nem temperatura em destaque no card
 * description: ContentCard em zonas para clima — header (cidade, condição), temperatura em destaque, body (Máxima e Mínima, qualidade do ar em chip) e footer de atualização; estático, sempre focado
 * figma: n/a — origem em docs/explorations/weather-card (opção 02)
 * proposedApi:
 *   cidade: "string"
 *   condicao: "string"
 *   temperatura: "string"
 *   maxima: "string"
 *   minima: "string"
 *   ar: "{ valor: string, rotulo: string, status: 'success' | 'warning' | 'error' }"
 *   atualizado: "string"
 */
export function ClimaCard({ cidade, condicao, temperatura, maxima, minima, ar, atualizado }: Props) {
  return (
    <ContentCard interactionState="focus" height={240}>
      <ContentCardHeader title={cidade} subtitle={condicao} />
      <ContentCardBody>
        {/* @reuse ContentCard: temperatura grande não cabe no header do kit */}
        <Text variant="heading-3-bold">{temperatura}</Text>
        <TableCell name="Máxima / Mínima" stats={[maxima, minima]} />
        {/* @reuse TableCell: a linha precisa de um chip de status e o chip não existe no kit */}
        <Box paddingX="xs" background="tint" radius="full">
          {/* @reuse TableCell: texto do chip, colorido pelo status */}
          <Text variant="caption-bold" color={`status-${ar.status}`}>{`Ar ${ar.valor} · ${ar.rotulo}`}</Text>
        </Box>
      </ContentCardBody>
      <ContentCardFooter caption={atualizado} />
    </ContentCard>
  )
}
