# semana-barras-e-radial
Tags: duas visões do mesmo dado, total fixo com legenda, marcador de agora
Padrão: Alternar visão
Resumo: O mesmo tempo da semana (dias × horas, em duas categorias) mostrado como colunas e como anéis, com o total e a legenda idênticos embaixo.

## Cerne
Um total grande ("31h 30m") é a resposta; o gráfico acima é a explicação, e pode trocar de forma sem mexer na resposta. Os dois painéis mostram exatamente os mesmos números (total, 24h 15m faturável, 7h 15m pessoal) em duas geometrias: colunas por dia e anéis concêntricos por dia. Isso ensina que a visualização é intercambiável e o que fica fixo é o total e a legenda.

## Peças
Dois painéis, cada um com três peças:
- **Claro (colunas):** cabeçalho de dias (nome + número, sexta circulada), eixo de horas à esquerda (09, 12, 15, 18), cinco colunas com blocos, marcador "13:20" na sexta; total; legenda.
- **Escuro (radial):** cinco anéis concêntricos (um por dia, de dentro para fora M T W T F), escala de horas em volta (09, 12, 15, 18), ponteiro "Now 13:20", subtotal no centro ("24h 15m billable"); total; legenda.
O painel claro é o mais instrutivo: o eixo e os dias ficam legíveis sem treino. O radial ensina a mesma informação compactada e o subtotal no miolo.

## Tipografia
- Uma família sem serifa, três tamanhos por painel (estimado): total, legenda, rótulos de eixo.
- O total é cerca de 3× a altura do texto da legenda e cerca de 4× os rótulos de eixo (estimado), peso médio, espaçamento apertado.
- Na legenda, o número vem mais escuro e o rótulo ("billable", "personal") mais claro, na mesma linha e no mesmo tamanho: o valor carrega o peso, a palavra fica de apoio. O número faturável vem na cor da categoria (azul).
- Dias em duas linhas: nome em cinza, número em preto, mesmo tamanho. O dia de hoje ("9") vira número branco em círculo preto.
- No radial, o subtotal do centro tem peso médio branco e a palavra "billable" em azul embaixo, menor.
- Horas com dois dígitos ("09"), alinhadas à direita do eixo.

## Posição e espaço
- O gráfico ocupa cerca de 3/4 da altura do painel; o total e a legenda, o 1/4 de baixo (estimado). Total ancorado à esquerda, legenda logo abaixo, na mesma borda.
- Colunas: cinco trilhos de fundo de largura igual, gap entre trilhos cerca de 1/4 da largura do trilho (estimado). Blocos com raio grande, quase pílula, e um pequeno vão entre blocos do mesmo dia.
- Eixo de horas alinha com o topo dos trilhos; o marcador "13:20" é uma linha horizontal que corta só a coluna de sexta, com o rótulo logo abaixo.
- Radial: anéis abrem do lado esquerdo (09) e terminam embaixo (18), em três quartos de volta; o quarto inferior esquerdo fica vazio, e o total ocupa a área abaixo.
- Legenda: quadradinho de cor + número + palavra; gap entre os dois itens cerca de 2× o gap interno.

## Cor e superfícies
- Dois neutros e um acento: azul saturado = faturável; cinza = pessoal. A legenda repete as mesmas duas cores em quadradinhos.
- Fundo dos trilhos em cinza quase branco no claro e cinza quase preto no escuro: mostram o tempo vazio sem competir.
- No escuro o cinza "pessoal" fica médio, e o trilho vazio quase preto, três degraus de neutro.
- A única cor com sentido extra é preto/branco do "hoje" (círculo no 9, ponteiro "Now").
- Painéis sem sombra, com raio grande; o tema claro e o escuro são o mesmo componente.

## Hierarquia e leitura
Total → legenda (quanto de cada tipo) → gráfico (quando aconteceu). Visualmente o gráfico é maior, mas o total é o texto mais pesado e fica na base, onde a leitura termina e "fecha a conta".

## Interação
- **Visível:** só estados estáticos: hoje marcado, agora marcado.
- **Inferido:** alternar entre as duas visões (barras ↔ radial) com o total e a legenda parados; percorrer os dias e destacar o selecionado. A imagem mostra as duas visões lado a lado, não a troca nem a transição entre elas.

## Minúcias
- O trilho de sexta termina vazio depois do marcador: o futuro do dia é mostrado como espaço livre.
- No radial, o ponteiro "Now" atravessa os anéis do centro para fora, a mesma ideia do marcador horizontal.
- Os blocos não encostam um no outro: um vão fino separa eventos consecutivos.
- O rótulo de cada anel (M T W T F) fica na ponta inicial do anel, em fila, abaixo do "09".
- O subtotal do centro repete só a categoria de acento, não o total.

## Por que funciona
- **Uma cor, um significado** (better-colors): azul é só faturável, em gráfico, legenda e subtítulo.
- **O número que importa tem espaço** (better-layout, ordem por importância): o total é o maior texto e não divide linha.
- **Valor forte, unidade fraca** (better-typography): o número pesado na legenda, a palavra em cinza.
- **Fundo como contexto** (better-ui, superfícies): o trilho vazio dá a escala sem precisar de linhas de grade.

## Receita
1. Ponha o total a cerca de 3× a legenda e mantenha-o fixo quando a visualização mudar.
2. Duas categorias: uma no acento, outra neutra; a legenda usa as mesmas cores e mostra o valor mais escuro que a palavra.
3. Desenhe o espaço disponível (trilho) num neutro muito próximo do fundo, e o dado por cima.
4. Marque "hoje" e "agora" com preto/branco puro, nunca com o acento.
5. Separe blocos vizinhos com um vão fino em vez de borda.
6. Ofereça uma segunda geometria do mesmo dado só se o total e a legenda continuam iguais.
Lição: total fixo + legenda de duas cores + gráfico trocável. Só aparência: o formato radial em três quartos e os blocos em pílula.

## Falhas
- O radial é difícil de ler: cinco anéis finos com arcos curtos, e o dia de cada anel só aparece numa letra pequena na ponta.
- O subtotal do centro do radial ("24h 15m billable") repete a legenda.
