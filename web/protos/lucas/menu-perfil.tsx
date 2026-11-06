import { Stack } from '@/primitives'
import { Screen } from '@/ui-kit/Screen'
import { MenuComPerfilAnimado } from './components/MenuComPerfilAnimado'
import { VideoAoVivo } from './components/VideoAoVivo'
import { PROGRAMA_NO_AR, PROGRAMA_SEGUINTE, STREAM_URL } from './dados-menu-perfil'

/**
 * Home sobre a transmissão ao vivo da TV Globo Rio, com o botão Login animado (opção 11 do estudo de motion do botão de perfil, ajustada).
 */
export default function MenuPerfil() {
  return (
    <Screen model="home" level={1} video={<VideoAoVivo src={STREAM_URL} />}>
      {/* o menu não ancora sozinho na borda de baixo; o Stack só empurra o menu para o fim do quadro */}
      <Stack direction="column" justify="end" align="stretch" gap="sm" padding="none" grow>
        <MenuComPerfilAnimado focusedItem="channel-bug" programTitle={PROGRAMA_NO_AR} programSubtitle={`A seguir ${PROGRAMA_SEGUINTE}`} />
      </Stack>
    </Screen>
  )
}
