# Juiz: bbb-3-loop

Fatos medidos:
- `check-explore-tokens.mjs`: ok.
- `check-explore-layout.mjs`: ok (nenhuma linha `itens`, `anel`, `eixo`, `cortado` ou `svg`). Com `--shots` e `--keys ArrowRight,Enter`: as capturas depois das teclas são iguais às de repouso nas 4 opções.
- Lido nas capturas: o nome "Camila Duarte" cabe em uma linha nas 4 opções; a opção 1 tem altura fixa de 380px (`--dimension-size-semantic-content-card-image-height`); a opção 4 mede cerca de 443px de altura (abaixo dos 456px do Content Card).

Nas 4 opções: nenhuma tecla, hover, clique, arraste, rolagem, tooltip, campo de texto ou animação dentro do card (o único `<script>` é o da página, que troca grade e lista). Menor texto: 12px (`.text-footnote-medium`, opções 1 e 2), nenhum a 10px. Sem sombra, sem gradiente além do véu da opção 1, sem branco ou preto puro (`text-primary` #EEEEEE, `background-primary` #191919, `background-elevated` #3F3F3F; `text-muted` #FFFFFFB3 sobre #3F3F3F dá cerca de #C5C5C5). A única cor fora do neutro são os próprios emojis (conteúdo). Nenhum chevron, sublinhado nem quebra ruim de título.

## Opção 1: Foto como contexto
Mais perto de: bom (a foto ocupa o card como chamariz e o nome a 28px é a peça mais forte, com idade, estalecas e emojis juntos na base sobre o véu, como o pôster do conjunto bom; a informação toda numa borda da foto cheia não é claustrofóbica, rodada 5).
Padrão de interação: nenhum (card estático, sem teclas, como pede o brief).
| Nível | Elemento | Regra ou token | Valor documentado | Encontrado |
| --- | --- | --- | --- | --- |
| Warning | "3.250" na linha de apoio | DESIGN §2.1 e §3.7 (o valor lido numa faixa de apoio fica em 16 a 18px); prioridade do brief (estalecas em 2º, idade em 4º, suposição) | `.text-body-md-*` ou `.text-body-lg-*`, acima do apoio | `.text-body-sm-bold` (14px), no mesmo tamanho de "27 anos" (14px) e depois dele na leitura; só o peso separa o 2º dado do 4º |
| Note | unidade "estalecas" | DESIGN §3.3 (`.text-footnote-*` só em rótulo secundário sem decisão) | 12px permitido em rótulo secundário | `.text-footnote-medium` (12px); o card não pede decisão |
| Note | silhueta do espaço reservado (`.cabeca`, `.ombro`) | DESIGN §6.5 (o recorte deixa o rosto visível) | rosto inteiro dentro do card | Cabeça de 144px (50% de 288) com a base a 72% de 380px: o topo fica a 417,6px, cerca de 38px cortados pela borda de cima; os ombros (160% × 88%) enchem o card como uma placa cinza. É só o espaço reservado do brief, mas na captura não se lê como pessoa |

## Opção 2: Estalecas em destaque
Mais perto de: bom (uma peça mais forte sem disputa, o "3.250" a 56px, cerca de 3 vezes o nome; grupos separados só por espaço; respiro de 32px em volta). Difere do conjunto bom num ponto: não há imagem como chamariz, a foto é um avatar de 64px, escolha da tese.
Padrão de interação: nenhum (card estático, sem teclas, como pede o brief).
| Nível | Elemento | Regra ou token | Valor documentado | Encontrado |
| --- | --- | --- | --- | --- |
| Warning | tamanho do avatar (`--avatar`) | DESIGN, abertura ("Rules name tokens, never raw px") | um token de tamanho do kit | `64px` cru; o script de tokens não acusa. O único token de 64px é `--dimension-size-semantic-channel-bug`, de outro papel |
| Note | rótulo "Emojis recebidos" | DESIGN §3.3 | 12px permitido em rótulo secundário | `.text-footnote-medium` (12px). O outro rótulo do mesmo papel, "Estalecas", está em `.text-body-sm-medium` (14px): dois rótulos acima do valor em tamanhos diferentes |

## Opção 3: Ficha em dois grupos
Mais perto de: bom (imagem no alto como chamariz, nome a 28px como peça mais forte, dados embaixo, raio da foto concêntrico com o card, 40 − 32 = 8px; grupos separados por espaço, sem divisor).
Padrão de interação: nenhum (card estático, sem teclas, como pede o brief).
| Nível | Elemento | Regra ou token | Valor documentado | Encontrado |
| --- | --- | --- | --- | --- |
| Warning | nome e idade (grupo de cima) longe de "3.250 estalecas" (grupo de baixo) | DESIGN §7.5; playbook §3, preferências (nome, idade e estalecas num grupo) | dados do mesmo assunto num grupo | Idade e estalecas em grupos diferentes, com o vão entre grupos (`--dimension-spacing-core-sm`, 16px) no meio. A separação é a tese do brief, a mesma que o designer pediu para aproximar em toda opção BBB que separou esses dados |
| Warning | "3.250" contra as contagens dos emojis | DESIGN §2.1 e §2.2 (hierarquia por tamanho e peso); prioridade do brief (estalecas em 2º, emojis em 3º) | o 2º dado acima do 3º | "3.250" em 18px bold `text-primary`; contagens em 16px bold `text-primary`. 2px de diferença, na mesma cor e no mesmo peso: na captura os dois leem como uma linha só de números |

## Opção 4: Emojis como protagonista
Mais perto de: claustrofóbico (quatro blocos pesados e iguais, cada um com emoji de 56px e número de 28px em bold, sem uma peça mais forte; a foto vira um monograma de 48px; caixas preenchidas fazem o trabalho que o espaço faria). Só no número de interações (nenhuma) ela fica com o conjunto bom.
Padrão de interação: nenhum (card estático, sem teclas, como pede o brief).
| Nível | Elemento | Regra ou token | Valor documentado | Encontrado |
| --- | --- | --- | --- | --- |
| Warning | células dos emojis (`.cell`) | falsa affordance (judge, passo 4); brief: "nada que pareça clicável" | peça informativa sem aparência de botão | Quatro blocos preenchidos (`--color-opacity-light-10`) e arredondados, no molde dos cartões escolhíveis de `cartoes-de-humor-gradiente`; nenhuma tecla alcança nenhum deles |
| Warning | fundo em volta de cada item repetido | DESIGN §7.2 (o espaço faz o trabalho de linhas e caixas; sem borda entre itens repetidos) | itens separados só por espaço | 4 caixas de fundo #FFFFFF1A, uma por emoji |
| Warning | raio da célula (`--cell-radius`) | DESIGN §8.1 (raio aninhado = raio de fora − vão) | 40 − 32 = 8px (`--dimension-radius-core-sm`) | `--dimension-radius-core-lg` (16px) |
| Warning | contagens 12, 7, 5 e 3 contra o nome | DESIGN §2.0 e §2.1 (uma âncora por card); playbook §4, anti-padrão 2; brief ("mais de uma informação disputando o primeiro lugar") | um dado âncora; o resto recua | Quatro números em `.text-heading-3-bold` (28px), iguais entre si, mais quatro emojis de 56px; o nome fica em `.text-body-lg-bold` (18px). A tese pede os emojis em evidência, mas os quatro disputam o primeiro lugar entre si |
| Note | tamanho do emoji (`--emoji-size`) | DESIGN §3.1 (56px só em numeral, por `.text-display-md-*`) | estilo de texto do kit | `--typography-font-size-4xl` (56px) por `font-size`, sem classe `.text-*`; o emoji age como imagem, não como texto |
| Note | foto do participante | brief, Conteúdo (foto como espaço reservado, sem inventar dados); playbook §3 (ordem de sacrifício: imagem primeiro) | espaço reservado da foto | Monograma "CD" num círculo de 48px no lugar do espaço da foto |

## Resumo
- Opção 1: nenhum Critical.
- Opção 2: nenhum Critical.
- Opção 3: nenhum Critical.
- Opção 4: nenhum Critical.
