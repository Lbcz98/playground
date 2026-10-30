# Crítica de direção, rodada 4: foco-clima-2

Julgado a partir dos PNGs de repouso, → e Enter de cada opção interativa (1 a 3), gerados pelo `check-explore-layout.mjs` com `--keys ArrowRight,Enter` (layout `ok`), e de uma captura em 3× de cada card. A 4 é estática: julguei o repouso dela; as fotos de tecla têm o mesmo tamanho de arquivo do repouso e não foram julgadas à parte.

Também montei uma folha com os sete PNGs de tempo lado a lado, na mesma escala e sobre o cinza do card, para comparar a mão de desenho. As caixas foram medidas no DOM, e a altura do algarismo, pela métrica da fonte. As cores foram amostradas nos PNGs em 3×. Todos os objetos carregaram, então as quatro opções foram julgadas por inteiro.

Medidas em px CSS, num card de 288 de largura. O 24° está em `.text-display-lg-bold` (72 px) nas quatro, e o algarismo tem **53 px** de altura em todas.

A régua é a Direção visual do brief e, nela, as refs. 4, 5 e 10:
- **Ref. 4:** o algarismo tem ≈14–16% do card. O sol, com os raios, tem ≈1,5× o algarismo.
- **Ref. 5:** o algarismo tem ≈12% do card. A nuvem tem ≈4× o algarismo e é cortada pela borda direita. Entre a base da nuvem e o "5 km/h" há ≈20 px de folga.
- **Ref. 10:** a luz com grão ocupa ≈60% do card, e o texto fica na parte escura dela.

## As quatro em números

| | Card (altura) | Algarismo / card | Objeto / algarismo | Folga dentro do grupo | Folga do grupo à faixa |
|---|---|---|---|---|---|
| 1 | 287 | **18,5%** | 3,7× (nuvem e sol, 195 px); só a nuvem, 2,4× | 16 | 43 |
| 2 | 376 | **14,1%** | 1,69× (89,5 px) | **31** (objeto ao 24°) e 20 | **≈34** |
| 3 | 377 | **14,1%** | 3,4× (a imagem, 179 px visíveis) | 23 e 20 | **19** |
| 4 | 231 | **23,0%** | 2,5× (132 px visíveis) | 20 e 20 | 38 |

As quatro estão dentro das duas faixas das referências: o algarismo entre 10% e 25% do card, e o objeto entre 1,6× e 4× o algarismo. Na rodada 3 só a 4 estava. O passo display fez o que se esperava: o número voltou a ser a arquitetura.

## Veredito por opção

**Opção 1 (contraponto, ref. 12): Quase.**
- **Levar:**
  - Número: ok. O algarismo tem 18,5% do card e está no centro, sobre o objeto.
  - Grupo: ok, e é a correção da rodada 3. São Paulo, o 24° e a palavra formam uma peça de 113 px, com 16 px entre as partes e 43 px até a faixa.
  - Objeto: falta a mão de desenho. É uma nuvem de fumaça borrada, sem grão e sem esferas: um cinza de tempestade (142,146,157), com a base numa reta serrilhada quase da cor do card (72,76,84). É a mão da ref. 12, não a das outras três. O sol, esse sim, é o mesmo da 2 e da 4 (251,202,58, raios em pílula, halo).
- **Evitar:**
  - **Número sem contraste.** O 24° (#EEE) fica sobre o cinza da nuvem (≈112,117,129), com contraste de ≈4:1, e a palavra de 14 px com ≈3,7:1. No card liso das outras opções o contraste é ≈9,5:1. É o único card em que o objeto enfraquece o número.
  - **Luz da direita.** O sol está no alto à direita, e o brief pede luz do alto à esquerda.
  - **Detalhe do °.** O ° flutua 7 px acima do topo dos algarismos (topo do ° em y 213,7, dos algarismos em 220,9). O `DESIGN.md` §2.3 pede o ° rente ao topo deles.
  - **Anel de foco sem foco.** O anel ciano aparece em "Sensação" no repouso, com o card sem foco. É a linha mais saturada da metade de baixo.
- **Teste de fidelidade:** sim, centrado, como o contraponto permite.
- **Genérico a olho:**
  - três células contornadas de mesmo peso (77×56) como única faixa;
  - o anel de foco mostrado em repouso.
- **Teclas:** → passa o anel para "Umidade". Enter abre a frase embaixo e o card cresce 48 px, que é a tese (abrir no lugar). Não há movimento.
- **Um ajuste:** redesenhar a nuvem na mão da 4:
  - cúmulo de esferas com grão fino, luz do alto à esquerda e o sol desse lado, base arredondada;
  - a parte atrás do 24° fica na sombra cinza-azulada das esferas, escura o bastante para o #EEE passar de 4,5:1.

  Hoje é fumaça de outro ilustrador.

**Opção 2 (reinterpretada, ref. 4): Quase.**
- **Levar:**
  - Número: ok. O algarismo tem 14,1% do card, a mediana das referências.
  - Objeto: ok, e é a correção da rodada 3. O sol virou o da ref. 4: saturado (245,195,36), com halo, ocupando ≈2/3 do quadro. A nuvem é um pedaço pequeno à frente, de esferas brancas (232,235,240) com grão fino.
  - Proporção: o objeto tem 1,69× o algarismo, a mesma relação da ref. 4.
  - Faixa: ok. A pílula invertida "Agora" saiu e virou texto em bold, então o controle já não é mais alto que o conteúdo.
- **Evitar:**
  - **O grupo lê em duas peças.** Entre a base do objeto e o topo do 24° há 31 px. Entre São Paulo e o seletor há ≈34 px. Pela distância, o objeto e a palavra pertencem tanto à faixa quanto ao número, e isso bate no Inegociável ("24° + objeto + São Paulo + palavra juntos"). A causa é a soma de três folgas: 10 px transparentes na base do PNG, o gap de 8 e ≈13 px de entrelinha acima do algarismo.
  - **A palavra quebra por 2 px.** "Sol entre nuvens" pede 110 px e tem 108 ao lado do objeto. Fica em duas linhas de 14 px em `text-muted` num segundo eixo (x +116), com "nuvens" sozinha.
- **Teste de fidelidade:** não, por pouco.
  - O objeto tem 1,69× a altura do algarismo, e o Teste pede ≥2×.
  - Essa medida fica dentro da faixa de 1,6–4× do Levar e é a da própria ref. 4. O brief se contradiz aqui (ver o fim).
- **Genérico a olho:** a composição ⛅ (sol grande atrás, nuvem pequena embaixo à direita) ainda é a de qualquer app. Agora ela é desenhada na mão da ref. 4, o que a salva em parte.
- **Teclas:** → vai a "Hoje" com o anel, e a faixa troca para as horas. Nada mais muda. Enter não faz nada, como o brief pede.
- **Um ajuste:** subir o 24° até ≈12 px da base do objeto (hoje são 31). A folga dentro do grupo passa a ser um terço da folga até a faixa, e o card desce para ≈357 px (algarismo em ≈14,8%).

**Opção 3 (reinterpretada, ref. 10): Quase.**
- **Levar:**
  - Número: ok. O algarismo tem 14,1% do card.
  - Imagem: ok na forma. É luz em faixas verticais com grão, cortada por cima e pelos lados, com 179 px visíveis (47% do card) que se fundem no fundo.
  - Série: ok. Ter vira chuva com o mesmo grão, 21° e "Chuva fraca", e o resto fica parado, como nas refs. 2 e 11.
  - A troca de dia é um dissolve. É o único movimento do conjunto e o kit permite. Mas usa `ease` no lugar de `--motion-semantic-easing`.
- **Evitar:**
  - **Outra mão de desenho.** O PNG tem 240×240 e é esticado para 288×300 (0,8 px de imagem por px de tela). Por isso o grão fica grosso (pontos de ≈1,2 px, contra ≈0,5 px na 2 e na 4) e as esferas ficam borradas.
  - **A luz vem da direita.** O pico amarelo fica no alto à direita.
  - **A laje continua.** Sob a nuvem há uma mancha cinza-bege horizontal (176,173,151, ≈70×17 px) que lê como sombra projetada. A rodada 3 já tinha apontado.
  - **Imagem de duas linguagens.** Dentro de Hoje, a nuvem 3D da ref. 5 está colada sobre as faixas de luz da ref. 10. Qui ("Sol forte"), só de luz, está mais perto da ref. 10.
  - **A faixa encosta no grupo.** Entre a palavra e o trilho há 19 px, a mesma folga que há dentro do grupo (20–23 px), então o trilho lê como parte do grupo (`DESIGN.md` §7.1).
- **Teste de fidelidade:** sim.
- **Genérico a olho:**
  - quatro células contornadas de mesmo peso (59×41);
  - a célula "Hoje" invertida (#EEE cheio, ≈2.400 px²) tem mais branco que os traços do 24° (≈1.700 px²). No quadrado de olhos semicerrados, ela é a segunda coisa vista, depois da nuvem.
- **Teclas:** → troca imagem, número e palavra, e o trilho fica. Enter insere média, sensação e umidade entre o grupo e o trilho, e o trilho desce 48 px. A tese diz que "nada mais se move", como já na rodada 3.
- **Um ajuste:** redesenhar as quatro imagens na mão da 2 e da 4:
  - em 576×600 (2×);
  - com grão fino;
  - com luz do alto à esquerda (o pico amarelo atrás do lado esquerdo da nuvem);
  - com as esferas de borda nítida e barriga lavanda;
  - sem a laje.

**Opção 4 (fiel, ref. 5, estática): Tem a cara.**
- **Levar:**
  - Número: ok. O algarismo tem 23% do card de 231, perto do teto das referências. O 24° é a entrada do card, no canto de cima à esquerda.
  - Objeto: ok, e é a correção da rodada 3. A base da nuvem agora é desenhada no próprio PNG: o alfa acaba em y 777, e a caixa da imagem vai até 861, além da borda do card. Não há mais corte reto de caixa.
  - Corte e proporção: o objeto é cortado só pela borda direita, com 138×132 visíveis, 2,5× o algarismo. Os raios do sol ficam a 11 px do °, perto como a nuvem da ref. 5 do "C".
  - Mão de desenho: é a de referência do conjunto. Sol saturado com halo, esferas brancas (238,237,235) com barriga lavanda, grão fino e luz do alto à esquerda.
  - Grupo e faixa: ok. Folgas de 20 e 20 dentro do grupo, e 38 até a faixa. Uma faixa só, em 12 px `text-muted`.
- **Evitar:**
  - **A faixa sai do inset e encosta na nuvem.** Os três dados somam 234 px numa linha que tem 224. Por isso "Umidade 68%" termina a **14 px** da borda direita, quando o inset é 32 (`DESIGN.md` §7.3). E o texto passa sob a base da nuvem a ≈4 px dela, que vira prateleira. Na ref. 5 o "5 km/h" fica ≈20 px abaixo da nuvem.
  - O ° tem 28 px aqui e 36 px nas outras três.
- **Teste de fidelidade:** sim.
- **Genérico a olho:** nenhum movimento de estoque.
- **Um ajuste:** assentar a faixa em rótulo sobre valor, como nas opções 2 e 3:
  - ela passa a ter ≈189 px e cabe no inset;
  - ela desce 16 px, para ficar a ≥20 px da base da nuvem;
  - o card vai a ≈264 px, com o algarismo em ≈20%.

## A mão de desenho: o que é comum e o que não é

Comparados lado a lado na mesma escala:

- **Sol: comum.** O mesmo sol na 1, na 2 e na 4: disco amarelo saturado (≈245–251, 190–202, 36–61), raios curtos em pílula creme e halo suave. O amarelo de Qui na 3 (244,204,49) é da mesma família.
- **Paleta: quase comum.** O amarelo do sol é igual nas quatro. O branco da nuvem é igual na 2, na 3 e na 4 (≈232–241). A 1 sai da paleta, com o cinza de tempestade (142,146,157) num tempo de "Sol entre nuvens".
- **Nuvem: não é comum.**
  - Na 2 e na 4, é um cúmulo de esferas de borda nítida, grão fino e barriga lavanda.
  - Na 1, é fumaça borrada sem volume de esfera.
  - Na 3, são esferas borradas de grão grosso.
- **Luz: não é comum.** Vem do alto à esquerda na 2 e na 4, como pede o brief, e da direita na 1 e na 3.
- **Base da nuvem: não é comum.** É arredondada ou achatada na 2 e na 4, uma reta escura serrilhada na 1 e uma laje cinza na 3.
- **Resolução e grão: não é comum.**
  - A 2 e a 4 têm ≈2 px de imagem por px de tela, com grão fino.
  - A 1 tem 1,5 px, mas sem grão.
  - A 3 tem 0,8 px, com grão grosso e borrado.
- **Fora dos PNGs: quase comum.**
  - O card é cinza neutro (63,63,63), sem gradiente, nas quatro.
  - O objeto é a única cor nas quatro.
  - A palavra está no grupo e há uma faixa só, em `text-muted`, nas quatro.
  - O 24° é tabular nas quatro.
  - O ° é desigual: tem 36 px na 1, 2 e 3 e 28 px na 4, e na 1 flutua 7 px acima dos algarismos.

**A mão do conjunto é a da opção 4** (e da 2). A 1 e a 3 ainda parecem de outros ilustradores, e por isso o ajuste delas é o desenho.

## Contra a rodada 3

- **O número.** Foi de 6,7%, 6,0%, 5,7% e 10,9% para 18,5%, 14,1%, 14,1% e 23,0%. O objeto foi de 7,5×, 5×, 9× e 6,3× para 3,7×, 1,7×, 3,4× e 2,5× o algarismo. O traço 1 do fio agora passa nas quatro, e o objeto deixou de ser a maior atração em todas, menos na 3.
- **Opção 1.** A cidade entrou no grupo, como pedia o ajuste da rodada 3. Ficaram a nuvem escura de base reta e as três células contornadas, e apareceu o problema de contraste.
- **Opção 2.** O sol foi refeito, como pedia o ajuste: saturado, com halo e dominante. A pílula invertida saiu. Ficaram a palavra no segundo eixo e, agora visível com o número maior, a folga que parte o grupo.
- **Opção 3.** O número cresceu. Mas nada do ajuste da rodada 3 entrou: a imagem continua com 47% do card visível, a laje continua, o trilho continua com células e ainda desce no Enter.
- **Opção 4.** A base da nuvem passou a ser desenhada, como pedia o ajuste. A falha nova veio do número maior: a faixa estourou o inset.
- **Movimento.** Nenhuma opção usa escala, deslize ou pulo. O único movimento é o dissolve de imagem da 3.

## Uma direção ou quatro?

É uma direção, e mais firme que na rodada 3. As quatro dividem:
- o número em display como arquitetura, entre 14% e 23% do card;
- um objeto de tempo como única cor, entre 1,7× e 3,7× o algarismo;
- o card neutro;
- a palavra no grupo;
- uma faixa só.

As distâncias se leem bem: a 4 é a ref. 5 traduzida, a 2 é a ref. 4, a 3 é a ref. 10 em série e a 1 é o contraponto, com o objeto atrás do grupo.

O que ainda impede uma série é a mão. Dois PNGs (1 e 3) não são da família do sol e da nuvem da 2 e da 4.

**Quantas estão "ótimo" (Tem a cara sem ajuste): nenhuma das quatro.**
- **A 4** tem a cara e fica ótima com um ajuste de faixa, que não toca a direção.
- **A 2** fica ótima com a folga do grupo fechada.
- **A 1 e a 3** precisam do redesenho do objeto na mão da 4. Mesmo com ele, ainda dependem de duas decisões que são do designer, não de quem escreve:
  1. **Células contornadas e célula invertida.** O `DESIGN.md` §9.5 pede o contorno em repouso em toda peça que o controle remoto alcança, e o §2.5 e o §9.2 pedem a peça escolhida invertida. Mas o critério "nenhuma peça mais forte que o 24°" e o Evitar "células iguais contornadas como único apoio" dizem o contrário. Na 3, a célula "Hoje" tem mais branco que o 24°. Enquanto isso não for decidido, a 1 e a 3 levam um movimento de estoque por regra do kit.
  2. **O ≥2× do brief.** O Levar (a) e o Teste de fidelidade pedem o objeto com ≥2× a altura do 24°. O próprio Levar dá a faixa de 1,6–4×, e a ref. 4 mede ≈1,5×. A 2 está em 1,69×. Vale decidir qual número manda, para a 2 não reprovar por fidelidade à própria referência.
