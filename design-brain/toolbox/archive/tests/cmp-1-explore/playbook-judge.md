# Juiz: cmp-1-explore

Fatos medidos:
- `check-explore-tokens.mjs`: ok, com 3 avisos de tamanho (`min-height: 176px` perto de `notification-text-width`, `height: 64px` = `channel-bug`, `height: 120px` perto de `card-height`). Os avisos citam as opções 1 e 4.
- `check-explore-layout.mjs`: ok.
- Servidor (`explore:serve`): a página responde 200 e renderiza estilizada (tokens, Inter). Único 404: `/src/styles/global.css`, o conhecido e inofensivo. Nenhum outro link falha. Servidor encerrado.
- Medido no navegador: texto mínimo no card 12px (opções 2 a 5) e 10px (opção 6); `text-inverse` resolve para `#000000`; texto principal `#EEEEEE`; texto suave `#FFFFFFB3` sobre `#3F3F3F`; os 6 cards têm 288px (`content-card-width`).

Falhas repetidas nas 6 opções (aparecem em cada tabela, só uma vez aqui):
- Quebra do título: todas quebram "Os Últimos Dias / de Pompeia". O "de" abre a segunda linha; a regra (seção 3, preferências) pede a quebra depois da palavra de função, com "de" preso à palavra a que se liga. Warning.
- Capitalização: títulos e rótulos estão em sentence case. Sem achado.

## Opção 1: Expandir no lugar
Mais perto de: bom, com ressalva (uma imagem chama, o título é o mais forte, o resto é pouco; mas 4 peças empilhadas, duas com fundo de botão, apertam o card: 365px de altura, a mais alta do conjunto depois da opção 2).
Padrão de interação: Expandir no lugar. O Enter na peça "Entrar agora" liga e desliga "Entrando"; é a ativação padrão da peça, não conta como segundo padrão (suposição do `judge.md`, a confirmar).
| Nível | Elemento | Regra ou token | Valor documentado | Encontrado |
| --- | --- | --- | --- | --- |
| Critical | Setas nas linhas "20h30 – 22h50" e "Ao vivo · restam 28 min" (`.chev`, gira 180° ao abrir) | Olhar de disclosure (`judge.md`, passo 4): na TV a pista é o anel de foco e a peça crescendo, não uma seta desenhada | sem chevron | chevron de 16px nas duas linhas, com rotação |
| Critical | Texto do `rating` "14" | Tipo mínimo 14px (seção 3); `body-sm` (14px) é o token que cumpre | ≥ 14px | 12px (`text-footnote-bold`) |
| Critical | Texto da peça "Entrar agora" ao ser escolhida (`.go[data-selected]`) | Sem preto puro (seção 3); `background-primary` (`#191919`) é o token que cumpre | não `#000000` | `text-inverse` = `#000000` sobre `#EEEEEE` |
| Warning | Linhas que abrem têm fundo de botão (`light-10`) e a imagem também é uma peça; 4 peças alcançáveis por ←/→ no card | Respiro, elementos por card (seção 3) | poucos elementos, uma peça forte | 4 peças, 2 com cara de linha de lista |
| Warning | Título "Os Últimos Dias / de Pompeia" (28px, 2 linhas) | Quebra do título (seção 3, preferências) | quebra depois de "de" | "de" abre a segunda linha |
| Note | `.vol` (silhueta) com `height: 64px` e `.media` aberta com `min-height: 176px` | check-explore-tokens | usar token de tamanho | valores soltos, avisados pelo script |

## Opção 2: Seletor segmentado
Mais perto de: bom (imagem de fundo com título no alto, uma peça de controle, respiro generoso; a imagem toma o card inteiro).
Padrão de interação: Seletor segmentado (←/→ troca o segmento, Enter não faz nada). Os rótulos "Agora" e "Mais tarde" são tabs de verdade: ←/→ os alcança. Sem falsa affordance.
| Nível | Elemento | Regra ou token | Valor documentado | Encontrado |
| --- | --- | --- | --- | --- |
| Critical | Segmento selecionado "Agora" / "Mais tarde" (`.seg[aria-selected]`) | Sem preto puro (seção 3); `background-primary` | não `#000000` | `text-inverse` = `#000000` sobre `#EEEEEE`, visível em repouso |
| Critical | `.state-text` "Ao vivo · restam 28 min", `.extra` "Duração 2 h 20", `rating` "14" | Tipo mínimo 14px; `body-sm` | ≥ 14px | 12px (`footnote`) |
| Warning | `.image` com `gradient-semantic-overlay-bottom` (90% preto no fim) sobre `#414FFD` | Preto puro e gradiente sutil (seção 3); o scrim é translúcido | composto não medido | fundo escurece quase a preto atrás do texto de 12px; não medido |
| Warning | Título com `padding-bottom` de 6xl + 4xl (faixa vazia de ~218px) | Respiro com intenção; proximidade | espaço serve ao conteúdo | faixa de imagem criada por padding no `h3`; o título parece solto no alto, longe das informações |
| Warning | Título "Os Últimos Dias / de Pompeia" (24px) | Quebra do título | quebra depois de "de" | "de" abre a segunda linha |
| Note | O seletor tem o anel do kit desenhado sempre, mesmo sem foco no card | Estados: foco, padrão | anel só com foco | anel fixo na barra |
| Note | "Mais tarde" mostra "Reprise" sem horário-resumo de gênero; Gênero ausente do card | Prioridade do brief | gênero fica fora (metadado longo) | consistente com a prioridade; só registro |

Seletor que não troca o conteúdo: não há. Ao trocar, estado, barra/duração e horário mudam e o resto fica fixo (título, classificação), como deve.

## Opção 3: Estado muda o card
Mais perto de: bom (um chamariz, uma zona que muda, metadados agrupados).
Padrão de interação: Estado muda o card (←/→ percorre as fases, Enter nada). A fase "Quase no fim" é a atual; → não passa dela.
| Nível | Elemento | Regra ou token | Valor documentado | Encontrado |
| --- | --- | --- | --- | --- |
| Critical | `.o3-support` "Ao vivo · são 22h22", `.o3-genre` "Aventura histórica" | Tipo mínimo 14px; `body-sm` | ≥ 14px | 12px (`footnote-medium`) |
| Warning | Cor da fase (`--o3-phase`): verde `#00E879`, amarelo `#E7C300`, laranja `#ED6001` na barra e no ponto | Uma cor, um significado; segundo acento | uma cor de destaque por vez com um sentido | 3 cores diferentes ao longo das fases; o significado (início, meio, fim) é só pela cor e pelo número de segmentos |
| Warning | Título "Os Últimos Dias / de Pompeia" (20px) | Quebra do título | quebra depois de "de" | "de" abre a segunda linha |
| Note | Fases "Começou" e "No meio" mostram "restam 2 h 20", "restam 1 h 10" e "Metade do filme · 21h40" | Brief: dados fixos, sem inventar outros | só os dados do brief | 1 h 10 e 21h40 são derivados e não estão no brief |
| Note | Reprise (01h10 – 03h30) e horário completo (20h30 – 22h50) não aparecem em nenhuma fase | Brief: dados fixos | dado presente ou justificado | ausentes |
| Note | Anel do kit só com foco do teclado no card (`:focus-visible`); as outras opções desenham o anel sempre | Estados | anel só com foco | consistente com a regra; as outras é que desviam |

Rating "14" e gênero formam um grupo de metadados junto (`.o3-meta`). Sem peça solta. Sem preto puro (a montanha usa `background-primary`, `#191919`).

## Opção 4: Alternar visão
Mais perto de: claustrofóbico, em parte (5 blocos em coluna: pôster, "Ao vivo", "Restam 28 min" a 28px, gráfico com itens e uma linha de rodapé; o número se repete).
Padrão de interação: Alternar visão (←/→ percorre os itens, Enter troca a visão).
| Nível | Elemento | Regra ou token | Valor documentado | Encontrado |
| --- | --- | --- | --- | --- |
| Critical | "Tempo" selecionado (`.opt-view[aria-current]`) | Sem preto puro; `background-primary` | não `#000000` | `text-inverse` = `#000000` sobre `#EEEEEE`, visível em repouso |
| Critical | `.live`, `.k` (Passou, Restam, Início, Agora, Fim), `.opt-view` | Tipo mínimo 14px; `body-sm` | ≥ 14px | 12px (`footnote`) |
| Warning | "Tempo / Horário" (`.views`: pílula com a visão atual invertida) | Falsa affordance (`judge.md`, passo 4) | cada controle com uma tecla | parece um seletor segmentado, mas ←/→ move o foco entre os itens do gráfico e o Enter alterna as duas visões; nenhuma tecla leva ao rótulo. Quem foca é "Passou", "Restam" ou "Início" |
| Warning | Itens "Passou" / "Restam" / "Início" / "Agora" / "Fim" com anel de foco | Falsa affordance: o foco indica algo que age | foco só no que age | o foco anda por itens que não fazem nada por si; o Enter age sobre a visão, não sobre o item focado (viola "Enter age sobre a peça focada") |
| Warning | "Restam 28 min" (28px) e o item "Restam / 28 min" | Contraste e hierarquia; "dado decorativo" (anti-padrão 12) | cada dado uma vez | o mesmo dado duas vezes na visão Tempo |
| Warning | `rating` "14" no rodapé ao lado de "Tempo / Horário" | Peça solta (`judge.md`, passo 4) | metadados agrupados junto ao título ou sobre a imagem | a classificação divide o rodapé com um seletor sem relação |
| Warning | Título "Os Últimos Dias / de Pompeia" (20px) | Quebra do título | quebra depois de "de" | "de" abre a segunda linha |
| Note | Reprise (01h10 – 03h30) e gênero ausentes | Brief: dados fixos | presentes ou justificados | ausentes |
| Note | `height: 64px` e `120px` avisados pelo script | check-explore-tokens | token de tamanho | valores soltos |

Seletor que não troca o conteúdo: não há; a troca mostra só a visão escolhida (`display` por `data-view`).

## Opção 5: Fileira de escolha
Mais perto de: bom (um chamariz, duas escolhas iguais, foco e escolhido com aparências diferentes), mas os cartões são estreitos e quebram o texto.
Padrão de interação: Fileira de escolha (←/→ move o foco, Enter escolhe).
| Nível | Elemento | Regra ou token | Valor documentado | Encontrado |
| --- | --- | --- | --- | --- |
| Critical | Cartão escolhido (`.choice[aria-checked]`) | Sem preto puro; `background-primary` | não `#000000` | `text-inverse` = `#000000` sobre `#EEEEEE` depois do Enter |
| Critical | `.live` (e `.live-tag`), `.choice-time` | Tipo mínimo 14px; `body-sm` | ≥ 14px | 12px (`footnote`) |
| Warning | Rótulos "Assistir agora" e "Ver mais tarde" nos cartões de 112px | Quebra de linha | quebra após a palavra de função, sem palavra solta | "Assistir / agora" e "Ver mais / tarde": "tarde" sozinha na segunda linha |
| Warning | "Ao vivo · restam 28 min" entre o pôster e os cartões | Proximidade | o estado fica com a escolha a que pertence ("Assistir agora") | linha solta, sem grupo com o cartão "agora"; tem 12px |
| Warning | Título "Os Últimos Dias / de Pompeia" (24px) | Quebra do título | quebra depois de "de" | "de" abre a segunda linha |
| Note | Anel do foco e fundo invertido com check do escolhido são linguagens diferentes | Estados: foco, selecionado | foco e selecionado distintos | cumpre; só registro |
| Note | O `rating` fica sobre a imagem (pílula escura no canto), de propósito | Peça solta | permitido sobre a imagem | ok |

## Opção 6: Trilho de passos
Mais perto de: bom (imagem com título e classificação sobre ela, um trilho, um detalhe; é a mais baixa, 306px). Com ressalva de que o trilho tem só 2 casas.
Padrão de interação: Trilho de passos (←/→ move a seleção, Enter abre o detalhe no lugar). O catálogo descreve 5 a 7 itens; com 2 vira, na tela, o mesmo seletor da opção 2.
| Nível | Elemento | Regra ou token | Valor documentado | Encontrado |
| --- | --- | --- | --- | --- |
| Critical | `.when` "Agora" / "Mais tarde" (`text-caption`) | Tipo mínimo 14px; `body-sm`. Fora da escala de 14px do designer | ≥ 14px | 10px |
| Critical | `.genre` "Aventura histórica", `.rating` "14" | Tipo mínimo 14px; `body-sm` | ≥ 14px | 12px (`footnote`) |
| Critical | Casa selecionada (`.house[aria-selected]`) com "Agora" e "20h30" | Sem preto puro; `background-primary` | não `#000000` | `text-inverse` = `#000000` sobre `#EEEEEE`, visível em repouso |
| Warning | `.rating` em pílula sobre a imagem, no canto oposto ao título e ao gênero | Peça solta | no grupo ou sobre a imagem de propósito | sobre a imagem; o escuro a 60% é translúcido (não medido) e o canto fica longe de título e gênero |
| Warning | Título "Os Últimos Dias / de Pompeia" (24px) | Quebra do título | quebra depois de "de" | "de" abre a segunda linha |
| Note | O Enter mostra o detalhe completo e cresce o card; ←/→ fecha o detalhe | Trilho de passos: Enter abre o detalhe do item | conforme catálogo | cumpre |

Seletor que não troca o conteúdo: não há; o detalhe acompanha a casa selecionada e fecha ao trocar.

## Resumo
- Opção 1 carrega Critical: olhar de disclosure (chevrons nas duas linhas), texto de 12px, preto puro na peça escolhida.
- Opção 2 carrega Critical: preto puro no segmento selecionado, texto de 12px.
- Opção 3 carrega Critical: texto de 12px. Sem preto puro.
- Opção 4 carrega Critical: preto puro em "Tempo", texto de 12px; também as falsas affordances e a peça solta.
- Opção 5 carrega Critical: preto puro no cartão escolhido, texto de 12px.
- Opção 6 carrega Critical: texto de 10px e 12px, preto puro na casa selecionada.
- Nenhuma opção tem ↑/↓ consumidas, hover ou mais de um padrão de interação.
- Kit contra playbook: a escala do kit tem `footnote` (12px) e `caption` (10px), mas há `body-sm` (14px) compatível, então os 12px e 10px são Critical, não Note. O `text-inverse` do kit é `#000000`; o token `background-primary` (`#191919`) cumpre, então o preto puro é Critical.
