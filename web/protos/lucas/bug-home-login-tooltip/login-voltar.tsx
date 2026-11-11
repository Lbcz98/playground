import { Stack } from '@/primitives'
import { RoundedButton } from '@/ui-kit/RoundedButton'
import { Screen } from '@/ui-kit/Screen'
import { CardLoginRepouso } from '../components/CardLoginRepouso'
import { VideoAoVivo } from '../components/VideoAoVivo'
import { STREAM_URL } from '../dados-menu-perfil'

/** Nível 3: o card de login (QR), foco no botão Voltar (o nível 3 abre aqui). */
export default function LoginVoltar() {
  return (
    <Screen model="interactivity-cards-left" level={3} focusSide="left" anchored={<RoundedButton label="Voltar" interactionState="focus" />} video={<VideoAoVivo src={STREAM_URL} />}>
      <Stack direction="column" justify="end" align="stretch" gap="sm" padding="none" grow>
        <Stack direction="row" justify="start" align="end" gap="sm">
          <CardLoginRepouso topo={false} />
        </Stack>
      </Stack>
    </Screen>
  )
}
