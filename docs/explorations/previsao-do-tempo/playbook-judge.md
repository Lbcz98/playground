# Juiz: previsao-do-tempo

Fatos medidos:
- `check-explore-tokens.mjs`: ok, com 6 avisos (advisory) de tamanho literal que o kit já nomeia: `width/height: 64px` (opção 1, ícone do clima, `channel-bug`), `96px` e `72px` (opção 4, sóis, `alert-bug` e `round-button-circle`). Nenhuma cor ou token fora do kit.
- `check-explore-layout.mjs`: ok.

Medido no código-fonte, sem renderizar: nenhum texto resolve para branco ou preto puro (`text-primary` = #EEEEEE, `background-primary` = #191919, card = #3F3F3F, `text-muted` = #FFFFFFB3, translúcido: não medido, no máximo Nota). Nenhum chevron, seta ou caret desenhado. Nenhuma opção chama `preventDefault` em ↑/↓. Nenhum hover dentro de um card (o hover do cabeçalho da página, `.view-toggle`, não faz parte do card).

## Opção 1: Trilho de dias
Mais perto de: bom (um número, um ícone calmo, uma frase e uma fileira; o vazio fica no meio do card; o dia escolhido inverte a cor como pede DESIGN §2.5).
Padrão de interação: Trilho de passos (←/→ move o dia, Enter abre sensação e umidade no lugar da frase, Voltar recolhe)

| Nível | Elemento | Regra ou token | Valor documentado | Encontrado |
| --- | --- | --- | --- | --- |
| Critical | Nomes dos dias do trilho ("Seg" a "Dom"), `.day-name` | Playbook §3 tipo, DESIGN §3.3: 12px só em rótulo secundário que não carrega decisão | 14px (`.text-body-sm-medium`) para o que identifica o item escolhido | `.text-footnote-medium` (12px); o rótulo diz qual dia está sendo escolhido |
| Warning | Temperatura atual `.temp` | DESIGN §2.1: âncora com pelo menos 3x o apoio quando é número curto | 3x de 14px = 42px | `.text-heading-3-bold` = 28px, 2x do apoio de 14px |
| Warning | Ícone `.glyph` | DESIGN §3.1 e kit de tamanhos | `var(--dimension-size-semantic-*)` | `64px` literal (aviso do script); o ícone fica maior que o número, atenuado em `text-muted`, o que ameniza |
| Note | Rótulos "Sensação" e "Umidade", `.pair-label` | DESIGN §3.3, rótulo secundário com o valor ao lado | `.text-footnote-*` permitido | 12px, sem decisão: permitido |
| Note | Ponto entre local e "Agora", `.dot` | DESIGN §7.2, círculo de 4px em `text-muted` | 4px | 4px literal, igual ao documentado |

## Opção 2: Curva ou barras do dia
Mais perto de: bom, no limite (um número fixo e um gráfico; mas o card junta local, número, tag, ícone, valor, gráfico, 7 horas e legenda de duas chaves, mais peças que as outras; ainda sem 2 padrões de interação, e a área livre do brief fica mais curta).
Padrão de interação: Alternar visão (←/→ percorre as horas, Enter troca curva e barras, Voltar volta às barras e depois à hora atual)

| Nível | Elemento | Regra ou token | Valor documentado | Encontrado |
| --- | --- | --- | --- | --- |
| Critical | Horas do eixo ("09h" a "21h"), `.hour` | DESIGN §3.3: 12px só em rótulo que não carrega decisão | 14px (`.text-body-sm-medium`) | `.text-footnote-medium` / `.text-footnote-bold` (12px); são o rótulo do item que ←/→ percorre |
| Warning | Temperatura atual `.temp` | DESIGN §2.1 | 3x do apoio (42px) | 28px (2x de 14px) |
| Warning | Número da hora escolhida, `.value-text` | DESIGN §2.1 (uma âncora por card) | uma âncora só | 14px bold acima do gráfico, ao lado de um 28px: dois números de dados, mas em tamanhos bem diferentes, então a âncora segue clara |
| Note | Transição de opacidade entre curva e barras | Playbook §3, movimento: dissolve simples | só dissolve | `opacity` com `ease-out`: é dissolve, funciona sem a transição |

## Opção 3: Detalhe sob demanda
Mais perto de: bom com o card fechado (número enorme, ícone, três linhas de uma palavra; é o mais vazio do conjunto); aberto, tende ao claustrofóbico (linha aberta traz valor, frase, 5 colunas com 10 rótulos de 12px, e as outras duas linhas continuam abaixo).
Padrão de interação: Expandir no lugar (←/→ move entre as linhas, Enter abre ou recolhe, Voltar recolhe)

| Nível | Elemento | Regra ou token | Valor documentado | Encontrado |
| --- | --- | --- | --- | --- |
| Critical | Valores da série, `.val` (22°, 25°, 26°...) | Playbook §3: mínimo de 14px para conteúdo; DESIGN §3.3 | 14px (`.text-body-sm-*`) | `.text-footnote-medium` (12px), em dado que é o conteúdo da linha, não rótulo |
| Warning | Linhas empilhadas na vertical enquanto ←/→ move entre elas | Axis mismatch (judge §4); DESIGN §7.6: itens que ←/→ movem ficam lado a lado | fileira horizontal | coluna de 3 linhas, foco muda com ←/→ |
| Warning | Linhas recolhidas que se abrem, sem seta desenhada | Disclosure look (judge §4) | a pista na TV é o anel de foco e a peça que cresce | a lista recolhida se abre como um acordeão; sem chevron, o anel e o crescimento fazem o papel. Fica como Warning; o designer decide se a lista de linhas é o aspecto vetado |
| Warning | Anel de foco `.row[data-focus]::after` | Playbook §3: estados foco, padrão, selecionado distintos | anel só com o card focado | sem `:focus` no seletor: o anel fica sempre desenhado, também com o card sem foco |
| Warning | Temperatura `.temp` | DESIGN §3.1: sem tamanhos inventados | `.text-*` do kit | `calc(var(--typography-font-size-3xl) * 2.5)` = 70px; o ícone também é calculado (`icon-2xl * 1.6`) |
| Note | Rótulos de hora das colunas, `.hour` | DESIGN §3.3 | 12px permitido em rótulo secundário | 12px, sem decisão (a coluna não é escolhida) |

## Opção 4: Paisagem por segmento
Mais perto de: bom (imagem como isca, três linhas de dados embaixo, seletor; é a estrutura do cartão seletor salvo; a paisagem dá o vazio visual que o brief pede).
Padrão de interação: Seletor segmentado (←/→ troca o segmento na hora, Enter não faz nada, Voltar volta a "Agora")

| Nível | Elemento | Regra ou token | Valor documentado | Encontrado |
| --- | --- | --- | --- | --- |
| Warning | Anel de foco `.o4-opt[aria-checked="true"]::after` | Playbook §3: foco distinto de selecionado | anel só com o card focado | sem `:focus` no seletor: o anel fica sempre desenhado; foco e escolhido se confundem |
| Warning | Temperatura `.o4-value` | DESIGN §2.1 | 3x do apoio (42px) | 28px (2x de 14px) |
| Warning | Segmentos "Hoje" e "Semana" | Brief: a temperatura atual é a âncora e fica igual | temperatura atual em todas as vistas | a âncora vira média (22°, 23°) e some a sensação e a umidade fora de "Agora"; a legenda `Média de...` avisa a troca |
| Note | Legenda `.o4-label` ("Parcialmente nublado", "Média de hoje, 09h às 21h") | DESIGN §3.3 | 12px permitido em rótulo secundário | 12px; qualifica o número mas não carrega decisão |
| Note | Disco do sol `.o4-sun`, `--gradient-primary-tarde` | DESIGN §4.3 e §5: gradiente de tema como identidade de conteúdo, como está | `--gradient-primary-*` sem alteração | usa o gradiente do kit sem alterar, mas a cor de "tarde" aparece em "Agora" sem marcar a hora do dia; 96px e 72px literais (aviso do script) |
| Note | Segmentos não escolhidos | DESIGN §3.2: opções não escolhidas ficam em regular | `.text-body-sm-regular` | `.text-body-sm-medium` |

## Resumo
- Opção 1: Critical, nomes dos dias em 12px (rótulo que identifica o item escolhido).
- Opção 2: Critical, horas do eixo em 12px (rótulo do item que ←/→ percorre).
- Opção 3: Critical, valores da série em 12px (conteúdo, não rótulo); o formato de lista recolhida na vertical entra como Warning.
- Opção 4: sem Critical; maior nível Warning (anel de foco sempre visível, âncora com 2x em vez de 3x).

---

# Juiz, rodada nova ("Mais opções"): opções 9, 10, 11 e 12

Escopo: só as opções 9 a 12. As opções 1 a 8 não foram julgadas aqui; as linhas de `check-explore-layout.mjs` sobre elas (itens, anel, svg, eixo) ficam de fora deste bloco. O brief só descreve as opções 1 a 4; para 9 a 12 usei a tese escrita nos comentários do HTML como alegação, não como evidência.

Fatos medidos:
- `check-explore-tokens.mjs`: ok. Os avisos de tamanho literal (64px, 96px, 72px) são das opções 1 e 4; o `64px` de `.sky` na opção 11 também é um tamanho que o kit nomeia (`--dimension-size-semantic-<nome>`).
- `check-explore-layout.mjs`: nenhuma linha para as opções 9, 10, 11 e 12 (sem itens demais, anel com folga, sem svg de ícone, sem eixo trocado). Conferi a folga do anel à mão: opção 9 coluna com 8px em volta; opção 10 segmento com 40px de altura e uns 10px de cada lado do texto; opção 11 telha com 12px por 8px; opção 12 dia com 12px por 8px. Todas chegam a anel (4) + 4.
- Cores: nenhum branco ou preto puro. Texto `#EEEEEE`, mudo `#FFFFFFB3` sobre `#3F3F3F` (6,1:1), selecionado `#191919` sobre `#EEEEEE`.

## Opção 9: Quatro horas, duas formas
Mais perto de: bom (um número grande, quatro colunas lado a lado e muito respiro; a legenda de baixo é a parte mais cheia, mas ainda arejada)
Padrão de interação: Alternar visão (←/→ percorre as 4 horas, Enter troca curva e barras)
| Nível | Elemento | Regra ou token | Valor documentado | Encontrado |
| --- | --- | --- | --- | --- |
| Warning | Anel da coluna (`.col[data-selected]::after`) | DESIGN §9.1, §9.4 (foco e repouso são estados diferentes); as opções 1, 2 e 10 só mostram o anel com `:focus` no card | O anel aparece só quando o card tem o foco | O anel fica sempre ligado na coluna escolhida, com o card focado ou não. O estado "repouso" não existe e, numa tela com vários cards, parece haver mais de um foco |
| Warning | Linha da curva e barras sem foco (`--color-opacity-light-30`, traço de `border-width-core-thin`) | DESIGN §4.6 (nada de elemento sutil que some em TV que esmaga sombras) | Elemento que carrega dado legível a 3 m | Barra e linha a 30% de branco sobre `#3F3F3F` dão cerca de 2,4:1; a linha tem 1px. Os pontos a 50% dão cerca de 4:1. As três horas fora de foco quase somem |
| Warning | Legenda (ícone, "24°", "Agora", "Curva") | Princípios 3 e proximidade; DESIGN §12.10 (dado decorativo) | Cada peça com uma função | "Agora" e "24°" repetem o rótulo da primeira coluna e o número grande do topo; a legenda reúne 4 peças pequenas numa linha |
| Note | Nome da visão "Curva" / "Barras" (`.text-footnote-medium`, 12px) | DESIGN §3.3 | 12px só em rótulo secundário sem decisão | 12px num rótulo que só nomeia a visão atual: permitido |
| Note | Voltar (`Escape`/`Backspace`) | `--teclas`: Voltar volta à primeira visão e, no estado inicial, sai do card | Volta à visão inicial (curva, primeira hora) | Volta à primeira hora, mas deixa a visão em "barras"; com a hora 0 sai do card sem restaurar a curva |
| Note | Desenho da curva (`<svg class="line">`, 44×96) | Playbook §3 "Ícones são PNG" | Gráfico não é ícone e pode ficar inline | Aceito como gráfico; os ícones do clima são PNG com `mask-image`, no neutro do kit |

## Opção 10: Três momentos
Mais perto de: bom (um só padrão, uma imagem como isca, informação em cima e seletor embaixo, respiro generoso; é a mais próxima de `pompeia-seletor-card`)
Padrão de interação: Seletor segmentado (←/→ troca o segmento na hora, Enter não faz nada)
| Nível | Elemento | Regra ou token | Valor documentado | Encontrado |
| --- | --- | --- | --- | --- |
| Warning | Voltar (`Escape`/`Backspace`, `show(0)` seguido de `preventDefault`) | `--teclas`: "No estado inicial, sai do card" | Voltar no segmento inicial deixa o card passar | Voltar é sempre consumido, até em "Agora"; o card nunca é deixado por Voltar |
| Warning | Ícone do clima (`assets/o10-*.png`, 144px) | DESIGN §4.1 (uma cor de marca, o resto neutro); §4.3 (cor do conteúdo só como arte); brief ("evitar ícones genéricos de app de clima") | Arte do conteúdo, sem segundo matiz como identidade | Nuvem azul e sol laranja com degradê, o visual padrão de app de clima. Pode ser lido como arte (§4.3), mas é o contrário do que o brief pediu |
| Note | `.scene` com `144px` fixo | DESIGN §12.4 (tamanho fora do kit) | Tamanho do kit, `--dimension-size-semantic-*` | 144px literal; o kit não tem um tamanho que sirva. Decisão do designer |
| Note | Frases dos segmentos | Princípio "Seletor que não muda o conteúdo" | O conteúdo inteiro muda junto | Muda, mas só "Agora" mostra sensação e umidade; "Hoje" e "Amanhã" mostram a média. Dados diferentes por segmento: coerente, só vale confirmar |

## Opção 11: Expandir no lugar
Mais perto de: bom (número grande, ícone e três palavras quietas; os detalhes só aparecem quando se pede; muito respiro)
Padrão de interação: Expandir no lugar (←/→ move entre as três peças lado a lado, Enter abre e fecha, Voltar recolhe e depois volta à primeira peça). Sem seta nem chevron; a peça aberta é a única invertida.
| Nível | Elemento | Regra ou token | Valor documentado | Encontrado |
| --- | --- | --- | --- | --- |
| Warning | Anel da peça (`.tile.is-focus::after`) | DESIGN §9.1, §9.4; as opções 1, 2 e 10 ligam o anel só com `:focus` | O anel aparece só quando o card tem o foco | O anel fica sempre ligado numa peça, sem depender do foco do card |
| Warning | Ícone do clima (`assets/o11-cloud-sun.png`, 64px) | DESIGN §4.1, §4.3; brief ("evitar ícones genéricos de app de clima") | Arte do conteúdo, sem segundo matiz como identidade | Nuvem azul e sol laranja com degradê, o visual padrão de app de clima |
| Note | `.sky` com `64px` literal | DESIGN §12.4; aviso do `check-explore-tokens` | `var(--dimension-size-semantic-<nome>)` | `width` e `height` de 64px literais; o kit já nomeia 64px |
| Note | Peça aberta com o foco em outra peça | Princípio "Seletor que não muda o conteúdo" | O estado escolhido e a informação mostrada não se contradizem sem pista | O detalhe mostrado é o da peça invertida, não o da peça com anel; a pista é visível (fundo invertido), então não é achado |

## Opção 12: Trilho de passos
Mais perto de: bom (local, número grande e ícone na mesma linha, quatro casas iguais, uma frase; respiro e hierarquia claros)
Padrão de interação: Trilho de passos (←/→ move entre Hoje e os 3 dias seguintes, Enter abre sensação e umidade do dia no lugar da frase, Voltar fecha e, em repouso, sai do card). Quatro itens: dentro do limite de 4.
| Nível | Elemento | Regra ou token | Valor documentado | Encontrado |
| --- | --- | --- | --- | --- |
| Warning | Anel do dia (`.o12-day[aria-current="true"]::after`) | DESIGN §9.1, §9.4; as opções 1, 2 e 10 ligam o anel só com `:focus` | O anel aparece só quando o card tem o foco | O anel fica sempre ligado no dia escolhido; sem estado de repouso |
| Warning | Ícone do clima (`assets/o12-*.png`, 40px) | DESIGN §4.1, §4.3; brief ("evitar ícones genéricos de app de clima") | Arte do conteúdo, sem segundo matiz como identidade | Nuvem azul e sol laranja com degradê, o visual padrão de app de clima |
| Note | Grau do dia no trilho ("24°", "26°"...) e número grande | Princípio de elementos por card; DESIGN §12.10 | Cada peça com uma função | O número grande repete o grau do dia escolhido a cada passo; a repetição é pequena e faz parte do padrão |

## Resumo
- Opção 9: nenhum Critical; 3 Warnings (anel sempre ligado, curva e barras fora de foco a cerca de 2,4:1, legenda repetida) e 2 Notes. Mais perto de "bom".
- Opção 10: nenhum Critical; 2 Warnings (Voltar nunca sai do card, ícone colorido de app de clima) e 2 Notes. Mais perto de "bom".
- Opção 11: nenhum Critical; 2 Warnings (anel sempre ligado, ícone colorido de app de clima) e 2 Notes. Mais perto de "bom".
- Opção 12: nenhum Critical; 2 Warnings (anel sempre ligado, ícone colorido de app de clima) e 1 Note. Mais perto de "bom".

---

# Juiz, rodada "Mais opções" mais nova: opções 13, 14, 15 e 16

Escopo: só as opções 13 a 16. Ignorei as outras, as cópias ajustáveis (`data-tuned`) e a opção oculta 8. Cada uma foi comparada com a antiga que substitui (13 com a 1, 14 e 16 com a 2, 15 com a 4). As teses nos comentários do HTML são alegação, não evidência.

Fatos medidos:
- `check-explore-tokens.mjs`: ok (só avisos de tamanho literal das opções 1 e 4).
- `check-explore-layout.mjs`: nenhuma linha para 13, 14, 15 e 16 (sem itens demais, anel com folga, sem svg de ícone, sem eixo trocado). As linhas que sobram são das opções 1 a 4. Como a página não está `ok`, o `--shots` do layout não roda; usei o mesmo `shoot` do `explore-page.mjs` só nas opções 13 a 16 e li os PNGs.
- Folga do anel, medida: opção 13 dia com 14px nos lados e 12px em cima e embaixo; opção 15 segmento com 15px nos lados e 10px em cima; opção 16 anel de 56px por 157px, pontos a 22px, texto da hora a 6px da borda de baixo (caixa de linha; o glifo fica mais longe).
- Cores: nenhum branco ou preto puro. Texto `#EEEEEE`, mudo sobre `#3F3F3F`.
- Os ícones de máscara PNG da opção 13 não aparecem quando a página abre por `file://` (o Chromium bloqueia `mask` de arquivo local), que é como o script de capturas abre; abrindo por http aparecem. Julguei a 13 pela captura por http.

## Opção 13: Trilho de 4 dias (substitui a 1)
Mais perto de: bom (um número grande, ícone do clima grande, trilho de 4 casas, uma frase; é a opção 1 sem os 3 dias a mais, com a mesma composição)
Padrão de interação: Trilho de passos (←/→ move entre Hoje e os 3 dias seguintes, Enter abre sensação e umidade no lugar da frase, Voltar fecha e, em repouso, deixa o card)
Comparação com a opção 1: não é mais pobre. Mantém o ícone grande no canto, o local junto do número, os mini-ícones por dia e a frase. O anel passou a ter folga (a 1 tinha 2px). Perdeu só os dias de sexta a domingo, que era o objetivo.
| Nível | Elemento | Regra ou token | Valor documentado | Encontrado |
| --- | --- | --- | --- | --- |
| Warning | Frase (`.o13-sum`, "Média de 22° hoje, com nuvens e sol.") | Playbook §3 "Line breaks" (quebra depois da palavra de função) | Sem palavra curta abrindo ou fechando a linha | A segunda linha fica só com "e sol."; o "e" abre a linha e a linha tem duas palavras. `text-wrap: pretty` não resolveu |
| Warning | Nome do dia no trilho (`.o13-day-name`, `.text-footnote-medium`, 12px) | DESIGN §3.3 | 12px só em rótulo secundário sem decisão | O nome do dia é o rótulo do item que a seta escolhe, mas o cabeçalho repete o dia ("Quarta"), então o nome não leva decisão sozinho. Fica no limite; se o designer o vê como o rótulo do controle, vira Critical |
| Note | Rótulos "Sensação" e "Umidade" (`.text-footnote-medium`, 12px) | DESIGN §3.3 | 12px em rótulo secundário | Permitido; os valores estão em 14px bold |
| Note | Glifo `64px` fixo (`.o13-glyph`) | DESIGN §12.4; aviso do `check-explore-tokens` | `var(--dimension-size-semantic-<nome>)` | 64px literal; o kit já nomeia 64px |
| Note | Anel só com o card focado (`[data-option="13"]:focus`) | DESIGN §9.1 | Foco e repouso diferentes | Correto; melhor que as opções 9, 11 e 12, que deixavam o anel sempre ligado |

## Opção 14: Curva do dia, só leitura (substitui a 2, junto com a 16)
Mais perto de: bom (número grande, uma curva inteira e legível, legenda curta, muito respiro; quase tudo é neutro)
Padrão de interação: nenhum. É só leitura: o card não tem `tabindex`, nenhuma tecla é tratada e Enter e ←/→ não fazem nada. Não infringe a lei de um padrão por card; o ponto é outro (linha abaixo).
Comparação com a opção 2: o gráfico não ficou mais pobre. A curva está inteira (4 rótulos no eixo, 09h, 13h, 17h, 21h, em vez de 7), com área, média tracejada, marca de agora e marca de sensação, e o desenho é mais alto que o da 2. O que ela perdeu é interação: a 2 trocava curva e barras e percorria as horas; a 14 não deixa o espectador fazer nada, e só a hora de agora tem número na tela. Por isso é mais pobre no que o brief pede (controle ←/→ e Enter).
| Nível | Elemento | Regra ou token | Valor documentado | Encontrado |
| --- | --- | --- | --- | --- |
| Warning | Card inteiro sem controle | Brief ("Controle: interativo. ←/→ navega pelos dias/horas, Enter abre o detalhe; Voltar recolhe"); playbook anti-padrão 12 (dado decorativo sem ligação com a intenção); "Reduce items, not richness" | Interação do brief mantida ao reduzir itens | A 14 tira o controle em vez de só reduzir as horas. Sem tecla, o espectador não lê 17h ou 21h além da curva; os valores (18°, 26°, 19°) só estão no `aria-label` do SVG |
| Warning | Linha de queda do agora (`.o14-drop`, `--color-opacity-light-30`, 1px) | DESIGN §4.6 / §5.3 (nada sutil que some em TV que esmaga sombras) | Elemento que carrega informação legível a 3 m | 30% de branco sobre `#3F3F3F`, cerca de 2,4:1; a hora de agora é marcada também pelo ponto e pelo "13h" em bold, então a linha é reforço |
| Note | Horas do eixo (`.text-footnote-medium`, 12px) e "13h" em bold | DESIGN §3.3 | 12px só em rótulo sem decisão | Sem controle, o rótulo não carrega decisão: permitido. Na 16 as mesmas horas estão em 14px |
| Note | Ícone do clima (máscara PNG em data URI, 48px do kit) | Playbook §3 "Ícones são PNG" | PNG ou máscara | Atende; neutro do kit, sem cor de app de clima |
| Note | Média tracejada e anel de sensação no desenho | DESIGN §4.5 (série de uma cor) | Uma cor, legenda explica | Tudo em neutro; a legenda diz o que cada marca é |

## Opção 15: Paisagem por segmento (substitui a 4)
Mais perto de: bom (uma imagem como isca, informação e seletor embaixo, uma interação, respiro generoso; fica entre `pompeia-seletor-card` e a opção 4)
Padrão de interação: Seletor segmentado (←/→ troca o segmento na hora; Enter não faz nada)
Comparação com a opção 4: não é mais pobre. Mantém as três paisagens (nuvem e sol, arco do sol, chuva na quinta) com o mesmo peso, e melhora o agrupamento: local, número, legenda e detalhes ficam num só grupo logo acima do seletor, e o nome do local deixou de brigar com o sol, como na 4. O anel do segmento tem folga (15px nos lados, 10px em cima), a 4 tinha 7px.
| Nível | Elemento | Regra ou token | Valor documentado | Encontrado |
| --- | --- | --- | --- | --- |
| Warning | Voltar (`Escape` e `Backspace` com `show(0)` e `preventDefault`) | `--teclas`: "No estado inicial, sai do card" | Voltar no segmento inicial deixa o card passar | Voltar é sempre consumido, até em "Agora"; o card nunca é deixado por Voltar (a opção 10 tinha o mesmo defeito) |
| Note | Legenda do número (`.o15-label`, `.text-footnote-medium`, 12px: "Parcialmente nublado", "Média de hoje") | DESIGN §3.3 | 12px só em rótulo sem decisão | Permitido; o número ao lado diz o essencial |
| Note | Sol com `--gradient-primary-tarde` | DESIGN §4.3, §5.3 | Gradiente temático do kit, como identidade do conteúdo | Atende; não marca foco nem seleção. Sem scrim, e não precisa: nenhum texto fica sobre a imagem |
| Note | Sol com `96px` e `72px` literais | DESIGN §12.4; aviso do `check-explore-tokens` | `var(--dimension-size-semantic-<nome>)` | O kit já nomeia 96px e 72px |

## Opção 16: Marcador na curva do dia (substitui a 2, junto com a 14)
Mais perto de: bom (um número grande, curva inteira, um marcador que muda uma leitura ao lado; a parte de baixo, legenda mais gráfico, é a mais cheia, mas arejada)
Padrão de interação: Alternar visão (←/→ percorre as 4 horas, Enter troca curva e barras; Voltar volta às barras para a curva, depois à hora de agora e, no estado inicial, deixa o card). O "marcador" é só o item que o gráfico percorre; não é o padrão "Marcador em escala", que o catálogo reserva a valor ajustável.
Comparação com a opção 2: não é mais pobre; é mais rica em quase tudo. Curva inteira (4 horas, rótulos em 14px em vez de 12px), marcador com linha e ponta, ícone do clima que muda com a hora (nuvem, sol, lua), leitura "hora, grau e frase" ao lado, as duas visões (curva e barras) e a legenda média e sensação. Ganhou também o ring que cabe na coluna.
| Nível | Elemento | Regra ou token | Valor documentado | Encontrado |
| --- | --- | --- | --- | --- |
| Warning | Leitura da hora ao lado do agora (`.o16-read`: "Agora 24°" ao lado de "24° agora") | Playbook §3 (proximidade, poucos elementos); anti-padrão 12 | Cada peça com uma função | Na hora de agora o card diz o mesmo dado duas vezes, lado a lado, com dois pesos diferentes. Só passa a ter função quando o marcador sai de agora |
| Warning | Frase da hora (`.o16-phrase`, "Noite limpa e fresca") | Playbook §3 "Line breaks" | Sem palavra solta numa linha | Quebra em "Noite limpa e / fresca": "fresca" fica sozinha na segunda linha e o "e" fecha a primeira. Também acontece com "Manhã fresca, céu claro" e "Nuvens e vento leve" se a coluna estreitar |
| Warning | Linha do marcador (`.o16-marker-line`, `--color-opacity-light-30`, 1px) e barras fora de foco | DESIGN §4.6 | Elemento legível a 3 m | Cerca de 2,4:1 sobre `#3F3F3F`; a ponta do marcador e o rótulo em bold carregam o foco, então a linha é reforço |
| Note | Folga do anel em baixo (hora a 6px da borda) | Playbook §3 "O anel cabe no item" (anel mais 4px = 8px) | 8px de cada lado | A caixa de linha do rótulo "13h" fica a 6px da borda de baixo; o glifo do texto fica mais perto de 9px. O check de layout não aponta; medir de novo se o designer mexer no tamanho da fonte |
| Note | Ícone do clima (PNG em `<img>`, `--dimension-size-semantic-icon-2xl`) | Playbook §3 "Ícones são PNG" | PNG | Atende; neutro do kit, sem a cor de app de clima que a rodada anterior apontou |
| Note | Anel só com `:focus-within` no card | DESIGN §9.1 | Foco e repouso diferentes | Correto |

## Resumo
- Opção 13: nenhum Critical; maior nível Warning (quebra de linha "e sol." e nome do dia em 12px no limite). Mais perto de "bom"; não é mais pobre que a opção 1.
- Opção 14: nenhum Critical; maior nível Warning (só leitura, sem o controle do brief; linha de agora a 2,4:1). Mais perto de "bom"; o gráfico não é mais pobre que o da opção 2, mas a interação é.
- Opção 15: nenhum Critical; maior nível Warning (Voltar nunca deixa o card). Mais perto de "bom"; não é mais pobre que a opção 4.
- Opção 16: nenhum Critical; maior nível Warning (leitura repetida em "agora", quebra "fresca" sozinha, linha do marcador a 2,4:1). Mais perto de "bom"; não é mais pobre que a opção 2.
