import { Stack } from '@/primitives'
import { RoundedButton } from '@/ui-kit/RoundedButton'
import { Screen } from '@/ui-kit/Screen'
import { FichaTecnicaProgramaCard } from '../components/FichaTecnicaProgramaCard'
import { SobreProgramaCard } from '../components/SobreProgramaCard'
import { VideoAoVivo } from '../components/VideoAoVivo'
import { VidroNaTela } from '../components/VidroNaTela'
import { RAIL, STREAM_URL } from '../dados-menu-perfil'

/** Nível 3: sobre e ficha técnica de Quem Ama Cuida, foco no botão Voltar. */
export default function ScheduleDetalhe3() {
  return (
    <Screen model="interactivity-cards-left" level={3} focusSide="left" anchored={<RoundedButton label="Voltar" interactionState="focus" />} video={<VideoAoVivo src={STREAM_URL} diagnostico />}>
      <Stack direction="column" justify="end" align="stretch" gap="sm" padding="none" grow>
        <Stack direction="row" justify="start" align="end" gap="sm">
          <VidroNaTela />
          <SobreProgramaCard
            logo={RAIL[3].logo}
            nome="Quem Ama Cuida"
            sinopse={"Pilar ameaça Tom. Felipe conta a Mau Mau que falou para Fernando sobre o relacionamento dos dois. Pedro e Adriana planejam uma armadilha para Pilar. Tom se compromete a conseguir uma arma para Pilar. Carmita sugere que Bruna se aproxime de Heitor. Pedro conta a Cléber que Tom…"}
            classificacao="14"
            categoria="Novela"
            generos={[]}
            pais="Brasil"
          />
          <FichaTecnicaProgramaCard
            categoria="Novela"
            direcao={["Amora Mautner"]}
            elenco={["Letícia Colin", "Chay Suede", "Tony Ramos", "Isabel Teixeira"]}
          />
        </Stack>
      </Stack>
    </Screen>
  )
}
