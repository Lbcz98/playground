import { Stack } from '@/primitives'
import { Screen } from '@/ui-kit/Screen'
import { BugAnimado } from '../components/BugAnimado'
import { VideoAoVivo } from '../components/VideoAoVivo'
import { STREAM_URL } from '../dados-menu-perfil'

/** Nível 0, início do fluxo: a transmissão limpa com o bug de interatividade entrando (animação do kit). Enter abre a Home. */
export default function Bug() {
  return (
    <Screen model="alert" level={0} video={<VideoAoVivo src={STREAM_URL} />}>
      <Stack direction="column" justify="end" align="stretch" gap="sm" padding="none" grow>
        <Stack direction="row" justify="end" align="end" gap="sm">
          <BugAnimado />
        </Stack>
      </Stack>
    </Screen>
  )
}
