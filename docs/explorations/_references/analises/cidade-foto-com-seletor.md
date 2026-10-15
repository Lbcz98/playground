# cidade-foto-com-seletor
Tags: foto como contexto, rota simétrica, seletor que troca o card inteiro
Padrão: Seletor segmentado
Resumo: Card de viagem com foto da cidade de fundo, rota de dois aeroportos e um seletor de duas cidades que troca a foto e o título.

## Cerne
O seletor no rodapé é um filtro do card: escolher "San Francisco" ou "New York" muda a foto, o título no topo e provavelmente a ênfase da rota. A foto ocupa o card todo e dá o lugar; o texto fica nas duas faixas em que a foto é mais escura ou mais calma (céu no topo, neblina embaixo).

## Peças
Quatro peças:
- Título centralizado no topo ("San Francisco").
- Foto de fundo de ponta a ponta (ponte na neblina).
- Bloco de rota: código de origem à esquerda (CDG, 9:15 PM, Paris), código de destino à direita (SFO, 12:45 AM, San Francisco), ícone de avião e linha ondulada no centro.
- Divisor fino + seletor segmentado de dois itens no rodapé ("San Francisco" selecionado, "New York").

## Tipografia
- Uma família sem serifa; quatro tamanhos (estimado): código, horário/título, nome da cidade, rótulo do seletor.
- Código do aeroporto cerca de 1,5× o horário e cerca de 2× o nome da cidade (estimado), peso semibold, em caixa alta por natureza.
- Horário em branco puro, regular; nome da cidade menor e em branco com opacidade reduzida.
- Título do topo em tamanho de horário, regular, centralizado.
- Rótulos do seletor no mesmo tamanho; o selecionado em preto sobre branco, o outro em branco.
- Origem alinhada à esquerda, destino alinhado à direita: os textos se espelham.

## Posição e espaço
- O bloco de rota começa a pouco mais da metade da altura (estimado), onde a neblina começa; o céu e a ponte ficam livres de texto exceto o título.
- Margem lateral igual para a rota, o divisor e o seletor; tudo na mesma borda.
- Rota simétrica em três colunas: pontas com texto, centro com ícone e linha.
- Dentro de cada ponta, gap entre código e horário maior que entre horário e cidade (estimado): o código se destaca, horário e cidade formam um par.
- Seletor ocupa a largura total; o segmento selecionado é uma pílula branca que ocupa metade, com raio menor que o da barra que a contém (aninhada).
- Raio do card grande; barra do seletor com raio moderado.

## Cor e superfícies
- A foto dá toda a cor (azul-esverdeado do céu, laranja da ponte e das nuvens); a interface não tem acento próprio.
- Texto todo em branco, em duas opacidades: cheio para código e horário, reduzido para cidade e para o segmento não selecionado.
- A metade inferior da foto escurece em direção à base (estimado: um véu ou o próprio tom da neblina), o que garante leitura do texto branco.
- A barra do seletor é escura translúcida sobre a foto; o selecionado é branco opaco: o maior contraste do card está no estado escolhido.
- A foto tem textura granulada, tratada como ilustração.

## Hierarquia e leitura
Foto (lugar) → códigos da rota → horários → seletor. O título do topo é pequeno e serve de rótulo para a foto, não de manchete.

## Interação
- **Visível:** cursor sobre "San Francisco" no seletor, segmento selecionado em branco.
- **Inferido:** escolher "New York" troca a foto, o título e a ênfase da rota (talvez inverta origem e destino ou mostre o outro trecho). A imagem não mostra o outro estado nem a transição.

## Minúcias
- A linha da rota é ondulada, desenhada à mão, não reta nem tracejada; o avião fica acima dela, pequeno, inclinado.
- O divisor acima do seletor é uma linha branca de baixa opacidade, quase invisível.
- O segmento não selecionado não tem fundo, só texto: o selecionado é a única pílula.
- Os horários usam AM/PM com espaço e o código sempre em três letras: as colunas ficam com largura parecida.

## Por que funciona
- **Conteúdo sangra, controles flutuam** (better-layout): a foto vai até as bordas; texto e seletor ficam dentro das margens.
- **Contraste do texto sobre imagem** (better-colors, gradientes): o texto fica só onde a foto é calma e escura.
- **Estado selecionado com contraste máximo** (better-colors, uso): o segmento escolhido é a única superfície opaca.
- **Raios concêntricos** (better-ui): pílula selecionada encaixada na barra.

## Receita
1. Use a imagem de ponta a ponta e ponha o texto só nas faixas mais calmas, com um véu escuro onde for preciso.
2. Texto em uma cor sobre a imagem, em duas opacidades: cheia para o dado, reduzida para o rótulo.
3. Código ou dado principal a cerca de 2× o rótulo; origem à esquerda, destino à direita, espelhados.
4. O seletor tem 2 ou 3 segmentos; o escolhido é a única superfície opaca do card.
5. O seletor troca o contexto inteiro (imagem e título), não só um número.
6. A peça selecionada leva raio menor que a barra que a contém.
Lição: imagem como contexto + filtro de 2 segmentos que troca tudo. Só aparência: a textura granulada, a linha ondulada, a ponte.

## Falhas
- O título do topo repete "San Francisco" do segmento selecionado e do destino.
- O nome da cidade em branco reduzido sobre a neblina clara tem pouco contraste (estimado).
- Cursor de mouse: não existe na TV; não há estado de foco separado do estado escolhido.
