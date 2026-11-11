import { Stack } from '@/primitives'
import { InteractivityButton } from '@/ui-kit/InteractivityButton'
import { InteractivityMenu } from '@/ui-kit/InteractivityMenu'
import { Screen } from '@/ui-kit/Screen'
import { MarcasSso } from '../components/MarcasSso'
import { VideoAoVivo } from '../components/VideoAoVivo'
import { STREAM_URL } from '../dados-menu-perfil'

/** Nível 2: a Previsão do tempo abre as duas opções de login, foco em Entre ou cadastre-se. Enter abre o QR. */
export default function MiscLogin() {
  return (
    <Screen model="interactivity-buttons-left" level={2} focusSide="left" video={<VideoAoVivo src={STREAM_URL} />}>
      <Stack direction="column" justify="end" align="stretch" gap="sm" padding="none" grow>
        <InteractivityMenu align="start">
          <InteractivityButton interactionState="focus" overline="Conta Globo" overlineSize="title" title="Entre ou cadastre-se" />
          <InteractivityButton interactionState="selected" title="Continuar como Clara" thumbnail={<MarcasSso />} />
        </InteractivityMenu>
      </Stack>
    </Screen>
  )
}
