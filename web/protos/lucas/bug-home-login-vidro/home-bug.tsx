import { Stack } from '@/primitives'
import { Screen } from '@/ui-kit/Screen'
import { MenuComPerfilAnimado } from '../components/MenuComPerfilAnimado'
import { VideoAoVivo } from '../components/VideoAoVivo'
import { VidroNaTela } from '../components/VidroNaTela'
import { programaAgora, STREAM_URL } from '../dados-menu-perfil'

/** Home de primeira visita (perfil com motion), foco em channel-bug. */
export default function HomeBug() {
  const { noAr, seguinte } = programaAgora()
  return (
    <Screen model="home" level={1} video={<VideoAoVivo src={STREAM_URL} diagnostico />}>
      {/* o menu não ancora sozinho na borda de baixo; o Stack empurra o menu para o fim do quadro */}
      <Stack direction="column" justify="end" align="stretch" gap="sm" padding="none" grow>
        <VidroNaTela />
        <MenuComPerfilAnimado focusedItem="channel-bug" programTitle={noAr} programSubtitle={`A seguir ${seguinte}`} />
      </Stack>
    </Screen>
  )
}
