# cartoes-de-humor-gradiente
Tags: fileira de cartões iguais, uma variável por cartão, frase em duas partes, ícone que codifica o sentido
Padrão: Fileira de escolha
Resumo: Três cartões do mesmo molde, cada um com uma emoção; a frase "i feel" fica igual e só a palavra, a cor e o ícone mudam.
Fonte: imagem fora do repositório · 2026-10-15

## Cerne
O molde é fixo e só três coisas variam juntas: a palavra da emoção, o matiz do degradê e a forma do ícone. Repetir "i feel" em todos faz o olho ignorar a parte igual e ler só a diferença. São opções lado a lado de mesmo peso, prontas para escolher uma.

## Peças
Três cartões, cada um com 3 peças: fundo em degradê, ícone, frase de duas linhas (uma peça só, em dois níveis).

## Tipografia
- Uma família sem serifa, minúsculas em tudo (até o "i").
- Duas linhas quase do mesmo tamanho (a palavra talvez 1,1× maior, estimado); a hierarquia vem do peso e da cor: "i feel" leve e acinzentado, a emoção em peso médio na cor escura do matiz.
- A segunda linha é recuada em relação à primeira, mais ou menos a largura de "i " (estimado): a frase desce em degrau.
- Entrelinha apertada, as duas linhas lidas como uma frase.

## Posição e espaço
- Cartões quase quadrados, um pouco mais largos que altos (cerca de 1,1:1, estimado), raio grande (cerca de 1/6 da largura, estimado), cantos suaves.
- Vão entre cartões igual, cerca de 1/9 da largura de um cartão (estimado).
- Ícone no terço superior esquerdo; frase ancorada no canto inferior esquerdo; ícone e primeira linha da frase quase no mesmo eixo esquerdo.
- O centro inteiro fica vazio: cerca de metade da área sem nada além da cor.
- Margem interna lateral e inferior iguais, cerca de 1/10 da largura (estimado).

## Cor e superfícies
- Cada cartão tem um matiz próprio: rosa, lavanda, verde. É a única cor que muda; não há acento comum.
- O degradê é mais forte na borda e claro no meio, com um segundo tom quente fraco perto do centro (pêssego, creme): um anel suave, como luz por dentro.
- Ícone e palavra usam um tom escuro do mesmo matiz do cartão; "i feel" é um neutro mais claro.
- Sem borda e sem sombra: o cartão se separa do fundo branco só pelo próprio degradê.

## Hierarquia e leitura
Em cada cartão: palavra da emoção → ícone → "i feel". Entre cartões, a cor é o primeiro diferenciador e a palavra o segundo.

## Interação
Nenhuma mostrada: não há foco, cursor nem cartão escolhido. A fileira implica escolha única. É preciso criar o foco e o escolhido com aparências diferentes, sem usar o matiz (que já é o conteúdo).

## Minúcias
- O ícone muda de forma com a emoção: estrela de quatro pontas côncava para "stressed", explosão de muitos raios finos para "depressed", estrela de oito raios com miolo cheio para "anxious". O traço é fino, igual nos três.
- A cor do ícone é a mesma da palavra: os dois são uma unidade de sentido.
- O recuo da segunda linha faz a palavra parecer a continuação falada da frase.

## Por que funciona
Consistência de padrão e reutilização de componente (Design Critique): um molde, três valores, então a comparação é instantânea. Cor com significado (better-colors): o matiz identifica a opção e aparece em três lugares coerentes (fundo, ícone, palavra). Hierarquia por peso, não por tamanho (better-typography: ênfase é um passo de peso). Espaço vazio no centro deixa a cor ser a superfície (better-layout: agrupar por espaço, não por linhas).

## Receita
- Faça um molde único e mude no máximo três coisas por item, sempre juntas e coerentes entre si.
- Repita a parte constante da frase em peso leve e neutro; a parte que muda vai um passo de peso acima, na cor do item.
- Use o mesmo tom escuro do matiz para o ícone e para a palavra.
- Ancore o texto no canto inferior e o ícone no alto, no mesmo eixo; deixe o centro vazio.
- Separe os itens por vão igual, sem borda.
- Faça o ícone carregar o sentido pela forma, com o mesmo traço em todos.
- Lição: molde fixo, variável coerente, frase em duas vozes. Aparência a não carregar: os pastéis, o degradê difuso, as minúsculas forçadas.

## Falhas
- "i feel" em neutro claro sobre pastel tem contraste fraco, e o contraste muda ao longo do degradê.
- Os três fundos têm quase a mesma claridade; sem o matiz, só a palavra e o ícone os distinguem.
- Nenhum estado de foco ou escolha: a imagem não ensina a seleção.
