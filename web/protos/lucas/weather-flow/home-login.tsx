import { InteractivityButton } from '@/ui-kit/InteractivityButton'
import { InteractivityMenu } from '@/ui-kit/InteractivityMenu'
import { MainMenu } from '@/ui-kit/MainMenu'
import { Screen } from '@/ui-kit/Screen'
import { Stack } from '@/primitives'

export default function HomeLogin() {
  return (
    <Screen model="home-buttons-left" level={1} focusSide="left">
      <Stack direction="column" justify="end" gap="sm" padding="none" grow>
        <Stack direction="column" justify="end" gap="2xl">
          <InteractivityMenu align="start">
            <InteractivityButton title="Minha conta" interactionState="default" />
            <InteractivityButton title="Preferências" interactionState="default" />
            <InteractivityButton title="Ajuda" interactionState="default" />
          </InteractivityMenu>
          <MainMenu
            focusedItem="login"
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
