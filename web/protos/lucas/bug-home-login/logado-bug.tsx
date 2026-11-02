import { Stack } from '@/primitives'
import { Screen } from '@/ui-kit/Screen'
import { MainMenu } from '@/ui-kit/MainMenu'
import { VideoAoVivo } from '../components/VideoAoVivo'
import { BUG_GLOBO_SRC } from '../dados-bug-globo'
import { AVATAR_LOGADO } from '../dados-avatar-logado'
import { programaAgora, STREAM_URL } from '../dados-menu-perfil'

/** Home logada (perfil sem motion), foco em channel-bug. */
export default function LogadoBug() {
  const { noAr, seguinte } = programaAgora()
  return (
    <Screen model="home" level={1} video={<VideoAoVivo src={STREAM_URL} />}>
      {/* o menu não ancora sozinho na borda de baixo; o Stack empurra o menu para o fim do quadro */}
      <Stack direction="column" justify="end" align="stretch" gap="sm" padding="none" grow>
        <MainMenu focusedItem="channel-bug" miscellaneousTitle="Previsão do tempo" miscellaneousSubtitle="São Paulo, SP" programTitle={noAr} programSubtitle={`A seguir ${seguinte}`} avatarSrc={AVATAR_LOGADO} bugSrc={BUG_GLOBO_SRC} />
      </Stack>
    </Screen>
  )
}
