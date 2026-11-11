import { Stack } from '@/primitives'
import { Screen } from '@/ui-kit/Screen'
import { CartaoSobe } from '../components/CartaoSobe'
import { VideoAoVivo } from '../components/VideoAoVivo'
import { STREAM_URL } from '../dados-menu-perfil'

/** Transição automática depois do login: o cartão entra de baixo e segue sozinho para a Home logada. Não é nível 3. */
export default function BoasVindas() {
  return (
    <Screen model="alert" level={0} focusSide="right" video={<VideoAoVivo src={STREAM_URL} />}>
      <Stack direction="column" justify="end" align="stretch" gap="sm" padding="none" grow>
        <Stack direction="row" justify="end" align="end" gap="sm">
          <CartaoSobe />
        </Stack>
      </Stack>
    </Screen>
  )
}
