import { useEffect, type ReactNode } from 'react'
import { Box } from '@/primitives'

const LUGAR = 'video-ao-vivo'
const HLS_JS = 'https://cdn.jsdelivr.net/npm/hls.js@1.5.17/dist/hls.min.js'

interface HlsInstance {
  loadSource: (url: string) => void
  attachMedia: (el: HTMLVideoElement) => void
  destroy: () => void
}
type HlsGlobal = { isSupported: () => boolean; new (): HlsInstance }

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
}

/**
 * @proposal
 * why: o kit tem o espaço do vídeo no Screen (`video`), mas não um player que toque uma transmissão HLS
 * description: vídeo de fundo, mudo, de uma playlist HLS ao vivo: via hls.js, ou nativo onde não houver MSE (Safari do iPhone)
 * proposedApi:
 *   src: "string"
 */
export function VideoAoVivo({ src }: VideoAoVivoProps): ReactNode {
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
    let hls: HlsInstance | null = null
    let cancelado = false
    // hls.js primeiro: o Chrome novo diz tocar HLS nativo ("maybe") mas não decodifica esta transmissão; o nativo fica de reserva (Safari do iPhone, sem MSE).
    carregarHls().then((Hls) => {
      if (cancelado) return
      if (Hls?.isSupported()) {
        hls = new Hls()
        hls.loadSource(src)
        hls.attachMedia(el)
      } else if (el.canPlayType('application/vnd.apple.mpegurl')) {
        el.src = src
      }
    })
    // Autoplay só vale mudo; se o navegador recusar, o primeiro clique na página toca.
    const tocar = () => { void el.play().catch(() => {}) }
    el.addEventListener('loadedmetadata', tocar)
    el.addEventListener('canplay', tocar)
    return () => {
      cancelado = true
      hls?.destroy()
      el.remove()
    }
  }, [src])

  // @reuse Box: só reserva o lugar do <video> na camada de vídeo; nenhum componente do kit toca vídeo
  return <Box id={LUGAR} />
}
