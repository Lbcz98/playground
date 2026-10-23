# Juiz: bbb-1-playbook

Fatos medidos:
- `check-explore-tokens.mjs`: ok, com 2 avisos (opção 1: `width: 168px` e `height: 160px` valem tokens do kit, `notification-text-width` e `card-expanded-height`; são o corpo da silhueta da foto, e a opção 4 também desenha a silhueta com px soltos).
- `check-explore-layout.mjs`: ok.
- Servidor de exploração: a página carrega estilizada (tokens.css e inter.css 200, fonte Inter aplicada). Único 404: `../../../../src/styles/global.css` (conhecido e inofensivo). Nenhum outro link falha.
- Medido no navegador: nenhum elemento focável (`a`, `button`, `[tabindex]`) dentro dos cards, nenhum cursor de clique, nenhum handler de tecla no card (o único script da página é o seletor grade/lista da moldura, fora dos cards). Menor texto dentro dos cards: 14px (todas as opções). Cards com 288px de largura (token) e 188 a 400px de altura, abaixo dos 456px do Content Card.

Interação, para todas as opções: nenhuma, como pedido. Sem hover, clique, tecla, animação, seta, aba ou campo. Enter no card é o padrão de todo card e não conta. ↑/↓ passam, pois não há script no card.

## Opção 1: Foto como contexto
Mais perto de: bom (uma tese só, a foto é a isca, nome sobre a imagem, respiro generoso e nenhuma cor de destaque; é o layout de foto cheia com informação na borda, que o designer aprovou).
Padrão de interação: nenhum (só visual)
| Nível | Elemento | Regra ou token | Valor documentado | Encontrado |
| --- | --- | --- | --- | --- |
| Warning | Nome e idade sobre a foto; estalecas abaixo da foto | Dados do mesmo assunto ficam juntos (playbook 3, preferências, rodada 5) | nome, idade e estalecas lidos como um grupo | A foto separa nome/idade de estalecas e emojis por um vão de 16px (`spacing-core-sm`) e pela borda da foto; estalecas lê como dado solto do grupo de apoio |
| Note | Silhueta da foto (`.head`, `.body`) | Tamanhos do kit | `notification-text-width`, `card-expanded-height` | 168px e 160px escritos à mão; é espaço reservado e some com a foto real |
| Note | Idade (`text-muted`, #FFFFFFB3) sobre o gradiente `overlay-bottom` | Cinza sobre preto; scrim aprovado na rodada 5 | sem cinza escuro sobre preto | Composição sobre a foto não medida; o scrim é do tipo aprovado, então só Note |
| Note | Estalecas em 14px bold, abaixo do nome em 28px | Conteúdo é o protagonista | nome mais forte que o status | Nome mais forte que o número; coerente com a prioridade do brief (quem é primeiro) |

Aparência de web, falsa affordance, quebra de linha, capitalização, elemento solto, eixo, status mais alto que o conteúdo: nada encontrado. "Camila Duarte" cabe numa linha; "estalecas" e "27 anos" em minúscula.

## Opção 2: Estalecas em destaque
Mais perto de: bom (uma interação nula, uma hierarquia clara com o número como único forte, três grupos com respiro e nenhuma cor de destaque; é o card mais leve e mais baixo, 189px).
Padrão de interação: nenhum (só visual)
| Nível | Elemento | Regra ou token | Valor documentado | Encontrado |
| --- | --- | --- | --- | --- |
| Warning | Linha foto, nome e idade; linha de estalecas | Dados do mesmo assunto ficam juntos (rodada 5) | nome, idade e estalecas como um grupo | Estalecas fica num grupo à parte, a 16px (`spacing-core-sm`) da identidade, tão distante dela quanto dos emojis |
| Note | Estalecas `text-heading-3-bold` 28px contra nome `text-body-sm-bold` 14px | Status mais alto que o conteúdo (Warning, rodada 4) | o título não perde para o número | O número é bem maior que o nome. A tese da opção e do brief é o número como âncora, então fica como Note. O designer decide se vale |
| Note | Nome em 14px | Mínimo de 14px; 16 a 18px confortável | 16 a 18px | No mínimo do mínimo; o nome é o dado mais fraco do card apesar de ser "quem é" |

Aparência de web, falsa affordance, quebra de linha, capitalização, elemento solto, eixo: nada encontrado. Emojis em fileira horizontal sem moldura, contagens em cinza suave, nada parece clicável.

## Opção 3: Ficha em dois grupos
Mais perto de: bom (dois grupos separados só por espaço, foto em cima e dado âncora embaixo, uma só tonalidade; o cuidado é o conjunto de 4 peças com fundo, que adensa a base).
Padrão de interação: nenhum (só visual)
| Nível | Elemento | Regra ou token | Valor documentado | Encontrado |
| --- | --- | --- | --- | --- |
| Warning | Grupo "quem é" (foto, nome, idade) e grupo "o que recebeu" (estalecas e emojis) | Dados do mesmo assunto ficam juntos (rodada 5) | nome, idade e estalecas como um grupo | O brief manda dois grupos e a opção cumpre: estalecas fica no grupo de baixo, a 16px do nome e da idade. É a separação que o designer pediu para aproximar em toda opção BBB que a fez |
| Warning | Quatro peças de emoji (`.emoji`, fundo `opacity-light-10`, raio `md`, lado a lado) | Falsa affordance (aparência de botão ou pílula sem tecla) | nada que pareça clicável | Quatro ladrilhos iguais e preenchidos têm cara de fileira de escolha; nenhuma tecla os alcança (o brief proíbe interação) |
| Note | Estalecas em `text-body-md-bold` 16px | Hierarquia | o dado âncora do grupo | Número mais fraco que o nome (28px); o nome lidera, coerente com a prioridade do brief |

Quebra de linha, capitalização, elemento solto, eixo, status mais alto que o conteúdo: nada encontrado.

## Opção 4: Emojis como protagonista
Mais perto de: bom, no limite (uma tese e sem cor de destaque, mas é o card mais alto, 400px, com quatro células grandes e a identidade reduzida a 56px e nome em 14px; ainda tem respiro entre as peças, sem chegar ao claustrofóbico).
Padrão de interação: nenhum (só visual)
| Nível | Elemento | Regra ou token | Valor documentado | Encontrado |
| --- | --- | --- | --- | --- |
| Warning | Nome e idade (topo) e estalecas (rodapé, abaixo da grade de emojis) | Dados do mesmo assunto ficam juntos (rodada 5) | nome, idade e estalecas como um grupo | A grade de emojis fica entre os dois: estalecas está a mais de 250px do nome e lê como dado solto |
| Warning | Estalecas (`.coins`, 14px, sozinho no rodapé) | Elemento solto: peça que não pertence a um grupo | metadado junto de um grupo, perto do título | Fica sob a grade, sem grupo e sem título próprio, depois do título "Emojis recebidos" que não o cobre |
| Warning | Quatro células preenchidas em grade 2x2 (`.cell`, `opacity-light-10`, raio `lg`) | Falsa affordance; eixo: o arranjo segue o eixo das teclas | nada que pareça clicável; sem grade de duas dimensões | As células têm o molde de cartões de escolha (o brief pediu o molde), e a grade 2x2 pareceria navegar nos dois eixos; nenhuma tecla as alcança |
| Note | Contagem em `text-heading-3-bold` 28px contra nome em 14px | Status mais alto que o conteúdo (rodada 4) | o conteúdo é o protagonista | A tese é "reação do público como assunto", então os números lideram, justificado; mas o nome e a foto ficam como o elemento mais fraco |
| Note | Rótulo "Emojis recebidos" | Elementos por card; o conteúdo fala por si | falar muito com pouco | Rótulo extra que repete o que os emojis já mostram; sentença em minúscula, correta |

Quebra de linha e capitalização: nada encontrado.

## Resumo
- Nenhuma opção tem Critical: nada de pure white/black medido, sem texto abaixo de 14px, sem tecla consumida, sem mais de um padrão, sem hover ou animação.
- Opção 1: só Warning (dado relacionado separado: nome e idade na foto, estalecas abaixo).
- Opção 2: só Warning (estalecas separada da identidade).
- Opção 3: só Warning (grupos separam estalecas do nome, como o brief manda; ladrilhos de emoji com cara de botão).
- Opção 4: só Warning (estalecas longe do nome e solta no rodapé; células com cara de cartão de escolha em grade 2x2).
