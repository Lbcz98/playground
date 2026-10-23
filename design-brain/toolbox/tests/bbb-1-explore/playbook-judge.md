# Juiz: bbb-1-explore

Fatos medidos:
- `check-explore-tokens.mjs`: ok. Três avisos (advisory): `height: 200px` perto de `card-expanded-width` (208px, opção 1, o vão da foto); `width: 72px` e `height: 72px` coincidem com `round-button-circle` (opção 3, a foto).
- `check-explore-layout.mjs`: ok.
- Servidor de exploração: a página renderiza estilizada (tokens.css e inter.css 200). O único 404 é o `../../../../src/styles/global.css`, conhecido e inofensivo. Nada do que a página liga dá 404 além dele.
- Medido no navegador: os 4 cards têm 288px de largura (`content-card-width`) e 378, 207, 286 e 380px de altura (todos abaixo de 456px). Os 4 nomes ficam em 1 linha. Nenhum elemento do card tem `cursor: pointer`.

Interação, valendo para as 4 opções: nenhum `tabindex`, botão, link, `onclick`, ouvinte de tecla, hover, animação ou transição dentro do card. O único script da página é o alternador grade/lista da moldura da exploração, fora do card. ↑/↓ passam (nada chama `preventDefault`). Isso cumpre o pedido (card só visual, sem foco). Enter ativar o card inteiro não é padrão e não é achado.

Menor fonte e cores, vistos na fonte (kit: `.text-footnote-*` = 12px; `.text-body-sm-*` = 14px, que existe e cumpre o mínimo): ver a primeira linha de cada tabela. Nenhuma opção usa branco ou preto puros: texto `#EEEEEE`, rótulos `text-muted` (`#FFFFFFB3`, translúcido, composto sobre `#3F3F3F` dá cerca de `#C5C5C5`), fundo `#3F3F3F`. Nenhuma cor de destaque, só neutros.

## Opção 1: Foto como contexto
Mais perto de: bom (uma foto cheia como isca, informação junto no pé sobre o gradiente, nome como elemento mais forte, respiro generoso em cima; a informação agrupada na borda inferior de uma foto cheia não é claustrofobia).
Padrão de interação: nenhum (só visual, como pedido).
| Nível | Elemento | Regra ou token | Valor documentado | Encontrado |
| --- | --- | --- | --- | --- |
| Crítico | Idade "27 anos", rótulo "estalecas" e contagens dos emojis (12, 7, 5, 3) | Tipo mínimo 14px; `text-body-sm-*` cumpre | 14px ou mais | `text-footnote-medium` e `text-footnote-bold` = 12px, escolhidos havendo `text-body-sm-medium` (14px) |
| Aviso | Fileira de 4 emojis com contagem (`.emoji`) | Falsa affordance: aspecto de pílula/botão que nenhuma tecla alcança | Nada deve parecer clicável | Fundo claro `opacity-light-10`, raio `sm`, em fileira, como chips; sem tecla que os alcance |
| Aviso | "3.250 estalecas" (`.coins`) | Hierarquia: 2ª prioridade fraca | Dado de 2º lugar deve ler antes do apoio | 14px bold com rótulo de 12px, do mesmo peso que a idade; as pílulas de emoji (maiores, com fundo) chamam mais que as estalecas |
| Nota | Gradiente `gradient-semantic-overlay-bottom` sobre a foto | Pior caso de preto | Aprovado pelo designer na rodada 5 | Translúcido (`#000000E6` no pé); composição sobre a foto não medida; não é achado em si |
| Nota | `.zone` com `height: 200px` | Tamanho fora do kit | Usar `var(--dimension-size-semantic-*)` se for o mesmo tamanho | 200px fixo, perto de `card-expanded-width` (208px); é só um vão para a foto |

Sem quebra de linha ruim (nome numa linha), sem maiúscula indevida, sem peça solta (nome, idade, estalecas e emojis formam uma pilha só).

## Opção 2: Estalecas em destaque
Mais perto de: bom (um número-herói claro, respiro de 16px entre três grupos, card baixo e calmo; apenas o conjunto de pílulas de emoji pesa).
Padrão de interação: nenhum (só visual, como pedido).
| Nível | Elemento | Regra ou token | Valor documentado | Encontrado |
| --- | --- | --- | --- | --- |
| Crítico | Idade "27 anos" e rótulo "Estalecas" | Tipo mínimo 14px; `text-body-sm-*` cumpre | 14px ou mais | `text-footnote-medium` = 12px, havendo `text-body-sm-medium` (14px) |
| Aviso | Fileira de 4 emojis com contagem (`.emoji`, 4 pílulas de largura igual) | Falsa affordance: aspecto de botão/pílula | Nada deve parecer clicável | Fundo `opacity-light-10`, raio `md`, 4 pílulas em fileira cheia, parecem 4 botões ou abas; sem tecla que as alcance |
| Aviso | Dados do mesmo assunto separados: foto, nome e idade num grupo; "Estalecas / 3.250" noutro, 16px abaixo, que é o mesmo espaço que vai até os emojis | Dados relacionados juntos (rodada 5) | Nome, idade e estalecas lidos como um só grupo | Três grupos com a mesma distância (16px), sem agrupar nome, idade e estalecas mais perto do que dos emojis |
| Nota | Estalecas em 28px bold contra nome em 14px bold | Status mais alto que o conteúdo (rodada 4) | Conteúdo é o protagonista | O número (28px) é duas vezes o nome (14px). A tese da opção, no comentário do código, assume o número como âncora; o designer decide se vale aqui |

Sem quebra de linha ruim, sem maiúscula indevida ("Estalecas" só maiúscula inicial), sem peça solta.

## Opção 3: Ficha em dois grupos
Mais perto de: bom (hierarquia nítida: nome 28px, estalecas 16px bold, emojis em tiles; todos os textos têm 14px ou mais; foto circular de 72px em cima, espaço em vez de divisores).
Padrão de interação: nenhum (só visual, como pedido).
| Nível | Elemento | Regra ou token | Valor documentado | Encontrado |
| --- | --- | --- | --- | --- |
| Aviso | Dados do mesmo assunto separados: identidade (foto, nome, idade) e "3.250 estalecas" em grupos diferentes | Dados relacionados juntos (rodada 5) | Nome, idade e estalecas como um grupo | Estalecas fica 16px abaixo da idade e só 8px dos emojis, então lê junto dos emojis e não do nome; a tese pede dois grupos, mas é a separação que o designer pediu para aproximar |
| Nota | 4 tiles de emoji (`.emoji`, raio `lg`, fundo `opacity-light-10`) | Falsa affordance: aspecto de botão | Nada deve parecer clicável | Tiles em fileira com fundo claro; mais altos e com glifo sobre a contagem, leem mais como mostrador do que como botão; sem tecla que os alcance |
| Nota | Foto `72px` por `72px` | Tamanho fora do kit | `--dimension-size-semantic-avatar` = 40px | 72px fixo; o aviso do script o associa a `round-button-circle` (nome errado para uma foto) |

Sem quebra de linha ruim, sem maiúscula indevida, sem peça solta, sem status acima do conteúdo.

## Opção 4: Emojis como protagonista
Mais perto de: bom (um card único, grade 2x2 com respiro; é a mais cheia das quatro, 380px de 456px, mas a tese pede os emojis como assunto e não há disputa de cores).
Padrão de interação: nenhum (só visual, como pedido).
| Nível | Elemento | Regra ou token | Valor documentado | Encontrado |
| --- | --- | --- | --- | --- |
| Crítico | Idade "27 anos" e rótulo "estalecas" | Tipo mínimo 14px; `text-body-sm-*` cumpre | 14px ou mais | `text-footnote-medium` = 12px, havendo `text-body-sm-medium` (14px) |
| Aviso | "3.250 estalecas" (`.coins`) solta entre identidade e emojis | Peça solta e dados relacionados separados | Estalecas junto do nome e da idade (`gap` de `xs`, 12px) | O `<p class="coins">` não zera a margem (as outras opções zeram): ganha 16px em cima e 16px embaixo, então fica a 28px da idade e a 32px da grade de emojis; mede-se 28px entre "27 anos" e "3.250", não os 12px do `gap`. Lê-se como uma linha solta, longe do nome |
| Aviso | 4 células de emoji (`.cell`, raio `lg`, fundo `opacity-light-10`) em grade 2x2 | Falsa affordance: aspecto de botão | Nada deve parecer clicável | Quatro blocos grandes de fundo claro com glifo e número; leem como cartões de escolha; sem tecla que os alcance |
| Nota | Contagens em 28px bold (4 numerais iguais) contra nome em 14px | Status mais alto que o conteúdo; um elemento mais forte | Conteúdo é o protagonista; um mais forte | A tese pede os emojis em destaque, mas as quatro contagens têm o mesmo peso e o nome (identidade) fica menor que todas |

Sem quebra de linha ruim, sem maiúscula indevida.

## Resumo
- Crítico (tipo abaixo de 14px com `text-body-sm-*` disponível): opção 1, opção 2 e opção 4. A opção 3 não tem Crítico.
- Nenhuma opção tem mais de um padrão de interação, hover, tecla ou elemento clicável de verdade; as quatro cumprem o pedido de card só visual.
- Todas as quatro vêm de pílulas ou células de emoji com aspecto de botão (aviso nas opções 1, 2 e 4, nota na 3). O achado de dados relacionados separados aparece nas opções 2, 3 e 4 (na 4 por margem esquecida).
