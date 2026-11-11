import { Stack } from '@/primitives'
import { InteractivityButton } from '@/ui-kit/InteractivityButton'
import { InteractivityMenu } from '@/ui-kit/InteractivityMenu'
import { Screen } from '@/ui-kit/Screen'
import { MenuComPerfilAnimado } from '../components/MenuComPerfilAnimado'
import { VideoAoVivo } from '../components/VideoAoVivo'
import { VidroNaTela } from '../components/VidroNaTela'
import { programaAgora, STREAM_URL } from '../dados-menu-perfil'

/** Home de primeira visita (perfil com motion), foco em miscellaneous. A trilha acima mostra o hint. */
export default function HomeMisc() {
  const { noAr, seguinte } = programaAgora()
  return (
    <Screen model="home-buttons-left" level={1} focusSide="left" video={<VideoAoVivo src={STREAM_URL} diagnostico />}>
      {/* o menu não ancora sozinho na borda de baixo; o Stack empurra o menu para o fim do quadro */}
      <Stack direction="column" justify="end" align="stretch" gap="sm" padding="none" grow>
        <Stack direction="column" justify="end" align="stretch" gap="sm">
          <VidroNaTela />
          <InteractivityMenu align="start">
            <InteractivityButton interactionState="default" title="Previsão do tempo" />
          </InteractivityMenu>
          <MenuComPerfilAnimado focusedItem="miscellaneous" programTitle={noAr} programSubtitle={`A seguir ${seguinte}`} />
        </Stack>
      </Stack>
    </Screen>
  )
}
