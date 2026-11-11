import { useEffect, useLayoutEffect, useState, type ReactNode } from 'react'
import { MainMenu } from '@/ui-kit/MainMenu'
import { BUG_GLOBO_SRC } from '../dados-bug-globo'
import { AVATAR_ANONIMO } from '../dados-avatar-anonimo'
import { estiloUnico } from './estiloUnico'
import {
  abreTooltip,
  atrasoEntrada,
  entrouMenu,
  entrouTooltip,
  faseTooltip,
  irParaEsquerda,
  marcaHome,
  menuJaEntrou,
  mostraTooltip,
  tooltipJaEntrou,
} from './tooltipLogin'

// Opção 9 (ajuste da 7, com a entrada círculo→pílula, squash, texto aos 90% e saída com descida) de docs/explorations/tooltip-perfil-login/index.html: valores finais lidos do CSS da opção, como estão.
// CSS e JS só com o que o Chrome 68 entende: sem color-mix, :is, inset, gap em flex, aspect-ratio, translate/scale separados nem @property.
// Sem aspas, "&" nem "<" no texto do CSS. A folha entra por textContent, então o ">" dos seletores não passa pelo React.
// O morph para o selo saiu: o foco à esquerda só encolhe a pílula, e o botão de perfil não ganha selo.

/** Movimento reduzido: tudo troca só por opacidade (sem subida, desfoque nem distorção). Vale com data-reduced e com a media query. */
const reduzido = (p: string): string => `
${p} .mpt-pillpath { transform: translate(var(--o9-cx0), var(--o9-cy0)); filter: blur(0px); transition-property: opacity; }
${p} .mpt-dot { transform: translate(-50%, 0); filter: blur(0px); transition-property: opacity; }
${p} .mpt-tip-text { transform: none; transition-property: none; }
${p}[data-tip] .mpt-dot, ${p}[data-tip] .mpt-squash, ${p}[data-tip] .mpt-tooltip, ${p}[data-tip] .mpt-tip-text { animation: none; }
${p}[data-tip=off] .mpt-pillpath, ${p}[data-tip=off] .mpt-dot, ${p}[data-tip=off] .mpt-tip-text { opacity: 0; }
${p}[data-menu] nav > :first-child > *, ${p}[data-menu] nav > :last-child > * { animation-name: mpt-opcao-opacidade; transform: none; filter: none; }
`

const CSS = `
.mpt-raiz {
  position: relative;
  --tip-in-dur: 350ms; --tip-in-ease: cubic-bezier(0.25, 0.1, 0.25, 1);
  --tip-out-dur: 200ms; --tip-out-ease: cubic-bezier(0.25, 0.1, 0.25, 1);
  --tip-travel: 8px; --tip-blur: 2px;
  --dot-dur: 280ms; --dot-ease: cubic-bezier(0.25, 0.1, 0.25, 1); --dot-sx: 1.05; --dot-sy: 1.18;
  --pill-delay: 140ms; --dot-out-delay: 80ms;
  --text-travel: 4px; --text-dur: 100ms; --text-ease: cubic-bezier(0.25, 0.1, 0.25, 1); --text-delay: 0ms;
  --pill-w: 124px; --pill-h: 33px; --pill-ratio: 0.266;
  --grow-dur: 300ms; --grow-ease: cubic-bezier(0.25, 0.1, 0.25, 1); --grow-d: 0.3; --pop-dur: 600ms; --pop-ease: cubic-bezier(0.25, 0.1, 0.25, 1); --pop-x: 1.07; --pop-y: 0.95; --exit-travel: 10px;
  --squash-dur: 400ms; --squash-ease: cubic-bezier(0.42, 0, 0.58, 1);
  --stretch-x: 0.94; --stretch-y: 1.12; --squash-x: 1.12; --squash-y: 0.88;
  --squash-peak: 35; --squash-land: 80; --squash-ox: 50%; --squash-oy: 50%;
}
.mpt-ancora {
  position: absolute; left: 0; bottom: 0; z-index: 1; pointer-events: none;
  width: var(--dimension-size-semantic-round-button); height: var(--dimension-size-semantic-round-button);
  --o9-cx0: calc(var(--dimension-size-semantic-round-button) / 2);
  --o9-cy0: calc(var(--dimension-size-semantic-round-button) - (var(--dimension-size-semantic-round-button) + var(--dimension-size-semantic-round-button-circle)) / 2 - var(--dimension-spacing-core-2xs) - var(--dimension-spacing-core-2xs) - var(--dimension-spacing-core-3xs) - var(--pill-h) / 2);
}
.mpt-pillpath {
  position: absolute; left: 0; top: 0; z-index: 1; width: 0; height: 0; pointer-events: none;
  opacity: 0;
  transform: translate(var(--o9-cx0), calc(var(--o9-cy0) + var(--tip-travel)));
  filter: blur(var(--tip-blur));
  transition-property: opacity, transform, filter;
  transition-duration: var(--tip-out-dur); transition-timing-function: var(--tip-out-ease); transition-delay: 0ms;
}
.mpt-tooltip {
  position: absolute; left: 0; top: 0; display: flex; align-items: center; justify-content: center;
  box-sizing: border-box; overflow: hidden; width: var(--pill-w); height: var(--pill-h); white-space: nowrap;
  background-color: var(--color-semantic-functional-background-elevated);
  border-radius: var(--dimension-radius-semantic-pill);
  color: var(--color-semantic-functional-text-primary);
  font-size: var(--typography-font-size-md); font-weight: var(--typography-font-weight-medium);
  letter-spacing: var(--typography-letter-spacing-tight); line-height: var(--typography-line-height-normal);
  transform: translate(-50%, -50%);
  transform-origin: var(--squash-ox) var(--squash-oy);
}
.mpt-dot {
  position: absolute;
  bottom: calc((var(--dimension-size-semantic-round-button) + var(--dimension-size-semantic-round-button-circle)) / 2 + var(--dimension-spacing-core-2xs));
  left: 50%; width: var(--dimension-spacing-core-2xs); height: var(--dimension-spacing-core-2xs);
  border-radius: 50%; background-color: var(--color-semantic-functional-background-elevated); pointer-events: none;
  opacity: 0; transform: translate(-50%, var(--tip-travel)); filter: blur(var(--tip-blur));
  transition-property: opacity, transform, filter;
  transition-duration: var(--dot-dur); transition-timing-function: var(--dot-ease); transition-delay: var(--dot-out-delay);
}
.mpt-veu-pilula, .mpt-veu-ponto { position: absolute; top: 0; right: 0; bottom: 0; left: 0; border-radius: inherit; background-color: var(--color-opacity-light-100); }
.mpt-veu-pilula { opacity: 0.2; }
.mpt-veu-ponto { opacity: 0.2; }
.mpt-tip-text {
  position: relative; display: inline-block; transform: translateY(var(--text-travel));
  transition-property: transform; transition-duration: var(--tip-out-dur); transition-timing-function: var(--tip-out-ease); transition-delay: 0ms;
}
.mpt-raiz[data-state=programa][data-tip=on] .mpt-pillpath {
  opacity: 1; transform: translate(var(--o9-cx0), var(--o9-cy0)); filter: blur(0px);
  transition-duration: var(--tip-in-dur); transition-timing-function: var(--tip-in-ease); transition-delay: var(--pill-delay);
}
.mpt-raiz[data-state=programa][data-tip=on] .mpt-dot {
  opacity: 1; transform: translate(-50%, 0); filter: blur(0px);
  transition-duration: var(--dot-dur); transition-timing-function: var(--dot-ease); transition-delay: 0ms;
}
.mpt-raiz[data-state=programa] .mpt-tip-text { transform: none; transition: none; }
.mpt-squash { position: absolute; left: 0; top: 0; width: 0; height: 0; transform-origin: 0 0; }
/* Entrada: o ponto sobe esticado; a pílula nasce círculo pequeno e cresce (transform), com um pico de escala no meio que assenta ao fechar a forma; o texto aparece aos 90% do crescimento. Saída: o texto some, a pílula desce e volta a círculo. Só keyframes (Chrome 68, sem @property). */
.mpt-raiz[data-state=programa][data-tip=on] .mpt-dot { animation: mpt-dot-sobe var(--dot-dur) var(--dot-ease) backwards; }
.mpt-raiz[data-state=programa][data-tip=on] .mpt-tooltip { animation: mpt-crescer var(--grow-dur) var(--grow-ease) var(--pill-delay) backwards; }
.mpt-raiz[data-state=programa][data-tip=on] .mpt-squash { animation: mpt-pico var(--pop-dur) var(--pop-ease) var(--pill-delay) backwards; }
.mpt-raiz[data-state=programa][data-tip=on] .mpt-tip-text { animation: mpt-texto-entra var(--text-dur) var(--text-ease) calc(var(--pill-delay) + var(--grow-dur) * 0.9) backwards; }
.mpt-raiz[data-state=programa][data-tip=off] .mpt-tooltip { animation: mpt-encolher var(--tip-out-dur) var(--tip-out-ease) forwards; }
.mpt-raiz[data-state=programa][data-tip=off] .mpt-tip-text { animation: mpt-texto-sai var(--text-dur) var(--text-ease) forwards; }
@keyframes mpt-crescer {
  from { transform: translate(-50%, -50%) scale(calc(var(--grow-d) * var(--pill-ratio)), var(--grow-d)); border-radius: calc(var(--pill-h) / 2 / var(--pill-ratio)) / calc(var(--pill-h) / 2); }
  to { transform: translate(-50%, -50%) scale(1, 1); border-radius: calc(var(--pill-h) / 2) / calc(var(--pill-h) / 2); }
}
@keyframes mpt-encolher {
  from { transform: translate(-50%, -50%) scale(1, 1); border-radius: calc(var(--pill-h) / 2) / calc(var(--pill-h) / 2); }
  to { transform: translate(-50%, calc(-50% + var(--exit-travel))) scale(calc(var(--grow-d) * var(--pill-ratio)), var(--grow-d)); border-radius: calc(var(--pill-h) / 2 / var(--pill-ratio)) / calc(var(--pill-h) / 2); }
}
@keyframes mpt-pico { 0% { transform: scale(1, 1); } 60% { transform: scale(var(--pop-x), var(--pop-y)); } 100% { transform: scale(1, 1); } }
@keyframes mpt-dot-sobe {
  0% { opacity: 0; filter: blur(var(--tip-blur)); transform: translate(-50%, var(--tip-travel)) scale(1, 1); }
  55% { opacity: 1; filter: blur(0px); transform: translate(-50%, 0) scale(var(--dot-sx), var(--dot-sy)); }
  100% { opacity: 1; filter: blur(0px); transform: translate(-50%, 0) scale(1, 1); }
}
@keyframes mpt-texto-entra { from { opacity: 0; transform: translateY(var(--text-travel)); } to { opacity: 1; transform: translateY(0); } }
@keyframes mpt-texto-sai { from { opacity: 1; transform: translateY(0); } to { opacity: 0; transform: translateY(var(--text-travel)); } }
.mpt-raiz[data-snap][data-tip] .mpt-pillpath, .mpt-raiz[data-snap][data-tip] .mpt-squash, .mpt-raiz[data-snap][data-tip] .mpt-tooltip, .mpt-raiz[data-snap][data-tip] .mpt-tip-text, .mpt-raiz[data-snap][data-tip] .mpt-dot { transition: none; animation: none; }
/* Entrada aplicada na opção 2 de entrada-do-menu: da direita para a esquerda, um gesto só. 10px, desfoque 2px, opacidade 0 a 1, 120ms entre itens, 650ms, a curva que ficou no palco. */
.mpt-raiz[data-menu] nav > :first-child > *,
.mpt-raiz[data-menu] nav > :last-child > * {
  animation-name: mpt-opcao;
  animation-duration: 650ms;
  animation-timing-function: cubic-bezier(0.216, 0.118, 0.232, 0.979);
  animation-fill-mode: both;
}
.mpt-raiz[data-menu] nav > :last-child > :nth-child(2) { animation-delay: 0ms; }
.mpt-raiz[data-menu] nav > :last-child > :nth-child(1) { animation-delay: 120ms; }
.mpt-raiz[data-menu] nav > :first-child > :nth-child(3) { animation-delay: 240ms; }
.mpt-raiz[data-menu] nav > :first-child > :nth-child(2) { animation-delay: 360ms; }
.mpt-raiz[data-menu] nav > :first-child > :nth-child(1) { animation-delay: 480ms; }
@keyframes mpt-opcao {
  0% { opacity: 0; transform: translate(10px, 0); filter: blur(2px); }
  100% { opacity: 1; transform: translate(0, 0); filter: blur(0px); }
}
@keyframes mpt-opcao-opacidade {
  0% { opacity: 0; }
  100% { opacity: 1; }
}
@media (prefers-reduced-motion: reduce) {
${reduzido('.mpt-raiz')}
}
${reduzido('.mpt-raiz[data-reduced]')}
`
// Uma folha por página, posta ao carregar o módulo: no JSX ela entrava de novo a cada troca de foco (ver estiloUnico).
estiloUnico('menu-com-tooltip', CSS)

export interface MenuComTooltipProps {
  focusedItem?: 'login' | 'schedule' | 'miscellaneous' | 'program' | 'channel-bug' | null
  programTitle: string
  programSubtitle: string
}

const ESQUERDA = ['login', 'schedule', 'miscellaneous']

/**
 * A pílula Faça o login da opção 9, sem virar selo: ao ir para a esquerda ela encolhe e o botão de perfil fica sem badge.
 * @exploration tooltip-perfil-login#9
 * @proposal
 * why: o kit não tem tooltip; o designer quer o lembrete Faça o login da opção 7 (ajustada, cópia 9) sobre o botão de perfil da Home, a entrada 1s depois da Home, as opções do menu em sequência, e pediu para tirar o selo e o morph
 * description: MainMenu do kit com ponto e pílula Faça o login sobre o botão Login; a pílula entra 1s depois que a Home aparece, reaparece em cada botão redondo da direita e encolhe quando o foco vai à esquerda, sem selo; o menu entra da direita para a esquerda, 120ms entre opções, 10px no eixo x, desfoque de 2px e opacidade de 0 a 1 em 650ms
 * proposedApi:
 *   focusedItem: "'login' | 'schedule' | 'miscellaneous' | 'program' | 'channel-bug' | null"
 *   programTitle: "string"
 *   programSubtitle: "string"
 */
export function MenuComTooltip({ focusedItem = 'channel-bug', programTitle, programSubtitle }: MenuComTooltipProps): ReactNode {
  const esquerda = focusedItem !== null && ESQUERDA.indexOf(focusedItem) >= 0
  // Chegou à esquerda com a pílula na tela: ela nasce acesa e, dois quadros depois, encolhe. Sem isso o navegador não vê o ponto de partida.
  const [sair] = useState(() => esquerda && faseTooltip() === 'visivel')
  const [tip, setTip] = useState<'on' | 'off'>(() => (sair || (!esquerda && tooltipJaEntrou()) ? 'on' : 'off'))
  const [snap, setSnap] = useState(true)
  const [reduzido, setReduzido] = useState(false)
  const [menu] = useState(() => !menuJaEntrou())
  const dica = tip === 'on' || sair ? tip : undefined

  useLayoutEffect(() => {
    marcaHome()
    if (menu) entrouMenu()
    if (esquerda) irParaEsquerda()
    else abreTooltip()
    setReduzido(window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  }, [esquerda, menu])

  useEffect(() => {
    // Já entrou num botão da direita: fica acesa, sem repetir a entrada. Na esquerda: fica fora.
    if (!sair && (esquerda || tooltipJaEntrou())) return
    let a = 0
    let b = 0
    let entrou = 0
    let espera = 0
    let vivo = true
    const solta = () => {
      if (!vivo) return
      a = requestAnimationFrame(() => {
        b = requestAnimationFrame(() => {
          if (!vivo) return
          setSnap(false)
          if (sair) setTip('off')
          else if (!esquerda && faseTooltip() !== 'feito') {
            mostraTooltip()
            setTip('on')
            entrou = window.setTimeout(entrouTooltip, 900)
          }
        })
      })
    }
    // A primeira entrada espera 1s desde que a Home apareceu. A reentrada num botão da direita começa na hora.
    if (!sair && faseTooltip() === 'novo') espera = window.setTimeout(solta, atrasoEntrada())
    else solta()
    return () => {
      vivo = false
      window.clearTimeout(espera)
      cancelAnimationFrame(a)
      cancelAnimationFrame(b)
      window.clearTimeout(entrou)
    }
  }, [sair, esquerda])

  return (
    <div
      className="mpt-raiz"
      data-state="programa"
      data-tip={dica}
      data-snap={snap ? '' : undefined}
      data-reduced={reduzido ? '' : undefined}
      data-menu={menu ? '' : undefined}
    >
      <MainMenu
        focusedItem={focusedItem}
        miscellaneousTitle="Previsão do tempo"
        miscellaneousSubtitle="São Paulo, SP"
        programTitle={programTitle}
        programSubtitle={programSubtitle}
        avatarSrc={AVATAR_ANONIMO}
        bugSrc={BUG_GLOBO_SRC}
      />
      <div className="mpt-ancora" aria-hidden="true">
        <div className="mpt-pillpath">
          <div className="mpt-squash">
            <div className="mpt-tooltip" role="tooltip">
              <span className="mpt-veu-pilula" />
              <span className="mpt-tip-text">Entrar na conta</span>
            </div>
          </div>
        </div>
        <div className="mpt-dot">
          <span className="mpt-veu-ponto" />
        </div>
      </div>
    </div>
  )
}
