import { Stack } from '@/primitives'
import { RoundedButton } from '@/ui-kit/RoundedButton'
import { Screen } from '@/ui-kit/Screen'
import { CardLogin } from '../components/CardLogin'
import { VideoAoVivo } from '../components/VideoAoVivo'
import { STREAM_URL } from '../dados-menu-perfil'

/** Nível 3 da Previsão do tempo: o QR em foco, com a mensagem de cima. */
export default function MiscCard() {
  return (
    <Screen model="interactivity-cards-left" level={3} focusSide="left" anchored={<RoundedButton label="Voltar" interactionState="default" />} video={<VideoAoVivo src={STREAM_URL} />}>
      <Stack direction="column" justify="end" align="stretch" gap="sm" padding="none" grow>
        <Stack direction="row" justify="start" align="end" gap="sm">
          <CardLogin />
        </Stack>
      </Stack>
    </Screen>
  )
}
