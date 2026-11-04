# Schedule card live · título longo

**Pedido (nas palavras do designer):** Go into the storybook and grab the interactivity card variation with the live tag. Generate 4 different composition options, use long program names so we can stress test it.

**Para quê e onde:** Fileira da grade (Schedule) na home — escolher o que está no ar.

**Intenção:** Legível sob stress de título longo; evitar truncar feio ou empilhar demais; sensação premium/editorial com arte dominante.

**Foco:** Nome do programa (título longo). Em segundo plano: horário (overline), badge AO VIVO, arte/poster.

**Direção visual:**
- Tom: poster no canto · temperatura: neutra — o campo é escuro, a arte abre no canto superior direito e a única cor com função é o estado ao vivo
- Fio condutor: o nome longo é a âncora, em 2 linhas e cortado no que passar, sobre um poster que cobre o cartão inteiro com a imagem no canto superior direito e o scrim do kit livrando o bloco de texto.
- Referência principal: UI Kit / Interactivity Button, story Poster (live) · teoria confirmada: poster a 100% do cartão (208×160 no foco) com um gradiente por cima e o assunto enquadrado no canto superior direito; o nome para em 2 linhas (~40 caracteres na largura útil, ~160px) e o que passa corta; a razão 16px bold contra 12px bold fica de fora.
- Levar: poster a 100% do cartão, `object-position` no canto superior direito, scrim do kit mais fechado do lado do texto e aberto na direção da imagem — a imagem é a massa do canto, o nome continua a âncora do grupo destaque.
- Levar: título em `.text-body-md-bold`, `text-wrap: balance`, no máximo 2 linhas; o corte cai no fim da 2ª linha, em fronteira de palavra (~40 caracteres).
- Levar: horário em `.text-footnote-medium` com `--color-semantic-functional-text-muted`, e a pílula AO VIVO do kit na mesma faixa, no eixo esquerdo, com inset `--dimension-spacing-semantic-card-inset`. Vão entre o título e essa faixa: `--dimension-spacing-core-sm`. Vão dentro da faixa: `--dimension-spacing-core-3xs`.
- Evitar: título e horário os dois em bold, 16px e 12px, com vão de 4px.
- Evitar: terceira linha, ou reticências no meio da palavra.
- Evitar: assunto centrado por baixo do texto, poster que encolhe para uma faixa, ou um gradiente que não seja o scrim do kit.
- Palavras do designer: "Arte em tela cheia mas com um gradient por cima e a imagem posicionada no canto superior direito…", "título quase não se separa do horário", "poster 100%; ~40 caracteres / 2 linhas; o que passar corta", "Nome longo em 2 linhas"
- Inegociável: título que não se separa do horário (os dois bold, 16px contra 12px) ou que passa de 2 linhas.
- Teste de fidelidade: o título está em no máximo 2 linhas, em bold e mais pesado que o horário, e o assunto do poster está no canto superior direito com o scrim sobre o bloco de texto?
- Distância por opção: 1 fiel · 2 reinterpretada · 3 reinterpretada · 4 contraponto (inverte a imagem no canto: o assunto volta ao centro e encontra o texto; o nome segue em 2 linhas)
- Conflito anotado: corte ~40 chars pede `.text-body-md-bold` (16px), não `.text-heading-3-bold` (28px).

**Controle:** ←/→ mudam de card na fileira; Enter abre o programa; Voltar sai da fileira. Padrão único do brief: **Fileira de escolha** — as opções diferem pela estrutura, não pelo padrão.

**Estados:** `Suposição` — focus, selected, default (como no Interactivity Button); arte some/dimme fora do foco.

**Conteúdo:** `Suposição` — fileira de 3 cards schedule com nomes longos, ex.:
- "A Grande Conquista do Sertão Nordestino em Tempo Real"
- "Jornal Nacional Especial: Cobertura Completa das Eleições"
- "Big Brother Brasil — A Eliminação Mais Esperada da Temporada"
- Overline: `20:30 – 21:45` · live: true · poster do kit (`extra-info-oscar.png` ou equivalente)

**O que varia:** composição (posição do bloco de texto vs massa da arte, empilhamento do apoio horário+AO VIVO, peso tipográfico dentro do fio). Fica igual: superfície Card, live tag, título ≤2 linhas, object-position canto superior direito (exceto opção 4), Fileira de escolha, tokens do kit.

**Superfície:** Card

---

## Opção 1 — Faixa baixa + massa no canto (fiel)

- **Tese:** O nome ancora na faixa inferior sobre o scrim; a arte em 100% só aparece como âncora visual no canto superior direito.
- **Foco em cena:** tamanho/peso do título; espaço da faixa livre acima; posição canto-inferior-esquerdo do grupo; massa da imagem no canto oposto. Recua: horário muted + pílula na mesma linha.
- **Referência:** `cidade-foto-com-seletor` — imagem ponta a ponta; texto só na faixa calma com véu.
- **Interação:** Fileira de escolha — ←/→ entre cards; Enter escolhe/abre; Voltar sai.
- **Peças:** poster full-bleed; título 2 linhas; faixa horário+AO VIVO; FocusRing no card focado.
- **Regras:** `tipografia-de-detalhe`, `esqueleto-fixo`

## Opção 2 — Zona limpa tipográfica + arte como textura (reinterpretada)

- **Tese:** Separar zonas: bloco tipográfico limpo para o nome; o resto do cartão é só massa de arte (canto superior direito), sem disputa.
- **Foco em cena:** posição (zona limpa dedicada); contraste do texto na zona; espaço entre zona e arte; massa da arte na zona oposta. Recua: meta numa linha quieta.
- **Referência:** `cartazes-tipograficos` — zonas separadas texto vs textura; eixo esquerdo único.
- **Interação:** Fileira de escolha (mesmo padrão; estrutura em zonas).
- **Peças:** zona limpa do título; poster na zona de textura; horário+AO VIVO no eixo do título; FocusRing.
- **Regras:** `tipografia-de-detalhe`, `esqueleto-fixo`

## Opção 3 — Âncora tipográfica empilhada (reinterpretada)

- **Tese:** O título é o dado-âncora dominante na pilha; horário e AO VIVO formam um único grupo de apoio abaixo; a arte permanece full-bleed no canto sem roubar o olhar.
- **Foco em cena:** tamanho do título vs apoio; proximidade do grupo âncora; posição de partida do olho; contraste cheio só no nome. Recua: meta + arte.
- **Referência:** `cartoes-contexto-evento-voz-clima-voo` — um âncora gigante; resto em apoio agrupado por espaço.
- **Interação:** Fileira de escolha (mesmo padrão; hierarquia por âncora/apoio).
- **Peças:** título âncora; grupo apoio (hora + live); poster full-bleed; FocusRing.
- **Regras:** `tipografia-de-detalhe`, `esqueleto-fixo`

## Opção 4 — Assunto ao centro encontra o texto (contraponto)

- **Tese:** Inverte o canto: o assunto do poster volta ao centro óptico e encontra o bloco tipográfico; o nome segue em 2 linhas.
- **Foco em cena:** posição central da massa; contraste do título sobre scrim; espaço ao redor do encontro arte/texto; peso do nome. Recua: meta numa linha.
- **Referência:** `cartoes-de-humor-gradiente` — molde fixo; texto ancorado; centro como zona ativa (aqui, o assunto).
- **Interação:** Fileira de escolha (mesmo padrão; contrapõe o enquadramento).
- **Peças:** poster com assunto centrado; scrim sob o texto; título 2 linhas; horário+AO VIVO; FocusRing.
- **Regras:** `tipografia-de-detalhe`, `esqueleto-fixo`
