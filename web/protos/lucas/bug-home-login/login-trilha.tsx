import { Stack } from '@/primitives'
import { InteractivityButton } from '@/ui-kit/InteractivityButton'
import { InteractivityMenu } from '@/ui-kit/InteractivityMenu'
import { Screen } from '@/ui-kit/Screen'
import { VideoAoVivo } from '../components/VideoAoVivo'
import { STREAM_URL } from '../dados-menu-perfil'

/** Nível 2: a trilha do botão de perfil, com o card de login em foco. Enter abre o card de QR (nível 3). */
export default function LoginTrilha() {
  return (
    <Screen model="interactivity-buttons-left" level={2} focusSide="left" video={<VideoAoVivo src={STREAM_URL} />}>
      <Stack direction="column" justify="end" align="stretch" gap="sm" padding="none" grow>
        <InteractivityMenu align="start">
          <InteractivityButton interactionState="focus" title="Entre ou cadastre-se" />
        </InteractivityMenu>
      </Stack>
    </Screen>
  )
}
