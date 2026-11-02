# Juiz: pb-test-3

Fatos medidos:
- `check-explore-tokens.mjs`: ok (5 avisos informativos: alturas 120, 128, 96 e larguras/alturas 72 coincidem com tamanhos do kit, mas estão escritas em px).
- `check-explore-layout.mjs`: ok.
- Servidor de exploração: a página abre (200), `tokens.css` (200) e `inter.css` (200) carregam, e as regras do kit chegam ao navegador. Único 404: `../../../src/styles/global.css` (conhecido, inofensivo). Servidor encerrado. Não consegui renderizar a página num navegador (a navegação foi negada); "estilizada" vem das respostas 200 e do conteúdo do `tokens.css`, não de uma captura de tela.

Nota geral, vale para as seis: nenhuma opção usa hover, arrastar, animação, campo de texto, tooltip ou rolagem. O teclado só trata ←, →, Enter, Esc e Backspace; ↑/↓ nunca recebem `preventDefault`. Menor fonte dentro dos cards: 14px (`body-sm`) em todas. Cores de destaque: só o vermelho `status-live` (#FD4142) mais o azul da imagem. O card aparece solto numa grade de 3 colunas, não num palco 1280×720 com área segura 40/32; esse item não foi medido.

## Opção 1: Cartaz
Mais perto de: bom (uma imagem grande como chamariz, título, duas linhas de texto, sem ação; é o que mais respira dos seis).
Padrão de interação: nenhum além do Enter padrão do card (marca selecionado com check no título).
| Nível | Elemento | Regra ou token | Valor documentado | Encontrado |
| --- | --- | --- | --- | --- |
| Note | Ausência da reprise (01h10 – 03h30) e do gênero | Brief: "duas visões do tempo do programa" | as duas visões do tempo no conteúdo | Só "agora"; corte justificado na tese (ordem de sacrifício do playbook, seção 3) |
| Note | Selo "14" (`.age`, caixa com borda) | Falsa affordance (aparência de botão/chip sem tecla) | tudo que parece interativo precisa de uma tecla | Borda de 1px, raio `radius-core-xs` (4px), nenhuma tecla o alcança; é o selo padrão de classificação, então só aviso |
| Note | Texto secundário todo em `body-sm` | Playbook seção 3: 14px é o mínimo, 16 a 18px confortável | 16 a 18px | 14px; existe `text-body-md-*` (16px) no kit |

## Opção 2: Agora e Mais tarde
Mais perto de: bom (imagem, título, um segmento e duas linhas; um padrão, um destaque; um pouco mais cheia que a 1).
Padrão de interação: Seletor segmentado (←/→ troca entre 2 segmentos, o conteúdo inteiro muda; Enter só marca selecionado).
| Nível | Elemento | Regra ou token | Valor documentado | Encontrado |
| --- | --- | --- | --- | --- |
| Note | Segmento "Agora / Mais tarde" (`.seg`, `role="tablist"`) | Falsa affordance (aba/pílula) | cada coisa com cara de aba precisa de uma tecla | Alcançado por ←/→, então não é falsa affordance. O `role="tablist"` não tem `role="tab"` nos filhos (acessibilidade, não regra do playbook) |
| Note | Segmento selecionado | Hierarquia (seção 3) | um elemento mais forte | O pedaço `background-primary` (#191919) sobre a pílula é o bloco de maior contraste do card e disputa com o título; o título ainda é maior |
| Note | "Mais tarde" esconde o estado ao vivo | Brief, prioridade 4 | "ao vivo" e quanto falta | Some na segunda visão; admitido na tese |
| Note | Selo "14" | Falsa affordance | tecla para o que parece interativo | Mesmo caso da opção 1 |
| Note | Texto em `body-sm` | 16 a 18px confortável | 16 a 18px | 14px |

## Opção 3: Linhas que crescem
Mais perto de: claustrofóbico, de leve (a imagem encolhe para 112px, entram título, gênero, selo e duas caixas com fundo; um padrão e um destaque, mas o filme deixa de ser o protagonista e é a mais cheia das seis, como a própria tese admite).
Padrão de interação: Expandir no lugar (←/→ move entre as 2 linhas, Enter expande ou recolhe, Esc recolhe).
| Nível | Elemento | Regra ou token | Valor documentado | Encontrado |
| --- | --- | --- | --- | --- |
| Warning | Imagem `.i3` (112px) | Princípio: conteúdo é o protagonista; brief, prioridade 1 | a imagem é o chamariz | Menor que na 1, 2 e 4, e dividindo o card com 2 caixas aninhadas |
| Warning | Número de elementos (imagem, título, gênero, selo, 2 caixas com 2 a 3 linhas cada, mais 2 linhas ao expandir) | Respiro / "Tudo num componente" (seção 3, anti-padrão 4) | pouco por card; detalhe vai para outra etapa | É a opção com mais peças; o detalhe de horário e duração fica dentro do card em vez de ir à página de detalhe |
| Note | Visual de acordeão (disclosure look) | Disclosure look: seta/chevron, ou linha que desdobra como dropdown/acordeão | pista é o anel e a peça crescendo, sem seta desenhada | Sem seta, caret ou chevron no CSS ou no markup; a pista é o anel de foco (4px) e a linha que cresce, como o catálogo manda. As duas linhas empilhadas com fundo `background-tint` lembram um acordeão; classifiquei como Note porque o texto do juiz aceita "expandir no lugar" sem seta. Cabe ao designer decidir se o visual de caixas empilhadas conta |
| Note | ←/→ movem foco entre linhas empilhadas na vertical | Teclas (`--teclas`): coluna só se justifica se lida na ordem | ←/→ anterior e seguinte, foco bem visível | 2 linhas, anel visível; o eixo do gesto (horizontal) não bate com o do layout (vertical) |
| Note | Selo "14" e texto em `body-sm` | Falsa affordance; 16 a 18px | ver opção 1 | Igual |

## Opção 4: Entrar ou ver depois
Mais perto de: bom (imagem, título, duas escolhas de mesmo peso e uma linha de metadado; informação em cima, ação embaixo, um padrão).
Padrão de interação: Fileira de escolha (←/→ move entre 2 cartões iguais, Enter escolhe; foco = anel, escolhido = fundo mais claro e check).
| Nível | Elemento | Regra ou token | Valor documentado | Encontrado |
| --- | --- | --- | --- | --- |
| Warning | Cartão escolhido (`.tiles .piece.chosen`), com `--color-opacity-light-30` (#FFFFFF4D) | Cor / acessibilidade são "o chão" (seção 3); legibilidade a 3 m | texto legível; sem cinza sobre cinza | Branco 30% sobre `background-elevated` (#3F3F3F) dá cerca de #797979 (calculado por mim). Texto principal #EEEEEE a cerca de 3,8:1 e o texto suave "01h10 – 03h30" (`text-muted`) a cerca de 3,0:1, em 14px. Não é branco nem preto puro, por isso Warning e não Critical |
| Warning | Escolha sem efeito no brief ("Ver depois") | Intenção (seção 3): não inventar | o brief não define o que "ver depois" faz | Admitido na própria página; o Enter deixa de "abrir o filme" (o card como botão) |
| Note | Cartões "Ver agora" / "Ver depois" | Falsa affordance (botão) | tecla para o que parece botão | Alcançados por ←/→ e Enter; não é falsa affordance |
| Note | Ausência do horário de agora | Brief | dados fixos | Cortado e justificado na tese |
| Note | Selo "14" e `body-sm` | ver opção 1 | ver opção 1 | Igual |
| Não medido | Largura dos cartões com `nowrap` ("01h10 – 03h30" em cerca de 100px úteis) | Layout | sem estouro | O script de layout passou; não vi a renderização |

## Opção 5: O tempo como protagonista
Mais perto de: claustrofóbico (imagem mínima de 96px, mais peças que as outras de um padrão só: número, título, linha ao vivo, barra, duas pontas, reprise e selo; o filme sai do centro, como a tese admite).
Padrão de interação: Alternar visão, só em parte: Enter troca "restam 28 min" / "já passaram 1 h 52", mas ←/→ não fazem nada (o catálogo diz que ←/→ percorre os itens do gráfico).
| Nível | Elemento | Regra ou token | Valor documentado | Encontrado |
| --- | --- | --- | --- | --- |
| Warning | Número "28 min" (`heading-3-bold`, 28px) sobre o título (20px) | Brief, prioridade 1 e 2: imagem, depois título | imagem e título lideram | O número vira o maior elemento; justificado na tese como escolha de intenção, então fica como risco ao brief |
| Warning | Imagem `.i5` (96px) | Princípio: conteúdo é o protagonista | a imagem é o chamariz | A menor das seis em card inteiro; admitido na própria tese |
| Warning | Densidade: 9 peças num card de 288px | Respiro (seção 3) | pouco por card | Número, linha ao vivo, barra, duas pontas, reprise, selo, título, imagem |
| Warning | Enter troca a visão; não abre o filme | Brief: "o card é o botão" | Enter ativa o card | Não reconhecido na página (a opção 6 reconhece). A pergunta aberta não cobre este caso |
| Note | Visão trocada sem pista visível | Interação por TV | a pista é o anel e a peça mudando | O texto muda de "28 min" para "1 h 52", mas nada indica que Enter faz isso |
| Note | Barra de progresso com horas nas pontas (`.bar`) | Falsa affordance (aparência de seletor/slider) | tecla para o que parece interativo | Sem alça; ←/→ não fazem nada; leitura como slider é possível para quem vem da web |
| Note | Número em cima e "Ao vivo · restam" embaixo | Proximidade | rótulo junto do valor | A frase "28 min / Ao vivo · restam" é lida em duas linhas, com o rótulo abaixo do número |
| Note | Selo "14" e `body-sm` | ver opção 1 | ver opção 1 | Igual |

## Opção 6: Texto primeiro, lembrar da reprise
Mais perto de: claustrofóbico (miniatura de 72px ao lado do título, quatro blocos de texto e o interruptor; o texto lidera e a imagem some como chamariz).
Padrão de interação: Interruptor (Enter liga/desliga "Avisar na reprise", o texto confirma "Ligado/Desligado"; um padrão só).
| Nível | Elemento | Regra ou token | Valor documentado | Encontrado |
| --- | --- | --- | --- | --- |
| Warning | Função "Avisar na reprise" | Anti-padrão 11 / intenção (seção 3): não inventar | só o que o brief pede | Não está no brief; admitido na página |
| Warning | Enter liga o aviso; não abre o filme | Brief: "o card é o botão" | Enter ativa o card | Admitido na página como "precisa de decisão" |
| Warning | Miniatura `.thumb` (72px) | Princípio: conteúdo é o protagonista; brief, prioridade 1 | a imagem é o chamariz | Miniatura; admitido na tese |
| Warning | Densidade: miniatura, título, linha ao vivo, horário, selo, gênero, rótulo, estado, interruptor | Respiro (seção 3) | pouco por card | 8 a 9 peças em 288px; traz o gênero e a reprise que o brief manda para o detalhe |
| Note | Interruptor `.sw` | Falsa affordance | tecla para o que parece controle | O card inteiro é o `role="switch"` e Enter o aciona, então a tecla existe; o foco é o anel do card, não do controle desenhado |
| Note | Selo "14" e `body-sm` | ver opção 1 | ver opção 1 | Igual |

## Resumo
Nenhuma das seis opções tem Critical: nenhuma quebra lei (↑/↓, padrão duplo, branco ou preto puro, fonte abaixo de 14px, interação só web).
Com Warning: opção 3 (densidade e imagem pequena), opção 4 (contraste do cartão escolhido, escolha sem efeito definido), opção 5 (imagem mínima, densidade, Enter não abre o filme), opção 6 (função inventada, Enter não abre o filme, miniatura, densidade).
Só Note: opção 1 e opção 2.
Sobre aparência de web (pedido pelo designer): disclosure look não encontrado por markup em nenhuma opção; a opção 3 é um caso limítrofe (linhas empilhadas que desdobram, sem seta). Falsa affordance como a da referência (sublinhado/aba sem tecla) não encontrada; só o selo "14" com borda (todas) e a barra da opção 5 têm aparência de controle sem tecla, ambos como Note.
