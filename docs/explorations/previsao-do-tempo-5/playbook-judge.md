# Juiz: previsao-do-tempo-5

Fatos medidos:
- `check-explore-tokens.mjs`: ok, com um aviso: Opção 2, `.o2-card` tem respiro de 20px (raio 40px); o kit usa 32px (`--dimension-spacing-semantic-card-inset-expanded`).
- `check-explore-layout.mjs`: ok (nenhuma linha de falha: `itens`, `anel`, `cortado`, `eixo` e `svg` sem ocorrência). Imagens vistas com `--shots --keys ArrowRight,Enter`.
- Fonte: nenhum `<svg>` de ícone nas opções; nenhum `data-items-ok` (as quatro opções ficam em 4 itens, sem precisar); ↑/↓ não chamam `preventDefault` em nenhuma opção (o `preventDefault` só roda nas teclas tratadas).
- Valor resolvido que pesa nas opções 1, 3 e 4: `--color-semantic-functional-text-inverse` = `#000000`. A opção 2 usa `--color-semantic-functional-background-primary` = `#191919`, que é o token compatível.

## Opção 1: Trilho de dias
Mais perto de: bom (uma interação, herói claro com a temperatura, trilho de 4 dias, respiro de 32px igual nos quatro lados).
Padrão de interação: Trilho de passos (←/→ move a seleção e o herói muda junto; Enter abre o detalhe no lugar; Voltar fecha).
| Nível | Elemento | Regra ou token | Valor documentado | Encontrado |
| --- | --- | --- | --- | --- |
| Critical | Texto do dia escolhido (`--sel-color`) e texto do `aberto` | Playbook §3 cor / DESIGN §4.6: sem preto puro; token compatível existe (`--color-semantic-functional-background-primary`) | nada de `#000000`; `#191919` como texto invertido | `--color-semantic-functional-text-inverse` = `#000000` sobre `#EEEEEE` no dia escolhido |
| Warning | Temperatura âncora "24°" (`text-heading-3-bold`) | DESIGN §2.1: âncora com pelo menos 2x o apoio, 3x para número curto | 3x de 14px = 42px | 28px sobre textos de 14px (2x); o número não domina como a prioridade do brief pede |
| Note | Rótulos "Máx/mín", "Chuva", "Vento" no detalhe | DESIGN §3.3: `.text-footnote-*` só para rótulo secundário sem decisão | 12px permitido | 12px, ao lado de valor em 14px bold; é rótulo secundário, permitido |
| Note | Rótulo "Hoje" no trilho | DESIGN §3.6: três letras, mesmo tamanho na fileira | "Hoj/Qui/Sex/Sáb" | "Hoje" tem 4 letras; o brief nomeia "Hoje", desvio justificável |
| Note | Escolhido e focado são a mesma peça | DESIGN §9.2 e §9.5 | escolhido preenchido pode dispensar o contorno | em repouso o dia escolhido é preenchido; os outros têm contorno de 1px (certo) |

## Opção 2: Dia que se abre
Mais perto de: bom (um herói, um trilho de 4 dias, detalhe em duas colunas rótulo e valor; é a opção com o único token de texto invertido compatível).
Padrão de interação: Expandir no lugar (←/→ move o foco entre dias e atualiza o herói; Enter expande). Na prática o comportamento é o mesmo da opção 1 (trilho com detalhe embaixo).
| Nível | Elemento | Regra ou token | Valor documentado | Encontrado |
| --- | --- | --- | --- | --- |
| Warning | `.o2-card` em repouso (`padding-bottom: calc(var(--inset) - var(--day-pad))`) | DESIGN §7.3: respiro igual nos quatro lados, medido até o visível; 32px no Content Card | 32px | 20px embaixo, 32px nos outros lados (o contorno do dia é visível); aviso do `check-explore-tokens` |
| Warning | Temperatura "24°" (`text-heading-3-bold`) | DESIGN §2.1 | 3x o apoio de 16px = 48px | 28px sobre a condição em 16px (1,75x) |
| Note | Tese pede o detalhe "na própria linha do dia"; o detalhe é uma lista abaixo do trilho | Brief, direção 2 | detalhe na linha | O detalhe aparece embaixo do trilho, como na opção 1; a opção 2 não se distingue em conceito. Foi bom ter deixado de fora o "⌄" (sem aspecto de menu suspenso) |
| Note | Rótulo "Hoje" no trilho | DESIGN §3.6 | 3 letras | 4 letras; o brief nomeia "Hoje" |

## Opção 3: Duas leituras do dia
Mais perto de: bom (um gráfico de 4 horas, a hora em foco marcada pelo ponto e pela barra clara, resumo fixo em cima; vizinha do seletor segmentado de referência). A tela fica mais alta que as outras e tem três grupos, mas com respiro de sobra.
Padrão de interação: Alternar visão (←/→ percorre as 4 horas; Enter troca barras e números; o resumo não muda).
| Nível | Elemento | Regra ou token | Valor documentado | Encontrado |
| --- | --- | --- | --- | --- |
| Critical | Número da hora em foco na visão "números" (`.o3-num`, cor `--color-semantic-functional-text-inverse`) | Playbook §3 cor / DESIGN §4.6; token compatível existe (`background-primary`) | nada de `#000000` | `#000000` sobre `#EEEEEE` (barra ativa) |
| Critical | Rótulos de hora "15h / 18h / 21h / 00h" e "chuva %" da visão números (`text-footnote-medium`) | DESIGN §3.3: 12px só em rótulo secundário sem decisão | decisão: 14px ou mais | 12px; as horas dão nome ao que o controle escolhe e a chuva é dado lido, então carregam decisão |
| Warning | Altura das barras (`--h`: 89%, 74%, 52%, 37% para 26°, 24°, 21°, 19°) | DESIGN §1 / §12.10: dado visual sem decoração enganosa | altura proporcional ao valor ou eixo explícito | Base cortada e sem eixo: 19° tem 37% e 26° tem 89%, o que exagera a queda (19/26 é 73%) |
| Warning | Linha de detalhe "Agora, 15h · 26° · chuva 20% · / vento 14 km/h" | DESIGN §3.4 e §3.5: quebra sem separador solto | quebra antes do "·" ou frase curta | O "·" fica pendurado no fim da primeira linha (visto na captura) |
| Warning | Temperatura "24°" (`text-heading-3-bold`) | DESIGN §2.1 | 42px para 14px | 28px sobre 14px (2x) |
| Note | Texto "Temperatura por hora · barras" (12px) | DESIGN §3.3 | 12px permitido para rótulo secundário | 12px, nomeia a visão; permitido |
| Note | Raio das barras (`--dimension-radius-core-xs`) | DESIGN §8.1: raio externo menos a distância (40 - 32 = 8) | 8px | 4px na barra e 8px na célula; ligeiramente abaixo do concêntrico |

## Opção 4: Lista de métricas
Mais perto de: claustrofóbico, em grau leve (cinco peças competem: lugar, título-conclusão, três métricas, âncora com condição e o detalhe aberto; "24°" aparece duas vezes, no bloco "Temp." e na âncora; a leitura não tem um mais forte claro).
Padrão de interação: Lista de métricas, adaptada para a horizontal (←/→ entre três blocos; Enter abre o detalhe numa linha embaixo). Fora do catálogo no desenho: o catálogo descreve linhas com mini-gráfico que empurram as outras; aqui são blocos lado a lado que não empurram nada. O eixo bate com as teclas, então não é quebra de lei.
| Nível | Elemento | Regra ou token | Valor documentado | Encontrado |
| --- | --- | --- | --- | --- |
| Critical | Bloco da métrica aberta (`--tile-sel-text`) | Playbook §3 cor / DESIGN §4.6; token compatível (`background-primary`) | nada de `#000000` | `--color-semantic-functional-text-inverse` = `#000000` sobre `#EEEEEE` |
| Critical | Rótulos "Temp.", "Chuva", "Vento" nos blocos (`text-footnote-medium`) | DESIGN §3.3: 12px só em rótulo secundário sem decisão | 14px ou mais | 12px; o rótulo é o que diz qual métrica o foco escolhe |
| Warning | Âncora "24°" (`text-heading-3-bold`, 28px) ao lado do título-conclusão (`text-body-md-medium`, 16px) | DESIGN §2.4: número de status nunca mais forte que o título | título dominante | O número (28px) é mais forte que o título (16px); a tese diz que a conclusão é o título |
| Warning | Número repetido: "24°" no bloco Temp. e na âncora | DESIGN §12.10 e §7.5: sem dado repetido, dado do mesmo assunto junto | uma vez | Aparece duas vezes, em grupos separados (blocos, depois âncora); ao focar Chuva, "30%" também repete |
| Warning | Bloco "Vento" mostra "14" sem unidade; "Temp." abreviado | DESIGN §3.6 e §2.3: rótulo lê sozinho, unidade junto ao valor | "14 km/h", "Temperatura" | "14" nu no bloco; a unidade só aparece na nota depois de Enter ou no foco |
| Note | "São Paulo · hoje" em 12px (`text-footnote-medium`) | DESIGN §3.3 | 12px permitido para rótulo secundário | 12px; o lugar fica pequeno, mas legível na captura |

## Resumo
- Opção 1: carrega Critical (preto puro `#000000` no dia escolhido, com token compatível `background-primary`).
- Opção 2: sem Critical; tem Warnings (respiro de 20px embaixo em repouso, âncora de 1,75x) e a Note de que repete a estrutura da opção 1.
- Opção 3: carrega Critical (preto puro na visão números; rótulos de hora e chuva a 12px que carregam decisão).
- Opção 4: carrega Critical (preto puro no bloco aberto; rótulos dos blocos a 12px que carregam decisão), além de Warnings de hierarquia e de dado repetido.
- Nada foi alterado na exploração; o designer decide.
