import { Stack } from '@/primitives'
import { RoundedButton } from '@/ui-kit/RoundedButton'
import { Screen } from '@/ui-kit/Screen'
import { FichaTecnicaProgramaCard } from '../components/FichaTecnicaProgramaCard'
import { SobreProgramaCard } from '../components/SobreProgramaCard'
import { VideoAoVivo } from '../components/VideoAoVivo'
import { RAIL, STREAM_URL } from '../dados-menu-perfil'

/** Nível 3: sobre e ficha técnica de Por Você, foco no botão Voltar. */
export default function ScheduleDetalhe1() {
  return (
    <Screen model="interactivity-cards-left" level={3} focusSide="left" anchored={<RoundedButton label="Voltar" interactionState="focus" />} video={<VideoAoVivo src={STREAM_URL} />}>
      <Stack direction="column" justify="end" align="stretch" gap="sm" padding="none" grow>
        <Stack direction="row" justify="start" align="end" gap="sm">
          <SobreProgramaCard
            logo={RAIL[1].logo}
            nome="Por Você"
            sinopse={"Peixe agradece Vanessa e afirma que devolverá o dinheiro da casa a ela. Bela pede novos exames a Iara. Ricardo aconselha Vitor, e Gabriel conforta Leandra. Dalila repreende Peixe por ter aceitado a casa comprada por Vanessa. Bela revela resultado da biópsia de Margô e a orienta…"}
            classificacao="12"
            categoria="Novela"
            generos={[]}
            pais="Brasil"
          />
          <FichaTecnicaProgramaCard
            categoria="Novela"
            direcao={["Jeferson De"]}
            elenco={["Sheron Menezzes", "Lucy Ramos", "Thiago Lacerda", "Aline Moraes"]}
          />
        </Stack>
      </Stack>
    </Screen>
  )
}
