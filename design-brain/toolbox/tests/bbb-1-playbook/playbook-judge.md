# Juiz: bbb-1-playbook

Fatos medidos:
- `check-explore-tokens.mjs`: ok, com 2 avisos (opção 1: `width: 168px` equivale ao token `notification-text-width`; `height: 160px` equivale a `card-expanded-height`; o script pede `var(--dimension-size-semantic-<nome>)`).
- `check-explore-layout.mjs`: ok.
- Servidor (`explore:serve`): a página renderiza estilizada (tokens.css, inter.css 200). Só `../../../src/styles/global.css` dá 404 (conhecido e inofensivo). Nada mais linkado dá 404. Servidor que eu subi foi parado.
- Medido no navegador: os 4 cards têm 288px de largura (`content-card-width`) e alturas de 378, 189, 371 e 400px (teto do Content Card: 456px). Menor fonte dentro de cada card: 14px. Nenhum elemento com `cursor: pointer`, `tabindex`, `a` ou `button`. Nenhum handler de tecla, hover, animação ou transição no card.

Interação nas 4 opções: nenhuma (só visual), como o brief pede. Não há padrão de catálogo a contar, e ↑/↓ passam (nada é capturado).

## Opção 1: Foto como contexto
Mais perto de: bom (uma tese, a foto é a isca e o nome ancora sobre ela, respiro generoso, estalecas e emojis como apoio curto embaixo).
Padrão de interação: nenhum (só visual)
| Nível | Elemento | Regra ou token | Valor documentado | Encontrado |
| --- | --- | --- | --- | --- |
| Warning | Escrim sobre a foto (`.scrim`) | Cor, preto puro / escrim (playbook seção 3 e judge.md); token compatível `--gradient-complementary-dark` (#34343C00 a #17161B) | sem preto puro; escrim com `gradient-complementary-dark` | usa `--gradient-semantic-overlay-bottom` (termina em #000000E6). O composto sobre a foto (light-10 sobre #3F3F3F) fica em torno de #080808 (calculado, não medido na tela): quase preto, mas não #000000. Existe token compatível |
| Warning | Estalecas (`.coins`, 14px bold) | Hierarquia / proximidade (seção 3) | estalecas é o 2º dado na prioridade | o número tem o mesmo peso e tamanho das contagens de emoji (14px bold); o 2º dado não se distingue dos emojis (3º) |
| Note | `.head` 76px, `.body` 168px x 160px, foto 264px | Tokens de tamanho do kit | `var(--dimension-size-semantic-*)` | px soltos na silhueta do espaço reservado; o script avisa 168 e 160 |

## Opção 2: Estalecas em destaque
Mais perto de: bom (o card mais enxuto, 189px; uma tese clara, o número em 28px é o primeiro, muito respiro, nada disputa).
Padrão de interação: nenhum (só visual)
| Nível | Elemento | Regra ou token | Valor documentado | Encontrado |
| --- | --- | --- | --- | --- |
| Note | Número `3.250` (28px bold) maior que o nome (14px bold) | Status mais alto que o conteúdo (judge.md, round 4) | o conteúdo é o protagonista | a tese do brief pede estalecas como âncora, então é deslocamento justificado; o nome fica pequeno ao lado da foto, mas ainda legível (14px) |
| Note | Foto 56px redonda com ícone de 40px | Respiro / tamanhos | tokens `icon-2xl` usado | ok; a foto é pequena para "quem é" (prioridade 1 do brief), por escolha da tese |

Sem aparência web, sem falsa affordance, sem peça solta, sem quebra de linha ruim (nome em 1 linha), caixa em frase.

## Opção 3: Ficha em dois grupos
Mais perto de: bom (dois grupos separados só pelo espaço, nome em 28px como âncora, respiro bom), com um deslize de olhar web nos emojis.
Padrão de interação: nenhum (só visual)
| Nível | Elemento | Regra ou token | Valor documentado | Encontrado |
| --- | --- | --- | --- | --- |
| Warning | Fileira de 4 blocos de emoji (`.emoji`, fundo `light-10`, raio `md`, 4 colunas) | Falsa affordance (judge.md): o que parece clicável sem tecla | nada deve parecer botão, pílula ou aba | os blocos preenchidos em fileira horizontal parecem chips/botões de seleção; nenhuma tecla os alcança (o brief proíbe isso) |
| Warning | Estalecas (`.estalecas`, 16px bold) | Hierarquia (seção 3) | estalecas é o 2º dado | é menor que o nome (28px) e quase igual aos emojis (24px glifo); o 2º dado fica fraco, perto dos blocos de emoji |
| Note | Foto 148px fixo | Tokens de tamanho | `var(--dimension-size-semantic-*)` | px solto |

Sem quebra de linha ruim, sem caixa alta indevida.

## Opção 4: Emojis como protagonista
Mais perto de: claustrofóbico em parte (o card mais denso: título "Emojis recebidos", quatro blocos grandes em 2x2 e ainda a linha de estalecas, 400px de 456px; os blocos pesam mais que o resto).
Padrão de interação: nenhum (só visual)
| Nível | Elemento | Regra ou token | Valor documentado | Encontrado |
| --- | --- | --- | --- | --- |
| Warning | Estalecas (`.coins`, 14px bold) no fim do card | Peça solta (judge.md) | cada peça pertence a um grupo | fica sozinha embaixo, fora do grupo de identidade e do grupo de emojis, e é a peça mais fraca embora o brief a trate como dado principal |
| Warning | Blocos de emoji 2x2 (`.cell`, `light-10`, raio `lg`) | Falsa affordance (judge.md) | nada deve parecer botão ou cartão escolhível | quatro blocos preenchidos, do tamanho de botões, lembram uma grade de escolha; nenhuma tecla os alcança |
| Note | Contagens (28px bold) maiores que o nome (14px bold) | Status mais alto que o conteúdo | o conteúdo é o protagonista | justificado pela tese (a reação do público é o assunto); o nome e a foto ficam pequenos (foto 56px) |
| Warning | Respiro | Respiro (seção 3) | "claustrofóbico" é rejeição | o card usa 400px dos 456px possíveis, quatro blocos com gap de `2xs` e pouca folga entre o título "Emojis recebidos", os blocos e a linha de estalecas |
| Note | `.head` 20px / `.shoulders` 36x22 / foto 56px, `top`/`left` em px | Tokens de tamanho | `var(--dimension-size-semantic-*)` | px soltos na silhueta |

## Resumo
Nenhuma opção carrega Critical. Warnings: opção 1 (escrim com token quase preto e estalecas fraca), opção 3 (blocos de emoji com cara de botão, estalecas fraca), opção 4 (estalecas solta, blocos com cara de botão, pouco respiro). A opção 2 só tem Notes.
