# grupo-por-espaco
Tags: agrupamento por proximidade, eixo esquerdo único, sem divisores
Padrão: nenhum
Resumo: o vão entre grupos é um só valor, nos passos xs a sm do kit, e maior que o vão dentro de um grupo; tudo alinha num eixo esquerdo, e o espaço faz o trabalho de linhas e caixas.
Fonte: destilado de metrica-com-barras-de-sessoes, saude-anel-metricas-e-barras, cartoes-contexto-evento-voz-clima-voo, cartazes-tipograficos, orbita-de-pessoas, cartoes-de-humor-gradiente · 2026-10-21
Vale para: qualquer card com mais de uma peça

## Cerne
Peças que respondem à mesma pergunta ficam juntas; as outras ficam longe. A distância diz o que é grupo, então linhas, caixas e bordas ficam desnecessárias. Um eixo esquerdo único amarra os grupos num só desenho.

## Receita
- Defina os grupos pela pergunta que cada peça responde. O vão entre grupos é um só valor no card inteiro, `--dimension-spacing-core-xs` ou `-sm`, e é maior que o vão dentro de um grupo (`-3xs` ou `-2xs`): menos não separa, mais desfaz o card em peças soltas. O `check-explore-layout` confere (`ritmo`).
- O respiro é o mesmo em cima e embaixo, medido até o que se vê (texto e formas), não até as caixas de layout. Altura reservada com `min-height` ou linhas extras para uma frase mais longa vira espaço morto embaixo, e o respiro de baixo parece maior que os outros. Não reserve: a altura do card acompanha o conteúdo, e as frases que trocam com o foco têm o mesmo número de linhas (no tamanho de leitura, cerca de 55 caracteres cabem em duas linhas no Content Card). O `check-explore-layout` confere (`respiro`).
- O que qualifica um título (o check do escolhido, uma contagem, um estado) fica ao lado dele, no mesmo grupo e na mesma linha de base, nunca na outra ponta da linha: a proximidade diz a quem ele pertence.
- Separe por espaço, não por borda. Divisor só onde há faixas de dados densos.
- Alinhe texto, ícone e ação num só eixo esquerdo; a ação neutra do pé usa o mesmo eixo.
- Dentro de um grupo, passo regular; entre itens iguais, vão igual.
- Em linhas de dois lados, dado à esquerda e contexto ou controle à direita, ambos na mesma linha de base.
- Formas concêntricas ou um fundo comum já são agrupamento: não some uma caixa por cima.

## Uso no kit
- Vão dentro do grupo: `--dimension-spacing-core-3xs` ou `-2xs`. Entre grupos: `-xs` ou `-sm`, um só para o card inteiro; `-lg` e acima desfazem o card em peças soltas.
- O eixo esquerdo é a margem do card: `--dimension-spacing-semantic-card-inset` no Card e `--dimension-spacing-semantic-card-inset-expanded` no Content Card. Nada passa dela.
- Divisor, quando preciso: `--dimension-border-width-semantic-divider` com `--color-semantic-functional-border-subtle`.
- Linhas de tabela: `--dimension-spacing-semantic-table-row-gap`.

## Ajuste
- Entre grupos é `-xs` ou `-sm`, e não mais. Com muitos grupos num card baixo, o vão grande come a altura: corte grupos antes de encolher o vão.
- Se a frase precisa de mais linhas do que o resto, encurte a frase; não deixe sobra embaixo.
- Se a ideia da opção é um desenho (um anel, uma órbita), o agrupamento vem da forma, e o vão entre texto e desenho segue a mesma razão.
