# Crítica de direção, rodada 2: foco-clima-2

Julgado a partir dos PNGs de repouso, → e Enter de cada opção, gerados pelo `check-explore-layout.mjs` (layout `ok`). As caixas de texto e de ícone foram medidas no DOM. Os ícones PNG e os desenhos carregaram nas quatro opções, então todas foram julgadas por inteiro. As medidas estão em px, no tamanho em que o card é desenhado (288 de largura). O algarismo do 24° (`.text-heading-3-bold`, 28 px) tem cerca de 20 px de altura.

## Passo 1: o fio das referências

Abri as 12 imagens e reescrevi `referencias/fio-das-referencias.md`. Onde discordei da leitura anterior:

- **O número "a 4–8× do apoio" não confere.** Contra o texto vizinho, o número fica entre 1× e 3× em 8 das 12 referências; só 1, 2, 7 e 8 passam de 4×. O constante é a **altura do algarismo contra o card: de 10% a 25%, mediana perto de 14%**. O peso também não é fio: fino só em 6, 7 e 12. As referências 2 e 8, contadas como finas, são regulares.
- **Não é "ar de um lado só".** É um eixo esquerdo com o texto preso às bordas de cima e de baixo. O meio do card é o vazio, e esse vazio está cheio de tempo (2, 8, 11). Só 6 e 9 dão ao número folga igual nos quatro lados.
- **Vidro não é fio.** A leitura anterior contava 8 de 12. Pela minha contagem são 3 a 5 de 12, e grão só aparece em 10. O raio grande aparece em todas as 12, mas já é do kit.
- **Dois traços faltavam.** (a) O tempo dito em palavra ("Cloudy", "Rainy", "Clear"), em 10 de 12. (b) Em 2 e 11, que vêm em série, o esqueleto é fixo e só mudam a atmosfera, o número e a frase.
- **Ausências:** nenhum gráfico (0 de 12), nenhuma previsão por hora (0 de 12), dias só em 3.
- **A análise do designer** aponta como foco a imagem ou a luz em 6 dos 10 widgets, e o número em 2. Pelos olhos dele, o ponto focal é o tempo desenhado, com o número em cima.

## As duas réguas

- **(a) Direção visual do brief (selo Replay).** Teste: "24°, ícone e São Paulo formam um só bloco com folga parecida nos quatro lados, e ao lado dele há um pedaço único, sem texto nem desenho (céu calmo vale), de pelo menos metade do card?"
- **(b) Fio das referências.** Cinco perguntas, cada uma de sim ou não:
  1. O algarismo tem ≥10% da altura do card?
  2. O texto está num eixo esquerdo preso às bordas, com o meio livre?
  3. O meio é atmosfera do tempo (cor ou imagem que diga sol, nuvem, chuva ou noite)?
  4. O tempo está dito em palavra?
  5. O apoio é uma faixa só, com até 6 dados?

  "Tem a cara" pede 4 ou 5 sins; "Quase", 2 ou 3; "Genérica", 0 ou 1.

## Veredito por opção

**Opção 1 (fiel).**
- (a) **Tem a cara.** Levar: ok. O trio forma uma peça de 113×59 com folga de 79 em cima, 87 e 88 nos lados e 91 até a faixa. O ar é um bloco de ≈64% do card. A faixa é de `text-muted` em 12 e 14 px, encostada embaixo. Evitar: ok. O ícone agora é o glifo branco de 40 px, não o colorido. Teste de fidelidade: sim.
- (b) **Genérica** (1 de 5, só a pergunta 5).
  - O algarismo tem 20 px num card de 306: 6,6%, abaixo do mínimo de 10% das referências.
  - O grupo está centrado com folga igual, o que só 6 e 9 fazem.
  - O fundo é o cinza liso de `background-elevated` (rgb 63,63,63), sem nenhuma cor de tempo.
  - O tempo aparece só em glifo, sem palavra.
- Genérico a olho: ícone, número e local num bloco centrado, mais três células iguais contornadas na base. Visto inteiro, é o widget 9 (Tiburon) ampliado.
- Um ajuste: dizer o tempo em palavra dentro do grupo ("Sol entre nuvens", em `.text-body-sm-medium` e `text-muted`, sob São Paulo). Na régua (b), atende a pergunta 4 e o `DESIGN.md` §4.4 (cor e desenho nunca são o único sinal). Na régua (a), o grupo cresce de 59 para ≈78 px e a folga em volta continua parecida.

**Opção 2 (reinterpretada).**
- (a) **Quase.**
  - Levar: o grupo é uma peça de 170×40, com ≈60 px até o desenho e as bordas e ≈63 até o seletor.
  - O ar é cerca de 45 a 49% do card de 380, um pouco abaixo da metade, porque o leque do canto ocupa ≈13% e a faixa de baixo começa a 263.
  - Evitar: entrou o ícone colorido de app (sol amarelo com nuvem azul, PNG de 40 px), que o brief veta, com cores que não vêm do tema dia. O seletor e a tabela de três colunas somam duas faixas de apoio.
  - Teste de fidelidade: não (ar abaixo da metade, por pouco).
- (b) **Quase** (2 de 5: o meio tem luz vinda de um canto e o apoio é uma faixa só). É a opção mais perto da referência 3 (fundo escuro, ícone ao lado do número, faixa embaixo) e da 10 (leque de luz). Mas:
  - o algarismo tem 5,3% do card;
  - o grupo está centrado;
  - a luz é verde de marca, não sol;
  - não há palavra.
- Genérico a olho: há dois sóis em duas cores, o amarelo do ícone e o leque verde. O leque, então, não diz sol e vira decoração. O ícone parece de qualquer app.
- Um ajuste: trocar o ícone colorido pelo glifo branco das opções 1 e 3, para que a única luz do card seja o leque do canto. Na régua (a), isso tira o Evitar. Na régua (b), atende o traço 4 (uma só luz, e a cor vem do tempo).

**Opção 3 (reinterpretada).**
- (a) **Quase.** Levar 1 e 2: ok. O trio tem 88×59, com ≈100 px nos lados, ≈95 até o trilho e ≈99 até o desenho. O ar é ≈62% do card de 387. O glifo é branco, de 32 px. O dia escolhido agora é marcado pelo rótulo e pelo anel, não pintado de branco: a briga com o grupo vista na rodada 1 sumiu. Levar 3 falta: a tese promete "ilustração de ponta a ponta", e o PNG mostra um quarto de círculo verde no canto (≈8 a 10% do card) sobre fundo liso. Evitar: ok. Teste de fidelidade: sim.
- (b) **Quase** (2 de 5: o esqueleto é fixo e o apoio é pouco). É a única opção com o mecanismo de 2 e 11: trocar o dia troca a paisagem e o número, e nada mais se move (na terça entram os riscos de chuva e o glifo de chuva). Mas:
  - o algarismo tem 5,2% do card;
  - o grupo está centrado;
  - a atmosfera é um canto;
  - não há palavra.
- Genérico a olho: quatro caixas iguais contornadas no trilho, e glifo com número centrados no meio.
- Um ajuste: fazer a paisagem do dia cobrir a metade de cima. O gradiente de tema da fase entra como céu calmo da borda superior até atrás do grupo, esmaecido, e fundido pelo scrim do kit em direção ao trilho. Os montes e a chuva continuam presos no canto, em até 1/4. Na régua (a), isso cumpre o Levar 3 ("céu calmo vale"). Na régua (b), cumpre os traços 3 e 4.

**Opção 4 (contraponto).**
- (a) **Quase**, como contraponto.
  - O trio fica numa linha no canto, no inset de 32 (24° com 48×34, ícone de 32, São Paulo em 14 px).
  - O ar é um bloco de 224×205 entre o grupo e o rótulo da curva: ≈56% da área dentro do inset, ≈37% do card de 430.
  - O apoio é uma faixa só: curva, horas e legenda em `text-muted` de 12 px, de 274 a 398.
  - Evitar: voltou o ícone colorido de app.
  - Teste de fidelidade: não, de propósito (a folga do canto troca a folga igual).
- (b) **Quase** (2 de 5: eixo esquerdo preso às bordas, com o meio livre, e apoio numa faixa só). É a única opção com a composição do fio: número no canto superior esquerdo, apoio preso à borda de baixo, meio vazio, como 2, 8 e 11. Mas:
  - o algarismo tem 4,7% do card, o menor dos quatro;
  - o meio é cinza liso (o triângulo verde de ≈4% fica no canto oposto);
  - o gráfico não aparece em nenhuma das 12 referências;
  - não há palavra.
- Genérico a olho: gráfico de linha com pontos cinza e base tracejada, e um triângulo de canto sem dado por trás.
- Um ajuste: o meio vira céu. Tirar o triângulo e pôr o gradiente de tema da fase no bloco vazio, esmaecido e fundido pelo scrim na curva, que passa a ser o horizonte desse céu (como 7 e 8). Na régua (b), atende o traço 3. Na régua (a), mantém o bloco único ("céu calmo vale").

**Uma direção ou quatro?**
- **Na régua (a), é uma direção.** As quatro opções mantêm o trio junto em `text-primary`, um bloco de ar perto ou acima da metade, um apoio só em `text-muted` e o verde do tema dia como única cor de conteúdo. A única costura solta é o ícone, que fala com duas vozes: glifo branco nas opções 1 e 3, PNG colorido de app nas 2 e 4.
- **Na régua (b), também é uma direção, mas não a das referências.** As quatro dividem o que o fio rejeita:
  - número em 5 a 7% do card;
  - nenhuma palavra para o tempo;
  - fundo cinza liso com marcas verdes de 4 a 13% que não dizem sol, nuvem nem noite.
- **A opção 4 é a única com a composição do fio, e a 3 é a única com o seu mecanismo de série.** Em repouso, a 1 e a 3 são quase a mesma figura (grupo centrado, campo liso, células contornadas embaixo). Elas se distinguem pela interação, não pelo gosto.

## Passo 3: as réguas se contradizem?

Sim, em dois pontos medidos, e o designer decide:

- **Onde fica o vazio.** A régua (a) põe o grupo no centro óptico, com folga igual nos quatro lados (79 a 100 px nas opções 1 e 3). A (b) põe o texto num eixo esquerdo, preso às bordas, e o vazio no meio do card. Só 6 e 9, das 12, fazem como o Replay. A opção 4 é fiel ao fio justamente por ser o contraponto da direção.
- **Ar contra escala.** Com o teto do kit em 28 px (algarismo de ≈20 px), a régua (b) pede o número com ≥10% da altura do card, ou seja, um card de no máximo ≈200 px. A régua (a) pede pelo menos metade do card vazia, além do grupo (≈59), da faixa (≈45) e de dois insets de 32. Isso dá ≥ ≈270 px, e a opção mais curta tem 306. Nenhum card cumpre as duas com a tipografia de hoje.

Elas concordam no resto:

- uma faixa só de apoio;
- poucos dados;
- nada de tabela nem divisor;
- o vazio num bloco só;
- a cor vindo do conteúdo, que o `DESIGN.md` §4.3 já permite com os gradientes de tema.

O que o fio pede e o kit ainda não dá:

1. **Um tamanho de número de exibição.** Para 10% num card de 380 o algarismo precisa de ≈38 px (corpo ≈52 px). Para a mediana de 14% precisa de ≈53 px (corpo ≈74 px). O kit para em `.text-heading-3-*` (28 px).
2. **Peso regular em tamanho de título.** Os headings existem só em medium e bold. Peso light ou thin é pedido por apenas 3 das 12 (6, 7, 12) e não é essencial.
3. **Cor de tempo.**
   - O `--gradient-primary-dia` é verde (#00E879 → #00E1C0) e não lê como céu de dia.
   - O `-noite` (azul) e o `-tarde` (laranja e amarelo) leem como noite e entardecer.
   - Não há campo para chuva, nublado ou neblina.
   - Pintar o card pelo tempo, como fazem 2 e 11, exige decidir se a fase do dia pode falar pelo tempo.
4. **Foto de céu por condição.** O Content Card tem a variante com imagem, mas a imagem fica em cima e o texto embaixo. As referências 2, 11 e 12 põem o texto sobre a foto inteira, o que pede o scrim do kit em tela cheia e um banco de fotos (sol, nuvem, chuva, noite) que não existe.
5. **Unidade alta.** Em 5 das 12 o "°" sobe ao topo do número, com cerca de 1/3 do tamanho. Isso contraria o §2.3, que manda a unidade para a linha de base.

Vidro, desfoque e grão o kit também não tem, mas eles não são fio, e eu não os pediria.
