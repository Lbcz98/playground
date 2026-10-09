import { InteractivityButton } from '@/ui-kit/InteractivityButton'
import { InteractivityMenu } from '@/ui-kit/InteractivityMenu'
import { Screen } from '@/ui-kit/Screen'
import { Stack } from '@/primitives'

export default function RailProgram() {
  return (
    <Screen model="interactivity-buttons-right" level={2} focusSide="right">
      <Stack direction="column" justify="end" align="stretch" gap="sm" padding="none" grow>
        <InteractivityMenu align="end">
          <InteractivityButton title="Opções de áudio" interactionState="selected" />
          <InteractivityButton title="Estatísticas" interactionState="selected" />
          <InteractivityButton title="Escalação" interactionState="focus" />
        </InteractivityMenu>
      </Stack>
    </Screen>
  )
}
