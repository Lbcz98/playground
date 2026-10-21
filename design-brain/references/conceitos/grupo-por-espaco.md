# grupo-por-espaco
Tags: agrupamento por proximidade, eixo esquerdo único, sem divisores
Padrão: nenhum
Resumo: o vão entre grupos é pelo menos 2× o vão dentro deles, tudo alinha num eixo esquerdo, e o espaço faz o trabalho de linhas e caixas.
Fonte: destilado de metrica-com-barras-de-sessoes, saude-anel-metricas-e-barras, cartoes-contexto-evento-voz-clima-voo, cartazes-tipograficos, orbita-de-pessoas, cartoes-de-humor-gradiente · 2026-10-21

## Cerne
Peças que respondem à mesma pergunta ficam juntas; as outras ficam longe. A distância diz o que é grupo, então linhas, caixas e bordas ficam desnecessárias. Um eixo esquerdo único amarra os grupos num só desenho.

## Receita
- Defina os grupos pela pergunta que cada peça responde. O vão entre grupos é pelo menos 2× o vão dentro de um grupo.
- Separe por espaço, não por borda. Divisor só onde há faixas de dados densos.
- Alinhe texto, ícone e ação num só eixo esquerdo; a ação neutra do pé usa o mesmo eixo.
- Dentro de um grupo, passo regular; entre itens iguais, vão igual.
- Em linhas de dois lados, dado à esquerda e contexto ou controle à direita, ambos na mesma linha de base.
- Formas concêntricas ou um fundo comum já são agrupamento: não some uma caixa por cima.

## Uso no kit
- Vão dentro do grupo: `--dimension-spacing-core-3xs` ou `-2xs`. Entre grupos, o par que dobra: `-2xs` com `-sm`, ou `-xs` com `-lg`.
- O eixo esquerdo é a margem do card: `--dimension-spacing-semantic-card-inset` no Card e `--dimension-spacing-semantic-card-inset-expanded` no Content Card. Nada passa dela.
- Divisor, quando preciso: `--dimension-border-width-semantic-divider` com `--color-semantic-functional-border-subtle`.
- Linhas de tabela: `--dimension-spacing-semantic-table-row-gap`.

## Ajuste
- 2× é o piso, não a meta. Com muitos grupos num card baixo, o vão grande come a altura: corte grupos antes de encolher o vão.
- Se a ideia da opção é um desenho (um anel, uma órbita), o agrupamento vem da forma, e o vão entre texto e desenho segue a mesma razão.
