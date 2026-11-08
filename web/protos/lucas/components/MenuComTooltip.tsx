import { useEffect, useLayoutEffect, useState, type ReactNode } from 'react'
import { MainMenu } from '@/ui-kit/MainMenu'
import { BUG_GLOBO_SRC } from '../dados-bug-globo'
import { AVATAR_ANONIMO } from '../dados-avatar-anonimo'
import { estiloUnico } from './estiloUnico'
import { abreTooltip, entrouTooltip, faseTooltip, irParaEsquerda, tooltipJaEntrou } from './tooltipLogin'

// Opção 9 (ajuste da 7, com a entrada círculo→pílula, squash, texto aos 90% e saída com descida) de docs/explorations/tooltip-perfil-login/index.html: valores finais lidos do CSS da opção, como estão.
// CSS e JS só com o que o Chrome 68 entende: sem color-mix, :is, inset, gap em flex, aspect-ratio, translate/scale separados nem @property; o morph não mede nada em JS.
// Sem aspas, ">", "&" nem "<" no texto do CSS: o React os escapa no servidor e o cliente discorda (erro de hidratação).
const ESQ = ['login', 'agenda', 'misc']
const esq = (resto: string, prefixo = '.mpt-raiz'): string =>
  ESQ.map((s) => prefixo + '[data-state=' + s + '][data-tip=on] ' + resto).join(', ')

/** Movimento reduzido: tudo troca só por opacidade (sem subida, desfoque, morph nem distorção). Vale com data-reduced e com a media query. */
const reduzido = (p: string): string => `
${p} .mpt-pillpath { transform: translate(var(--o9-cx0), var(--o9-cy0)); filter: blur(0px); transition-property: opacity; }
${p} .mpt-dot { transform: translate(-50%, 0); filter: blur(0px); transition-property: opacity; }
${p} .mpt-tip-text { transform: none; transition-property: none; }
${p}[data-state=programa][data-tip] .mpt-dot, ${p}[data-state=programa][data-tip] .mpt-squash, ${p}[data-state=programa][data-tip] .mpt-tooltip, ${p}[data-state=programa][data-tip] .mpt-tip-text { animation: none; }
${esq('.mpt-pillpath', p)} { transform: translate(var(--o9-cx0), var(--o9-cy0)); transition: opacity var(--tip-out-dur) var(--tip-out-ease); }
${esq('.mpt-tooltip', p)} { width: var(--pill-w); height: var(--pill-h); background-color: var(--color-semantic-functional-background-elevated); border-radius: var(--dimension-radius-semantic-pill); transition: none; animation: none; }
${esq('.mpt-veu-pilula', p)} { opacity: var(--morph-veil); transition: none; }
${esq('.mpt-tip-text', p)} { opacity: 1; transition: none; }
${esq('.mpt-dot', p)} { transition-duration: var(--dot-dur); transition-timing-function: var(--dot-ease); transition-delay: var(--dot-out-delay); }
${esq('.sfs-main-menu-badge', p)} { transition: opacity var(--tip-out-dur) var(--tip-out-ease); }
`

const CSS = `
.mpt-raiz {
  position: relative;
  --tip-in-dur: 350ms; --tip-in-ease: cubic-bezier(0.25, 0.1, 0.25, 1);
  --tip-out-dur: 200ms; --tip-out-ease: cubic-bezier(0.25, 0.1, 0.25, 1);
  --tip-travel: 8px; --tip-blur: 2px;
  --dot-dur: 280ms; --dot-ease: cubic-bezier(0.25, 0.1, 0.25, 1); --dot-sx: 0.88; --dot-sy: 1.18;
  --pill-delay: 140ms; --dot-out-delay: 80ms;
  --text-travel: 4px; --text-dur: 100ms; --text-ease: cubic-bezier(0.25, 0.1, 0.25, 1); --text-delay: 0ms;
  --morph-dur: 400ms; --morph-ease: cubic-bezier(0.25, 0.1, 0.25, 1); --morph-delay: 0ms;
  --morph-text-dur: 200ms; --morph-text-ease: cubic-bezier(0.25, 0.1, 0.25, 1);
  --morph-radius: var(--dimension-radius-semantic-pill); --morph-veil: 0.2; --morph-dot-delay: 0ms;
  --pill-w: 103px; --pill-h: 33px; --pill-ratio: 0.32;
  --grow-dur: 600ms; --grow-ease: cubic-bezier(0.25, 0.1, 0.25, 1); --grow-d: 0.3; --pop-x: 1.06; --pop-y: 0.95; --exit-travel: 10px;
  --squash-dur: 400ms; --squash-ease: cubic-bezier(0.42, 0, 0.58, 1);
  --stretch-x: 0.94; --stretch-y: 1.12; --squash-x: 1.12; --squash-y: 0.88;
  --squash-peak: 35; --squash-land: 80; --squash-ox: 50%; --squash-oy: 50%;
  --dot-morph-dur: 80ms; --dot-morph-ease: cubic-bezier(0.25, 0.1, 0.25, 1);
  --morph-start: 80ms; --morph-handoff: 60ms;
  --o9-start: calc(var(--morph-delay) + var(--morph-start));
}
.mpt-ancora {
  position: absolute; left: 0; bottom: 0; z-index: 1; pointer-events: none;
  width: var(--dimension-size-semantic-round-button); height: var(--dimension-size-semantic-round-button);
  --o9-cx0: calc(var(--dimension-size-semantic-round-button) / 2);
  --o9-cy0: calc(var(--dimension-size-semantic-round-button) - (var(--dimension-size-semantic-round-button) + var(--dimension-size-semantic-round-button-circle)) / 2 - var(--dimension-spacing-core-2xs) - var(--dimension-spacing-core-2xs) - var(--dimension-spacing-core-3xs) - var(--pill-h) / 2);
  --o9-cx1: calc((var(--dimension-size-semantic-round-button) + var(--dimension-size-semantic-avatar)) / 2 - var(--dimension-size-semantic-round-button-badge) / 2);
  --o9-cy1: calc((var(--dimension-size-semantic-round-button) - var(--dimension-size-semantic-avatar)) / 2 + var(--dimension-size-semantic-round-button-badge) / 2);
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
.mpt-veu-pilula { opacity: var(--morph-veil); }
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
.mpt-raiz[data-state=programa][data-tip=on] .mpt-squash { animation: mpt-pico var(--grow-dur) var(--grow-ease) var(--pill-delay) backwards; }
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
.mpt-raiz[data-snap][data-state][data-tip] .mpt-pillpath, .mpt-raiz[data-snap][data-state][data-tip] .mpt-squash, .mpt-raiz[data-snap][data-state][data-tip] .mpt-tooltip, .mpt-raiz[data-snap][data-state][data-tip] .mpt-tip-text, .mpt-raiz[data-snap][data-state][data-tip] .mpt-dot { transition: none; animation: none; }
${esq('.mpt-pillpath')} {
  opacity: 0; transform: translate(var(--o9-cx1), var(--o9-cy1)); filter: blur(0px);
  transition: transform var(--morph-dur) var(--morph-ease) var(--o9-start), opacity 1ms linear calc(var(--morph-dur) + var(--o9-start));
}
${esq('.mpt-tooltip')} {
  width: var(--dimension-size-semantic-round-button-badge); height: var(--dimension-size-semantic-round-button-badge);
  background-color: var(--color-semantic-functional-round-button-badge); border-radius: var(--morph-radius);
  transition: width var(--morph-dur) var(--morph-ease) var(--o9-start), height var(--morph-dur) var(--morph-ease) var(--o9-start), background-color var(--morph-dur) var(--morph-ease) var(--o9-start), border-radius var(--morph-dur) var(--morph-ease) var(--o9-start);
  animation-name: mpt-esticar, mpt-comprimir, mpt-assentar;
  animation-duration: calc(var(--squash-dur) * var(--squash-peak) / 100), calc(var(--squash-dur) * (var(--squash-land) - var(--squash-peak)) / 100), calc(var(--squash-dur) * (100 - var(--squash-land)) / 100);
  animation-delay: var(--o9-start), calc(var(--o9-start) + var(--squash-dur) * var(--squash-peak) / 100), calc(var(--o9-start) + var(--squash-dur) * var(--squash-land) / 100);
  animation-timing-function: var(--squash-ease);
  animation-fill-mode: forwards;
}
@keyframes mpt-esticar { from { transform: translate(-50%, -50%) scale(1, 1); } to { transform: translate(-50%, -50%) scale(var(--stretch-x), var(--stretch-y)); } }
@keyframes mpt-comprimir { from { transform: translate(-50%, -50%) scale(var(--stretch-x), var(--stretch-y)); } to { transform: translate(-50%, -50%) scale(var(--squash-x), var(--squash-y)); } }
@keyframes mpt-assentar { from { transform: translate(-50%, -50%) scale(var(--squash-x), var(--squash-y)); } to { transform: translate(-50%, -50%) scale(1, 1); } }
${esq('.mpt-veu-pilula')} { opacity: 0; transition: opacity var(--morph-dur) var(--morph-ease) var(--o9-start); }
${esq('.mpt-tip-text')} { opacity: 0; transform: translateY(0); transition: opacity var(--morph-text-dur) var(--morph-text-ease) var(--o9-start); }
${esq('.mpt-dot')} { transition-duration: var(--dot-morph-dur); transition-timing-function: var(--dot-morph-ease); transition-delay: var(--morph-dot-delay); }
.mpt-raiz[data-prep] .sfs-main-menu-badge { opacity: 0; }
${esq('.sfs-main-menu-badge')} { opacity: 1; transition: opacity 1ms linear calc(var(--morph-dur) + var(--o9-start) - var(--morph-handoff)); }
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
const ESTADO: Record<string, string> = { login: 'login', schedule: 'agenda', miscellaneous: 'misc' }

/**
 * Morph do tooltip para o selo (pedido: "create a morph transition to the badge"), com o movimento final da opção 9 ajustada.
 * @exploration tooltip-perfil-login#9
 * @proposal
 * why: o kit não tem tooltip; o designer quer o lembrete Faça o login da opção 7 (ajustada, cópia 9) sobre o botão de perfil da Home, virando o selo do botão quando o foco sai para a esquerda, em Chrome 68
 * description: MainMenu do kit com ponto e pílula Faça o login sobre o botão Login; fica até o foco ir à esquerda, quando a pílula vira o selo
 * proposedApi:
 *   focusedItem: "'login' | 'schedule' | 'miscellaneous' | 'program' | 'channel-bug' | null"
 *   programTitle: "string"
 *   programSubtitle: "string"
 */
export function MenuComTooltip({ focusedItem = 'channel-bug', programTitle, programSubtitle }: MenuComTooltipProps): ReactNode {
  const esquerda = focusedItem !== null && ESQUERDA.indexOf(focusedItem) >= 0
  // Chegou à esquerda com o tooltip na tela: nasce na posição de repouso e, dois quadros depois, o estado muda e o morph corre.
  const [morfa] = useState(() => esquerda && faseTooltip() === 'visivel')
  const [estado, setEstado] = useState(() => (esquerda && !morfa ? ESTADO[focusedItem as string] : 'programa'))
  const [tip, setTip] = useState(() => (morfa || (!esquerda && tooltipJaEntrou()) ? 'on' : 'off'))
  const [snap, setSnap] = useState(true)
  const [reduzido, setReduzido] = useState(false)
  const selo = esquerda || faseTooltip() === 'feito'

  useLayoutEffect(() => {
    if (esquerda) irParaEsquerda()
    else abreTooltip()
    setReduzido(window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  }, [esquerda])

  // Dois quadros depois da montagem o estado final é aplicado: um só não basta, porque o React confirma o estado antes da primeira pintura e o navegador nunca vê o ponto de partida.
  useEffect(() => {
    let b = 0
    let entrou = 0
    const a = requestAnimationFrame(() => {
      b = requestAnimationFrame(() => {
        setSnap(false)
        if (morfa) setEstado(ESTADO[focusedItem as string])
        else if (!esquerda) {
          setTip('on')
          entrou = window.setTimeout(entrouTooltip, 900)
        }
      })
    })
    return () => {
      cancelAnimationFrame(a)
      cancelAnimationFrame(b)
      window.clearTimeout(entrou)
    }
  }, [morfa, esquerda, focusedItem])

  return (
    <div
      className="mpt-raiz"
      data-state={estado}
      data-tip={tip}
      data-snap={snap ? '' : undefined}
      data-prep={morfa && estado === 'programa' ? '' : undefined}
      data-reduced={reduzido ? '' : undefined}
    >
      <MainMenu
        focusedItem={focusedItem}
        miscellaneousTitle="Previsão do tempo"
        miscellaneousSubtitle="São Paulo, SP"
        programTitle={programTitle}
        programSubtitle={programSubtitle}
        avatarSrc={AVATAR_ANONIMO}
        loginBadge={selo}
        bugSrc={BUG_GLOBO_SRC}
      />
      <div className="mpt-ancora" aria-hidden="true">
        <div className="mpt-pillpath">
          <div className="mpt-squash">
            <div className="mpt-tooltip" role="tooltip">
              <span className="mpt-veu-pilula" />
              <span className="mpt-tip-text">Faça o login</span>
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
