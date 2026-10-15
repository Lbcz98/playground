# metrica-com-barras-de-sessoes
Tags: número-herói com variação, série diária em barras, exceção destacada por cor, card de métrica empilhado
Padrão: nenhum
Resumo: um total grande com a variação ao lado, uma fileira de 24 barras diárias em que duas destoam pela cor, e uma ação no pé.

## Cerne
O card responde a uma pergunta escrita em linguagem comum ("a IA está te mandando visitas?") com um número e a forma dos últimos dias. O número dá a resposta; as barras dão a tendência; a cor só aparece onde há algo diferente. Tudo empilha numa coluna, na ordem em que se lê.

## Peças
Sete peças, em quatro grupos:
1. Cabeçalho: ícone em ladrilho, nome da métrica, selo "Live" à direita.
2. A pergunta (duas linhas).
3. Dado (um grupo): total "4.8k" + variação "+1.2k", as 24 barras, a legenda "sessions from AI answers · last 24 days".
4. Pé (um grupo): linha de metadado com ícone de relógio ("Updated hourly · …") e o botão "View human visits".

## Tipografia
- Quatro tamanhos, dois pesos (estimado). O total é o maior, cerca de 2× o texto da pergunta e ~2,5× a legenda (estimado).
- A variação "+1.2k" fica bem menor que o total (~0,5×, estimado), na mesma linha de base, na cor positiva. Ela qualifica o número; não compete com ele.
- O nome da métrica no cabeçalho é cinza e médio: é rótulo, não título. Quem titula é a pergunta, em cor de texto principal.
- Legenda e metadado em cinza, mesmo tamanho; o ponto "·" separa as duas partes de cada um, em uma linha.
- Unidade implícita: "k" colado ao número, no mesmo tamanho e peso.

## Posição e espaço
- Um eixo esquerdo único: ladrilho do ícone, pergunta, total, primeira barra, legenda, relógio e botão começam no mesmo x.
- As barras ocupam a largura toda do conteúdo, borda a borda do padding; a última barra chega no mesmo x direito que o selo "Live".
- Gaps: total → barras e barras → legenda são curtos (dentro do grupo); pergunta → total é maior; legenda → pé é o maior vão do card (~2× os outros, estimado). Esse vazio separa "dado" de "sobre o dado".
- As barras têm largura igual, cantos totalmente arredondados (cápsulas), espaço entre elas ~1/3 da largura (estimado). Todas sobem da mesma base; a mais baixa tem cerca de metade da mais alta: a escala não começa no zero visível, mas mostra a subida.
- Raio do card grande; o botão e o ladrilho têm raio menor, coerente com o tamanho deles.

## Cor e superfícies
- Fundo claro com borda fina e sombra quase nula.
- Uma cor de dado (verde) para 22 barras e para "+1.2k": verde = normal/positivo. Uma segunda cor (laranja) em 2 barras: exceção.
- O selo "Live" usa o mesmo verde, mas como fundo bem diluído, borda tingida e texto verde escuro: estado, em forma de pílula.
- O resto é neutro: preto para pergunta e total, cinza para rótulos, legenda e metadado.
- O botão é neutro (fundo claro + contorno fino), sem cor: a ação é secundária ao dado.

## Hierarquia e leitura
1. "4.8k" (maior e mais escuro).
2. As barras (maior área colorida); dentro delas, as duas laranjas.
3. A pergunta, depois o "+1.2k", depois a legenda.
4. Pé: metadado e botão.

## Interação
- Mostra: nenhum estado de foco; o único controle é o botão.
- Infiro: cada barra é um dia e poderia receber foco para mostrar o valor do dia; o botão leva a uma vista detalhada. Nada na imagem diz o que as barras laranjas significam.

## Minúcias
- 24 barras para "last 24 days": a contagem bate com a legenda.
- "+1.2k" sem caixa nem seta: o sinal e a cor bastam.
- O ícone do cabeçalho mora num ladrilho com borda própria, num cinza mais claro que o card.
- O metadado tem ícone (relógio) e a legenda do gráfico não: o ícone marca "informação sobre o sistema", não sobre o dado.
- O selo "Live" fica na mesma altura do título, alinhado ao centro da linha.

## Por que funciona
- Ordem por importância (better-layout): o número que se veio buscar sobe antes do gráfico e de qualquer detalhe.
- Grupo por espaço: vão pequeno dentro do bloco de dado, vão grande antes do pé; nenhuma linha separadora.
- Uma cor, um significado (better-colors): verde = normal/positivo; a segunda cor só onde há exceção.
- Ação neutra: só o dado tem cor, então o botão não disputa o foco.

## Receita
- O total vai a pelo menos 2× o texto de apoio; a variação vai ao lado, na mesma base, com metade do tamanho e a cor do sentido.
- Abra com o rótulo da métrica em cinza e titule com a pergunta que o número responde.
- Uma barra por unidade de tempo, todas na mesma largura, ocupando a largura do conteúdo; a legenda diz quantas e de quando.
- Pinte a série numa cor só; use uma segunda cor apenas nas barras que são exceção, e diga na legenda o que ela quer dizer.
- Vão entre dado e pé ~2× o vão dentro do dado.
- Ação no pé, neutra, alinhada ao mesmo eixo esquerdo.
- Lição: número → forma → contexto, com cor só na exceção. Só o visual do original: cápsulas, verde/laranja, ladrilho do ícone.

## Falhas
- As duas barras laranjas não têm legenda: o leitor vê a exceção mas não sabe o que ela é. Não copie exceção sem explicação.
- O verde vale para três coisas (série, variação, "Live"); funciona aqui, mas mistura "positivo" com "ao vivo".
- Sem eixo nem valor por barra: dá a tendência, não a leitura de um dia.
