import { Stack } from '@/primitives'
import { RoundedButton } from '@/ui-kit/RoundedButton'
import { Screen } from '@/ui-kit/Screen'
import { FichaTecnicaProgramaCard } from '../components/FichaTecnicaProgramaCard'
import { SobreProgramaCard } from '../components/SobreProgramaCard'
import { VideoAoVivo } from '../components/VideoAoVivo'
import { RAIL, STREAM_URL } from '../dados-menu-perfil'

/** Nível 3: sobre e ficha técnica de Chef de Alto Nível - 2ª temporada, foco no botão Voltar. */
export default function ScheduleDetalhe4() {
  return (
    <Screen model="interactivity-cards-left" level={3} focusSide="left" anchored={<RoundedButton label="Voltar" interactionState="focus" />} video={<VideoAoVivo src={STREAM_URL} />}>
      <Stack direction="column" justify="end" align="stretch" gap="sm" padding="none" grow>
        <Stack direction="row" justify="start" align="end" gap="sm">
          <SobreProgramaCard
            logo={RAIL[4].logo}
            nome="Chef de Alto Nível - 2ª temporada"
            sinopse={"Comandado por Ana Maria Braga, o reality culinário é uma versão brasileira do Next Level Chef, do chef e apresentador Gordon Ramsay. Na competição, os participantes terão a mentoria e a avaliação dos renomados chefs Alex Atala, Jefferson Rueda e Renata Vanzetto."}
            classificacao="10"
            categoria="Reality show"
            generos={[]}
            pais="Brasileira"
          />
          <FichaTecnicaProgramaCard
            categoria="Variedades"
          />
        </Stack>
      </Stack>
    </Screen>
  )
}
