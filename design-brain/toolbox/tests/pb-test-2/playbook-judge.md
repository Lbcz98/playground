# Juiz: pb-test-2

Fatos medidos:
- `check-explore-tokens.mjs`: ok. Três avisos (advisory) de tamanho fixo: `height: 160px` (opção 2) é o tamanho do kit `card-expanded-height`; `height: 120px` (opção 3) fica perto de `card-height` (122px); `height: 96px` (opções 5 e 6) é o tamanho `alert-bug`.
- `check-explore-layout.mjs`: ok.

Catálogo de padrões e teclas lido (`--padroes`, `--teclas`). Em nenhuma opção o script chama `preventDefault` em ↑/↓; o único `keydown` é o do `.opt`, que só trata ←/→, Enter, Esc e Backspace. Não há hover, clique, arrastar, tooltip, dropdown, campo de texto nem animação (só `transform: rotate` sem transição, na opção 4). O único acento de cor em todas é o vermelho do "ao vivo" (`status-live` #FD4142). Os azuis do pôster são a imagem, não a interface. Nenhum token resolve para #FFFFFF ou #000000 nos textos ou superfícies: texto `#EEEEEE`, fundo do palco `#191919`, card `#3F3F3F`, texto invertido usa `background-primary` `#191919`. Menor fonte nos cartões: 14px (`text-body-sm-*`).

## Opção 1: Pôster inteiro
Mais perto de: bom (uma imagem como chamariz que ocupa o card todo, um acento só, título como elemento mais forte, respiro generoso e poucos elementos).
Padrão de interação: Seletor segmentado (←/→ trocam o segmento, Enter sem efeito extra, Esc volta a "Agora"). O seletor tem aparência de pílula e é alcançado por ←/→: não é falsa affordance.
| Nível | Elemento | Regra ou token | Valor documentado | Encontrado |
| --- | --- | --- | --- | --- |
| Note | Selo "14" (`.rating`) e trilho do seletor (`.seg`) sobre o pôster | Fundo `--color-opacity-dark-50` (translúcido); sobreposição não é preto puro | Compor com o fundo, ou "não medido" (no máximo Warning) | Não medido: depende da imagem atrás. O texto sobre ele é `#EEEEEE`, então não é cinza sobre preto |

## Opção 2: Barra do tempo
Mais perto de: bom (um pôster, título, uma barra e as pontas do horário; poucos elementos, um acento, a barra como segundo elemento mais forte).
Padrão de interação: Alternar visão (só Enter troca entre "agora" e "mais tarde"; ←/→ não fazem nada). Nada com aparência clicável, então não há falsa affordance.
| Nível | Elemento | Regra ou token | Valor documentado | Encontrado |
| --- | --- | --- | --- | --- |
| Note | Segunda visão ("Reprise") | Playbook seção 3, princípios (clareza do que existe) | A pessoa deve poder descobrir o que o Enter faz | Nada no card indica que há uma segunda visão; só quem aperta Enter vê |
| Note | `.poster.p160` com `height: 160px` | Script de tokens (aviso) | 160px é `card-expanded-height` (o card inteiro); aqui é só o pôster | Altura fixa, sem token; provavelmente intencional, o significado é outro |

## Opção 3: Dois botões
Mais perto de: claustrofóbico (dois ladrilhos iguais de 14px com três linhas cada, espremidos num card de 288 com vão `3xs`, `nowrap`, e o pôster reduzido a 120).
Padrão de interação: Fileira de escolha (←/→ movem o foco, Enter escolhe; foco = anel, escolhido = fundo invertido + check, aparências diferentes). Cada ladrilho com aparência de botão é alcançado por ←/→ + Enter: não é falsa affordance.
| Nível | Elemento | Regra ou token | Valor documentado | Encontrado |
| --- | --- | --- | --- | --- |
| Warning | Dois ladrilhos `.tile` iguais + pôster 120 | Hierarquia (seção 3) e anti-padrão 2: sem elemento mais forte; prioridade 1 do brief é a imagem | Um elemento claramente mais forte; a imagem como chamariz | Ladrilhos de mesmo peso; pôster menor que nas opções 1, 2 e 4. O texto da página afirma que a escolha é o forte, mas são dois alvos idênticos |
| Warning | `.tiles` com `gap` `core-3xs` e `white-space: nowrap` | Respiro / proximidade (seção 3) | Respiro é o critério que mais separa bom de ruim | Seis linhas de 14px em dois blocos de ~118px colados; é a mais densa das opções de linha única |
| Note | `.poster.p120` com `height: 120px` | Script de tokens (aviso) | 120px fica perto de `card-height` (122px) | Altura fixa; manter se for intencional |

## Opção 4: Título e um toque
Mais perto de: bom quando fechada (pôster, título e uma linha, com bastante respiro); aberta, o card enche (dois horários, gênero e divisor).
Padrão de interação: Expandir no lugar (Enter abre e fecha; ←/→ sem efeito).
| Nível | Elemento | Regra ou token | Valor documentado | Encontrado |
| --- | --- | --- | --- | --- |
| Critical | `.piece .chev` (seta `M5 8l5 5 5-5`) na linha do "ao vivo", que gira 180° ao abrir (`.piece[data-open] .chev`) | Aparência de disclosure (judge.md passo 4); playbook seção 3, TV sem pista de web | Na TV a pista é o anel de foco e a peça crescendo, nunca uma seta desenhada | Há chevron na linha que abre e fecha, e a linha recolhida se desdobra como acordeão. A página chama isso de "seta virada" e não justifica o desvio |
| Note | Detalhe aberto (`.detail`: Agora, Mais tarde, Gênero) | Anti-padrão 4 (tudo num componente) e brief (detalhe vai para a página de detalhe) | Metadados fora do card | Reprise e gênero entram no card ao abrir; o brief lista os dois como dados fixos, então só aviso |

## Opção 5: Relógio primeiro
Mais perto de: bom (um elemento claramente mais forte, "restam 28 min" a 28px, um acento, respiro razoável), com mais linhas de 14px que as opções 1 e 2.
Padrão de interação: Seletor segmentado, como a opção 1.
| Nível | Elemento | Regra ou token | Valor documentado | Encontrado |
| --- | --- | --- | --- | --- |
| Note | Hierarquia: "restam 28 min" (`text-heading-3-bold`) acima do título (`text-body-lg-bold`) e do pôster 96 | Princípio "o conteúdo é o protagonista"; prioridade do brief (1 imagem, 2 título) | Imagem primeiro | Inverte a prioridade do brief; a página justifica como teste de contraste de propósito (Note por desvio justificado) |
| Note | Texto "Depois do que está no ar" (visão "Mais tarde") | Brief: usar só os dados fixos | Sem dados inventados | Frase que não está no brief; não é dado novo, só texto de apoio |
| Note | `.poster.p96` com `height: 96px` | Script de tokens (aviso) | 96px é `alert-bug`, sem relação | Altura fixa sem token; manter se intencional |

## Opção 6: Duas linhas de grade
Mais perto de: claustrofóbico (pôster de 96, título e duas linhas de mesmo peso com `gap` `2xs`; aberta, empurra mais quatro linhas de texto; a página mesma diz que é "a mais próxima do card cheio").
Padrão de interação: Lista de métricas (←/→ vão à linha anterior ou à próxima, Enter abre o detalhe no lugar, Esc fecha). A pista é o anel de foco na linha e o fundo mais claro ao crescer, sem chevron: não há aparência de disclosure. As linhas com fundo `background-tint` são alcançadas por ←/→ + Enter: sem falsa affordance.
| Nível | Elemento | Regra ou token | Valor documentado | Encontrado |
| --- | --- | --- | --- | --- |
| Warning | Duas `.rowi` de mesmo peso + pôster 96 | Hierarquia e anti-padrão 2 (sem elemento mais forte); prioridade 1 do brief é a imagem | Um elemento mais forte; a imagem como chamariz | Linhas iguais; o pôster é o menor de todos nesta opção e na 5 |
| Warning | `.rows` (`gap` `2xs`) e `.rowi` (padding `xs`), com 2 a 3 linhas de 14px cada | Respiro (seção 3) | Respiro é o critério que mais separa bom de ruim | Linhas coladas, lembram um card cheio |
| Note | ←/→ numa pilha vertical de linhas | `--teclas`: coluna só se justifica se lida na ordem, com foco bem visível | Leitura em ordem e foco visível | Lida de cima para baixo e com anel na linha; a página reconhece o risco |
| Note | `.poster.p96` com `height: 96px` | Script de tokens (aviso) | 96px é `alert-bug`, sem relação | Altura fixa sem token |

## Achados sobre aparência de web

- Aparência de disclosure (Critical): opção 4, chevron na linha do "ao vivo" que gira ao abrir.
- Falsa affordance (Warning): nenhuma encontrada. Seletor (opções 1 e 5), ladrilhos (3) e linhas (6) são alcançados por ←/→ e Enter. A opção 2 não tem nada com aparência clicável. O selo "14" tem borda e raio mas é só rótulo, não se lê como botão.

## Resumo
- Opção 4 carrega um Critical: chevron de disclosure (aparência de web).
- Opções 1, 2 e 5: nenhum Critical nem Warning, só Notes.
- Opção 3: maior nível é Warning (sem elemento mais forte, respiro apertado).
- Opção 6: maior nível é Warning (sem elemento mais forte, respiro apertado).
