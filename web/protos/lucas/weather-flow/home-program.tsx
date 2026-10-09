import { InteractivityButton } from '@/ui-kit/InteractivityButton'
import { InteractivityMenu } from '@/ui-kit/InteractivityMenu'
import { MainMenu } from '@/ui-kit/MainMenu'
import { Screen } from '@/ui-kit/Screen'
import { Stack } from '@/primitives'

export default function HomeProgram() {
  return (
    <Screen model="home-buttons-right" level={1} focusSide="right">
      <Stack direction="column" justify="end" gap="sm" padding="none" grow>
        <Stack direction="column" justify="end" gap="2xl">
          <InteractivityMenu align="end">
            <InteractivityButton title="Opções de áudio" interactionState="default" />
            <InteractivityButton title="Estatísticas" interactionState="default" />
            <InteractivityButton title="Escalação" interactionState="default" />
          </InteractivityMenu>
          <MainMenu
            focusedItem="program"
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
