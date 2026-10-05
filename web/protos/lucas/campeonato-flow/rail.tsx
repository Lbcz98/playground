import type { ReactNode } from 'react'
import { Stack } from '@/primitives'
import { InteractivityButton } from '@/ui-kit/InteractivityButton'
import { InteractivityMenu } from '@/ui-kit/InteractivityMenu'
import { Screen } from '@/ui-kit/Screen'

/**
 * RailCampeonato — the rail entered, focus on card 1. Layer model `interactivity-buttons-left`, level 2.
 */
export function RailCampeonato(): ReactNode {
  return (
    <Screen model="interactivity-buttons-left" level={2} focusSide="left">
      <Stack direction="column" justify="end" align="stretch" gap="sm" padding="none" grow>
        <InteractivityMenu align="start">
            <InteractivityButton
              overline="13:00"
              live
              title="Tabela do Brasileirão"
              interactionState="focus"
            />
            <InteractivityButton
              overline="14:30"
              title="Cinema em Casa"
              interactionState="selected"
            />
            <InteractivityButton
              overline="16:00"
              title="Novela das Seis"
              interactionState="selected"
            />
        </InteractivityMenu>
      </Stack>
    </Screen>
  )
}

export default RailCampeonato
