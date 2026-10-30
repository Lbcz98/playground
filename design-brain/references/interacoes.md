# Padrões de interação para controle remoto

O `/explore` atribui **um padrão diferente a cada direção**, para as opções de um pedido não se parecerem na interação. O padrão vem desta lista; a coluna "Veio de" aponta a referência de `index.md` que o ilustra. Quando a imagem não mostra o comportamento, a coluna diz "ideia derivada de": o agente não deve procurar na imagem algo que ela não tem.

## Teclas dentro do card

| Tecla | O que faz |
| --- | --- |
| **←  →** | Move o foco entre as peças do card, na ordem. **Sem laço** nas pontas: na primeira peça ← não faz nada, na última → não faz nada. |
| **Enter** | Age sobre a peça focada: abre, escolhe, liga, desliga, alterna. |
| **↓** | Sai do card e foca o botão Voltar. Nunca é usada para algo dentro do card. |
| **↑** | Sai do card e foca o elemento que estiver acima, se houver. Se não houver, não faz nada. Nunca é usada para algo dentro do card. |
| **Voltar** (Esc / Backspace) | Desfaz a última ação dentro do card (recolhe, volta à primeira visão, devolve o foco à primeira peça). No estado inicial, sai do card. |

Consequências para o desenho:
- O que se navega fica numa **fileira horizontal** (abas, dias, pessoas, cartões). Uma coluna só se justifica se for lida na ordem, com ←/→ indo ao item anterior e ao seguinte, e o foco bem visível.
- Nada de grade de duas dimensões dentro do card: só há um eixo.
- O resultado de cada tecla aparece onde o foco está. Texto que muda leva `aria-live="polite"`.
- Nada de hover, arrastar ou clique: o cursor das imagens não existe na TV.
- Em uma exploração, o card deixa ↑ e ↓ passarem (não chama `preventDefault`): quem trata essas teclas é a tela.

Esta tabela é a única fonte das teclas dentro do card; os outros arquivos do `/explore` e do `/tune` só a resumem e apontam para `node scripts/explore-ref.mjs --teclas`. `web/protos/CLAUDE.md` e `web/protos/standards/flow.md` usam `up`/`down`/`enter` para os **níveis da tela** (Home, trilha, interatividade), um nível acima do card: não há conflito, porque o ↑/↓ que sai do card é justamente o que a tela trata.

## Padrões

Cada padrão diz o que ←/→ e Enter fazem. Direções diferentes → padrões diferentes. Se o brief só admite um, mude a estrutura e diga isso.

| Padrão | ← → | Enter | O que o espectador vê | Veio de |
| --- | --- | --- | --- | --- |
| **Expandir no lugar** | move entre as peças expansíveis | expande ou recolhe a peça focada | A peça cresce e mostra o detalhe sem sair do card. Voltar recolhe. | cartões de contexto (ideia derivada de "Attendees"; a imagem não mostra a expansão) |
| **Foco revela** | move o foco entre 2 a 4 peças pequenas | — | O detalhe da peça em foco aparece numa linha reservada do card, no lugar de outro texto; o card nunca muda de altura. Sem Enter e sem abrir nada. | derivado de "Expandir no lugar", sem o crescimento (decisão do designer, que o achou parecido com um dropdown) |
| **Seletor segmentado** | troca o segmento (2 ou 3), na hora | — | O conteúdo inteiro do card muda junto com o segmento. É um filtro do card. | cidade com foto |
| **Trilho de passos** | move a seleção (até 4 itens do mesmo tipo; mais só se o designer decidir) | abre o detalhe do item no lugar | O item selecionado inverte a cor; o detalhe dele aparece no card. | trilho de dias (a semana e o clima só mostram a fileira) |
| **Alternar visão** | percorre os itens do gráfico (dias, categorias) | troca entre duas visões do mesmo dado | A visão atual aparece marcada; o total e a legenda não mudam. | semana barras e radial (mostra as duas lado a lado, não a troca) |
| **Órbita** | vai ao item anterior (←, anti-horário) ou ao próximo (→, horário); começa e termina no vão do topo, sem dar a volta | abre o detalhe do item | O item focado ganha contorno e um rótulo com o nome; os outros ficam quietos. | órbita de pessoas |
| **Marcador em escala** | move o marcador | confirma o valor | O valor, a frase de comparação e a cor mudam com a posição. **Só para um valor que o usuário ajusta** (volume, meta). Um valor medido não tem foco: use outro padrão. | medidor com escala (ideia derivada; o medidor da imagem mostra um valor medido) |
| **Estado muda o card** | percorre as fases já vividas | — | A fase atual vem marcada; cada fase mostra o detalhe dela. A cor muda numa **peça** (título ou barra), nunca no fundo do card. | estados por cor |
| **Lista de métricas** | vai à métrica anterior ou à próxima, na ordem | abre o detalhe da linha no lugar dela | Cada linha tem valor e mini-gráfico; a linha aberta empurra as outras. Voltar fecha. | saúde (métricas) |
| **Interruptor** | move entre os interruptores | liga ou desliga | A linha confirma o novo estado com cor e texto, não só com cor. | saúde (interruptores) |
| **Fileira de escolha** | move o foco entre cartões iguais | escolhe o cartão | O cartão focado ganha contorno; o escolhido fica marcado de **outro jeito**. Foco e escolhido têm aparências diferentes. | cartões de humor (a imagem não mostra foco nem escolhido: crie os dois) |

Distinção entre os dois padrões de fileira: **Seletor segmentado** troca o contexto do card inteiro com 2 ou 3 segmentos (um filtro). **Trilho de passos** tem até 4 itens do mesmo tipo (reenquadre: os próximos 3 dias, não a semana), cada um com o seu detalhe. Não use os dois na mesma exploração: na interação eles parecem iguais.
