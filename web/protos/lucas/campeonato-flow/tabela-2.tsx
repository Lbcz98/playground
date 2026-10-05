import type { ReactNode } from 'react'
import { Stack } from '@/primitives'
import { ContentCard, ContentCardBody, ContentCardFooter, ContentCardHeader } from '@/ui-kit/ContentCard'
import { RoundedButton } from '@/ui-kit/RoundedButton'
import { Screen } from '@/ui-kit/Screen'
import { TableCell } from '@/ui-kit/TableCell'

/**
 * Tabela2 — times 11 a 20 do campeonato; Enter no cartão mostra os outros 10. Layer model `interactivity-cards-left`, level 3.
 */
export function Tabela2(): ReactNode {
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
              <TableCell position="11" name="VAS" stats={['39', '28', '10']} />
              <TableCell position="12" name="BAH" stats={['38', '28', '9']} />
              <TableCell position="13" name="FOR" stats={['36', '28', '9']} />
              <TableCell position="14" name="SPT" stats={['35', '28', '8']} />
              <TableCell position="15" name="CAP" stats={['33', '28', '8']} />
              <TableCell position="16" name="VIT" stats={['31', '28', '7']} />
              <TableCell position="17" name="JUV" stats={['29', '28', '6']} />
              <TableCell position="18" name="CUI" stats={['27', '28', '6']} />
              <TableCell position="19" name="RBB" stats={['25', '28', '5']} />
              <TableCell position="20" name="SAN" stats={['22', '28', '4']} />
            </ContentCardBody>
            <ContentCardFooter caption="Página 2 de 2" />
          </ContentCard>
        </Stack>
      </Stack>
    </Screen>
  )
}

export default Tabela2
