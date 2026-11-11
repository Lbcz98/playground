import { Stack } from '@/primitives'
import { InteractivityButton } from '@/ui-kit/InteractivityButton'
import { InteractivityMenu } from '@/ui-kit/InteractivityMenu'
import { Screen } from '@/ui-kit/Screen'
import { MarcasSso } from '../components/MarcasSso'
import { VideoAoVivo } from '../components/VideoAoVivo'
import { STREAM_URL } from '../dados-menu-perfil'

/** Nível 2: a trilha do botão de perfil, foco no login por SSO da Globoplay. Enter abre o cartão de boas-vindas. */
export default function LoginSso() {
  return (
    <Screen model="interactivity-buttons-left" level={2} focusSide="left" video={<VideoAoVivo src={STREAM_URL} />}>
      <Stack direction="column" justify="end" align="stretch" gap="sm" padding="none" grow>
        <InteractivityMenu align="start">
          <InteractivityButton interactionState="selected" overline="Conta Globo" overlineSize="title" title="Entre ou cadastre-se" />
          <InteractivityButton interactionState="focus" title="Continuar como Clara" thumbnail={<MarcasSso />} />
        </InteractivityMenu>
      </Stack>
    </Screen>
  )
}
