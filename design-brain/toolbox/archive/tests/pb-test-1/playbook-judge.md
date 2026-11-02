# Juiz: pb-test-1

Fatos medidos:
- `check-explore-tokens.mjs`: sem falha. Um aviso: `height: 252px` perto do tamanho do kit `wide-button-width` (240px) (opção 6).
- `check-explore-layout.mjs`: ok.
- Menor fonte dentro dos cards: 14px (`text-body-sm-*`), nas seis opções. Cores não neutras: azul da imagem (`gradient-inverse-noite`), vermelho `status-live` (#FD4142). Nenhuma animação, hover, arrastar, scroll, tooltip, dropdown ou campo de texto dentro dos cards. O único `keydown` é o da opção 3 (só ←/→, com `preventDefault` só nessas duas teclas; ↑/↓ passam).
- Contrastes abaixo são calculados por mim a partir dos valores do kit (#EEEEEE, #3F3F3F, #FD4142, #35C7F3). Sobre a imagem, a arte real vai mudar tudo: "não medido" onde dependia dela.

Observação geral (vale para as seis): o quadro 1280×720 e a área segura 40/32 não estão desenhados; os cards aparecem soltos numa grade da página. Segurança de área: não medido. Kit x números do designer: largura do Content Card 288 (kit) contra a superfície 1280×720 do brief. Nota; o designer decide qual lado muda.

Padrões do catálogo: não há linha "card é o botão, só Enter" no `--padroes`. As opções 1, 2, 4, 5 e 6 só têm isso. Registro como Nota (não é um segundo padrão; o brief pede o card como botão), mas a regra do juiz lê "comportamento fora do catálogo" como quebra de lei. Cabe ao designer decidir se o catálogo ganha essa linha ou se a regra vale aqui.

## Opção 1: Pôster claro
Mais perto de: bom (uma imagem como chamariz, um título forte, um vermelho; é a mais densa das seis simples, com quatro linhas abaixo da imagem, mas ainda longe do conjunto claustrofóbico).
Padrão de interação: fora do catálogo (card-botão, só Enter; nada implementado no código)
| Nível | Elemento | Regra ou token | Valor documentado | Encontrado |
| --- | --- | --- | --- | --- |
| Aviso | `.live` "Ao vivo · restam 28 min" sobre o card | legibilidade a 3 m; texto sobre `background-elevated` | #FD4142 sobre #3F3F3F | contraste calculado cerca de 3,0:1 em 14px medium; o texto é fino para o tamanho |
| Aviso | grupo horário + 14 + linha "ao vivo" | proximidade / respiro | informação do mesmo tipo junta | o "14" fica colado ao horário, mas o "ao vivo" fica numa terceira linha separada do mesmo bloco de tempo; três blocos abaixo do título com gap `xs` (12px) |
| Nota | `.img` silhueta (`dark-50`) e brilho (`light-30`) | sem preto/branco puro | tokens translúcidos | marcador da imagem, não superfície de interface; refazer com a arte real |
| Nota | card inteiro | catálogo de padrões | linha para "card-botão" | não existe linha; ver observação geral |

## Opção 2: Ao vivo no chamariz
Mais perto de: bom (imagem alta, texto embaixo mínimo, vermelho como único destaque; a decisão "entrar agora" vive sobre a imagem).
Padrão de interação: fora do catálogo (card-botão, só Enter)
| Nível | Elemento | Regra ou token | Valor documentado | Encontrado |
| --- | --- | --- | --- | --- |
| Crítico | `.chip` ("Ao vivo", "restam 28 min") | sem preto puro; token que resolve a #000000 conta | `color-opacity-dark-70` = #000000B3 | fundo dos dois chips é o preto com 70%; composto sobre a arte: não medido |
| Crítico | `.shade` sobre a imagem (`gradient-overlay-bottom`) | sem preto puro; sem gradiente que some | fim em #000000E6 a 90% | cobre a metade de baixo da imagem sem nenhum texto sobre ela (os chips estão no topo): escurece sem função; composto: não medido |
| Aviso | `.chip.live` texto vermelho | legibilidade a 3 m | #FD4142 sobre fundo escuro translúcido | contraste estimado cerca de 3,3:1 sobre o gradiente (azul claro no topo); depende da arte |
| Aviso | ordem estado (prioridade 4) acima do título (prioridade 2) | hierarquia do brief | imagem, título, horário/14, ao vivo | o estado vira o primeiro texto lido; justificado na página como ligado ao objetivo "decidir se entra" (isso rebaixa só este ponto) |
| Nota | `.img.tall` 190px | escala/kit | `.img` 150 nas opções simples | altura a mais para reforçar a imagem; sem token de altura; não medido contra kit |

## Opção 3: Agora / Mais tarde
Mais perto de: bom (um padrão, imagem e título fortes; o seletor acrescenta uma camada que a opção 1 não tem, mas o texto é pouco).
Padrão de interação: Seletor segmentado (←/→ troca o segmento)
| Nível | Elemento | Regra ou token | Valor documentado | Encontrado |
| --- | --- | --- | --- | --- |
| Aviso | handler `keydown` do card | catálogo `--teclas`: Voltar desfaz a última ação e volta à primeira visão | Voltar (Esc/Backspace) volta a "Agora" | só trata ArrowLeft/ArrowRight; Voltar não faz nada |
| Aviso | `.seg` e `.v-now`/`.v-later` | catálogo: texto que muda leva `aria-live="polite"` | `aria-live="polite"` | ausente; o conteúdo troca sem aviso |
| Aviso | conteúdo trocado pelo segmento | catálogo "Seletor segmentado": o conteúdo inteiro do card muda | o card muda junto com o segmento | muda só a linha de estado/horário; imagem e título ficam. O rótulo "Mais tarde" deixa o espectador sem o horário do filme e com texto de espaço reservado |
| Aviso | `.live` em "Agora" | legibilidade a 3 m | #FD4142 sobre #3F3F3F | cerca de 3,0:1 (mesma observação da opção 1) |
| Nota | Enter | catálogo: Enter "—" no Seletor segmentado | sem ação | o código não trata Enter; a página diz que Enter abre o detalhe. Se isso for implementado, é um segundo padrão (Crítico). Hoje só a afirmação existe |
| Nota | segmento ativo | preferência: marcar sem outra cor | peso e cor do rótulo | negrito/primary contra regular/muted: ok, só a diferença de peso a 14px |
| Nota | `.img` silhueta/brilho | sem preto/branco puro | tokens translúcidos | marcador da imagem |

## Opção 4: Foco revela
Mais perto de: bom no respiro (só imagem e título), mas esconde as prioridades 3 e 4 do brief em repouso.
Padrão de interação: fora do catálogo (revelar no foco; nenhum handler, o card é o botão)
| Nível | Elemento | Regra ou token | Valor documentado | Encontrado |
| --- | --- | --- | --- | --- |
| Crítico | `.shade` sob o texto do título (`gradient-overlay-bottom`) | sem preto puro | fim em #000000E6 a 90% | o título fica sobre o escuro do token; composto: não medido |
| Aviso | `.reveal` (horário, 14, "ao vivo") | catálogo: "Estado muda o card"/"Expandir no lugar" têm tecla e Voltar; revelar no foco não existe | nenhum padrão com revelação por foco | comportamento fora do catálogo; o CSS só revela por `data-state`, não por `:focus`; um card realmente focado não revela nada no código |
| Aviso | informação de repouso | prioridade 3 e 4 do brief; princípio de divulgação | horário, 14, ao vivo visíveis | invisíveis sem foco; o espectador que passa pelo card não vê o estado |
| Aviso | texto sobre a imagem sem chip | legibilidade | #EEEEEE sobre sombra do token | título sobre a metade do degradê; depende da arte, não medido |
| Nota | altura fixa nos dois estados | estados | foco não empurra o vizinho | ok; justificado na página |

## Opção 5: Linha do tempo
Mais perto de: claustrofóbico (quatro blocos empilhados abaixo de uma miniatura de 56px, sem imagem forte, sem um chamariz; o "14" fica sozinho em uma quinta linha).
Padrão de interação: fora do catálogo (card-botão, só Enter)
| Nível | Elemento | Regra ou token | Valor documentado | Encontrado |
| --- | --- | --- | --- | --- |
| Aviso | `.thumb` 56×56 | prioridade 1 do brief; "extremamente visual" | imagem é o chamariz | imagem em miniatura; o card perde o elemento mais forte da imagem. Justificado na página como hipótese oposta (isso torna este ponto uma Nota se o designer aceitar o teste) |
| Aviso | blocos: cabeça (thumb+título), barra, linha horário/ao vivo, linha do 14 | respiro, elementos por card, proximidade | gap `xs` 12px entre blocos; inset 24px | cinco itens de texto/forma empilhados; o "14" está separado do horário (que está na outra linha) |
| Aviso | `.bar` | acessibilidade; faixa sem número | rótulo no elemento | `aria-label` num `div` sem `role`; leitores não anunciam. Trilha em `border-default` (#FFFFFF33) sobre #3F3F3F: contraste baixo |
| Aviso | `.live` (texto) | legibilidade a 3 m | #FD4142 sobre #3F3F3F | cerca de 3,0:1; o vermelho aparece em barra, ponto e texto: um só matiz, mas três pontos de destaque |
| Nota | `.bar b` gradiente `status-live` | sem gradiente sutil | #FD4142 → #DE2C2C | o degradê é quase invisível (mesmo vermelho); sem efeito, só ruído |
| Nota | dado da barra (72%) | decorativo? | ligado à intenção | ligado ao tempo restante, não decorativo (justificado e coerente) |

## Opção 6: Tipográfico sobre a imagem
Mais perto de: bom (quase só imagem, um elemento claramente mais forte: o título em 28px).
Padrão de interação: fora do catálogo (card-botão, só Enter)
| Nível | Elemento | Regra ou token | Valor documentado | Encontrado |
| --- | --- | --- | --- | --- |
| Crítico | `.shade` sob título e meta (`gradient-overlay-bottom`) | sem preto puro | fim em #000000E6 a 90% | texto sobre o escuro do token; composto: não medido |
| Aviso | `.rating` "14" no canto superior direito | legibilidade; texto sem chip | #EEEEEE sobre o topo do degradê #35C7F3 (a sombra só cobre embaixo) | contraste calculado cerca de 1,7:1; ilegível com a arte clara. Também separado do horário (proximidade) |
| Aviso | título `heading-3-bold` 28px em 240px úteis | respiro | título curto, sobra imagem | a página mesma prevê 3 linhas; ocupa cerca de 125px de 252px com o meta. Escala existe no kit, então não é fora da escala |
| Aviso | `21h00` em `text-muted` sobre a imagem | princípio de contraste/legibilidade | muted = #FFFFFFB3 | sobre a imagem e a sombra: não medido |
| Nota | `.img.full` 252px | token do kit | `wide-button-width` 240px | aviso do `check-explore-tokens`; altura intencional, tamanho próprio |
| Nota | card total 300px | limite do Content Card | até 456px | dentro do limite |

## Resumo
- Opção 1: sem Crítico; maior nível é Aviso (vermelho a ~3:1, três blocos de tempo).
- Opção 2: carrega Crítico (chips `dark-70` e `overlay-bottom` com preto puro).
- Opção 3: sem Crítico; maior nível é Aviso (Voltar e `aria-live` ausentes; vira Crítico se o Enter for implementado como segundo padrão).
- Opção 4: carrega Crítico (`overlay-bottom` sob o texto); informação de repouso some.
- Opção 5: sem Crítico; maior nível é Aviso; é a mais próxima do conjunto claustrofóbico.
- Opção 6: carrega Crítico (`overlay-bottom` sob o texto); "14" a ~1,7:1 no topo.
