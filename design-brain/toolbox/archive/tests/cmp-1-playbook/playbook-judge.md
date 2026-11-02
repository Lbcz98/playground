# Juiz: cmp-1-playbook

Fatos medidos:
- `check-explore-tokens.mjs`: ok, com 1 aviso (advisory): `height: 128px` na opção 4 (`.poster`) tem token de tamanho do kit.
- `check-explore-layout.mjs`: ok.
- Página servida pelo `explore:serve`: renderiza estilizada (tokens.css, inter.css e as fontes woff2 respondem 200). Só `../../../src/styles/global.css` dá 404 (conhecido e inofensivo). Nada mais do que a página liga falha.
- Teclado (disparado em cada opção): ↑ e ↓ não recebem `preventDefault` em nenhuma opção. Menor fonte dentro do card: 14px em todas.
- Altura do card (limite do kit 456px): 1: 378 em repouso e 456 com "Agora" aberto; 2: 391; 3: 340; 4: 369; 5: 347; 6: 329 em repouso e 385 com o detalhe aberto.
- Cores: nenhum `#FFFFFF` ou `#000000` resolvido em texto ou superfície. Os scrims `--gradient-overlay-bottom` (opções 1, 3, 4 e 5) terminam em `#000000E6`; compostos sobre a silhueta `#191919` dão cerca de `#030303` (calculado, não medido em tela). Não é preto puro: no máximo Warning.

## Opção 1: Expandir no lugar
Mais perto de: claustrofóbico (quatro faixas empilhadas de mesmo peso abaixo da imagem, título em 3 linhas, e o card chega ao teto de 456px quando abre).
Padrão de interação: Expandir no lugar (o Enter no botão "Assistir agora" só ativa; não conta como segundo padrão).
| Nível | Elemento | Regra ou token | Valor documentado | Encontrado |
| --- | --- | --- | --- | --- |
| Warning | As duas faixas "Agora 20h30 – 22h50" e "Ao vivo · restam 28 min" (aparência de abrir e fechar) | Aparência de disclosure (judge.md passo 4): o sinal na TV é o anel de foco e a peça crescer, sem seta desenhada | Sem chevron; faixa que se desdobra como acordeão | Não há seta nem caret, então não é Critical. Mas são duas faixas empilhadas com o mesmo fundo, de abertura exclusiva (abrir uma fecha a outra), e o botão "Assistir agora" tem o mesmo fundo `opacity-light-10`: tudo parece uma lista de acordeão, e a ação não se distingue das faixas. O designer decide. |
| Warning | Detalhe da faixa "Agora" (Duração, Gênero, Reprise) | Proximidade (playbook seção 3) | Cada dado fica junto do que o explica | A "Reprise 01h10 – 03h30" e o "Gênero" aparecem dentro da faixa "Agora", mas a reprise é o "mais tarde". Dado de outra visão do tempo dentro da faixa errada. |
| Warning | Anel de foco (`[data-focus]::after`) | Estados: foco, padrão, selecionado (playbook seção 3) | O anel só aparece com o card focado | O anel da primeira faixa fica desenhado o tempo todo, mesmo com o card sem foco; o estado padrão não existe visualmente. |
| Warning | Scrim da imagem `--gradient-semantic-overlay-bottom` | Cor: sem preto puro (playbook seção 3) | Token compatível: `--gradient-complementary-dark` (termina em `#17161B`) | Composto de cerca de `#030303` sobre a silhueta (calculado). Não é preto puro, então Warning. |
| Warning | Título "Os Últimos / Dias de / Pompeia" (quebra) | Quebras de título (playbook seção 3, Preferências) | A quebra fica depois da palavra de função, sem rio de espaço | Quebrou em 3 linhas com `&nbsp;` ("Os Últimos", "Dias de", "Pompeia"). O "de" fica ligado a "Dias", sem "de" no começo de linha, mas a última linha é curta e a imagem perde altura útil. Mais perto de Note que de Warning. |
| Note | Altura do card aberto | Content Card: no máximo 456px (explore-tokens.md) | ≤ 456px | 456px com "Agora" aberto: exatamente no teto, sem folga. |

## Opção 2: Seletor segmentado
Mais perto de: bom (imagem cheia como chamariz, título forte, info curta e a ação embaixo, com respiro; é a mais parecida com o card bom guardado).
Padrão de interação: Seletor segmentado.
| Nível | Elemento | Regra ou token | Valor documentado | Encontrado |
| --- | --- | --- | --- | --- |
| Note | Segmentos "Agora" e "Mais tarde" (`role="tablist"`, aparência de aba em pílula) | Aparência falsa de ação (judge.md passo 4) | Tudo que parece interativo tem uma tecla | Os dois segmentos são alcançados por ←/→ (troca na hora). O Enter não faz nada, como o catálogo diz. Sem aparência falsa. |
| Note | Troca de seção | Seletor que não muda o conteúdo (judge.md passo 4) | Depois da troca, só a informação da seção escolhida | Correto: "Mais tarde" mostra só "01h10 – 03h30" e "Reprise"; o "restam 28 min" e o ponto vermelho saem. A classificação 14 permanece por ser do filme. |
| Note | Scrim `--gradient-complementary-dark` | Cor | `#34343C00` → `#17161B` | Dentro da regra, sem preto puro. Nada a corrigir. |
| Note | Quebras de título: `<br>` fixo em "Os Últimos / Dias de Pompeia" | Quebras de título | Sem preposição começando linha | Sem problema. O `<br>` fixo não acompanha mudança de largura, mas a largura do Content Card é fixa. |

Não há Warning nem Critical nesta opção.

## Opção 3: Estado muda o card
Mais perto de: claustrofóbico (dois elementos disputam o primeiro lugar, o título de 18px e o dado âncora de 28px, mais três cores de fase).
Padrão de interação: Estado muda o card.
| Nível | Elemento | Regra ou token | Valor documentado | Encontrado |
| --- | --- | --- | --- | --- |
| Warning | Âncora "restam 28 min" / "passou 1 h 10" / "às 20h30" (`text-heading-3-bold`, 28px) contra o título (`text-body-lg-bold`, 18px) | Hierarquia: um elemento mais forte, a imagem e o título primeiro (brief, prioridade 1 e 2) | Título maior que o dado de estado | O dado de estado (28px) é maior que o título (18px): a hierarquia do brief fica invertida. |
| Warning | Dado "passou 1 h 10" e "de 2 h 20" na fase "No meio" | Dados fixos: usar exatamente os do brief, sem inventar outros | Só "1 h 52", "28 min", "20h30 – 22h50", "2 h 20" | "1 h 10" não está no brief (metade de 2 h 20): é dado inventado. |
| Warning | Ponto vermelho ao lado de "Fim" (`.name .live-dot`) | Uma cor, um significado; proximidade | O vermelho de "ao vivo" só aparece quando o filme está ao vivo | O `display: none` do ponto vale só dentro de `.caption`. O ponto em "Fim" aparece em todas as fases, inclusive em "Começou" e "No meio", dizendo "ao vivo" onde não está. |
| Warning | Barra da fase: verde (`theme-dia-dark`), laranja (`theme-tarde-dark`), vermelho (`status-live`) | Uma cor, um significado; segundo acento (playbook seção 3) | Uma cor de destaque; cor de estado só para estado | Cores de tema dia e tarde reaproveitadas como cores de fase, mais o vermelho de ao vivo: três acentos para uma barra, só um por vez, mas sem significado estável. |
| Warning | Título "Os Últimos Dias / de Pompeia" (`text-wrap: balance`) | Quebras de título (playbook seção 3, Preferências) | A quebra fica depois da palavra de função | "de" abre a segunda linha ("Os Últimos Dias / de Pompeia"). |
| Warning | Anel de foco da fase (`.seg[data-focus]`) | Estados: foco, padrão | O anel só com o card focado | Anel sempre desenhado na fase atual, mesmo sem foco no card. |
| Warning | Scrim `--gradient-semantic-overlay-bottom` | Cor: sem preto puro | Token compatível: `--gradient-complementary-dark` | Composto de cerca de `#030303` (calculado). Warning, não Critical. |
| Note | `.media height: 136px`, barra e ponto de `8px` | Tamanhos pelo token (`--dimension-*`) | Sem pixel solto | Valores soltos em px; o script de tokens não reclamou (só avisou o `128px` da opção 4). |
| Note | Fade de 1 troca (`zone[data-fresh]`) | Movimento: só dissolve; a tela funciona sem | Dissolve permitido | Dissolve com `prefers-reduced-motion` tratado; a tela funciona sem. Dentro da regra. |

## Opção 4: Alternar visão
Mais perto de: claustrofóbico (seis grupos num card: imagem, âncora de 2 linhas, cabeçalho com pontos, trilho e três células; o "28 min" aparece duas vezes).
Padrão de interação: Alternar visão.
| Nível | Elemento | Regra ou token | Valor documentado | Encontrado |
| --- | --- | --- | --- | --- |
| Warning | Pontos "••" no cabeçalho da visão (`.dots`) | Aparência falsa de ação (judge.md passo 4) | Tudo que parece interativo tem tecla; ponto de paginação sugere ←/→ trocando de página | Parecem os pontos de um carrossel, mas ←/→ movem as células e só o Enter troca a visão. Nenhuma tecla move o ponto. |
| Warning | Células (anel de foco) e Enter | Foco direto: o Enter aciona só o nó focado (playbook, "Focus and Enter") | Enter age sobre a peça focada | O anel anda pelas três células, mas o Enter não faz nada por célula: troca a visão inteira. O foco sugere uma ação da célula que não existe. |
| Warning | Trilho da visão "Horário" (`track-time`, 3 segmentos iguais: vermelho, cinza, cinza) | Anti-padrão 12: dado decorativo sem ligação com a intenção | Todo elemento visual traz um dado | Os três segmentos têm tamanho igual e nenhuma legenda os liga a início, fim e reprise: decoração. |
| Warning | Âncora "28 min" (28px) contra o título (`text-body-md-bold`, 16px) | Hierarquia (brief: imagem e título primeiro) | Título maior que o dado | Título de 16px abaixo de um "28 min" de 28px. E "28 min" repete na célula "Resta" da visão 1. |
| Warning | Anel de foco da célula | Estados: foco, padrão | Anel só com foco | Sempre desenhado, mesmo sem foco no card. |
| Warning | Scrim `--gradient-overlay-bottom` | Cor: sem preto puro | Token compatível: `--gradient-complementary-dark` | Composto muito escuro, perto de preto (calculado); Warning no máximo. |
| Note | `.poster height: 128px` | Tamanhos pelo token | `--dimension-size-semantic-*` | O script de tokens avisou o `128px`. |
| Note | Título "Os Últimos Dias de / Pompeia" (`<br>` fixo) | Quebras de título | Quebra depois da palavra de função | Certo (depois do "de"), mas deixa "Pompeia" sozinha na segunda linha. |

## Opção 5: Fileira de escolha
Mais perto de: bom (uma imagem chama, o título é o mais forte, duas escolhas do mesmo molde embaixo e uma frase curta; respiro razoável; fica atrás da opção 2 por ter mais peças).
Padrão de interação: Fileira de escolha.
| Nível | Elemento | Regra ou token | Valor documentado | Encontrado |
| --- | --- | --- | --- | --- |
| Warning | Frase de status ("Ao vivo · restam 28 min" / "Reprise · 2 h 20 de duração") | Seletor que não muda o conteúdo (judge.md passo 4): depois da escolha, só a informação da escolha | A informação mostrada segue o item escolhido | A frase segue o foco, não o escolhido. Escolher "Ver mais tarde" e depois mover o foco para "Assistir agora" mostra "Ao vivo" com "Ver mais tarde" ainda marcado. Também fica solta, abaixo da fileira, sem ligação visual com as escolhas. |
| Warning | Nomes das escolhas ("Assistir / agora", "Ver mais / tarde") | Quebras (playbook seção 3, Preferências) | Rótulo curto em uma linha; sem quebrar "mais tarde" | O `padding-right` reservado para o check nas duas faz "Assistir agora" e "Ver mais tarde" quebrarem; "Ver mais / tarde" separa "mais tarde". |
| Warning | Título "Os Últimos Dias / de Pompeia" (`text-wrap: balance`) | Quebras de título | Quebra depois da palavra de função | "de" abre a segunda linha. |
| Warning | Anel de foco (`.choice[data-focus]`) | Estados: foco, padrão | Anel só com o card focado | Anel sempre desenhado na escolha focada, mesmo com o card sem foco. |
| Warning | Scrim `--gradient-overlay-bottom` | Cor: sem preto puro | Token compatível: `--gradient-complementary-dark` | Composto de cerca de `#030303` (calculado). Warning, não Critical. |

## Opção 6: Trilho de passos
Mais perto de: claustrofóbico (o trilho junta quatro horários de 16px em negrito sem respiro, e o anel invade os vizinhos; o resto do card é calmo).
Padrão de interação: Trilho de passos (4 itens; o catálogo diz 5 a 7: fora da faixa, só uma nota).
| Nível | Elemento | Regra ou token | Valor documentado | Encontrado |
| --- | --- | --- | --- | --- |
| Warning | Trilho (`.rail`, `.step`: "20h30 22h22 22h50 01h10") com o anel (`inset: -4px`) | Respiro (playbook seção 3, "critério que mais separa o bom do ruim") | Espaço entre os itens; foco legível | Os textos de 16px quase se tocam e o anel de 4px invade a coluna vizinha e a borda do trilho. |
| Warning | Metadados "14" e "Aventura histórica" (`.meta`, no pé do card) | Elemento solto (judge.md passo 4): grupo junto do título ou sobre a imagem de propósito | Classificação e gênero em um grupo perto do título | O grupo existe, mas fica no pé, depois do trilho e do detalhe, longe do título; a classificação "14" tem fundo e borda de ficha ao lado de texto simples. |
| Warning | Estado "Ao vivo · restam 28 min" | Prioridade do brief (item 4) | O estado ao vivo visível | Só aparece depois do Enter. Em repouso o card não diz que está ao vivo (nem o ponto vermelho). |
| Warning | Anel de foco no passo selecionado (`aria-selected` + `::after`) | Estados: foco, padrão, selecionado (playbook seção 3) | Foco e selecionado diferentes | O anel é o próprio selecionado: sempre desenhado, mesmo sem foco, e foco e seleção são a mesma aparência. |
| Warning | Scrim `--gradient-complementary-dark` e título `<br>` | Cor; quebras | Compatíveis | Scrim dentro da regra. Título "Os Últimos Dias de / Pompeia" quebra depois do "de" (certo), com "Pompeia" sozinha. |
| Note | Detalhe de "Reprise" ("Reprise às 01h10" e "01h10 – 03h30") | Cada peça diz uma coisa só | Sem repetição | As duas linhas repetem o mesmo horário. |
| Note | Seleção sem efeito antes do Enter | Seletor que não muda o conteúdo | A seleção muda o conteúdo | Antes do Enter, ←/→ só movem o realce; o conteúdo só muda depois. Previsto no catálogo ("Enter abre o detalhe"). |
| Note | 4 itens no trilho | Catálogo: 5 a 7 itens do mesmo tipo | 5 a 7 | Quatro itens, e de tipos diferentes (início, agora, fim, reprise). |

## Resumo
Nenhuma opção tem Critical. Sem ↑/↓ consumidos, sem segundo padrão de interação, sem interação só de web, sem fonte abaixo de 14px, sem preto ou branco puro.
- Opção 1: maior nível Warning (aparência de acordeão sem seta, dado da reprise na faixa errada, anel sempre desenhado).
- Opção 2: sem Warning; só Notes.
- Opção 3: maior nível Warning (âncora maior que o título, dado inventado "1 h 10", ponto vermelho em "Fim" em todas as fases).
- Opção 4: maior nível Warning (pontos que parecem paginação, Enter que não age na célula focada, trilho decorativo).
- Opção 5: maior nível Warning (frase segue o foco e não o escolhido, quebra de rótulos).
- Opção 6: maior nível Warning (trilho sem respiro, metadados soltos no pé, estado ao vivo escondido).
