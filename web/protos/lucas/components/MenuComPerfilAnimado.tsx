import { useLayoutEffect, useRef, type ReactNode } from 'react'
import { MainMenu } from '@/ui-kit/MainMenu'
import { ICONE_PERFIL } from '../dados-menu-perfil'

/** Opção 11 de docs/explorations/motion-botao-de-perfil/index.html (Reflexo e duas ondas juntos), sobre o botão Login do MainMenu. Só CSS no motion; o React só põe os três elementos dentro do botão. */
// Sem aspas, ">", "&" nem "<" no texto do CSS: o React os escapa no servidor e o cliente discorda (erro de hidratação).
const CSS = `
.mpa {
  --o11-band-w: 40;
  --o11-band-tilt: 20;
  --o11-band-opacity: 0.45;
  --o11-band-soft: 12px;
  --o11-rim: 6px;
  --o11-avatar: var(--dimension-size-semantic-avatar);
  --o11-wave-color: var(--color-semantic-functional-text-primary);
  --o11-wave-width: var(--dimension-border-width-core-thin);
  --o11-wave-reach: 1.65;
  --o11-wave-peak: 0.55;
  --o11-wave2-peak: 0.25;
  --o11-wave-lag: 150ms;
  --o11-cycle-dur: 6510ms; /* 1510 ms de efeito + 5 s até o próximo */
  --o11-cycle-ease: cubic-bezier(0.4, 0, 0.2, 1);
}
.mpa [data-focus-item=login] .sfs-round-button-circle .sfs-round-button-content { z-index: 2; }
.mpa .o11-ext { display: contents; }
.mpa .o11-plate {
  position: absolute; display: block; z-index: 1;
  top: 50%; left: 50%;
  width: calc(var(--o11-avatar) + var(--o11-rim) * 2);
  height: calc(var(--o11-avatar) + var(--o11-rim) * 2);
  margin-top: calc(var(--o11-avatar) / -2 - var(--o11-rim));
  margin-left: calc(var(--o11-avatar) / -2 - var(--o11-rim));
  border-radius: var(--dimension-radius-semantic-pill);
  overflow: hidden;
  -webkit-clip-path: circle(50% at 50% 50%);
  clip-path: circle(50% at 50% 50%);
  -webkit-transform: translateZ(0); transform: translateZ(0);
  pointer-events: none;
}
.mpa .o11-band {
  position: absolute; display: block;
  top: -30%; left: 0;
  width: calc(var(--o11-band-w) * 1%); height: 160%;
  background-color: var(--color-opacity-light-50);
  -webkit-filter: blur(var(--o11-band-soft)); filter: blur(var(--o11-band-soft));
  opacity: 0;
  -webkit-transform: translateX(-160%) rotate(calc(var(--o11-band-tilt) * 1deg));
  transform: translateX(-160%) rotate(calc(var(--o11-band-tilt) * 1deg));
  will-change: transform, opacity;
  -webkit-animation: o11-sweep var(--o11-cycle-dur) var(--o11-cycle-ease) 600ms infinite both;
  animation: o11-sweep var(--o11-cycle-dur) var(--o11-cycle-ease) 600ms infinite both;
}
.mpa .o11-wave {
  position: absolute; display: block; z-index: 0;
  top: 50%; left: 50%;
  box-sizing: border-box;
  width: calc(var(--o11-avatar) + var(--o11-rim) * 2);
  height: calc(var(--o11-avatar) + var(--o11-rim) * 2);
  margin-top: calc(var(--o11-avatar) / -2 - var(--o11-rim));
  margin-left: calc(var(--o11-avatar) / -2 - var(--o11-rim));
  border-radius: var(--dimension-radius-semantic-pill);
  border: var(--o11-wave-width) solid var(--o11-wave-color);
  opacity: 0;
  -webkit-transform: scale(1); transform: scale(1);
  pointer-events: none;
  will-change: transform, opacity;
  -webkit-animation: o11-wave var(--o11-cycle-dur) cubic-bezier(0.2, 0, 0, 1) 600ms infinite both;
  animation: o11-wave var(--o11-cycle-dur) cubic-bezier(0.2, 0, 0, 1) 600ms infinite both;
}
.mpa .o11-wave-2 {
  --o11-wave-peak: var(--o11-wave2-peak);
  -webkit-animation-delay: calc(600ms + var(--o11-wave-lag)); animation-delay: calc(600ms + var(--o11-wave-lag));
}
@-webkit-keyframes o11-sweep {
  0%   { opacity: 0; -webkit-transform: translateX(-160%) rotate(calc(var(--o11-band-tilt) * 1deg)); }
  3.9% { opacity: var(--o11-band-opacity); }
  13.1% { opacity: var(--o11-band-opacity); }
  15.7% { opacity: 0; -webkit-transform: translateX(420%) rotate(calc(var(--o11-band-tilt) * 1deg)); }
  100% { opacity: 0; -webkit-transform: translateX(420%) rotate(calc(var(--o11-band-tilt) * 1deg)); }
}
@keyframes o11-sweep {
  0%   { opacity: 0; transform: translateX(-160%) rotate(calc(var(--o11-band-tilt) * 1deg)); }
  3.9% { opacity: var(--o11-band-opacity); }
  13.1% { opacity: var(--o11-band-opacity); }
  15.7% { opacity: 0; transform: translateX(420%) rotate(calc(var(--o11-band-tilt) * 1deg)); }
  100% { opacity: 0; transform: translateX(420%) rotate(calc(var(--o11-band-tilt) * 1deg)); }
}
@-webkit-keyframes o11-wave {
  0%   { opacity: 0; -webkit-transform: scale(1); }
  1.3% { opacity: var(--o11-wave-peak); -webkit-transform: scale(1); }
  20.9% { opacity: 0; -webkit-transform: scale(var(--o11-wave-reach)); }
  100% { opacity: 0; -webkit-transform: scale(var(--o11-wave-reach)); }
}
@keyframes o11-wave {
  0%   { opacity: 0; transform: scale(1); }
  1.3% { opacity: var(--o11-wave-peak); transform: scale(1); }
  20.9% { opacity: 0; transform: scale(var(--o11-wave-reach)); }
  100% { opacity: 0; transform: scale(var(--o11-wave-reach)); }
}
@-webkit-keyframes o11-glint { 0%, 15.7%, 100% { opacity: 0; } 7.8% { opacity: var(--o11-band-opacity); } }
@keyframes o11-glint { 0%, 15.7%, 100% { opacity: 0; } 7.8% { opacity: var(--o11-band-opacity); } }
@-webkit-keyframes o11-fade { 0%, 20.9%, 100% { opacity: 0; } 7.8% { opacity: var(--o11-wave-peak); } }
@keyframes o11-fade { 0%, 20.9%, 100% { opacity: 0; } 7.8% { opacity: var(--o11-wave-peak); } }
@media (prefers-reduced-motion: reduce) {
  .mpa .o11-band {
    left: 34%;
    -webkit-transform: rotate(calc(var(--o11-band-tilt) * 1deg)); transform: rotate(calc(var(--o11-band-tilt) * 1deg));
    -webkit-animation-name: o11-glint; animation-name: o11-glint;
  }
  .mpa .o11-wave { -webkit-animation-name: o11-fade; animation-name: o11-fade; }
}
`

export interface MenuComPerfilAnimadoProps {
  focusedItem?: 'login' | 'schedule' | 'miscellaneous' | 'program' | 'channel-bug' | null
  programTitle: string
  programSubtitle: string
}

/**
 * @exploration motion-botao-de-perfil#11
 * @proposal
 * why: o Login do MainMenu não tem motion ocioso; o designer quer ver o efeito da opção 11 dentro do menu real, junto dos outros botões
 * description: MainMenu do kit com a faixa de luz atrás do avatar e duas ondas saindo do botão Login, em loop só de CSS (efeito de 1,5 s, depois 5 s de pausa)
 * proposedApi:
 *   focusedItem: "'login' | 'schedule' | 'miscellaneous' | 'program' | 'channel-bug' | null"
 *   programTitle: "string"
 *   programSubtitle: "string"
 */
export function MenuComPerfilAnimado({ focusedItem = 'channel-bug', programTitle, programSubtitle }: MenuComPerfilAnimadoProps): ReactNode {
  const raiz = useRef<HTMLDivElement>(null)

  // O motion é só CSS. Os três elementos entram no botão Login do kit sem tocar nele: as ondas antes do círculo, a chapa com a faixa dentro do círculo.
  useLayoutEffect(() => {
    if (focusedItem === 'login') return
    const botao = raiz.current?.querySelector<HTMLElement>('[data-focus-item="login"]')
    const circulo = botao?.querySelector<HTMLElement>('.sfs-round-button-circle')
    if (!botao || !circulo) return
    const ondas = document.createElement('span')
    ondas.className = 'o11-ext'
    ondas.setAttribute('aria-hidden', 'true')
    ondas.innerHTML = '<span class="o11-wave"></span><span class="o11-wave o11-wave-2"></span>'
    const chapa = document.createElement('span')
    chapa.className = 'o11-ext'
    chapa.setAttribute('aria-hidden', 'true')
    chapa.innerHTML = '<span class="o11-plate"><span class="o11-band"></span></span>'
    botao.insertBefore(ondas, botao.firstChild)
    circulo.insertBefore(chapa, circulo.firstChild)
    return () => {
      ondas.remove()
      chapa.remove()
    }
  }, [focusedItem])

  return (
    <div ref={raiz} className="mpa">
      <style>{CSS}</style>
      <MainMenu
        focusedItem={focusedItem}
        miscellaneousTitle="Previsão do tempo"
        miscellaneousSubtitle="São Paulo, SP"
        programTitle={programTitle}
        programSubtitle={programSubtitle}
        avatarSrc={ICONE_PERFIL}
      />
    </div>
  )
}
