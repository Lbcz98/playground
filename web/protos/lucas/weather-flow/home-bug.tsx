import { MainMenu } from '@/ui-kit/MainMenu'
import { Screen } from '@/ui-kit/Screen'
import { Stack } from '@/primitives'

export default function HomeBug() {
  return (
    <Screen model="home" level={1} focusSide="right">
      <Stack direction="column" justify="end" gap="sm" padding="none" grow>
        <Stack direction="column" justify="end" gap="2xl">
          <MainMenu
            focusedItem="channel-bug"
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
