import type { ReactNode } from 'react'
import { Stack } from '@/primitives'
import { ContentCard, ContentCardBody, ContentCardFooter, ContentCardHeader } from '@/ui-kit/ContentCard'
import { RoundedButton } from '@/ui-kit/RoundedButton'
import { Screen } from '@/ui-kit/Screen'
import { TableCell } from '@/ui-kit/TableCell'

/**
 * Tabela1 — times 1 a 10 do campeonato; Enter no cartão mostra os outros 10. Layer model `interactivity-cards-left`, level 3.
 */
export function Tabela1(): ReactNode {
  return (
    <Screen
      model="interactivity-cards-left"
      level={3}
      focusSide="left"
      anchored={<RoundedButton label="Voltar" interactionState="focus" />}
    >
      <Stack direction="column" justify="end" align="stretch" gap="sm" padding="none" grow>
        <Stack direction="row" justify="start" align="end" gap="sm">
          <ContentCard interactionState="default">
            <ContentCardHeader title="Brasileirão" subtitle="Pts · J · V" />
            <ContentCardBody>
              <TableCell position="1" name="FLA" stats={['58', '28', '17']} />
              <TableCell position="2" name="PAL" stats={['56', '28', '16']} />
              <TableCell position="3" name="BOT" stats={['52', '28', '15']} />
              <TableCell position="4" name="CAM" stats={['50', '28', '14']} />
              <TableCell position="5" name="INT" stats={['48', '28', '13']} />
              <TableCell position="6" name="SAO" stats={['46', '28', '13']} />
              <TableCell position="7" name="GRE" stats={['45', '28', '12']} />
              <TableCell position="8" name="COR" stats={['43', '28', '11']} />
              <TableCell position="9" name="FLU" stats={['42', '28', '11']} />
              <TableCell position="10" name="CRU" stats={['41', '28', '10']} />
            </ContentCardBody>
            <ContentCardFooter caption="Página 1 de 2" />
          </ContentCard>
        </Stack>
      </Stack>
    </Screen>
  )
}

export default Tabela1
