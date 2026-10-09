import { RoundedButton } from '@/ui-kit/RoundedButton'
import { Screen } from '@/ui-kit/Screen'
import { Stack } from '@/primitives'
import { ClimaCard } from '../components/ClimaCard'

export default function DetailCard() {
  return (
    <Screen model="interactivity-cards-left" level={3} focusSide="left" anchored={<RoundedButton label="Voltar" interactionState="default" />}>
      <Stack direction="column" justify="end" align="stretch" gap="sm" padding="none" grow>
        <Stack direction="row" justify="start" align="end" gap="sm">
          <ClimaCard
            interactionState="focus"
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
