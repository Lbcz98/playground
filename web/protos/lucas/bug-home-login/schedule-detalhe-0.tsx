import { Stack } from '@/primitives'
import { RoundedButton } from '@/ui-kit/RoundedButton'
import { Screen } from '@/ui-kit/Screen'
import { FichaTecnicaProgramaCard } from '../components/FichaTecnicaProgramaCard'
import { SobreProgramaCard } from '../components/SobreProgramaCard'
import { VideoAoVivo } from '../components/VideoAoVivo'
import { RAIL, STREAM_URL } from '../dados-menu-perfil'

/** Nível 3: sobre e ficha técnica de RJ2, foco no botão Voltar. */
export default function ScheduleDetalhe0() {
  return (
    <Screen model="interactivity-cards-left" level={3} focusSide="left" anchored={<RoundedButton label="Voltar" interactionState="focus" />} video={<VideoAoVivo src={STREAM_URL} />}>
      <Stack direction="column" justify="end" align="stretch" gap="sm" padding="none" grow>
        <Stack direction="row" justify="start" align="end" gap="sm">
          <SobreProgramaCard
            logo={RAIL[0].logo}
            nome="RJ2"
            sinopse={"Telejornal que traz as notícias locais, mostrando o que acontece na sua região, com prestação de serviço, boletins de trânsito e a previsão do tempo."}
            classificacao="L"
            categoria="Jornalismo"
            generos={["Telejornais"]}
            pais="Brasil"
          />
          <FichaTecnicaProgramaCard
            categoria="Variedades"
          />
        </Stack>
      </Stack>
    </Screen>
  )
}
