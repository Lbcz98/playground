import { useEffect, useRef, useState, type KeyboardEvent } from 'react'

/** Opção 3 de design-brain/toolbox/references/pompeia-seletor-card/index.html, com os valores do ajuste (bloco tune:vars). */
const CSS = `
.sc {
  --radius: var(--dimension-radius-semantic-content-card);
  --inset: var(--dimension-spacing-semantic-card-inset-expanded);
  --card-bg: var(--color-semantic-functional-background-elevated);
  --art-glow: var(--color-semantic-theme-noite-light);
  --art-top: var(--color-semantic-theme-noite-dark);
  --art-bottom: var(--color-semantic-functional-background-primary);
  --art-x: 72%;
  --art-y: 20%;
  --art-reach: 50%;
  --mount-color: var(--color-semantic-functional-background-primary);
  --mount-bottom: 18%;
  --mount-height: 44%;
  --scrim-opacity: 1;
  --body-gap: var(--dimension-spacing-core-sm);
  --body-top: 144px;
  --title-size: var(--typography-font-size-3xl);
  --title-lh: var(--typography-line-height-normal);
  --title-ls: var(--typography-letter-spacing-tight);
  --title-color: var(--color-semantic-functional-text-primary);
  --info-gap: var(--dimension-spacing-core-2xs);
  --when-gap: var(--dimension-spacing-core-xs);
  --time-size: var(--typography-font-size-md);
  --time-color: var(--color-semantic-functional-text-primary);
  --rating-size: var(--typography-font-size-md);
  --rating-box: var(--dimension-size-semantic-icon-sm);
  --rating-pad: var(--dimension-spacing-core-3xs);
  --rating-border: var(--dimension-border-width-semantic-divider);
  --rating-radius: var(--dimension-radius-core-sm);
  --rating-color: var(--color-semantic-functional-text-primary);
  --state-size: var(--typography-font-size-md);
  --state-gap: var(--dimension-spacing-core-2xs);
  --state-key-color: var(--color-semantic-functional-text-primary);
  --dot-size: var(--dimension-spacing-core-2xs);
  --dot-color: var(--color-semantic-functional-status-live);
  --bar-gap: var(--dimension-spacing-core-3xs);
  --bar-pad: var(--dimension-spacing-core-3xs);
  --bar-radius: var(--dimension-radius-semantic-pill);
  --seg-height: var(--dimension-size-semantic-control-height);
  --seg-radius: var(--dimension-radius-core-xl);
  --seg-size: var(--typography-font-size-md);
  --seg-color: var(--color-semantic-functional-text-primary);
  --seg-on-bg: var(--color-semantic-functional-text-primary);
  --seg-on-color: var(--color-semantic-functional-background-primary);
  --ring-w: var(--dimension-border-width-semantic-focus-ring);
  --ring-offset: 0px;
  --grow: 1;
  --glow-opacity: 0;
  --glow-blur: 12px;
  --glow-color: var(--color-semantic-focus-outline);
  --dur-seg: 150ms;
  --ease-seg: cubic-bezier(0.2, 0, 0, 1);
  --dur-content: 150ms;
  --ease-content: cubic-bezier(0.2, 0, 0, 1);
  --dur-focus: 150ms;
  --ease-focus: cubic-bezier(0.2, 0, 0, 1);
}
.sc .card { position: relative; display: flex; flex-direction: column; width: var(--dimension-size-semantic-content-card-width); padding: var(--inset); border-radius: var(--radius); background: var(--card-bg); overflow: hidden; color: var(--color-semantic-functional-text-primary); }
.sc .art { position: absolute; inset: 0; display: block; background: radial-gradient(circle at var(--art-x) var(--art-y), var(--art-glow), transparent var(--art-reach)), linear-gradient(180deg, var(--art-top), var(--art-bottom)); }
.sc .mount { position: absolute; left: 0; right: 0; bottom: var(--mount-bottom); height: var(--mount-height); display: block; background: var(--mount-color); clip-path: polygon(0 100%, 0 78%, 22% 62%, 38% 70%, 52% 30%, 60% 28%, 70% 52%, 84% 60%, 100% 72%, 100% 100%); }
.sc .scrim { position: absolute; inset: 0; display: block; background: var(--gradient-complementary-dark); opacity: var(--scrim-opacity); }
.sc .body { position: relative; display: flex; flex-direction: column; gap: var(--body-gap); padding-top: var(--body-top); }
.sc .title { margin: 0; color: var(--title-color); font-size: var(--title-size); line-height: var(--title-lh); letter-spacing: var(--title-ls); text-wrap: balance; }
.sc .info { display: flex; flex-direction: column; gap: var(--info-gap); }
.sc .when { display: flex; align-items: center; gap: var(--when-gap); }
.sc .time { display: grid; color: var(--time-color); font-size: var(--time-size); font-variant-numeric: tabular-nums; }
.sc .rating { display: flex; align-items: center; justify-content: center; width: var(--rating-box); box-sizing: content-box; padding: var(--rating-pad); border: var(--rating-border) solid var(--color-semantic-functional-border-default); border-radius: var(--rating-radius); color: var(--rating-color); font-size: var(--rating-size); }
.sc .state { display: grid; color: var(--color-semantic-functional-text-muted); font-size: var(--state-size); font-variant-numeric: tabular-nums; }
.sc .state-line { display: flex; align-items: center; gap: var(--state-gap); }
.sc .state-key { color: var(--state-key-color); font-size: var(--state-size); }
.sc .dot { display: block; flex: none; width: var(--dot-size); height: var(--dot-size); border-radius: var(--dimension-radius-core-full); background: var(--dot-color); }

/* Estados do conteúdo: as duas versões ficam empilhadas na mesma célula; o estado mostra uma e esconde a outra. */
.sc .v { grid-area: 1 / 1; opacity: 0; visibility: hidden; transition-property: opacity, visibility; transition-duration: var(--dur-content); transition-timing-function: var(--ease-content); }
.sc[data-state="agora"] .v-agora,
.sc[data-state="mais-tarde"] .v-mais-tarde { opacity: 1; visibility: visible; }

.sc .seg-bar { display: flex; gap: var(--bar-gap); padding: var(--bar-pad); border-radius: var(--bar-radius); background: var(--color-opacity-light-20); }
.sc .seg { position: relative; isolation: isolate; flex: 1; display: flex; align-items: center; justify-content: center; height: var(--seg-height); border-radius: var(--seg-radius); color: var(--seg-color); font-size: var(--seg-size); transition-property: background-color, color, transform; transition-duration: var(--dur-seg), var(--dur-seg), var(--dur-focus); transition-timing-function: var(--ease-seg), var(--ease-seg), var(--ease-focus); }
.sc[data-state="agora"] .seg-now,
.sc[data-state="mais-tarde"] .seg-later { background: var(--seg-on-bg); color: var(--seg-on-color); }

/* Foco: o anel e o brilho existem sempre no segmento e só aparecem no selecionado, com o card em foco. */
.sc .seg::after { content: ''; position: absolute; inset: calc(var(--ring-offset) * -1); border-radius: inherit; padding: var(--ring-w); background: var(--gradient-semantic-focus-ring); mask: linear-gradient(var(--color-semantic-focus-outline) 0 0) content-box exclude, linear-gradient(var(--color-semantic-focus-outline) 0 0); pointer-events: none; opacity: 0; transition-property: opacity; transition-duration: var(--dur-focus); transition-timing-function: var(--ease-focus); }
.sc .seg::before { content: ''; position: absolute; inset: 0; z-index: -1; border-radius: inherit; background: var(--glow-color); filter: blur(var(--glow-blur)); pointer-events: none; opacity: 0; transition-property: opacity; transition-duration: var(--dur-focus); transition-timing-function: var(--ease-focus); }
.sc[data-state="agora"]:is([data-focused], :focus) .seg-now,
.sc[data-state="mais-tarde"]:is([data-focused], :focus) .seg-later { transform: scale(var(--grow)); }
.sc[data-state="agora"]:is([data-focused], :focus) .seg-now::after,
.sc[data-state="mais-tarde"]:is([data-focused], :focus) .seg-later::after { opacity: 1; }
.sc[data-state="agora"]:is([data-focused], :focus) .seg-now::before,
.sc[data-state="mais-tarde"]:is([data-focused], :focus) .seg-later::before { opacity: var(--glow-opacity); }

/* Movimento reduzido: sem escala; o anel de foco continua e as trocas viram só opacidade e cor. */
@media (prefers-reduced-motion: reduce) {
  .sc[data-state="agora"]:is([data-focused], :focus) .seg-now,
  .sc[data-state="mais-tarde"]:is([data-focused], :focus) .seg-later { transform: none; }
  .sc .seg { transition-property: background-color, color; transition-duration: var(--dur-seg); transition-timing-function: var(--ease-seg); }
}
`

type Estado = 'agora' | 'mais-tarde'
const ORDEM: Estado[] = ['agora', 'mais-tarde']

export interface SeletorCardProps {
  interactionState?: 'default' | 'focus'
}

/**
 * @exploration pompeia-seletor-card#3
 * @proposal
 * why: o ContentCard do kit não tem um seletor segmentado que troca o conteúdo do card inteiro (Agora / Mais tarde) sobre uma imagem fixa
 * description: card de programação com imagem ao fundo, título, horário, classificação indicativa, estado (Ao vivo / Reprise) e um seletor segmentado; as setas esquerda e direita trocam o estado; as demais teclas seguem para o sistema (Voltar, cima e baixo)
 * proposedApi:
 *   interactionState: "'default' | 'focus'"
 */
export function SeletorCard({ interactionState = 'default' }: SeletorCardProps) {
  const [estado, setEstado] = useState<Estado>('agora')
  const focused = interactionState === 'focus'
  const cartao = useRef<HTMLDivElement>(null)
  // O foco de nível entrega o teclado ao card: as setas esquerda e direita só chegam a ele com o foco do navegador.
  useEffect(() => {
    if (focused) cartao.current?.focus()
  }, [focused])

  const irPara = (posicao: number): boolean => {
    if (posicao < 0 || posicao >= ORDEM.length) return false
    setEstado(ORDEM[posicao])
    return true
  }
  // Só esquerda e direita são do card, e só quando mudam o estado: nas pontas, e em qualquer outra tecla, o sistema segue como de costume.
  const aoTeclar = (e: KeyboardEvent<HTMLDivElement>) => {
    const atual = ORDEM.indexOf(estado)
    const passo = e.key === 'ArrowLeft' ? -1 : e.key === 'ArrowRight' ? 1 : 0
    if (passo !== 0 && irPara(atual + passo)) e.preventDefault()
  }

  return (
    <div ref={cartao} className="sc" data-state={estado} data-focused={focused ? '' : undefined} tabIndex={0} onKeyDown={aoTeclar}>
      <style>{CSS}</style>
      <div className="card">
        <span className="art" aria-hidden="true">
          <span className="mount" />
          <span className="scrim" />
        </span>
        <div className="body">
          <h2 className="title text-heading-3-bold">
            Os Últimos
            <br />
            Dias de Pompeia
          </h2>
          <div className="info" aria-live="polite">
            <div className="when">
              <span className="time text-body-sm-bold">
                <span className="v v-agora">20h30 – 22h50</span>
                <span className="v v-mais-tarde">01h10 – 03h30</span>
              </span>
              <span className="rating text-body-sm-bold" aria-label="Classificação indicativa 14 anos">
                14
              </span>
            </div>
            <div className="state text-body-sm-medium">
              <span className="v v-agora state-line">
                <span className="dot" aria-hidden="true" />
                <span>
                  <span className="state-key text-body-sm-bold">Ao vivo</span> · restam 28 min
                </span>
              </span>
              <span className="v v-mais-tarde state-line">
                <span>
                  <span className="state-key text-body-sm-bold">Reprise</span>
                </span>
              </span>
            </div>
          </div>
          <div className="seg-bar" role="tablist" aria-label="Quando assistir">
            <div className="seg seg-now text-body-sm-bold" role="tab" aria-selected={estado === 'agora'}>
              Agora
            </div>
            <div className="seg seg-later text-body-sm-bold" role="tab" aria-selected={estado === 'mais-tarde'}>
              Mais tarde
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
