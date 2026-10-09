import { RoundedButton } from '@/ui-kit/RoundedButton'
import { Screen } from '@/ui-kit/Screen'
import { Stack } from '@/primitives'
import { ClimaCard } from '../components/ClimaCard'

export default function Detail() {
  return (
    <Screen model="interactivity-cards-right" level={3} focusSide="right" anchored={<RoundedButton label="Voltar" interactionState="focus" />}>
      <Stack direction="column" justify="end" align="stretch" gap="sm" padding="none" grow>
        <Stack direction="row" justify="end" align="end" gap="sm">
          <ClimaCard
            cidade="São Paulo"
            condicao="Chuva fraca"
            temperatura="22°"
            maxima="27°"
            minima="17°"
            ar={{ valor: '42', rotulo: 'Boa', status: 'success' }}
            atualizado="Atualizado há 1 min"
          />
        </Stack>
      </Stack>
    </Screen>
  )
}
