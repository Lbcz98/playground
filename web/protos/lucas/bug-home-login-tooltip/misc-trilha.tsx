import { Stack } from '@/primitives'
import { InteractivityButton } from '@/ui-kit/InteractivityButton'
import { InteractivityMenu } from '@/ui-kit/InteractivityMenu'
import { Screen } from '@/ui-kit/Screen'
import { VideoAoVivo } from '../components/VideoAoVivo'
import { STREAM_URL } from '../dados-menu-perfil'

/** Nível 2: a trilha de Miscellaneous, com o card Previsão do tempo em foco. Enter abre as duas opções de login. */
export default function MiscTrilha() {
  return (
    <Screen model="interactivity-buttons-left" level={2} focusSide="left" video={<VideoAoVivo src={STREAM_URL} />}>
      <Stack direction="column" justify="end" align="stretch" gap="sm" padding="none" grow>
        <InteractivityMenu align="start">
          <InteractivityButton interactionState="focus" title="Previsão do tempo" />
        </InteractivityMenu>
      </Stack>
    </Screen>
  )
}
