import { Stack } from '@/primitives'
import { InteractivityButton } from '@/ui-kit/InteractivityButton'
import { InteractivityMenu } from '@/ui-kit/InteractivityMenu'
import { Screen } from '@/ui-kit/Screen'
import { VideoAoVivo } from '../components/VideoAoVivo'
import { RAIL, STREAM_URL } from '../dados-menu-perfil'

/**
 * Nível 2: o rail de Schedule, foco no programa 1. Enter abre o sobre e a ficha técnica (nível 3).
 */
export default function Schedule0() {
  return (
    <Screen model="interactivity-buttons-left" level={2} focusSide="left" video={<VideoAoVivo src={STREAM_URL} />}>
      <Stack direction="column" justify="end" align="stretch" gap="sm" padding="none" grow>
        <InteractivityMenu align="start">
          <InteractivityButton interactionState="focus" overline="19:10" title="RJ2" posterSrc={RAIL[0].poster} live />
          <InteractivityButton interactionState="selected" overline="19:40" title="Por Você" />
          <InteractivityButton interactionState="selected" overline="20:30" title="Jornal Nacional" posterSrc={RAIL[2].poster} />
          <InteractivityButton interactionState="selected" overline="21:30" title="Quem Ama Cuida" />
          <InteractivityButton interactionState="selected" overline="22:40" title="Chef de Alto Nível - 2ª temporada" />
        </InteractivityMenu>
      </Stack>
    </Screen>
  )
}
