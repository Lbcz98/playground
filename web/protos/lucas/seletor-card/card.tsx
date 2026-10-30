import { Stack } from '@/primitives'
import { RoundedButton } from '@/ui-kit/RoundedButton'
import { Screen } from '@/ui-kit/Screen'
import { SeletorCard } from '../components/SeletorCard'

/**
 * Seletor de card de programação (Os Últimos Dias de Pompeia): foco no card.
 * @deviation level.initial-focus: pedido: "if I press the up arrow key, the focus should go to the component". Este estado é o que a seta para cima abre; o estado de entrada (voltar) começa no botão Voltar.
 */
export default function SeletorCardCard() {
  return (
    <Screen model="interactivity-cards-right" level={3} anchored={<RoundedButton label="Voltar" interactionState="default" />}>
      <Stack direction="column" justify="end" align="stretch" gap="sm" padding="none" grow>
        <Stack direction="row" justify="end" align="end" gap="sm">
          <SeletorCard interactionState="focus" />
        </Stack>
      </Stack>
    </Screen>
  )
}
