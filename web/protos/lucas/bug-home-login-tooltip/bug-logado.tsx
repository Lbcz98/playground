import { Stack } from '@/primitives'
import { Screen } from '@/ui-kit/Screen'
import { LoginSaindo } from '../components/LoginSaindo'
import { VideoAoVivo } from '../components/VideoAoVivo'
import { STREAM_URL } from '../dados-menu-perfil'

/**
 * Nível 0 depois do login: o card de login some com fade e então o bug de interatividade entra de novo. Enter abre a Home logada.
 */
export default function BugLogado() {
  return (
    <Screen model="alert" level={0} video={<VideoAoVivo src={STREAM_URL} />}>
      <Stack direction="column" justify="end" align="stretch" gap="sm" padding="none" grow>
        <LoginSaindo />
      </Stack>
    </Screen>
  )
}
