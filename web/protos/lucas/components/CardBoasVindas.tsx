import type { ReactNode } from 'react'
import { Stack, Text } from '@/primitives'
import { ContentCard } from '@/ui-kit/ContentCard'
import { CONTA_SSO } from '../dados-login'
import { RetratoBoasVindas } from './MarcasSso'

/**
 * @proposal
 * why: o kit não tem o cartão que o staging mostra à direita entre o login (QR ativado ou SSO) e a Home logada
 * description: cartão com o logo da Conta Globo, a foto do perfil e o cumprimento Olá, como transição para a Home logada
 * proposedApi:
 *   nome: "string"
 */
export function CardBoasVindas({ nome = CONTA_SSO }: { nome?: string }): ReactNode {
  return (
    <ContentCard interactionState="focus">
      {/* @reuse ContentCard: o Stack só centra o logo, a foto e o cumprimento, que o header do card não empilha assim */}
      <Stack direction="column" align="center" gap="lg">
        <RetratoBoasVindas />
        {/* @reuse ContentCardHeader: o cumprimento são duas linhas do mesmo peso; o vão none deixa a altura de linha do heading-3, sem o lg do cartão */}
        <Stack direction="column" align="center" gap="none">
          <Text variant="heading-3-bold" align="center">
            Olá,
          </Text>
          <Text variant="heading-3-bold" align="center">
            {nome}
          </Text>
        </Stack>
      </Stack>
    </ContentCard>
  )
}

/**
 * O mesmo cartão em repouso: a boas-vindas não é um nível 3, então o cartão não leva foco.
 * @proposal
 * why: o kit não tem o cartão de boas-vindas, e esta passagem não é uma interatividade
 * description: o cartão de boas-vindas em repouso, com o logo da Conta Globo, a foto e o cumprimento Olá
 * proposedApi:
 *   nome: "string"
 */
export function CardBoasVindasRepouso({ nome = CONTA_SSO }: { nome?: string }): ReactNode {
  return (
    <ContentCard interactionState="default">
      {/* @reuse ContentCard: o Stack só centra o logo, a foto e o cumprimento, que o header do card não empilha assim */}
      <Stack direction="column" align="center" gap="lg">
        <RetratoBoasVindas />
        {/* @reuse ContentCardHeader: o cumprimento são duas linhas do mesmo peso; o vão none deixa a altura de linha do heading-3, sem o lg do cartão */}
        <Stack direction="column" align="center" gap="none">
          <Text variant="heading-3-bold" align="center">
            Olá,
          </Text>
          <Text variant="heading-3-bold" align="center">
            {nome}
          </Text>
        </Stack>
      </Stack>
    </ContentCard>
  )
}
