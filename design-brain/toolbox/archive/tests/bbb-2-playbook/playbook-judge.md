# Juiz: bbb-2-playbook

Fatos medidos:
- `check-explore-tokens.mjs`: ok, com 8 avisos (advisory) de valores em px que batem com tamanhos do kit: `height: 152px` (perto de card-width 158px), `128px`, `64px`, `20px`, `40px`, `16px`. Nenhum bloqueio.
- `check-explore-layout.mjs`: ok.
- Não medido: a quebra de linha do nome a 28px nas opções 1 e 3 (largura útil de 224px) e a altura final das opções 2, 3 e 4 (só estimada pela soma das partes). A opção 1 tem altura fixa de 380px (`content-card-image-height`).

Nas 4 opções: nenhuma tecla, hover, clique, arraste, rolagem, tooltip, campo de texto ou animação dentro do card (só o `<script>` da página, que troca grade/lista e não faz parte do card). Menor texto: 14px (`.text-body-sm-*`). Sem cor fora do neutro, exceto os próprios emojis (conteúdo). Sem sombra, sem branco ou preto puro (`background-primary` é #191919, `text-primary` é #EEEEEE). Nenhum chevron, sublinhado ou aparência de botão.

## Opção 1: Foto como contexto
Mais perto de: bom (uma foto como isca ocupando o card, informação agrupada na base sobre o scrim e respiro de 32px; o layout "tudo na borda de uma foto cheia" não é, por si só, claustrofóbico, rodada 5).
Padrão de interação: nenhum, só visual (conforme o brief; nada a classificar no catálogo).
| Nível | Elemento | Regra ou token | Valor documentado | Encontrado |
| --- | --- | --- | --- | --- |
| Warning | "3.250 estalecas" na linha de apoio | DESIGN §2.1 e §2.2 (hierarquia por tamanho e peso); prioridade 2 do brief (suposição) | o segundo dado em importância deveria se distinguir do apoio | Fica na mesma linha e no mesmo tamanho (14px) da idade; só o peso (bold) o separa. Idade e estalecas disputam o mesmo nível |
| Warning | emojis (🐍 12, 💔 7, 🌱 5, 🎯 3) | DESIGN §7.1 (um gap entre grupos, maior que o interno) | gap entre grupos `core-xs` ou `-sm`, maior que o interno | O gap entre grupos é `core-sm` (16px), igual ao gap entre idade e estalecas na linha de fatos (`core-sm`). A distância não separa o grupo "quem é" do grupo "emojis" mais do que separa itens do mesmo grupo |
| Note | scrim `--gradient-semantic-card-scrim` | DESIGN §5.4 (scrim `--gradient-complementary-dark`) | mesmas paradas (#34343C00 a #17161B) | Token equivalente do kit, com texto sobre a imagem; não é achado |
| Note | `.head`, `.shoulders` do espaço reservado da foto | DESIGN §6.4 (arte como entregue) | foto sem filtro | Silhueta em `opacity-light-20` é só o espaço reservado do brief; não julgado |

## Opção 2: Estalecas em destaque
Mais perto de: bom (um dado âncora claro, pouca coisa e respiro; falta uma imagem como isca, a foto é um círculo de 48px).
Padrão de interação: nenhum, só visual (conforme o brief).
| Nível | Elemento | Regra ou token | Valor documentado | Encontrado |
| --- | --- | --- | --- | --- |
| Warning | "3.250" (`text-heading-3-bold`, 28px) | DESIGN §2.1 (âncora com pelo menos 2x o apoio, 3x para número curto) | 3x para um número curto | 28px sobre apoio de 14px = 2x. O maior estilo do kit é 28px, então 3x só se alcança com apoio menor que 14px, que não é permitido; fica no limite |
| Note | "3.250" (28px) contra o nome (`text-body-sm-bold`, 14px) | DESIGN §2.4 (número de status nunca mais alto que o título) | o título é maior ou igual ao status | O número é 2x o nome. Justificado pela direção 2 do brief (estalecas como dado âncora); o designer decide |
| Warning | nome, idade e estalecas | DESIGN §7.5 e playbook §3 (dados do mesmo sujeito juntos; pedido do designer em toda opção BBB que os separou) | nome, idade e estalecas lidos como um grupo | Nome e idade estão ao lado da foto; as estalecas estão em outra linha, 16px abaixo (`gap: core-sm`), fora do grupo de identidade |
| Warning | foto (círculo `header-xl`, 48px, ícone genérico) | playbook §1 (o que fica deve ser "extremamente visual"); DESIGN §1 | o conteúdo é o protagonista; um card bom tem uma imagem como isca | Sem imagem forte; o card é só texto e números, e a foto, prioridade 1 do brief (suposição), é a menor peça |
| Warning | linha de emojis (`justify-content: space-between`) | DESIGN §7.1 e §7.2 (um eixo à esquerda, espaço entre itens por gap) | gap fixo entre itens, um eixo | Os 4 itens se espalham pela largura toda; o espaço entre eles varia com o conteúdo e o último encosta na borda direita |
| Note | glifo do emoji em `text-body-md-regular` (16px) | DESIGN §3.3 (confortável 16 a 18px) | 16 a 18px | Dentro do piso; pequeno para os emojis, que são a informação das reações |

## Opção 3: Ficha em dois grupos
Mais perto de: bom, com ressalva de densidade (uma foto como isca, nome âncora, dois grupos separados por espaço sem divisor; mas o card tem muitas peças e é o mais alto: soma estimada de 420px, não medida, contra o limite de 456px do Content Card).
Padrão de interação: nenhum, só visual (conforme o brief).
| Nível | Elemento | Regra ou token | Valor documentado | Encontrado |
| --- | --- | --- | --- | --- |
| Warning | "Camila Duarte / 27 anos" (grupo de cima) e "Estalecas 3.250" (grupo de baixo) | DESIGN §7.5; playbook §3 (nome, idade e estalecas como um grupo) | dados do mesmo sujeito juntos | Separados por 16px (`gap: core-sm`) e por uma foto de 152px; a tese do brief pede essa separação, mas o designer pediu esses dados juntos em toda opção BBB que os dividiu |
| Warning | rótulos "Estalecas" e "Emojis recebidos" mais o valor, os 4 emojis, o nome, a idade e a foto | DESIGN §1 (quando em dúvida, remover); playbook §3 (respiro, elementos demais) | respiro generoso, poucas peças | 9 peças de texto e uma foto de 152px; dois rótulos de 14px só para nomear o que o glifo e o número já dizem. Altura estimada perto do teto de 456px (não medido) |
| Warning | "3.250" (`text-heading-5-bold`, 20px) | DESIGN §2.1 e §2.4 | 2x o apoio de 14px é o piso para o âncora; o número de status não passa o título | 20px sobre 14px = 1,4x; ninguém é âncora do grupo de baixo. O nome (28px) é o âncora do card (2x), as estalecas ficam em segundo plano de propósito |
| Note | `height: 152px`, `width: 112px`, `height: 128px` na foto | token do kit (aviso do script) | `var(--dimension-size-semantic-<nome>)` | Valores em px soltos; o script avisou que 152px é perto de `card-width` (158px) |
| Note | foto com `border-radius: core-sm` (8px) dentro de card de 40px com inset de 32px | DESIGN §8.1 (raio aninhado = externo menos a folga) | 40 - 32 = 8px | Bate |

## Opção 4: Emojis como protagonista
Mais perto de: bom, no limite (um âncora claro, os emojis; mas quatro cartelas preenchidas, cada uma com emoji e número, enchem o card de caixas).
Padrão de interação: nenhum, só visual (conforme o brief).
| Nível | Elemento | Regra ou token | Valor documentado | Encontrado |
| --- | --- | --- | --- | --- |
| Note, "kit vs playbook" | `.reacao-emoji` com `font-size: calc(var(--typography-font-size-3xl) * 2)` (56px) | DESIGN §3.1 (usar os estilos `.text-*`, sem tamanhos inventados) e §12.4 | maior estilo do kit: 28px (`text-heading-3`) | 56px fora da escala, sem classe `.text-*`. O kit não tem token de 56px para um emoji; o designer decide se o kit ganha esse tamanho ou se o emoji fica em 28px |
| Warning | quatro cartelas `.reacao` (fundo `opacity-light-10`, raio 8px, padding 12px, grade 2x2) | DESIGN §7.2 (espaço faz o trabalho de linhas e caixas) e §12.7 (cartões que lutam por ênfase) | sem caixas em itens repetidos | Cada emoji ganha uma caixa; as caixas ficam a 8px uma da outra. O gap entre cartelas (8px) é igual ao gap interno delas (8px), então nada distingue "entre grupos" de "dentro do grupo" |
| Warning | cartelas preenchidas em grade 2x2 | playbook §3 e brief ("Controle": nada que pareça clicável); DESIGN §9 | nenhuma peça com cara de escolha | Caixas com fundo e igual tamanho parecem cartões de escolha (o molde de `cartoes-de-humor-gradiente`); nenhuma tecla as alcança. É afford falso suave; a grade 2D também sugere duas direções, quando o card só tem um eixo |
| Warning | foto (caixa de 64px com silhueta) e nome (`text-body-md-bold`, 16px) | playbook §1; DESIGN §1; prioridade 1 do brief (suposição) | quem é o participante é o primeiro dado | Foto e nome são as peças menores do card; os emojis a 56px tomam o primeiro lugar (a tese pede, o designer decide) |
| Note | estalecas (`text-body-sm-bold` 14px) ao lado de nome e idade | DESIGN §7.5 | dados do mesmo sujeito juntos | Bate: nome, idade e estalecas formam um grupo só |
| Note | `width/height: 64px`, `20px`, `40px`, `16px` | token do kit (aviso do script) | `var(--dimension-size-semantic-<nome>)` | px soltos na silhueta da foto |

## Resumo
- Opção 1: sem Critical. Mais alta em Warnings do que em Notes: estalecas sem destaque, e o gap entre grupos igual ao interno.
- Opção 2: sem Critical. Âncora no limite (2x em vez de 3x), dados do sujeito separados, sem imagem como isca.
- Opção 3: sem Critical. Dados do sujeito separados e densidade alta (altura não medida, perto do teto).
- Opção 4: sem Critical. Emoji de 56px fora da escala (Note, "kit vs playbook"), cartelas que parecem escolhas e enchem o card de caixas.
