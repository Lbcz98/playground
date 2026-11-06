import { Stack } from '@/primitives'
import { Screen } from '@/ui-kit/Screen'
import { MenuComTooltip } from '../components/MenuComTooltip'
import { VideoAoVivo } from '../components/VideoAoVivo'
import { programaAgora, STREAM_URL } from '../dados-menu-perfil'

/**
 * Home de primeira visita (perfil sem motion, com tooltip), foco em program.
 */
export default function HomeProgram() {
  const { noAr, seguinte } = programaAgora()
  return (
    <Screen model="home" level={1} video={<VideoAoVivo src={STREAM_URL} />}>
      {/* o menu não ancora sozinho na borda de baixo; o Stack empurra o menu para o fim do quadro */}
      <Stack direction="column" justify="end" align="stretch" gap="sm" padding="none" grow>
        <MenuComTooltip focusedItem="program" programTitle={noAr} programSubtitle={`A seguir ${seguinte}`} />
      </Stack>
    </Screen>
  )
}
