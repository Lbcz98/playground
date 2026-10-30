# Crítica de direção, rodada 5: foco-clima-2

Julgado a partir dos PNGs de `rodadas/1/` (repouso, → e Enter) e de uma nova captura de cada card em 3×. Na 3× também percorri os quatro dias da opção 3 (Hoje, Ter, Qua e Qui). Montei ainda uma folha com os quatro objetos lado a lado sobre o cinza do card: primeiro no tamanho em que aparecem no card, depois ampliados. As caixas foram medidas no DOM. A altura do algarismo e as cores foram medidas nos pixels da captura em 3×.

Todas as imagens carregaram, inclusive os `assets/o3v5-*.png` relativos, e as quatro opções foram julgadas por inteiro.

Origem dos PNGs desta rodada:
- a 1 usa `o1v5` (novo);
- a 3 usa `o3v5-*` (novos, 576 px);
- a 2 e a 4 seguem com `o2v4` e `o4v4` (os mesmos da rodada 4).

O algarismo tem **52,7 px** de altura nas quatro (`.text-display-lg-bold`), e o ° agora tem 36 px nas quatro.

## As quatro em números

| | Card | Algarismo / card | Objeto / algarismo | Folgas dentro do grupo | Grupo → faixa | ° contra o topo dos algarismos |
|---|---|---|---|---|---|---|
| 1 | 271 | 19,5% | 3,3× (sol e nuvem, 176 px); só a nuvem, 2,6× | 16 e 17 | 51 (a base da nuvem fica no meio) | rente (0,3 px) |
| 2 | 356 | 14,8% | 1,7× (90 px) | **12** (objeto → 24°) e 21 | 35 | rente (0,3 px) |
| 3 | 364 | 14,5% | 2,4× (129 px visíveis) | 21 e 21 | **19** | 1,7 px abaixo |
| 4 | 261 | 20,2% | 2,5× (131 px) | 17 e 17 | 54 | **4,3 px acima** |

As quatro continuam dentro das faixas do brief: o algarismo entre 10% e 25% do card, e o objeto entre 1,5× e 4× o algarismo.

## Veredito por opção

**Opção 1 (contraponto, refs. 12 e 6): Quase.**
- **Levar:**
  - Número: ok. O algarismo tem 19,5% do card, centrado sobre o objeto, e o ° agora está rente ao topo dos algarismos (corrigido).
  - Grupo: ok. São Paulo, o 24° e a palavra formam uma peça, com 16 e 17 px entre as partes.
  - Objeto: falta a mão de desenho. A nuvem nova **lê como manchas, não como nuvem volumétrica**:
    - As esferas do meio são discos de ardósia (≈92,100,138) sem nenhum ponto de luz. A variação de tom dentro de cada uma não passa de ≈10% de luminância, então não há volume, só recorte.
    - O escuro vem da **posição**, não da luz. As esferas das pontas são brancas (227,230,241) dos dois lados por igual, e as do meio são escuras. Nenhuma esfera recebe a luz do sol, que está no alto à direita. O resultado é uma cortina com a borda clara e o centro escuro.
    - As bordas são esfiapadas e irregulares, como um carimbo de pincel. Na 2, na 3 e na 4, as bordas das esferas são limpas, com grão fino.
    - A base continua uma linha reta serrilhada em y 176, de lado a lado do card. Parece um corte, não o fundo de uma nuvem.
    - É a nuvem mais escura do conjunto. Ela é mais escura até que a nuvem de chuva de Ter na opção 3 (183,188,218), e o tempo aqui é "Sol entre nuvens".
- **Evitar:**
  - **Contraste.** Melhorou: a mediana do fundo sob os algarismos dá 5,5:1 com o #EEE (era ≈4:1). Mas 12% do fundo sob o "2" e o "4" ainda fica abaixo de 4,5:1 (≈4:1), onde passa a esfera mais clara do alto à esquerda.
  - **Luz da direita.** O sol ficou no alto à direita, e o brief pede luz do alto à esquerda.
  - **Anel de foco sem foco.** O anel ciano aparece em "Sensação" com o card em repouso, sem foco. A 2 e a 3 não mostram anel em repouso.
  - **Resolução.** O PNG tem 400 px para 288 de tela, ou seja, 1,4 px de imagem por px. A 2 e a 3 têm 2,0, e a 4 tem 1,85.
- **Teste de fidelidade:** sim (o contraponto pode ser centrado).
- **Genérico a olho:**
  - três células contornadas de mesmo peso como faixa. O contorno é regra do kit e o brief aceita, por serem pequenas;
  - o anel de foco mostrado em repouso.
- **Teclas:** → passa o anel para "Umidade". Enter abre a frase embaixo das células, e o card cresce para baixo sem mover as células. Isso cumpre a tese.
- **Um ajuste:** redesenhar a nuvem na mão da 4, em 576 px (2×):
  - esferas de borda limpa, com grão fino;
  - cada esfera com luz no alto à esquerda e barriga lavanda embaixo;
  - o sol do lado esquerdo;
  - base arredondada.

  O escuro atrás do 24° tem de vir da sombra das esferas de trás e da barriga das da frente, não de pintar o meio de ardósia. A meta é o #EEE passar de 4,5:1 em todo o fundo sob os algarismos.

**Opção 2 (reinterpretada, ref. 4): Tem a cara.**
- **Levar:**
  - Número: ok. O algarismo tem 14,8% do card, perto da mediana das referências.
  - Grupo: ok, e é a correção da rodada 4. Do objeto ao topo do 24° há ≈12 px (eram 31). Do 24° a São Paulo há 21, e de São Paulo ao seletor há 35. O grupo agora lê como uma peça.
  - Objeto: ok. Tem 1,7× o algarismo, que é a proporção da ref. 4 e fica dentro da faixa nova de 1,5–4×. Usa a mão de referência: sol saturado (246,198,25) com raios em pílula e halo, e nuvem de esferas brancas (238,239,242) com barriga lavanda (195,204,220).
  - Faixa: ok. O seletor é texto, com "Agora" em bold, e os dados ficam em rótulo sobre valor.
- **Evitar:**
  - **A palavra quebra.** "Sol entre nuvens" pede 110 px e tem 108 ao lado do objeto. Ela fica em duas linhas de 14 px em `text-muted`, com "nuvens" sozinha na segunda, num segundo eixo (x 148). É o que sobra da rodada 4.
- **Teste de fidelidade:** sim. Com o brief novo (1,5–4×), os 1,7× passam.
- **Genérico a olho:** a disposição ⛅ (sol grande atrás, nuvem pequena embaixo à direita) ainda é a de qualquer app. O volume, o grão e a escala de 1,7× a tiram do banco de ícones, mas ela é o objeto menos específico das quatro.
- **Teclas:** → vai a "Hoje" com o anel, e a faixa troca para as horas, sem mais nada mudar. Enter não faz nada, como o brief pede.
- **Um ajuste:** trocar o vão entre objeto e palavra de `--dimension-spacing-core-xs` (12 px) para `--dimension-spacing-core-2xs` (8 px).
  - É o vão de dentro de grupo, e os dois são do mesmo grupo.
  - A conta fica 104 + 8 + 110 = 222 px nos 224 disponíveis, então "Sol entre nuvens" cabe em uma linha.

**Opção 3 (reinterpretada, refs. 10, 2 e 11): Quase.**
- **Levar:**
  - Número: ok. O algarismo tem 14,5% do card.
  - Imagem: ok, e é a correção grande desta rodada. Os quatro PNGs foram refeitos em 576 px (2×):
    - o grão agora é fino;
    - a luz vem do alto à esquerda, com o sol à esquerda e o brilho no alto à esquerda de cada esfera;
    - as esferas têm borda limpa e barriga lavanda;
    - a laje cinza saiu;
    - as faixas de luz verticais com grão ficam atrás, como na ref. 10.
  - Série: ok, como nas refs. 2 e 11. Ter (chuva, nuvem cinza-lavanda 183,188,218), Qua (nublado) e Qui (sol forte) trocam a imagem, o número e a palavra, e o resto fica.
  - Peça escolhida: ok com a decisão do brief. A célula "Hoje" invertida tem ≈1.390 px² de branco, contra ≈2.250 px² dos traços do 24°. Ela é menor que o número e já não é a segunda coisa vista.
- **Evitar:**
  - **O trilho anda no Enter.** Enter insere média, sensação e umidade entre o grupo e o trilho, e o trilho, que é a peça em foco, desce ≈51 px. O brief pede que posição e margens fiquem entre estados, e a tese diz "nada mais se move" (`DESIGN.md` §7.7 e §9.1).
  - **O trilho encosta no grupo.** Da palavra ao trilho há 19 px, menos que os 21 px entre as partes do grupo (`DESIGN.md` §7.1). Assim o trilho lê como uma quarta linha do grupo.
  - **Emenda na nuvem.** O esmaecimento da imagem começa reto em y≈98 e atravessa a fileira de baixo das esferas: a luminância cai de 246 para 152 entre y 98 e 128. Em Hoje e em Qua, isso aparece como uma faixa horizontal, e a barriga das esferas some no cinza em vez de fechar redonda.
  - O dissolve da imagem usa `ease` no lugar de `--motion-semantic-easing`.
- **Teste de fidelidade:** sim.
- **Genérico a olho:** quatro células de mesmo peso no trilho. É regra do kit (`DESIGN.md` §9.5) e o brief aceita, por serem pequenas.
- **Um ajuste:** abrir o detalhe do Enter **abaixo** do trilho, como na opção 1. O card cresce para baixo, e o trilho e a peça em foco ficam parados.

**Opção 4 (fiel, ref. 5, estática): Tem a cara.**
- **Levar:**
  - Número: ok. O algarismo tem 20,2% do card. O 24° é a entrada do card, no canto de cima à esquerda.
  - Objeto: ok. Tem 2,5× o algarismo, é cortado só pela borda direita, e os raios do sol ficam a 9 px do °. É a mão de referência do conjunto.
  - Faixa: ok, e é a correção da rodada 4. Agora vai em rótulo sobre valor, e "Umidade" termina exatamente no inset de 32 px (antes estourava a 14 px).
  - Uma faixa só, em `text-muted`. Grupo com 17 e 17 px por dentro e 54 px até a faixa.
- **Evitar:**
  - **A nuvem pousa em "Umidade".** A base da nuvem está em y≈184, e o topo de "Umidade" em y 196: são **12 px**. O texto parece uma prateleira sob a nuvem. Na ref. 5 a folga é de ≈20 px, e a rodada 4 pediu ≥20. A base também é uma reta de borda áspera, enquanto a da 2 é arredondada.
  - **O ° flutua.** O topo do ° fica 4,3 px acima do topo dos algarismos (y 57,7 contra 62). O `DESIGN.md` §2.3 pede o ° rente ao topo deles, e nas outras três ele já está rente.
- **Teste de fidelidade:** sim.
- **Genérico a olho:** nenhum movimento de estoque.
- **Um ajuste:** descer a faixa 8 px. A nuvem fica a 20 px de "Umidade", o card vai a ≈269 px e o algarismo fica em ≈19,6%.

## A mão de desenho, lado a lado

Comparei os quatro objetos na mesma folha, sobre o cinza do card (63,63,63):

| | 1 | 2 | 3 | 4 |
|---|---|---|---|---|
| Sol | disco amarelo (245,209,81), raios em pílula, halo | igual | **bola sem raios nem halo**, com reflexo forte no alto à esquerda (a luz vem das faixas) | igual à 1 e à 2 |
| Nuvem | **discos de ardósia (92,100,138) com bordas esfiapadas**, brancos só nas pontas | esferas brancas, barriga lavanda, grão fino | esferas brancas, barriga lavanda, grão fino, um pouco mais brilhantes | esferas brancas, barriga lavanda, grão fino |
| Luz | **sol à direita**, escuro pela posição (simétrico) | alto à esquerda | alto à esquerda | alto à esquerda |
| Base | **reta serrilhada de lado a lado** | arredondada | esmaecida com emenda reta | reta, de borda áspera |
| px de imagem por px | 1,4 | 2,0 | 2,0 | 1,85 |

- **A mão agora é a mesma em três das quatro (2, 3 e 4).** A 3 entrou na família nesta rodada: mesma paleta, mesma luz, mesmo grão e mesma resolução. A única diferença é o sol sem raios, que na ref. 10 se justifica porque a luz já está nas faixas.
- **A 1 continua de outro ilustrador.** Paleta, luz, borda, base e resolução divergem.
- **Fora dos PNGs, tudo é comum:**
  - o card é cinza neutro, sem gradiente;
  - o objeto é a única cor;
  - a palavra está no grupo;
  - há uma faixa só;
  - o 24° é tabular;
  - o ° tem 36 px nas quatro.

## Contra a rodada 4

- **1.** O ° foi corrigido, e o contraste subiu de ≈4:1 para 5,5:1 (mediana). A nuvem foi redesenhada, mas não na mão pedida: o sol continua à direita, a base continua reta, e o escuro virou manchas. O anel em repouso continua.
- **2.** A folga do grupo foi corrigida (31 → 12 px). A quebra da palavra continua.
- **3.** O redesenho das imagens entrou inteiro: 2×, grão fino, luz à esquerda, sem laje. A célula invertida ficou menor que o 24°. Continuam o trilho que desce no Enter e a folga de 19 px até o trilho.
- **4.** A faixa voltou ao inset, e o ° passou a ter o tamanho das outras. A folga até a nuvem continua em 12 px, e o ° passou a flutuar.

## Uma direção ou quatro?

É uma direção, e a mais coesa até aqui. As quatro dividem:
- o número em display como arquitetura (14,5% a 20,2% do card);
- um objeto de tempo como única cor (1,7× a 3,3× o algarismo);
- o card neutro;
- a palavra no grupo;
- uma faixa só.

As distâncias se leem: a 4 é a ref. 5 traduzida, a 2 é a ref. 4, a 3 é a ref. 10 em série e a 1 é o contraponto.

O que ainda impede uma série é um objeto só, a nuvem da 1, que é a única peça de outra mão.

**Quantas estão ótimas (Tem a cara sem ajuste): nenhuma das quatro.** Duas têm a cara e ficam a um ajuste pequeno, que não toca a direção. Duas ainda estão em Quase.
- **A 2** fica ótima com a palavra numa linha (vão de 8 px). Não sobra mais nada.
- **A 4** fica ótima com a faixa 8 px abaixo. Também falta pôr o ° rente aos algarismos, como nas outras três. Isso é regra do kit (§2.3), não da direção, mas impede o "ótimo".
- **A 3** passa a ter a cara com o detalhe aberto abaixo do trilho. Para ser ótima falta ainda:
  - afastar o trilho do grupo (de 19 px para ≥24 px, ou seja, maior que os 21 de dentro do grupo);
  - tirar a emenda reta do esmaecimento nas esferas de Hoje e Qua;
  - trocar `ease` por `--motion-semantic-easing`.
- **A 1** depende do redesenho da nuvem na mão da 4 (esferas iluminadas do alto à esquerda, sol à esquerda, base redonda, 2×). Com ele também se resolve o contraste. Falta ainda tirar o anel de foco do repouso.
