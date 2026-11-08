import { Stack } from '@/primitives'
import { InteractivityButton } from '@/ui-kit/InteractivityButton'
import { InteractivityMenu } from '@/ui-kit/InteractivityMenu'
import { Screen } from '@/ui-kit/Screen'
import { MenuComPerfilAnimado } from '../components/MenuComPerfilAnimado'
import { VideoAoVivo } from '../components/VideoAoVivo'
import { programaAgora, STREAM_URL } from '../dados-menu-perfil'

/** Home de primeira visita (perfil com motion), foco em login. A trilha acima mostra o card compacto de login. */
export default function HomeLogin() {
  const { noAr, seguinte } = programaAgora()
  return (
    <Screen model="home-buttons-left" level={1} focusSide="left" video={<VideoAoVivo src={STREAM_URL} />}>
      {/* o menu não ancora sozinho na borda de baixo; o Stack empurra o menu para o fim do quadro */}
      <Stack direction="column" justify="end" align="stretch" gap="sm" padding="none" grow>
        <Stack direction="column" justify="end" align="stretch" gap="sm">
          <InteractivityMenu align="start">
            <InteractivityButton interactionState="default" overline="Conta Globo" overlineSize="title" title="Entre ou cadastre-se" />
          </InteractivityMenu>
          <MenuComPerfilAnimado key="menu" focusedItem="login" programTitle={noAr} programSubtitle={`A seguir ${seguinte}`} />
        </Stack>
      </Stack>
    </Screen>
  )
}
