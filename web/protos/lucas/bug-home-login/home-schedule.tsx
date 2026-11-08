import { Stack } from '@/primitives'
import { InteractivityButton } from '@/ui-kit/InteractivityButton'
import { InteractivityMenu } from '@/ui-kit/InteractivityMenu'
import { Screen } from '@/ui-kit/Screen'
import { MenuComPerfilAnimado } from '../components/MenuComPerfilAnimado'
import { VideoAoVivo } from '../components/VideoAoVivo'
import { programaAgora, RAIL, STREAM_URL } from '../dados-menu-perfil'

/** Home de primeira visita (perfil com motion), foco em schedule. A trilha acima mostra o hint. */
export default function HomeSchedule() {
  const { noAr, seguinte } = programaAgora()
  return (
    <Screen model="home-buttons-left" level={1} focusSide="left" video={<VideoAoVivo src={STREAM_URL} />}>
      {/* o menu não ancora sozinho na borda de baixo; o Stack empurra o menu para o fim do quadro */}
      <Stack direction="column" justify="end" align="stretch" gap="sm" padding="none" grow>
        <Stack direction="column" justify="end" align="stretch" gap="sm">
          <InteractivityMenu align="start">
            <InteractivityButton interactionState="default" overline="19:10" title="RJ2" posterSrc={RAIL[0].poster} live />
            <InteractivityButton interactionState="default" overline="19:40" title="Por Você" />
            <InteractivityButton interactionState="default" overline="20:30" title="Jornal Nacional" posterSrc={RAIL[2].poster} />
            <InteractivityButton interactionState="default" overline="21:30" title="Quem Ama Cuida" />
            <InteractivityButton interactionState="default" overline="22:40" title="Chef de Alto Nível - 2ª temporada" />
          </InteractivityMenu>
          <MenuComPerfilAnimado key="menu" focusedItem="schedule" programTitle={noAr} programSubtitle={`A seguir ${seguinte}`} />
        </Stack>
      </Stack>
    </Screen>
  )
}
