# Crítica de direção, rodada 6: foco-clima-2

Julgado a partir dos PNGs de `rodadas/2/` (repouso, → e Enter) e de uma nova captura de cada card em 3×. Na 3× também percorri os quatro dias da opção 3 (Hoje, Ter, Qua e Qui). As caixas foram medidas no DOM. A altura do algarismo, as bases dos objetos e o contraste foram medidos nos pixels da captura em 3×. Para o contraste, comparei duas capturas: uma com o texto e outra com o texto transparente.

Todas as imagens carregaram e as quatro opções foram julgadas por inteiro. Isso vale também para os `assets/*.png` relativos e para os PNGs embutidos.

Origem dos PNGs desta rodada:
- a 1 usa `o1v6` (novo, 576 px);
- a 3 usa `o3v6-*` (novos, 576 px);
- a 2 e a 4 seguem com `o2v4` e `o4v4`, embutidos e idênticos aos arquivos.

O algarismo tem **52,7 px** de altura nas quatro (`.text-display-lg-bold`), e o ° tem 36 px nas quatro.

## As quatro em números

| | Card | Algarismo / card | Objeto / algarismo | Folgas dentro do grupo | Grupo → faixa | ° contra o topo dos algarismos |
|---|---|---|---|---|---|---|
| 1 | 297 | 17,7% | **3,7×** (197 px visíveis) | 17 e 16 | 40 | rente (−0,3 px) |
| 2 | 356 | 14,8% | 1,7× (89 px) | 12 e 20 | 35 | rente (−0,3 px) |
| 3 | 372 | 14,2% | ≈2,1× (sol e nuvem; as faixas vão até a borda) | 21 e 21 | 27 (24 na caixa) | **1,7 px abaixo** |
| 4 | 269 | 19,6% | 2,5× (132 px) | 17 e 16 | 62 | rente |

## Veredito por opção

**Opção 1 (contraponto, refs. 12 e 6): Quase.**
- **Levar:**
  - Número: ok. O algarismo tem 17,7% do card e o ° está rente.
  - Grupo: ok. São Paulo, o 24° e a palavra formam uma peça, com 17 e 16 px entre as partes.
  - Objeto: a mão melhorou, mas a cor saiu da paleta.
    - **O que entrou** (pedido na rodada 5): PNG a 2×, esferas de borda limpa, sol à esquerda, esferas brancas com luz do alto à esquerda e base de barrigas redondas.
    - **O que saiu da paleta:** para dar fundo ao #EEE, o miolo da nuvem virou um disco azul-marinho (mediana 80,86,122). Ele ocupa 61% do objeto e **30% do card**, cerca de 25.500 px². O brief pede amarelo do sol, branco-azulado da nuvem e cinza de chuva. Este azul-marinho não é nenhum dos três, e é mais escuro que a nuvem de chuva de Ter na opção 3 (183,188,218). O card diz "Sol entre nuvens" e mostra uma tempestade.
    - **O sol quase some.** Uma esfera branca cobre mais da metade do disco. Sobram ≈880 px² de amarelo, raios incluídos, contra ≈2.160 na 4 e ≈1.430 na 2. Lê como um sol atrás da nuvem, não entre nuvens.
    - **O objeto vence o número.** Ele tem 3,7× o algarismo, perto do teto de 4×, e ocupa os 206 px de cima do card. Ao apertar os olhos, o que se vê primeiro é o medalhão azul-marinho com uma coroa de bolhas brancas, e só depois o 24°. O brief pede o contrário: "o número, não o objeto, é a atração".
- **Evitar:**
  - Contraste: ok, e é a correção desta rodada. O 24° tem mediana de 5,4:1 com o #EEE e mínimo de 4,6:1, sem nenhum pixel abaixo de 4,5:1. "Sol entre nuvens" tem mínimo de 4,3:1 em 0,1% do fundo.
  - Anel de foco em repouso: corrigido. Ele só aparece com o card em foco.
  - Cor fora da paleta do objeto: entrou o azul-marinho (acima).
- **Teste de fidelidade:** sim. Há um objeto só, e ele é a única cor. O 24° é o maior texto e o centro é permitido no contraponto.
- **Genérico a olho:** as três células contornadas de mesmo peso, que são regra do kit e que o brief aceita.
- **Teclas:**
  - → passa o anel para "Umidade".
  - Enter abre a frase embaixo das células. O card cresce para baixo e as células não se movem.
- **Um ajuste:** trocar a composição, de "grupo sobre a nuvem" para "**grupo no berço da nuvem**" (detalhes na seção abaixo).

**Opção 2 (reinterpretada, ref. 4): Tem a cara.**
- **Levar:**
  - Número: ok. O algarismo tem 14,8% do card.
  - Grupo: ok. Do objeto ao 24° há 12 px, e do 24° a São Paulo há 20 px.
  - Objeto: ok. Tem 1,7× o algarismo, que é a proporção da ref. 4, com sol de raios em pílula, halo e nuvem de esferas brancas com barriga lavanda.
  - A palavra: ok, e é a correção desta rodada. "Sol entre nuvens" agora cabe em **uma linha**: começa em x 144, tem 109,8 px e termina a 2 px do inset.
  - Faixa: ok. O seletor é texto, com "Agora" em bold, e os dados ficam em rótulo sobre valor.
- **Evitar:** ok.
- **Visto e aceito:** em "Agora", as colunas do seletor (x 32, 100, 159) e as dos dados (x 32, 90, 170) não se alinham, por ≈10 px. Não peço o alinhamento, por dois motivos:
  - "Sensação" (55 px) não cabe entre x 100 e x 159;
  - Hoje e Semana têm quatro itens, então nenhuma grade comum vale nos três estados.
- **Teste de fidelidade:** sim.
- **Genérico a olho:** nenhum que pese. A disposição ⛅ (sol grande atrás, nuvem pequena à frente) é a mais próxima de um ícone de app nas quatro, mas o volume, o grão e a escala de 1,7× a tiram do banco de ícones. É a forma (a) do brief.
- **Teclas:** → leva o anel a "Hoje", e a faixa troca para as horas. Nada mais muda. Enter não faz nada, como pede o brief.
- **Um ajuste:** nenhum: ótimo.

**Opção 3 (reinterpretada, refs. 10, 2 e 11): Tem a cara.**
- **Levar:**
  - Número: ok. O algarismo tem 14,2% do card.
  - Imagem: ok, e a emenda sumiu. Em Hoje e em Qua, as esferas de baixo fecham redondas, com a barriga lavanda inteira. As faixas de luz se esmaecem abaixo das nuvens e terminam logo acima de São Paulo, sem nenhuma linha reta atravessando uma esfera.
  - Série: ok. Hoje, Ter (chuva), Qua (nublado) e Qui (sol forte) trocam a imagem, o número e a palavra, e nada mais.
  - Trilho: ok, e é a correção desta rodada. Da palavra ao contorno do trilho há 24 px na caixa e 27 visíveis, contra 21 dentro do grupo. O trilho já não lê como uma quarta linha do grupo.
- **Evitar:**
  - O trilho andava no Enter: corrigido. Enter abre média, sensação e umidade **abaixo** do trilho, e o trilho fica parado na mesma posição antes e depois.
  - **O ° caiu.** Ele fica 1,7 px abaixo do topo dos algarismos, enquanto na 1, na 2 e na 4 está rente (`DESIGN.md` §2.3). Na 3×, o "2" e o "°" não começam na mesma linha.
  - Fora do PNG: o dissolve da imagem ainda usa `ease` no lugar de `--motion-semantic-easing` (linha 142). Isso não aparece numa foto, mas é regra do kit.
- **Teste de fidelidade:** sim.
- **Genérico a olho:** as quatro células de mesmo peso no trilho, que são regra do kit (§9.5) e que o brief aceita.
- **Um ajuste:** subir o ° 2 px, até ficar rente ao topo dos algarismos. Basta usar a mesma receita da 2 e da 4, que já medem −0,3 px.

**Opção 4 (fiel, ref. 5, estática): Tem a cara.**
- **Levar:**
  - Número: ok. O algarismo tem 19,6% do card e é a entrada, no canto de cima à esquerda. O ° agora está rente (corrigido).
  - Objeto: ok. Tem 2,5× o algarismo e é cortado só pela borda direita.
  - Faixa: ok, e é a correção desta rodada. Da base da nuvem (y 184,7) ao topo das letras de "Umidade" há ≈19 px (16 até a caixa). É a folga da ref. 5, e o texto já não parece uma prateleira.
  - Uma faixa só, em `text-muted`. O grupo tem 17 e 16 px por dentro e 62 px até a faixa.
- **Evitar:** ok.
- **Visto e aceito:** a base da nuvem é reta por ≈65 px (x 205 a 270). É a base chata de um cúmulo, e a 19 px do texto já não lê como corte.
- **Teste de fidelidade:** sim.
- **Genérico a olho:** nenhum.
- **Um ajuste:** nenhum: ótimo.

## A composição da opção 1: viável ou não?

**Com franqueza: "grupo centrado sobre a nuvem" não é viável como contraponto ótimo.** O problema não é de desenho, é de aritmética.
- **A conta do contraste.** Para o #EEE passar de 4,5:1, o fundo precisa ter luminância ≤ 0,15, o que dá um cinza de ≈108 ou mais escuro. Na paleta do brief, as nuvens têm luminância de ≈0,86 (o branco-azulado) e ≈0,58 (a barriga lavanda). Contra o #EEE, isso dá 1,0:1 e 1,5:1.
- **Por isso o redesenho sempre escurece.** Toda nuvem que fica atrás do 24° acaba pintada de escuro: foram ardósia na rodada 5 e azul-marinho na 6. Uma nuvem escura é uma nuvem de tempestade, o que contradiz a palavra e tira a paleta da família.
- **A coroa clara come o sol.** Para a nuvem continuar lendo como nuvem, o desenho põe uma coroa de esferas claras em volta do escuro, e essa coroa cobre o sol.
- **O texto escuro não resolve.** Pôr o 24° em `--color-semantic-functional-text-inverse` sobre a nuvem branca também falha. Faria uma caixa de luz de 2/3 do card numa sala escura (`DIRECAO.md` §4, item 12) e quebraria a série, que tem o #EEE nas quatro.

**Também não recomendo as duas saídas sugeridas como estão:**
- **A nuvem em faixa na metade de baixo, com a faixa de dados sobre ela:** o `text-muted` (70% de branco) cairia sobre o branco da nuvem.
- **O objeto atrás só do rodapé do grupo:** a palavra de 14 px em `text-muted` cairia sobre a nuvem, que é a pior combinação de contraste do card.

**A composição que proponho: o grupo no berço da nuvem.** A nuvem envolve o grupo por trás e pelos lados, e nenhum pixel de texto cai sobre ela. Card de 288 px de largura, inset `--dimension-spacing-semantic-card-inset-expanded` (32 px), medidas em px do card:

- **Grupo**, centrado e preso à borda de cima, com as folgas de hoje (17 e 16 px):
  - São Paulo a partir de y 32;
  - os algarismos de y ≈52 a y ≈105, ocupando x 99 a 204 com o °;
  - "Sol entre nuvens" com a caixa de y ≈128 a y ≈144, ocupando x 89 a 199.
  - Todo o texto fica sobre o cinza neutro do card, com ≈9:1, como nas outras três.
- **A nuvem** é um banco cortado pelas **duas** bordas laterais, num PNG de 576 × 304 px (2×) mostrado em 288 × 152, de y 62 a y 214. A silhueta tem duas cristas e um vale:
  - a crista da esquerda sobe até y ≈100 (a linha de base do 24°), sempre em x ≤ 80. Na altura da palavra, ela fica em x ≤ 73;
  - a crista da direita sobe até y ≈104, sempre em x ≥ 218;
  - o vale fica entre x 80 e x 210, com o topo em y ≥ 160 (16 px sob a palavra), numa fileira só de esferas;
  - a base é de barrigas redondas, com a mais baixa em y ≈214 e nenhum trecho reto;
  - a nuvem ocupa ≈28% do card, entre 1/4 e 1/3, como a forma (b) do brief e como a 4.
- **O sol** fica atrás da crista da esquerda:
  - centro em (50, 88), disco de Ø 44 px, com raios em pílula e halo, como na 2 e na 4;
  - os raios terminam em x ≤ 84, a 15 px do "2";
  - fica ≥ 60% do disco à vista, com a parte de baixo à direita escondida pela crista.
- **A mão** é a da 4: esferas branco-azuladas com luz do alto à esquerda, barriga lavanda e grão fino. Nenhuma esfera escura e nenhum azul-marinho.
- **A faixa** de três células começa em y ≈230, 16 px sob a base da nuvem. O Enter abre a frase embaixo dela, como hoje.
- **Conta final:**
  - card ≈304 px;
  - algarismo/card ≈17,3%;
  - objeto (do topo dos raios, y ≈56, à base, y 214) ≈158 px, ou seja, ≈3,0× o algarismo.

**O teste que separa o berço da pilha de estoque.** A nuvem tem de tocar as duas bordas laterais, e as cristas têm de subir até a linha de base do 24°. Se a nuvem ficar solta embaixo do texto, sem tocar as bordas, vira a pilha centrada ícone/número/rótulo que o brief manda evitar: descarte.

O que o contraponto mantém:
- inverte o eixo esquerdo (é centrado);
- põe o objeto atrás do grupo (as cristas sobem por trás dos lados do grupo, como na ref. 12);
- o número fica com a maior massa de contraste, e o objeto volta a ser a única cor, dentro da paleta.

Esta troca muda a linha "Foco em cena" da opção 1 no brief ("eles leem sobre a parte de sombra da nuvem"). Essa mudança é decisão do designer.

## A mão de desenho, lado a lado

| | 1 | 2 | 3 | 4 |
|---|---|---|---|---|
| Sol | disco com raios em pílula e halo, no alto à esquerda, **menos da metade à vista** (≈880 px² de amarelo) | disco inteiro, raios em pílula, halo (≈1.430 px²) | bola sem raios, com reflexo forte no alto à esquerda (a luz está nas faixas) | disco com raios em pílula e halo, cortado em baixo pela nuvem (≈2.160 px²) |
| Nuvem | **miolo azul-marinho (80,86,122) em 61% do objeto**, com uma coroa de esferas brancas | esferas brancas, barriga lavanda | esferas brancas, barriga lavanda, borda limpa | esferas brancas, barriga lavanda, borda felpuda (o grão passa da silhueta) |
| Luz | brancas do alto à esquerda; as escuras do alto ao centro | alto à esquerda | alto à esquerda | alto à esquerda |
| Base | barrigas redondas (corrigido) | redonda | barrigas redondas, sem emenda (corrigido) | reta por ≈65 px, de cúmulo |
| Grão | fino no sol; as esferas são quase lisas | fino | fino e visível em tudo | um pouco mais grosso, nas bordas |
| px de imagem por px | 2,0 (corrigido) | 2,0 | 2,0 | 1,85 |

- **A família é a mesma em três das quatro.** A 2, a 3 e a 4 têm a mesma paleta (amarelo, branco-azulado, lavanda), a mesma luz e o mesmo grão. As diferenças que ficam são de grau e não de mão: o sol sem raios da 3 se justifica pelas faixas de luz, e a borda da 4 é um pouco mais felpuda.
- **A 1 se aproximou na técnica, mas não na cor.** Já tem resolução, borda, base e luz das brancas iguais às outras. O que ainda a separa é o azul-marinho, e ele existe por causa da composição, não da mão. Por isso o ajuste é de composição.

## Contra a rodada 5

- **1.**
  - Entraram a nuvem a 2×, o sol à esquerda, a base redonda, o contraste (o mínimo sob o 24° subiu para 4,6:1) e o fim do anel em repouso.
  - Em troca, o escuro virou um disco azul-marinho de 30% do card, o sol perdeu mais da metade e o objeto subiu de 3,3× para 3,7×.
- **2.** A palavra cabe numa linha. Não resta nada.
- **3.** Entraram o detalhe abaixo do trilho, o trilho a 24 px e o fim da emenda. Restam o ° 1,7 px abaixo, que já aparecia na tabela da rodada 5, e o `ease`.
- **4.** Entraram a faixa ≈19 px abaixo da nuvem e o ° rente. Não resta nada.

## Uma direção ou quatro?

É uma direção, e as distâncias se leem:
- a 4 é a ref. 5 traduzida;
- a 2 é a ref. 4;
- a 3 é a ref. 10 em série;
- a 1 é o contraponto.

As quatro dividem o número em display como arquitetura (14,2% a 19,6% do card), um objeto de tempo como única cor, o card neutro, a palavra no grupo e uma faixa só. O único ponto que ainda divide a série é a cor do objeto da 1. Ele resulta de uma composição que exige uma nuvem escura, e por isso o problema da 1 é a composição, não o desenho.

**Quantas estão ótimas (Tem a cara sem ajuste): duas, a 2 e a 4.**
- **A 3** fica ótima com o ° 2 px acima, rente aos algarismos. Ainda precisa trocar `ease` por `--motion-semantic-easing`, que é um conserto de código invisível no PNG e que o juiz de kit também pega.
- **A 1** precisa trocar de composição para o berço da nuvem (medidas acima). Com isso caem de uma vez o azul-marinho, o sol escondido e o objeto maior que o número. Antes, o designer decide se aceita mudar a linha "Foco em cena" da opção 1 no brief.
