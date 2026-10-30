# Juiz: bug-interativo

Fatos medidos: `check-explore-tokens.mjs`: ok. `check-explore-layout.mjs`: ok.

## Opção 1: Bug interativo
Mais perto de: bom (um só elemento, uma só ideia, muito respiro em volta; texto em duas linhas numa tonalidade só, sem nada disputando com o Bug). Não é um card: é um elemento flutuante sobre vídeo, então a comparação é de densidade e hierarquia, não de estrutura.
Padrão de interação: nenhum (só animação; sem teclas, sem foco, sem `preventDefault`; ↑/↓ passam). Não há nada a alcançar por tecla e nada com aparência interativa (sem seta, sublinhado, botão ou pílula). O toggle grade/lista da página tem hover, mas é a moldura da exploração e fica oculto com uma opção só; não entra no julgamento.

| Nível | Elemento | Regra ou token | Valor documentado | Encontrado |
| --- | --- | --- | --- | --- |
| Warning | Halo (`.bug-halo-spin`) | Brief: "o giro do halo não pode parecer spinner" (playbook seção 3, intenção; anti-padrão 12, dado/efeito decorativo não ligado à intenção) | Giro lento, sem cara de carregando | `conic-gradient` com cauda que desvanece e vão transparente de 30° (330° a 360°), girando em `linear` infinito. É a anatomia clássica de um spinner. Atenuantes: a máscara radial o torna um disco suave, não um anel, e uma volta leva 12000ms (`--motion-semantic-focus-cycle-duration`). Julgado só pelo código; não medido em tela. |
| Warning | Halo, cores | Princípio "uma cor, um significado" / sem disputa de ênfase (seção 3, anti-padrão 2) | Cores do Bug | Quatro matizes no halo (azul `#414FFD`, verde `#00E879`, amarelo `#E7C300`, laranja `#ED6001`), todos tokens `theme-*`. O brief os autoriza como as cores do Bug; o aviso é só que o halo é a peça mais colorida do quadro e compete com o Bug no peso visual. |
| Note | Entrada e giro (subida do texto 16px, crescimento do halo, giro contínuo) | Lei de movimento: só dissolve (seção 3) | Dissolve simples | Subida, crescimento e giro vão além do dissolve. O movimento foi pedido pelo designer no brief (800ms, texto sobe, halo cresce, giro contínuo), então a lei foi dobrada por pedido, não por escolha da opção. Com `prefers-reduced-motion` a opção cai em dissolve e o giro some: a tela funciona sem animação. |
| Note | Halo, margem de segurança | Área segura 40 lateral / 32 em cima e embaixo (seção 3) | Bug a 40/32 | O Bug está a `--dimension-spacing-core-2xl` (40) e `-xl` (32). O halo final (`alert-bug-transmission`, 128px) passa 16px do Bug, então a borda dele fica a 24px da lateral e 16px de baixo. É o tamanho do próprio kit e a borda é máscara que vai a transparente; não medi o brilho visível. Kit vs playbook: o designer decide se a margem vale para o Bug ou para o halo. |
| Note | Texto "CONTEÚDO / INTERATIVO" | Sentence case em títulos e rótulos (seção 3, preferências) | Maiúscula só onde o nome pede | Caixa alta por `text-transform` e `<br>` fixo. O brief pede caixa alta em duas linhas. Quebra depois de "CONTEÚDO", sem palavra curta pendurada. Tamanho 16px (`text-body-md-bold`), dentro da escala e acima de 14px. |
| Note | Easing `--bug-ease` | Usar tokens do kit, sem inventar valores (seção 3, tipo e escala) | `--motion-semantic-easing` (mola damping 15, stiffness 56, massa 1) | A mola foi reescrita à mão como `linear(...)` de 25 pontos, normalizada para 800ms. Não há token CSS que a entregue pronta; confere com os números do kit, mas não foi medida. A duração usa `--motion-semantic-duration` (800ms). |
| Note | Quadro de apoio (`.stage`) | Tokens de dimensão (seção 3) | Valores do kit | A altura `192px` é literal, sem token. É só o palco escuro para o Bug aparecer; a largura usa `content-card-width` (288px). O fundo (`#191919` com véu `#FFFFFF1A`) não é preto nem branco puro. |
| Note | Animação de `width`/`height` do halo | Movimento simples (seção 3) | — | O halo anima `width`/`height` em vez de `transform: scale`. Não quebra regra do playbook; só registro, porque muda layout a cada quadro numa TV de baixo desempenho. |

## Resumo
Opção 1: sem Critical. O maior nível é Warning (halo com cara de spinner; peso das quatro cores do halo). Conjunto mais perto: bom.
