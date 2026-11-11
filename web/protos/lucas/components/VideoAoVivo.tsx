import { useEffect, type ReactNode } from 'react'
import { Box } from '@/primitives'

const LUGAR = 'video-ao-vivo'
const HLS_JS = 'https://cdn.jsdelivr.net/npm/hls.js@1.5.17/dist/hls.min.js'
/** Trecho de 30 s da mesma transmissão em VP9 1080p30 (web/public/video). O Chrome 68 da TV só toca WebM; HLS e H.264 ele não toca. */
const RESERVA_WEBM = '/video/globo-rj-1080p30.webm'
/** Painel de diagnóstico (só com `diagnostico`): escreve na tela o estado do vídeo. */
const HUD_JS = '/video-hud.js'

interface HlsInstance {
  loadSource: (url: string) => void
  attachMedia: (el: HTMLVideoElement) => void
  destroy: () => void
  on: (evento: string, ouvinte: (_: unknown, dados: { fatal?: boolean }) => void) => void
}
type HlsGlobal = { isSupported: () => boolean; Events: { ERROR: string }; new (): HlsInstance }

/** Carrega o hls.js uma vez só (Chrome não toca HLS com segurança sozinho). */
function carregarHls(): Promise<HlsGlobal | null> {
  const w = window as unknown as { Hls?: HlsGlobal }
  if (w.Hls) return Promise.resolve(w.Hls)
  return new Promise((resolve) => {
    const tag = document.createElement('script')
    tag.src = HLS_JS
    tag.onload = () => resolve(w.Hls ?? null)
    tag.onerror = () => resolve(null)
    document.head.appendChild(tag)
  })
}

export interface VideoAoVivoProps {
  /** Playlist .m3u8 da transmissão. */
  src: string
  /** Escreve na tela o que o vídeo está fazendo (caminho, estado, erro, quadros): para achar por que a TV não mostra a imagem. */
  diagnostico?: boolean
}

/**
 * @proposal
 * why: o kit tem o espaço do vídeo no Screen (`video`), mas não um player que toque uma transmissão HLS
 * description: vídeo de fundo, mudo, de uma playlist HLS ao vivo: via hls.js, ou nativo onde não houver MSE (Safari do iPhone); onde nada disso toca (Chrome 68 da TV, só WebM) vira um trecho gravado da transmissão, em loop
 * proposedApi:
 *   src: "string"
 *   diagnostico: "boolean"
 */
export function VideoAoVivo({ src, diagnostico = false }: VideoAoVivoProps): ReactNode {
  // O <video> nasce no efeito (o kit não tem player); o Box só reserva o lugar dele na camada de vídeo do Screen.
  useEffect(() => {
    const lugar = document.getElementById(LUGAR)
    if (!lugar) return
    const el = document.createElement('video')
    el.muted = true
    el.autoplay = true
    el.playsInline = true
    el.setAttribute('aria-hidden', 'true')
    el.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;object-fit:cover;display:block'
    lugar.appendChild(el)
    // Diagnóstico: o texto na tela vem de um script estático (public/video-hud.js), fora da tela do protótipo.
    const painel = diagnostico ? document.createElement('script') : null
    if (painel) {
      painel.src = HUD_JS
      document.body.appendChild(painel)
    }
    let hls: HlsInstance | null = null
    let cancelado = false
    let local = false
    const marcar = (caminho: string) => el.setAttribute('data-caminho', caminho)
    marcar('escolhendo')
    // Reserva gravada: o WebM em loop. VP9 pequeno às vezes para com erro de decodificação na TV; recarregar a fonte resolve.
    const usarReserva = () => {
      if (cancelado || local) return
      local = true
      marcar('WebM gravado')
      hls?.destroy()
      hls = null
      el.loop = true
      el.src = RESERVA_WEBM
      el.load()
    }
    el.addEventListener('error', () => {
      if (!local) {
        // Playlist nativa que não abre (token expirado, 410): cai na reserva.
        usarReserva()
        return
      }
      setTimeout(() => {
        if (cancelado) return
        el.load()
        void el.play().catch(() => {})
      }, 500)
    })
    // hls.js primeiro: o Chrome novo diz tocar HLS nativo ("maybe") mas não decodifica esta transmissão; o nativo fica de reserva (Safari do iPhone, sem MSE).
    carregarHls().then((Hls) => {
      if (cancelado) return
      if (Hls?.isSupported()) {
        marcar('hls.js')
        hls = new Hls()
        hls.on(Hls.Events.ERROR, (_, dados) => {
          if (dados.fatal) usarReserva()
        })
        hls.loadSource(src)
        hls.attachMedia(el)
      } else if (el.canPlayType('application/vnd.apple.mpegurl')) {
        marcar('HLS nativo')
        el.src = src
      } else {
        usarReserva()
      }
    })
    // Autoplay só vale mudo; se o navegador recusar, o primeiro clique na página toca.
    const tocar = () => { void el.play().catch(() => {}) }
    el.addEventListener('loadedmetadata', tocar)
    el.addEventListener('canplay', tocar)
    return () => {
      painel?.remove()
      document.getElementById('video-hud')?.remove()
      cancelado = true
      hls?.destroy()
      el.remove()
    }
  }, [src])

  // @reuse Box: só reserva o lugar do <video> na camada de vídeo; nenhum componente do kit toca vídeo
  return <Box id={LUGAR} />
}
