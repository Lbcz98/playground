# Crítica de direção, rodada 7: foco-clima-2

Julgado a partir dos PNGs de `rodadas/3/` (repouso, → e Enter) e de uma nova captura de cada card em 3×. As caixas foram medidas no DOM. A altura do algarismo, o objeto, a silhueta da nuvem da 1 e o grão foram medidos nos pixels da captura em 3×. Para isolar o texto, comparei a captura normal com uma captura de texto transparente. Para isolar o objeto, comparei essa segunda com uma captura de imagens ocultas.

Todas as imagens carregaram, inclusive o `assets/o1v7-nuvem-sol.png` relativo, e as quatro opções foram julgadas por inteiro.

O que mudou desde a rodada 6:
- os PNGs da 2 e da 4 são idênticos byte a byte aos de `rodadas/2/`, e nada mudou no código delas;
- a 1 trocou de composição (berço da nuvem, PNG `o1v7`) e o `gap` do card passou de `--dimension-spacing-core-sm` (16 px) para `--dimension-spacing-core-3xs` (4 px);
- a 3 subiu o ° (de `top: .28em` para `.225em`).

O algarismo tem **53,3 px** de altura nas quatro (`.text-display-lg-bold`).

## As quatro em números

| | Card | Algarismo / card | Objeto / algarismo | Folgas dentro do grupo | Grupo → faixa | ° contra o topo dos algarismos |
|---|---|---|---|---|---|---|
| 1 | 307 | 17,4% | 3,5× (185 px, do topo dos raios à base) · 33% do card | 16 e 16 | **objeto → células: 6** | rente |
| 2 | 356 | 15,0% | 1,7× (91 px) | 11 e 19 | 34 | rente |
| 3 | 372 | 14,3% | ≈2,1× (sol e nuvem; as faixas vão até a borda) | 16 e 16 | 28 | **rente (corrigido)** |
| 4 | 269 | 19,8% | 2,5× (132 px) | 16 e 16 | 59 | rente |

Todas estão dentro das medidas do brief: o algarismo fica entre 10% e 25% do card, e o objeto entre 1,5× e 4× o algarismo. A 1 está perto do teto nas duas medidas do objeto: tem 3,5× (o teto é 4×) e ocupa 33% do card (o teto é 1/3).

## Veredito por opção

**Opção 1 (contraponto, refs. 12 e 6): Quase.**
- **Levar:**
  - Número: ok. O algarismo tem 17,4% do card e o ° está rente. Todo o texto fica sobre o cinza neutro do card, e o azul-marinho da rodada 6 sumiu.
  - Berço: ok na forma.
    - A nuvem toca as duas bordas laterais.
    - As cristas sobem até y 98, 17 px acima da linha de base do 24° (y 115). A da esquerda fica em x ≤ 48 e a da direita em x ≥ 240.
    - A base é de barrigas redondas, sem trecho reto.
    - O sol tem disco de Ø 44 com centro em (50, 88), como pedido. Tem raios em pílula e halo, e o disco fica quase todo à vista: são ≈1.380 px² de amarelo, contra 880 na rodada 6.
    - Passa o teste da crítica 6: não é a pilha de estoque.
  - **Ar em volta do objeto: falta.** O grupo tem 16 px por dentro, mas o objeto encosta em tudo o que está à sua volta, com menos que isso:
    - do raio direito do sol ao "2": **8 px** (o plano pedia raios em x ≤ 84, e eles vão até x 95);
    - dos ombros da nuvem a "Sol entre nuvens": **11 px** (a esfera interna da esquerda chega a x ≈78 na altura da palavra; o plano pedia x ≤ 73);
    - do vale à palavra: **13 a 15 px** (o topo do vale fica em y 154–166; o plano pedia y ≥ 160);
    - da base da nuvem (y 226) ao contorno das células (y 232): **6 px**. O plano pedia 16. Isso vem do `gap` do card, que caiu de 16 para 4 px. As barrigas de baixo pendem sobre "Umidade", e no PNG de → o anel de foco fica a 6 px da nuvem.
    - É a mesma "prateleira" que a 4 tinha na rodada 5 e que foi corrigida para ≈19 px.
- **Evitar:** ok. A paleta é a da família, sem esfera escura, e o texto não cai sobre nenhum pixel de nuvem.
- **Fora da direção (conserto de contrato, que eu deixei passar na crítica 6):** "Sol entre nuvens" está em `--color-semantic-functional-text-primary`. O brief manda a palavra em `--color-semantic-functional-text-muted`, e a 2, a 3 e a 4 a usam. Na rodada 6 o primário se explicava pelo fundo azul-marinho. Agora a palavra fica sobre o cinza do card, e o muted volta a passar. Hoje o grupo lê como três linhas do mesmo branco.
- **Teste de fidelidade:** sim. Há um objeto só, e ele é a única cor. O 24° é o maior texto, o fundo é neutro e o centro é permitido no contraponto.
- **Genérico a olho:** as três células contornadas de mesmo peso, que são regra do kit e que o brief aceita.
- **Teclas:**
  - → passa o anel para "Umidade".
  - Enter abre a frase embaixo das células. O card cresce para baixo e as células não se movem.
- **Um ajuste:** dar ao objeto **o mesmo ar que o grupo tem por dentro: 16 px (`--dimension-spacing-core-sm`)** entre qualquer pixel do sol ou da nuvem e qualquer texto ou célula. Nas medidas:
  - devolver o `gap` do card a `--dimension-spacing-core-sm`, como era na rodada 6, e a margem da frase do Enter a zero. Com isso a base fica a 18 px das células, o card passa a ≈319 px e o algarismo a 16,7% do card;
  - no PNG, terminar o raio direito em x ≤ 87;
  - no PNG, afastar as esferas internas das cristas até x ≤ 73 e x ≥ 215 na altura da palavra;
  - no PNG, baixar o topo do vale para y ≥ 157.

  É a "Uma peça, ar igual em volta" do designer, aplicada ao objeto.

**Opção 2 (reinterpretada, ref. 4): Tem a cara.**
- **Levar:**
  - Número: ok. O algarismo tem 15,0% do card.
  - Objeto: ok. Tem 1,7× o algarismo, com sol de raios em pílula, halo e nuvem de esferas.
  - A palavra: ok. Fica numa linha, em muted.
  - Faixa: ok. O seletor é texto, com "Agora" em bold.
- **Evitar:** ok.
- **Visto e aceito** (como na rodada 6): as colunas do seletor e as dos dados não se alinham, por ≈10 px.
- **Teste de fidelidade:** sim.
- **Genérico a olho:** nenhum que pese.
- **Teclas:**
  - → leva o anel a "Hoje", e a faixa troca para as horas.
  - Enter não faz nada, como pede o brief.
- O PNG é idêntico ao da rodada 6.
- **Um ajuste:** nenhum: ótimo.

**Opção 3 (reinterpretada, refs. 10, 2 e 11): Tem a cara.**
- **Levar:**
  - Número: ok. O algarismo tem 14,3% do card, e o ° agora começa na mesma linha dos algarismos (y 200,7 nos dois). Esta é a correção da rodada.
  - Imagem: ok. Em Hoje, as faixas de luz se esmaecem antes de São Paulo. Em Ter, a fileira de nuvem de chuva vem cortada pelo topo, com riscos e grão.
  - Trilho: ok. Fica a 28 px da palavra, contra 16 dentro do grupo.
- **Evitar:** ok.
- **Teclas:**
  - → troca para Ter: chuva, 21° e "Chuva fraca", e nada mais se move.
  - Enter abre média, sensação e umidade abaixo do trilho, e o trilho fica parado.
- **Teste de fidelidade:** sim.
- **Genérico a olho:** as quatro células de mesmo peso no trilho, que são regra do kit (§9.5) e que o brief aceita.
- **Um ajuste:** nenhum: ótimo.
- **Pendência de código, fora da direção:** o dissolve da imagem ainda usa `ease` no lugar de `--motion-semantic-easing` (linha 142). Isso não aparece no PNG, foi pedido na rodada 6 e não entrou. O juiz de kit reprova.

**Opção 4 (fiel, ref. 5, estática): Tem a cara.**
- **Levar:**
  - Número: ok. O algarismo tem 19,8% do card e é a entrada, no canto.
  - Objeto: ok. Tem 2,5× o algarismo e é cortado só pela borda direita.
  - Faixa: ok. Fica a ≈19 px da base da nuvem.
- **Evitar:** ok.
- **Teste de fidelidade:** sim.
- **Genérico a olho:** nenhum.
- O PNG é idêntico ao da rodada 6.
- **Um ajuste:** nenhum: ótimo.

## A mão de desenho, lado a lado

| | 1 | 2 | 3 | 4 |
|---|---|---|---|---|
| Sol | disco Ø 44, raios em pílula, halo, ≈80% à vista | disco inteiro, raios em pílula, halo | bola sem raios, reflexo no alto à esquerda (a luz está nas faixas) | disco, raios em pílula, halo, cortado em baixo pela nuvem |
| Nuvem | banco de esferas quase iguais (Ø ≈55–60), branco-azuladas, barriga lavanda | cacho pequeno, barriga lavanda | cacho de tamanhos variados em Hoje; fileira de esferas iguais em Ter | cacho de tamanhos variados, borda felpuda |
| Luz | alto à esquerda | alto à esquerda | alto à esquerda | alto à esquerda |
| Base | barrigas redondas | redonda | barrigas redondas | reta por ≈65 px, de cúmulo |
| Grão na nuvem (variação média de luminância por pixel, em 3×) | 0,34 | 0,68 | 0,89 | 0,51 |
| Grão no sol | 0,87 | 0,47 | 2,38 | 1,18 |

- **É a mesma mão nas quatro.** Têm a mesma paleta (amarelo, branco-azulado, lavanda), a mesma luz e o mesmo raio em pílula com halo na 1, na 2 e na 4.
- A fileira de esferas iguais da 1 é o mesmo desenho do banco de chuva de Ter na 3. Quando a nuvem é um banco, ela é uma fileira; quando é uma nuvem só, é um cacho.
- **Visto e aceito: a nuvem da 1 é a mais lisa.** O grão mede 2/3 do da 4 e metade do da 2. Em 1× não se vê, e é diferença de grau, não de mão.
- A cor da 1, que era o que separava a série na rodada 6, agora está dentro da família.

## Variedade: quatro estruturas, não quatro cartões

| | Eixo | Onde está o objeto | Interação |
|---|---|---|---|
| 1 | centrado | banco na faixa do meio, de borda a borda, embaixo do grupo | expandir no lugar (←/→ nas linhas, Enter abre a frase) |
| 2 | esquerdo | ícone crescido no alto, ao lado da palavra (manchete) | seletor segmentado que troca só a faixa |
| 3 | esquerdo | imagem de luz na metade de cima, cortada pelo topo e pelos lados | trilho de dias que troca imagem, número e palavra |
| 4 | esquerdo, canto | nuvem cortada pela borda direita, encostada no número | estático |

O objeto ocupa uma região diferente em cada uma (banda do meio, canto de cima, metade de cima, borda direita), e os quatro padrões de interação são distintos. Nenhuma "difere só no layout".

## Contra a rodada 6

- **1.**
  - Entraram:
    - o berço;
    - o fim do azul-marinho;
    - o sol de volta à vista (de 880 para ≈1.380 px² de amarelo);
    - o texto todo sobre o cinza;
    - o objeto, que caiu de 3,7× para 3,5×.
  - Saiu: o ar entre a nuvem e as células, de 16 para 6 px, porque o `gap` do card passou a 4 px.
  - Não entraram as folgas do plano em volta do texto: raio a 8 px do "2", ombros a 11 px e vale a 13 px da palavra.
- **2.** Nada mudou. Não resta nada.
- **3.** O ° está rente. Resta o `ease`, que é código e não aparece no PNG.
- **4.** Nada mudou. Não resta nada.

## Uma direção ou quatro?

É uma direção, e as distâncias se leem:
- a 4 é a ref. 5 traduzida;
- a 2 é a ref. 4;
- a 3 é a ref. 10 em série;
- a 1 é o contraponto centrado, com o objeto atrás e embaixo do grupo.

As quatro têm em comum:
- o número em display como arquitetura (14,3% a 19,8% do card);
- um objeto de tempo como única cor, desenhado pela mesma mão;
- o card neutro;
- a palavra no grupo;
- uma faixa só.

Pela primeira vez no loop, nada na cor nem no desenho separa a 1 das outras. O que resta é de folga, não de direção.

**Quantas estão ótimas (Tem a cara sem ajuste): três, a 2, a 3 e a 4.**
- **A 3** ainda leva uma pendência de código fora da direção: trocar o `ease` da linha 142 por `--motion-semantic-easing`. Não muda o PNG, mas o juiz de kit a pega.
- **A 1 está Quase.** Falta um ajuste: 16 px de ar entre o objeto e tudo o que o cerca. Isso quer dizer o `gap` do card de volta a `--dimension-spacing-core-sm` e, no PNG, o raio direito, os ombros e o vale recuados (medidas acima). Falta também um conserto de contrato que não é de direção: "Sol entre nuvens" em `--color-semantic-functional-text-muted`, como nas outras três. Com os dois, a 1 fecha o loop.
