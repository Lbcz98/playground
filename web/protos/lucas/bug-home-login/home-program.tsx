import { Stack } from '@/primitives'
import { Screen } from '@/ui-kit/Screen'
import { MenuComPerfilAnimado } from '../components/MenuComPerfilAnimado'
import { VideoAoVivo } from '../components/VideoAoVivo'
import { programaAgora, STREAM_URL } from '../dados-menu-perfil'

/**
 * Home de primeira visita (perfil com motion), foco em program.
 */
export default function HomeProgram() {
  const { noAr, seguinte } = programaAgora()
  return (
    <Screen model="home" level={1} video={<VideoAoVivo src={STREAM_URL} />}>
      {/* o menu não ancora sozinho na borda de baixo; o Stack empurra o menu para o fim do quadro */}
      <Stack direction="column" justify="end" align="stretch" gap="sm" padding="none" grow>
        {/* O mesmo Stack interno das Homes com trilha: o menu fica no mesmo lugar da árvore, o React o atualiza em vez de recriá-lo, e a troca de foco anda na mola (recriado, ele pulava e custava ~40 ms de estilo no Chrome 68). */}
        <Stack direction="column" justify="end" align="stretch" gap="sm">
          <MenuComPerfilAnimado key="menu" focusedItem="program" programTitle={noAr} programSubtitle={`A seguir ${seguinte}`} />
        </Stack>
      </Stack>
    </Screen>
  )
}
