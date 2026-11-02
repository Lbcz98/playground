# Juiz: bbb-3-loop

Fatos medidos:
- `check-explore-tokens.mjs`: ok
- `check-explore-layout.mjs`: ok (com `--shots --keys ArrowRight,Enter`: nenhuma opção muda com as teclas, como pede o brief, que é estático)

Tamanhos e cores abaixo são valores computados no navegador (Playwright, 1280 px). Nenhuma opção tem `<svg>`, sombra, gradiente fora de DESIGN §5.3, branco ou preto puro, texto abaixo de 12px, peça com cara de botão, seta de abrir ou fileira com mais de 4 itens.

## Opção 1: Foto como contexto
Mais perto de: bom (a foto ocupa o card inteiro e é a isca, o nome é a âncora clara e todo o apoio fica num só bloco na borda de baixo, sobre o scrim, como no pôster do conjunto bom; respiro de 32px nas laterais e embaixo)
Padrão de interação: nenhum (estático; o brief não admite teclas)
| Nível | Elemento | Regra ou token | Valor documentado | Encontrado |
| --- | --- | --- | --- | --- |
| Aviso | valor das estalecas "3.250" | DESIGN §3.7 (o valor lido fica em 16 a 18px); DESIGN §2 (hierarquia) | `.text-body-md-*` ou `.text-body-lg-*` (16 a 18px) | `.text-body-sm-bold`, 14px: a prioridade 2 do brief tem o mesmo tamanho da idade (prioridade 4) e só o peso a diferencia |
| Nota | unidade "estalecas" | DESIGN §3.3 | 12px só em rótulo secundário que não carrega decisão | `.text-footnote-medium`, 12px; é rótulo secundário e o card não tem decisão, então é permitido |
| Nota | emojis 🐍 💔 🌱 🎯 | DESIGN §3.1 (usar os estilos `.text-*`) | um estilo de texto do kit | sem classe; herdam 16px peso 400 da página. O tamanho cai na escala (16px), mas não vem de um estilo do kit |

## Opção 2: Estalecas em destaque
Mais perto de: bom (um único dado âncora, sem disputa, neutro, respiro de 32px; a isca é o número, não uma imagem, porque a foto vira um avatar de 64px)
Padrão de interação: nenhum (estático; o brief não admite teclas)
| Nível | Elemento | Regra ou token | Valor documentado | Encontrado |
| --- | --- | --- | --- | --- |
| Aviso | identidade (nome e idade) e estalecas | juiz, passo 4, "dados do mesmo assunto separados"; DESIGN §7.1 e §7.5 | vão dentro do grupo menor que o vão entre grupos; nome, idade e estalecas lidos como um grupo | identidade → estalecas: 16px (`--dimension-spacing-core-sm`), o mesmo vão de estalecas → emojis. O "grupo A" do CSS não aparece na tela: as estalecas ficam tão longe do nome quanto dos emojis |
| Aviso | foto (avatar) | DESIGN, abertura (regras nomeiam tokens, nunca px crus) | `--dimension-size-semantic-avatar` (40px) | `--avatar: 64px`, valor cru sem token |
| Nota | "3.250" maior que o nome | DESIGN §2.4; juiz, passo 4, "status mais alto que o conteúdo" | o número não é mais alto que o título | 56px (`.text-display-md-bold`) contra o nome a 18px (`.text-body-lg-bold`). É a tese da opção no brief (estalecas como âncora); um numeral, 5 caracteres, um display no card: dentro de DESIGN §3.1 |
| Nota | rótulo "Emojis recebidos" | DESIGN §3.3 | 12px só em rótulo secundário que não carrega decisão | `.text-footnote-medium`, 12px; rótulo secundário, permitido |

## Opção 3: Ficha em dois grupos
Mais perto de: bom (foto como isca no topo, nome âncora a 28px, dois grupos separados só pelo espaço, sem divisores; o raio da foto (8px) é o raio do card (40px) menos a margem (32px), concêntrico)
Padrão de interação: nenhum (estático; o brief não admite teclas)
| Nível | Elemento | Regra ou token | Valor documentado | Encontrado |
| --- | --- | --- | --- | --- |
| Nota | nome e idade separados das estalecas | juiz, passo 4, "dados do mesmo assunto separados" (o designer pediu nome, idade e estalecas mais perto em toda opção BBB que os separou) | nome, idade e estalecas como um grupo | dois grupos a 16px (`--dimension-spacing-core-sm`). A separação é a tese da opção no brief, e o vão é o menor vão entre grupos; o designer decide se ela vale |

## Opção 4: Emojis como protagonista
Mais perto de: bom (não está apertado: margem de 32px, vãos de 12 e 16px, uma só área de destaque; o risco é outro: quatro células iguais disputam o primeiro lugar, sem uma que lidere)
Padrão de interação: nenhum (estático; o brief não admite teclas)
| Nível | Elemento | Regra ou token | Valor documentado | Encontrado |
| --- | --- | --- | --- | --- |
| Aviso | emojis 🐍 💔 🌱 🎯 | DESIGN §3.1 | só numerais usam tamanho display (`.text-display-*`); o resto vai até `.text-heading-3-*` (28px) | 56px por `--typography-font-size-4xl`, sem estilo `.text-*`. Se o emoji conta como texto, passa do teto de 28px; se conta como imagem, o kit não tem esse tamanho. O designer decide |
| Aviso | contagens 12, 7, 5, 3 | DESIGN §2.1 (um dado âncora por card); playbook §4, anti-padrão 2 | um dado âncora, pelo menos 2x o apoio | quatro contagens a 28px bold (`.text-heading-3-bold`) sob quatro emojis de 56px, todas com o mesmo peso: nada diz qual reação lidera |
| Aviso | "3.250 estalecas" | DESIGN §3.7 | valor a 16 a 18px, rótulo menor; nunca valor e rótulo no mesmo tamanho pequeno | valor e unidade juntos a 14px (`.text-body-sm-bold`), no mesmo tamanho da idade |
| Nota | contagens maiores que o nome | DESIGN §2.4; juiz, passo 4, "status mais alto que o conteúdo" | o número não é mais alto que o título | contagens a 28px contra o nome a 18px (`.text-body-lg-bold`). É a tese da opção no brief (emojis como assunto) |
| Nota | foto (círculo com "CD") | DESIGN §8.2 (o mesmo papel tem a mesma medida) | `--dimension-size-semantic-avatar` (40px) | `--dimension-size-semantic-header-xl` (48px), token de outro papel |
| Nota | iniciais "CD" | piso de acessibilidade (playbook §3) | contraste de 4,5:1 para texto de 16px | 16px bold em `--color-semantic-functional-text-muted` sobre `--color-opacity-light-20` em cima de `background-elevated`: 3,79:1 (calculado). É marcador de foto; só pesa se as iniciais ficarem no produto |
| Nota | margem visível à direita | DESIGN §7.3 (margem igual, medida ao que se vê) | 32px (`--dimension-spacing-semantic-card-inset-expanded`) | 32px à esquerda e 77px à direita: a grade 2x2 (`1fr 1fr`) alinha cada emoji à esquerda da célula, e a segunda coluna termina longe da borda |

## Resumo
- Opção 1: nenhum Crítico.
- Opção 2: nenhum Crítico.
- Opção 3: nenhum Crítico.
- Opção 4: nenhum Crítico.
