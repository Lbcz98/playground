import { Stack } from '@/primitives'
import { Screen } from '@/ui-kit/Screen'
import { NotificacaoLogin } from '../components/NotificacaoLogin'

/** Nível 0: a notificação do canto superior direito, sem foco. É o `notice` do fluxo: o player a põe sobre a tela em que o usuário estiver, 20 s depois da primeira Home, por 10 s. */
export default function AvisoLogin() {
  return (
    <Screen model="notification" level={0}>
      <Stack direction="column" justify="start" align="stretch" gap="sm" padding="none" grow>
        <Stack direction="row" justify="end" align="start" gap="sm">
          <NotificacaoLogin title="Faça o login e aproveite a experiência completa" />
        </Stack>
      </Stack>
    </Screen>
  )
}
