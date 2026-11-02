# Brief: ficha do participante do BBB

Pedido do designer: "crie 4 explorações de uma interatividade de ficha do participante para o BBB. A intenção do card é que o usuário consiga ter, de maneira rápida e objetiva, informações dos participantes: foto, nome, idade, quantidade de estalecas e os emojis que cada um recebeu. Será um card apenas informativo e sem interações, onde cada card mostra informações de apenas 1 participante por vez."

O que vem do pedido está sem marca; o que foi deduzido está marcado `Suposição`. O plano foi tratado como aprovado para esta rodada de teste: o designer delegou a aprovação.

## Para quê e onde
O espectador vê, numa interatividade contextual durante o programa, a ficha de um participante e a entende de relance. Um card por participante, um participante por vez.

## Intenção
"a mix between quick and objective and fun, reality-show energy". Não quer: card cheio, texto demais, mais de uma informação disputando o primeiro lugar com quem é.

## Foco
Foto e nome (quem é). O resto fica em segundo plano: idade, estalecas, emojis recebidos e a tag de estado.

## Direção visual
- Tom: retrato, placa, contagem · temperatura: quente, e o calor vem só do conteúdo (pele e luz da foto, cor dos emojis), sobre a superfície neutra do kit. Nenhuma cor é posta pelo card.
- Fio condutor: em todas as opções, a foto do participante (cerca de 60% do card) e o nome colado a ela são lidos num único olhar, antes de qualquer outra peça.
- Referência principal: ref1-tag-on-photo (tag) e ref2-card-composition (vazio) · teoria confirmada:
  - tag de estado na foto: uma pílula só, sobre a área calma da imagem, com ~5% da área do quadro (~19 partes de foto para 1 de texto) e uma linha num tamanho só;
  - vazio largo em volta da peça central: o texto ocupa só faixas finas, com vãos de ~1/6 e ~1/5 da altura do card em volta da peça, e nada dentro deles.
- Levar:
  - **Foto em ~60% do card:** a foto sangra no topo e nas laterais do Content Card até 55–65% da altura, medida no PNG. Usa o degrau de imagem G do kit (DESIGN §6.1) e segue o raio interno do card. O corte põe o rosto inteiro no terço superior da foto, sem cortar o queixo.
  - **Foto e nome num olhar:** o nome fica em `.text-heading-3-bold` com `--color-semantic-functional-text-primary`. Ele senta na borda de baixo da foto, sobre o scrim do kit, ou logo abaixo dela a `--dimension-spacing-core-2xs`. É o maior texto do card, pelo menos 2× o apoio (`.text-body-sm-medium` ou `.text-footnote-medium` em `--color-semantic-functional-text-muted`). Idade, estalecas e emojis ficam juntos numa única faixa de apoio. As estalecas usam `font-variant-numeric: tabular-nums` e nunca tamanho de display.
  - **Tag de estado na foto:** uma única pílula (`--dimension-radius-semantic-pill`), com uma linha em `.text-body-sm-medium`, sobre a área calma da foto, longe do rosto. Fica alinhada ao eixo esquerdo do card, a `--dimension-spacing-semantic-card-inset-expanded` das bordas. Fundo `--color-opacity-light-20` (ou `-light-10`), texto `--color-semantic-functional-text-primary`, contraste de pelo menos 4,5:1 medido nos pixels reais da foto. Se a área calma for clara demais, a tag desce para a zona do scrim. Ela tem no máximo ~1/3 da largura da foto e é a única peça sobre a foto além do nome.
  - **Vazio largo em volta:** a foto é a única massa. Fora dela há só o grupo do nome e uma faixa de apoio. Entre os dois, um vão só, `--dimension-spacing-core-sm`; dentro de cada grupo, `--dimension-spacing-core-3xs` ou `-2xs`. Sem divisor, sem ícone além dos emojis, sem caixa em volta dos dados; o único separador permitido é o ponto de 4px entre idade e estalecas (DESIGN §7.2). A energia de reality show vem da foto e dos emojis em cor real (conteúdo), nunca de peças a mais.
- Evitar:
  - **Degradê multicor no card:** qualquer degradê na superfície além do scrim do kit, ou uma cor por participante. Se aparecesse, cada ficha teria um fundo tingido diferente, como os cards laranja, verde e azul da ref 2.
  - **Pílula branca opaca:** a tag com fundo claro e opaco e texto escuro. Seria a receita do item selecionado do kit (`--color-semantic-functional-text-primary` de fundo com `--color-semantic-functional-text-inverse`) e leria como algo que o controle remoto alcança. Também fica proibido o contorno de luz de peça focável (DESIGN §9.5): o card não tem interação.
  - **Segundo ponto focal:** tag, estalecas ou a fileira de emojis maiores ou mais contrastados que o nome. Se acontecesse, o olhar entraria pelo dado, e não por quem é.
- Palavras do designer:
  - "photo and name (who it is)"
  - "a mix between quick and objective and fun, reality-show energy"
  - "A tag can be used on top of the image to communicate the participant's status in the game"
  - "The card composition, with a good distribution of information and the photo as the center piece"
  - Respostas da rodada 2: "Tag de estado na foto", "Vazio largo em volta", "Degradê multicor no card", "Pílula branca opaca", "Foto em ~60% do card", "Foto e nome num olhar"
- Inegociável: o designer não deu critério de descarte. O que as respostas fecham: foto e nome lidos num único olhar; nenhum degradê multicor no card; nenhuma pílula branca opaca.
- Teste de fidelidade: a foto ocupa entre 55% e 65% da altura do card, o nome está colado a ela e é o maior texto, e a única outra peça sobre a foto é uma tag que não é branca nem opaca?
- Distância por opção:
  - 1 **fiel:** tag no canto inferior esquerdo da foto, como na ref 1; nome logo abaixo da foto; uma faixa de apoio embaixo.
  - 2 **reinterpretada:** nome sobre o scrim na borda de baixo da foto; tag num canto superior; apoio abaixo.
  - 3 **reinterpretada:** outra estrutura, com a foto em ~60% da largura de um card horizontal e nome e apoio na coluna ao lado; a tag continua na foto.
  - 4 **contraponto:** inverte o vazio. Os emojis recebidos viram uma segunda massa de cor abaixo do nome, para testar até onde vai a energia de reality show. A foto e o nome ainda precisam ganhar no olhar rápido.

## Controle
Apenas visual: sem interação, sem foco interno, sem teclas dentro do card. Não desenhe botão, seletor, aba, seta de abrir nem nada que pareça clicável. O card não tem estado de foco. A tag de estado não é um controle.

## Estados
Só o estado padrão. `Suposição`: sem foco, selecionado, desabilitado nem carregando.

## Conteúdo
Dados fixos (usar exatamente estes, sem inventar outros; a foto é um espaço reservado, sem foto real):
- Foto do participante (espaço reservado)
- Nome: Camila Duarte
- Idade: 27 anos
- Estalecas: 3.250
- Emojis recebidos: 🐍 12 · 💔 7 · 🌱 5 · 🎯 3
- Tag de estado: Paredão. `Suposição`: o pedido não traz um estado de jogo; a tag que o designer pediu precisa de um valor, e este é o escolhido.

## O que varia
4 opções. Variam a tese e o arranjo, dentro da Direção visual: a distância de cada opção é a que o bloco marca (1 fiel, 2 e 3 reinterpretadas, 4 contraponto). O brief só admite o card estático, então as opções não mudam de padrão de teclas; diferem pela estrutura. Ficam iguais: o conteúdo acima, o Foco (foto e nome) e a superfície.

## Superfície
Content Card do kit (painel alto de uma interatividade contextual), a mesma nas 4 opções. A opção 3 cabe nesse painel: a foto ocupa cerca de 60% da largura, e a coluna fica ao lado, dentro da largura do Content Card.

## Opção 1 · Tag no canto
- **Tese:** a foto ocupa cerca de 60% da altura, a tag "Paredão" senta no canto inferior esquerdo da foto, e o nome cola logo abaixo dela.
- **Foco em cena:** a foto é a massa (cerca de 60% da altura, sangrando no topo) e o nome é o maior texto, colado na borda de baixo da foto, a 2× o apoio. A tag recua para uma pílula pequena sobre a área calma. Idade, estalecas e emojis ficam numa faixa só, mais quieta.
- **Referência:** `cidade-foto-com-seletor` (a foto dá o lugar e o texto fica na faixa calma). Só a foto e o texto; o seletor não entra.
- **Interação:** nenhuma (só visual).
- **Peças:** foto com a tag; nome; faixa de apoio (idade, estalecas, emojis).
- **Regras:** `raios-concentricos`, `tipografia-de-detalhe`.

## Opção 2 · Nome no véu
- **Tese:** o nome senta sobre o scrim na borda de baixo da foto, a tag fica num canto superior, e o apoio fica abaixo da foto, com vão largo entre os dois.
- **Foco em cena:** a foto continua a maior massa e o nome, em heading sobre o scrim, é o único texto grande colado a ela. A tag no alto é menor e translúcida. A faixa de apoio recua para baixo do vão.
- **Referência:** `cartazes-tipograficos` (o texto mora num vão limpo e a massa visual preenche o resto). Só a divisão de zonas; a textura de letras não entra.
- **Interação:** nenhuma (só visual).
- **Peças:** foto com nome no scrim e tag no alto; faixa de apoio.
- **Regras:** `raios-concentricos`, `tipografia-de-detalhe`.

## Opção 3 · Coluna ao lado
- **Tese:** a foto ocupa cerca de 60% da largura, com a tag sobre ela, e o nome com a faixa de apoio formam uma coluna ao lado.
- **Foco em cena:** a foto é a massa à esquerda e o nome, no topo da coluna, é o maior texto, colado na altura do rosto. A tag fica pequena na foto. Idade, estalecas e emojis descem na coluna, menores e mais frios.
- **Referência:** `saude-anel-metricas-e-barras` (o título é a conclusão e os números ao lado são a prova). Só essa relação; anel, barras e interruptores não entram.
- **Interação:** nenhuma (só visual).
- **Peças:** foto com tag; nome; faixa de apoio na coluna.
- **Regras:** `raios-concentricos`, `tipografia-de-detalhe`.

## Opção 4 · Emojis como segunda massa
- **Tese:** a foto e o nome ainda ganham o primeiro olhar, e os emojis recebidos formam uma segunda massa de cor abaixo do nome, invertendo o vazio.
- **Foco em cena:** a foto em cerca de 60% da altura e o nome colado a ela continuam maiores que cada emoji. A tag fica pequena na foto. Os quatro emojis ganham área, sem caixa e sem degradê, e a idade com as estalecas fica na faixa do nome, menor que ele.
- **Referência:** `cartoes-de-humor-gradiente` (uma reação por célula). Só a contagem ao lado do emoji; o degradê, a caixa e a escolha não entram.
- **Interação:** nenhuma (só visual).
- **Peças:** foto com tag; nome com idade e estalecas; fileira de emojis.
- **Regras:** `raios-concentricos`, `tipografia-de-detalhe`, `esqueleto-fixo`.
