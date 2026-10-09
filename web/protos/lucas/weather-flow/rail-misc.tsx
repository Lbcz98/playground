import { InteractivityButton } from '@/ui-kit/InteractivityButton'
import { InteractivityMenu } from '@/ui-kit/InteractivityMenu'
import { Screen } from '@/ui-kit/Screen'
import { Stack } from '@/primitives'

export default function RailMisc() {
  return (
    <Screen model="interactivity-buttons-left" level={2} focusSide="left">
      <Stack direction="column" justify="end" align="stretch" gap="sm" padding="none" grow>
        <InteractivityMenu align="start">
          <InteractivityButton title="Previsão do tempo" interactionState="focus" />
          <InteractivityButton title="Vote no paredão" interactionState="selected" />
          <InteractivityButton title="Cupom do dia" interactionState="selected" />
        </InteractivityMenu>
      </Stack>
    </Screen>
  )
}
