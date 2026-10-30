import { Stack } from '@/primitives'
import { RoundedButton } from '@/ui-kit/RoundedButton'
import { Screen } from '@/ui-kit/Screen'
import { SeletorCard } from '../components/SeletorCard'

/** Seletor de card de programação (Os Últimos Dias de Pompeia): foco no Voltar. */
export default function SeletorCardVoltar() {
  return (
    <Screen model="interactivity-cards-right" level={3} anchored={<RoundedButton label="Voltar" interactionState="focus" />}>
      <Stack direction="column" justify="end" align="stretch" gap="sm" padding="none" grow>
        <Stack direction="row" justify="end" align="end" gap="sm">
          <SeletorCard interactionState="default" />
        </Stack>
      </Stack>
    </Screen>
  )
}
