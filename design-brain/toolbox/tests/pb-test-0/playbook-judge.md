# Juiz: pb-test-0

Fatos medidos:
- `check-explore-tokens.mjs`: ok, com 3 avisos de tamanho perto do kit (`min-height: 176px` na opção 1 perto de `notification-text-width` 168px; `height: 216px` na opção 2 perto de `card-expanded-width` 208px; `height: 152px` na opção 3 perto de `card-width` 158px).
- `check-explore-layout.mjs`: ok.
- Valores do kit lidos de `explore-tokens.md`: `text-inverse` = `#000000`; `background-primary` = `#191919`; `text-primary` = `#EEEEEE`; escala de tipo com `caption` 10px e `footnote` 12px, e `body-sm` 14px como o menor estilo conforme.
- Sobreposição `gradient-semantic-overlay-bottom` termina em `#000000E6` (translúcida). Não medi o composto sobre a imagem; no máximo Warning, e só a registro na tabela de cada opção onde ela aparece.
- Nenhuma opção usa hover, clique, arrastar, rolagem, tooltip, dropdown ou campo de texto. Todas deixam ↑/↓ passar (sem `preventDefault`; `return` antes dele).

Kit vs playbook (Note, o designer decide qual lado muda): o kit tem `text-inverse` = `#000000` (preto puro) e estilos de 10px e 12px. Como existem tokens conformes (`background-primary` como texto invertido; `body-sm` 14px), cada opção que escolheu o token ou o estilo fora da regra leva Critical abaixo.

## Opção 1: Expandir no lugar
Mais perto de: bom (uma imagem como chamariz, linhas com altura de controle e espaço de 16 entre blocos); o enfraquecimento vem da ênfase, não do respiro: quatro peças com a mesma seta, sem uma mais forte que as outras além do botão "Entrar".
Padrão de interação: Expandir no lugar (←/→ move o foco entre as quatro peças, Enter expande ou recolhe, Voltar recolhe e depois volta ao primeiro).
| Nível | Elemento | Regra ou token | Valor documentado | Encontrado |
| --- | --- | --- | --- | --- |
| Critical | Setas (`.chev`) na imagem, na linha de horário, na linha "Ao vivo" e em "Entrar" | Visual de disclosure: a dica é o anel de foco e a peça crescendo, não uma seta desenhada | Sem seta, caret ou chevron em peça que abre e fecha | Quatro chevrons; o da peça aberta gira 180 graus |
| Critical | Botão "Entrar" (`.go`), texto e nota | `text-inverse` quando há token conforme: `background-primary` | Sem preto puro; `background-primary` `#191919` | `text-inverse` = `#000000` sobre `#EEEEEE` |
| Critical | Selo de classificação (`.age`, "14 anos") e legenda da barra ("1h 20 exibidos", "28 min") | Tipo mínimo 14px, escala do kit | `body-sm` 14px | `text-footnote-bold` e `text-footnote-medium`, 12px |
| Warning | Botão "Entrar" (`.go`) | Falsa affordance: parece o botão de ação (única peça cheia, rótulo "Entrar") | Enter no botão entra no filme | Enter só expande uma nota ("Abre no ponto em que o filme está"); nenhuma tecla entra |
| Warning | Título sobre a imagem | Preto puro: sobreposição translúcida | Sem `#000000` | `gradient-semantic-overlay-bottom` até `#000000E6`; composto não medido |
| Note | Peça aberta da imagem (`min-height: 176px`) e anel inicial | Aviso de tamanho perto de token; anel de foco na peça 0 aparece sem o card ter foco | Usar o token se o valor significar aquilo | 176px perto de `notification-text-width` 168px; anel sempre visível |

## Opção 2: Seletor segmentado
Mais perto de: bom (uma imagem grande de chamariz, um seletor, três linhas curtas; pouco texto e espaço de 16 entre blocos).
Padrão de interação: Seletor segmentado (← vai a "Agora", → vai a "Mais tarde", Enter não faz nada, Voltar volta a "Agora").
| Nível | Elemento | Regra ou token | Valor documentado | Encontrado |
| --- | --- | --- | --- | --- |
| Critical | Segmento selecionado (`.tab[aria-selected="true"]`) | `text-inverse` quando há token conforme: `background-primary` | Sem preto puro | `text-inverse` = `#000000` sobre `#EEEEEE` |
| Critical | Selo de classificação "14" (`.rating`) | Tipo mínimo 14px | `body-sm` 14px | `text-caption-bold`, 10px |
| Critical | Estado ("Ao vivo · restam 28 min" / "Começa em 1 h 12 min") | Tipo mínimo 14px | `body-sm` 14px | `text-footnote-medium`, 12px |
| Warning | Título sobre a imagem | Preto puro: sobreposição translúcida | Sem `#000000` | `overlay-bottom` até `#000000E6` mais `opacity-dark-30`; composto não medido |
| Note | Poster (`height: 216px`) e anel do segmento | Aviso de tamanho perto de token; anel no segmento selecionado sem o card ter foco | Usar o token se o valor significar aquilo | 216px perto de `card-expanded-width` 208px; anel sempre visível |

## Opção 3: Estado muda o card
Mais perto de: bom (é a mais enxuta: imagem, uma zona de estado com barra, nome da fase e tempo; a cor muda só na barra, como no catálogo).
Padrão de interação: Estado muda o card (← volta às fases já vividas, → avança até a fase atual, Enter não faz nada, Voltar volta à fase atual).
| Nível | Elemento | Regra ou token | Valor documentado | Encontrado |
| --- | --- | --- | --- | --- |
| Critical | Selo de classificação (`.rating`) | Tipo mínimo 14px | `body-sm` 14px | `text-footnote-bold`, 12px |
| Critical | Tempo restante (`.left`, "Ao vivo · restam 28 min"), a informação de prioridade 4 | Tipo mínimo 14px | `body-sm` 14px | `text-footnote-medium`, 12px, em `text-muted` |
| Warning | Barra de fase (`.seg[data-on]`) | Uma cor de destaque; sem segunda cor de destaque | Um acento por tela | Três matizes (`dia-dark` verde `#00E879`, `tarde-light` amarelo, `tarde-dark` laranja `#ED6001`) entre o azul da imagem e o do anel de foco |
| Warning | Título sobre a imagem | Preto puro: sobreposição translúcida | Sem `#000000` | `overlay-bottom` até `#000000E6`; composto não medido |
| Note | Horário de exibição | Prioridade 3 do pedido (horário e classificação) | Horário presente | Não aparece em nenhuma das fases; só a classificação |
| Note | Imagem (`height: 152px`) | Aviso de tamanho perto de token | Usar o token se o valor significar aquilo | 152px perto de `card-width` 158px |

## Opção 4: Alternar visão
Mais perto de: bom, com ressalva: a imagem e o título dominam, mas o card empilha selo, "Ao vivo", rótulos de abas, duas células e barra; é a opção com mais peças pequenas, e todas de 12px.
Padrão de interação: Alternar visão (←/→ percorre as duas células, Enter troca entre "Falta" e "Horário", Voltar volta a "Falta").
| Nível | Elemento | Regra ou token | Valor documentado | Encontrado |
| --- | --- | --- | --- | --- |
| Critical | Selo "14" (`.age`), rótulos "Falta" e "Horário" (`.tab`), legendas das células (`.label`) e "Agora 20:47" (`.foot`) | Tipo mínimo 14px | `body-sm` 14px | `text-footnote-bold` e `text-footnote-medium`, 12px, tudo o que explica os números |
| Warning | "Falta" e "Horário" (`.tab`, `.tab.is-on` com sublinhado, `aria-hidden`) | Falsa affordance: aparência de barra de abas com sublinhado | Cada rótulo alcançado por uma tecla | ←/→ move o anel entre as células, não entre os rótulos; Enter só alterna a visão, sem escolher um rótulo; nenhuma tecla alcança um rótulo individualmente |
| Warning | Células de tempo (`.cell`) | Proximidade e respiro entre peças | Espaço entre grupos de 12 a 16 | Células de 8px de padding e 4px de espaço, dois números de 20px lado a lado, sob uma linha com selo, "Ao vivo" e abas |
| Warning | Título sobre a imagem | Preto puro: sobreposição translúcida | Sem `#000000` | `overlay-bottom` até `#000000E6` mais `opacity-dark-30` e `opacity-dark-60` (selo); composto não medido |
| Note | Seleção entre as duas células | Padrão: o que ←/→ faz precisa mudar o que se vê | Resultado visível onde está o foco | Muda só o anel e o segmento da barra; sem efeito em outro dado |

## Opção 5: Fileira de escolha
Mais perto de: bom (um chamariz forte e duas escolhas iguais; o escolhido invertido é o elemento mais forte), com a imagem carregando quatro itens por cima (selo, título, horário) e uma linha de estado.
Padrão de interação: Fileira de escolha (←/→ move o foco, Enter escolhe, Voltar desfaz a escolha; foco = anel azul, escolhido = fundo invertido com check, aparências diferentes).
| Nível | Elemento | Regra ou token | Valor documentado | Encontrado |
| --- | --- | --- | --- | --- |
| Critical | Cartão escolhido (`.choice[aria-checked="true"]`), nome e dica | `text-inverse` quando há token conforme: `background-primary` | Sem preto puro | `text-inverse` = `#000000` sobre `#EEEEEE` |
| Critical | Horário "21:00 – 23:10" (`.when`) e dicas "No ar agora" / "Reprise 22:40" (`.hint`) | Tipo mínimo 14px | `body-sm` 14px | `text-footnote-medium`, 12px; a dica escolhida ainda em preto |
| Warning | Título e horário sobre a imagem | Preto puro: sobreposição translúcida | Sem `#000000` | `gradient-overlay-bottom` até `#000000E6`; composto não medido |
| Warning | Dados: "restam 28 min" | Intenção: a informação deve bater | Horário coerente | Termina 23:10 com 28 min restantes (agora perto de 22:42); a "Reprise 22:40" já passou |
| Note | Anel inicial no cartão 0 | Anel visível sem o card ter foco | Anel só com foco | `data-focus` fixo no início |

## Opção 6: Trilho de passos
Mais perto de: bom no card (uma imagem forte e um trilho), mais perto de claustrofóbico no trilho: cinco horários de 12px em fatias de cerca de 43px, separadas por 4px, sem folga entre os tempos.
Padrão de interação: Trilho de passos (←/→ move a seleção sem laço, Enter abre o detalhe do horário, Voltar fecha; 5 itens, dentro do catálogo).
| Nível | Elemento | Regra ou token | Valor documentado | Encontrado |
| --- | --- | --- | --- | --- |
| Critical | Horário selecionado (`.slot[aria-selected="true"]`) | `text-inverse` quando há token conforme: `background-primary` | Sem preto puro | `text-inverse` = `#000000` sobre `#EEEEEE` |
| Critical | Horários do trilho (`.slot`), selo (`.rating`) e hora do detalhe (`.detail-time`) | Tipo mínimo 14px | `body-sm` 14px | `text-footnote-bold` e `text-footnote-medium`, 12px; é o conteúdo principal do trilho |
| Warning | Trilho (`.rail`) | Respiro e proximidade | Folga entre itens; espaço entre grupos de 12 a 16 | Cinco fatias em 240px com 4px entre elas |
| Warning | Título sobre a imagem | Preto puro: sobreposição translúcida | Sem `#000000` | `opacity-dark-70` mais `overlay-bottom` até `#000000E6`; composto não medido |
| Note | Trilho sem rótulo de qual é "agora" além do ponto vermelho | Informação na hora certa | Marca legível | Só um ponto de 8px marca o ao vivo |

## Resumo
- Opção 1: Critical (chevrons de disclosure em quatro peças; texto `#000000` em "Entrar"; tipo de 12px).
- Opção 2: Critical (texto `#000000` no segmento selecionado; tipo de 10px e 12px).
- Opção 3: Critical (tipo de 12px, incluindo o tempo restante).
- Opção 4: Critical (tipo de 12px em quase todo o texto de apoio); Warning de falsa affordance nos rótulos "Falta" e "Horário".
- Opção 5: Critical (texto `#000000` no cartão escolhido; tipo de 12px).
- Opção 6: Critical (texto `#000000` no horário selecionado; tipo de 12px no trilho).
Looks de web achados: disclosure look na opção 1 (Critical); falsa affordance na opção 4 (Warning) e no botão "Entrar" da opção 1 (Warning). Nenhuma outra opção tem tecla ausente, hover ou dica de clique.
