# Queridômetro

Pedido: 3 variações de uma interação do card queridômetro, no perfil de um participante do BBB. A pessoa vê quem enviou cada emoji. Referência: [frame 296×309](https://www.figma.com/design/Dri6lz1Y2fGXI7DfZEdf5D/%F0%9F%A7%AA-Prot%C3%B3tipos-BBB?node-id=7799-38938&m=dev), Ana Paula Renault.

**Para quê e onde.** Na TV, dentro do perfil de uma participante. O card abre para ver quem mandou cada reação para ela.

**Intenção.** Como uma fofoca que se ouviu, misteriosa e pessoal. Recusar ranquear pessoas.

**Foco.** Quem enviou a reação. A contagem dessa reação fica no card, mais quieta.

**Direção visual**
- Tom: uma pessoa só · temperatura: quente, pelo brilho roxo-magenta que cai no canto inferior direito de um campo quase preto
- Fio condutor: Nas 3 opções o olho entra primeiro nos três rostos de quem enviou a reação, cada um maior que o número dessa reação, e as contas ficam em cada rosto sem serem a ordem da leitura.
- Referência principal: frame do queridômetro, Ana Paula Renault, 296×309 · teoria confirmada: card de uma pessoa no eixo x=32 (foto da participante 48px, nome 19px); número e palavra na mesma linha. O anel da fileira não foi o que puxa; entra porque o card inteiro entra. Quem decidiu a hierarquia: o designer. Na imagem o 12 tem 48px e os rostos têm 32px, em fila 8x, 3x, 1x. Ele ficou com o resto e inverteu esses dois pontos.
- Levar:
  - Os três rostos de quem enviou são a âncora e a entrada. Cada rosto é maior que a altura do número da reação; esse número deixa os 48px, não tem cor própria e fica de apoio.
  - As contas ficam no rosto: 8x, 3x e 1x ao lado de cada foto, no mesmo tamanho, e a posição não segue o valor.
  - Uma pessoa no eixo esquerdo, x=32: foto da participante a 48px, nome, chips Líder e VIP, e um brilho só, roxo-magenta, no canto inferior direito.
  - ←/→ troca a reação desta pessoa na fileira de círculos. O corrente leva anel (na referência, círculo de 40px, traço vertical de 24px, os outros a 36px). A única tecla que troca a reação é ←/→.
- Evitar:
  - Rostos em fila de conta, 8x depois 3x depois 1x, o maior na frente.
  - O número da reação a 48px como a maior massa, com os rostos menores embaixo.
  - Rostos e número da mesma altura, os dois disputando a entrada.
- Palavras do designer: "Card de uma pessoa", "Número com a palavra", "as três fotos, hoje 32px, passam à frente e o olho entra nelas. O 12 sai dos 48px e fica no card, menor que os rostos.", "As contas ficam em cada rosto, sem fila do maior para o menor. 8x, 3x e 1x continuam no card, mas a ordem deixa de ser a leitura.", "como uma fofoca que se ouviu, misteriosa e pessoal. Recusar ranquear pessoas.", "Nada, levaria tudo."
- Inegociável: rostos lidos em ordem 8x, 3x, 1x, ou o 12 a 48px como a maior massa.
- Teste de fidelidade: No PNG, o olho entra nos três rostos de quem enviou, cada um maior que o número da reação, e a posição deles não segue a conta?
- Distância por opção: 1 fiel, a imagem com duas trocas (rostos maiores que o número; contas fora de ordem), margem 32, respiros 24, número e palavra na mesma linha com 8px entre eles · 2 reinterpretada, os mesmos mecanismos, os três rostos fora da fileira horizontal e ocupando o miolo · 3 contraponto, o fio fica e o número sai da linha da palavra

**Controle.** ←/→ troca a reação desta participante. Sem laço nas pontas. Suposição: Enter não age, porque quem enviou já está no card. Suposição: Voltar, no estado inicial, sai do card.

**Estados.** Repouso: anel na reação corrente e os três rostos dessa reação. O anel marca o controle; o grupo de quem enviou fica no mesmo lugar e no mesmo peso. Suposição: ← na primeira e → na última não fazem nada. Suposição: uma reação sem envios deixa o grupo vazio e o número em 0, ainda menor que o lugar dos rostos.

**Conteúdo.** Ana Paula Renault, Líder, VIP. Reação à vista: 12 corações. Quem enviou, fora de ordem de valor: foto 3x, foto 1x, foto 8x. O frame não nomeia essas três pessoas. Suposição: a opção 1 mantém a fileira do frame, com o último círculo cortado na borda. A opção 2 mostra 4 reações, o teto do padrão. A opção 3 mostra 3.

**O que varia.** Onde os três rostos sentam, se o número divide a linha da palavra, o padrão de ←/→ e a referência principal. Não varia a participante, o anel, as contas no rosto, nem o número menor e sem cor própria.

**Superfície:** Card

## Opção 1. Fase na fileira

- **Tese:** Trocar a reação é mudar de fase no mesmo card: os três rostos continuam a entrada e as contas trocam com eles.
- **Foco em cena:** O grupo é quem enviou. Tamanho: cada rosto passa de 2× a altura do número. Espaço: o maior vão fica em volta dos três, e a conta cola no rosto. Posição: o grupo entra no eixo x=32, abaixo do nome. Massa: as três fotos são a maior forma, um grupo só, não três blocos. Recua a linha "12 corações" (8px entre número e palavra, sem cor própria) e a fileira, na borda de baixo.
- **Referência:** estados-por-cor-e-brilho. Leva o esqueleto parado e a zona que muda com a fase. O anel no círculo é a marca da fase. O brilho roxo-magenta fica no canto e não muda com a reação.
- **Interação:** Estado muda o card. ←/→ percorre as reações já recebidas. Enter não faz nada. A fase corrente leva o anel; quem enviou troca na zona de dado.
- **Peças:** Cabeçalho da participante no eixo. Grupo dos três rostos com a conta. Linha do número com a palavra. Fileira de círculos, 40px no corrente, 36px nos outros, traço de 24px.
- **Regras:** esqueleto-fixo, tipografia-de-detalhe

## Opção 2. Rostos no miolo

- **Tese:** Os três rostos ocupam o miolo, fora de uma fileira, e a reação em foco só revela de quem é essa reação.
- **Foco em cena:** O mesmo grupo. Tamanho: cada rosto a mais de 2× o número. Espaço: o miolo é a área livre deles, e eles não dividem a linha com o número. Posição: centro óptico, não o canto. Massa: as fotos trabalham para o grupo. Recua o cabeçalho para a faixa de cima, a linha do número com a palavra para baixo do miolo, e até 4 círculos na borda.
- **Referência:** orbita-de-pessoas. Leva a posição: as pessoas são o objeto e não sentam numa fileira horizontal. ←/→ não anda de pessoa em pessoa.
- **Interação:** Foco revela. ←/→ move o foco entre 4 reações. O grupo de rostos troca na zona reservada, e a altura do card não muda. Enter não faz nada.
- **Peças:** Cabeçalho quieto no eixo. Três rostos no miolo, com as contas no mesmo tamanho. Linha do número com a palavra, fora do miolo. Quatro círculos de reação.
- **Regras:** esqueleto-fixo, tipografia-de-detalhe

## Opção 3. Número fora da linha

- **Tese:** Um seletor de três reações troca a leitura, e o número sai da linha da palavra para não disputar os rostos.
- **Foco em cena:** O mesmo grupo. Tamanho: rostos a mais de 2× o número. Espaço: o vão maior em volta dos rostos; o número fica sozinho, sem dividir linha com a palavra nem com os rostos. Posição: os rostos na entrada, eixo x=32. Massa: as fotos. Contraste: só os rostos em texto e foto cheios; o número é mudo. Recua a palavra da reação para um rótulo, o número sozinho, e o seletor na borda.
- **Referência:** cidade-foto-com-seletor. Leva o filtro de 3 segmentos que troca a leitura na hora. A participante não troca.
- **Interação:** Seletor segmentado. ←/→ troca a reação na hora, entre 3. Enter não faz nada. Quem enviou, a palavra e o número mudam juntos.
- **Peças:** Cabeçalho da participante, fixo. Três rostos com as contas. Número sozinho, fora da linha da palavra. Seletor de 3 reações, o corrente com anel.
- **Regras:** esqueleto-fixo, tipografia-de-detalhe, raios-concentricos
