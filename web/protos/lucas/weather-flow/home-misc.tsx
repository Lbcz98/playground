import { InteractivityButton } from '@/ui-kit/InteractivityButton'
import { InteractivityMenu } from '@/ui-kit/InteractivityMenu'
import { MainMenu } from '@/ui-kit/MainMenu'
import { Screen } from '@/ui-kit/Screen'
import { Stack } from '@/primitives'

export default function HomeMisc() {
  return (
    <Screen model="home-buttons-left" level={1} focusSide="left">
      <Stack direction="column" justify="end" gap="sm" padding="none" grow>
        <Stack direction="column" justify="end" gap="2xl">
          <InteractivityMenu align="start">
            <InteractivityButton title="Previsão do tempo" interactionState="default" />
            <InteractivityButton title="Vote no paredão" interactionState="default" />
            <InteractivityButton title="Cupom do dia" interactionState="default" />
          </InteractivityMenu>
          <MainMenu
            focusedItem="miscellaneous"
            miscellaneousTitle="Previsão do tempo"
            miscellaneousSubtitle="São Paulo, SP"
            programTitle="Copa do Mundo: Equador x Argentina"
            programSubtitle="A seguir Central da Copa"
          />
        </Stack>
      </Stack>
    </Screen>
  )
}
