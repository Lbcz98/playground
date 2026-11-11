import { Stack } from '@/primitives'
import { RoundedButton } from '@/ui-kit/RoundedButton'
import { Screen } from '@/ui-kit/Screen'
import { FichaTecnicaProgramaCard } from '../components/FichaTecnicaProgramaCard'
import { SobreProgramaCard } from '../components/SobreProgramaCard'
import { VideoAoVivo } from '../components/VideoAoVivo'
import { VidroNaTela } from '../components/VidroNaTela'
import { RAIL, STREAM_URL } from '../dados-menu-perfil'

/** Nível 3: sobre e ficha técnica de Jornal Nacional, foco no botão Voltar. */
export default function ScheduleDetalhe2() {
  return (
    <Screen model="interactivity-cards-left" level={3} focusSide="left" anchored={<RoundedButton label="Voltar" interactionState="focus" />} video={<VideoAoVivo src={STREAM_URL} diagnostico />}>
      <Stack direction="column" justify="end" align="stretch" gap="sm" padding="none" grow>
        <Stack direction="row" justify="start" align="end" gap="sm">
          <VidroNaTela />
          <SobreProgramaCard
            logo={RAIL[2].logo}
            nome="Jornal Nacional"
            sinopse={"Renata Vasconcellos e César Tralli apresentam o principal telejornal da TV Globo, que traz notícias do Brasil e do mundo, matérias de denúncia e investigação e séries especiais."}
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
