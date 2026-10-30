# Crítica de direção, rodada 8: foco-clima-2

Julgado a partir dos PNGs de `rodadas/4/` (`opcao-N.png`, `-1-ArrowRight` e `-2-Enter`; as folhas foram ignoradas) e de uma nova captura de cada card em 3×. As caixas foram medidas no DOM. As distâncias foram medidas nos pixels da captura em 3×: o texto foi isolado com uma captura de texto transparente, e o objeto com uma captura de imagens ocultas. O fundo atrás de cada texto foi lido na captura sem texto.

Todas as imagens carregaram, inclusive o `assets/o1v8-nuvem-sol.png` relativo, e as quatro opções foram julgadas por inteiro. `check-explore-tokens` e `check-explore-layout` dão `ok`. Os avisos de tamanho (104 e 260 px) são das caixas de objeto da 2 e da 4, que não mudaram e não são contrato.

O que mudou desde a rodada 7 (diff da página contra `v7-index-rodada4-base.html.bak`):
- **1:**
  - o `gap` do card voltou a `--dimension-spacing-core-sm` (16 px);
  - a margem da frase do Enter foi a zero;
  - "Sol entre nuvens" passou a `--color-semantic-functional-text-muted`;
  - o PNG passou a `o1v8-nuvem-sol.png`.
- **3:** o dissolve usa `var(--motion-semantic-easing)`, que no CSS gerado é um `linear(...)` válido de 41 pontos, com `--motion-semantic-duration` (800 ms).
- **2 e 4:** nada mudou. Os PNGs são idênticos byte a byte aos de `rodadas/3/`.
- **3:** o `→` difere só na codificação do PNG. Os pixels são idênticos (0 px diferentes): o easing novo não muda o quadro final.

O algarismo tem **53,3 px** nas quatro (`.text-display-lg-bold`).

## As quatro em números

| | Card | Algarismo / card | Objeto / algarismo | Ar do objeto ao texto mais próximo | Grupo → faixa |
|---|---|---|---|---|---|
| 1 | 319 | 16,7% | 3,5× (185 px) | 19,6 px do raio sólido ao "2" (15,1 px na borda do halo) · 21 px à palavra · 16,3 px às células | objeto → células: 16,3 |
| 2 | 356 | 15,0% | 1,7× (90 px) | 22,6 px à palavra (o objeto é membro do grupo) | 34 |
| 3 | 372 | 14,3% | ≈2,1× | o texto fica todo sobre o cinza do card (luminância do fundo igual à do card) | 28 |
| 4 | 269 | 19,8% | 2,5× (132 px) | 21,3 px ao 24° · 21,9 px à palavra · 20,7 px a "Umidade" | 59 |

Todas estão dentro das medidas do brief: o algarismo fica entre 10% e 25% do card, e o objeto entre 1,5× e 4× o algarismo.

O contraste pior medido nos pixels reais é:
- 9,1:1 para o texto primário;
- 6,1:1 para o muted.

## Veredito por opção

**Opção 1 (contraponto, refs. 12 e 6): Tem a cara.**
- **Levar:**
  - Número: ok. O algarismo tem 16,7% do card, como a rodada 7 previu para o `gap` de 16 px.
  - Berço: ok. A nuvem toca as duas bordas, a base é de barrigas redondas e o sol tem raios em pílula e halo, quase todo à vista.
  - **Ar em volta do objeto: ok, era o ajuste da rodada.**
    - do raio direito ao "2": 19,6 px, contra 8 na rodada 7. O ponto mais à direita do raio sólido está em x 84,7, e o plano pedia x ≤ 87;
    - da nuvem a "Sol entre nuvens": 21 px, contra 11 a 15. O ponto mais próximo é o topo do vale, em y 162, e o plano pedia y ≥ 157;
    - da base da nuvem (y 227,7) ao contorno das células (y 244): 16,3 px, contra 6;
    - no PNG de →, o anel de foco fica nesse mesmo contorno, a 16 px da nuvem.
  - A palavra: ok. Está em muted (rgba(255,255,255,0,7)), como nas outras três. O grupo agora lê em dois tons: São Paulo e 24° em primário, a palavra mais baixa.
- **Visto e aceito:** a borda mais fraca do halo do sol chega a 15,1 px do "2". É queda de luz, não contorno: no limiar dos pixels sólidos são 19,6 px. Em 1× não se vê.
- **Evitar:** ok. Há um só objeto, na paleta da família, e nenhum pixel de nuvem fica sob o texto.
- **Teste de fidelidade:** sim. Há um só objeto, e ele é a única cor. O 24° é o maior texto, o fundo é neutro e o centro é permitido no contraponto.
- **Genérico a olho:** as três células contornadas de mesmo peso. São regra do kit (§9.5), e o brief as aceita.
- **Teclas:**
  - → passa o anel para "Umidade".
  - Enter abre a frase a 16 px abaixo das células. O card cresce para baixo, e as células e a nuvem não se movem.
- **Um ajuste:** nenhum: ótimo.

**Opção 2 (reinterpretada, ref. 4): Tem a cara.**
- **Levar:**
  - Número: ok, com 15,0% do card.
  - Objeto: ok, com 1,7× o algarismo, ao lado da palavra.
  - A palavra: ok, em muted.
  - Faixa: ok. O seletor é texto, e Agora vai em bold.
- **Evitar:** ok.
- **Visto e aceito, como nas rodadas 6 e 7:** as colunas do seletor e as dos dados não se alinham, por ≈10 px.
- **Teste de fidelidade:** sim.
- **Genérico a olho:** nenhum que pese.
- **Teclas:**
  - → leva o anel a "Hoje", e a faixa troca para as horas.
  - Enter não faz nada, como pede o brief.
- O PNG é idêntico ao da rodada 7.
- **Um ajuste:** nenhum: ótimo.

**Opção 3 (reinterpretada, refs. 10, 2 e 11): Tem a cara.**
- **Levar:**
  - Número: ok, com 14,3% do card e o ° rente.
  - Imagem: ok.
    - Em Hoje, as faixas de luz se esmaecem antes de São Paulo. No limiar firme, o pixel mais próximo está a 27 px.
    - Em Ter, a nuvem de chuva vem cortada pelo topo, com riscos e grão. No limiar firme, o pixel mais próximo está a 19 px.
    - Só o fim do esmaecimento chega a 7–10 px de São Paulo. Atrás das letras o fundo é o cinza do card.
  - Trilho: ok. Fica a 28 px da palavra, contra 16 dentro do grupo.
- **Evitar:** ok.
- **Contrato:** ok. A pendência de código da rodada 7 entrou. O dissolve agora é `var(--motion-semantic-duration) var(--motion-semantic-easing)`.
- **Teste de fidelidade:** sim.
- **Genérico a olho:** as quatro células de mesmo peso no trilho. São regra do kit (§9.5), e o brief as aceita.
- **Teclas:**
  - → troca para Ter: chuva, 21° e "Chuva fraca". Nada mais se move.
  - Enter abre média, sensação e umidade abaixo do trilho, e o trilho fica parado.
- **Um ajuste:** nenhum: ótimo.

**Opção 4 (fiel, ref. 5, estática): Tem a cara.**
- **Levar:**
  - Número: ok. Tem 19,8% do card e é a entrada, no canto.
  - Objeto: ok. Tem 2,5× o algarismo e é cortado só pela borda direita, a 21 px do 24° e da palavra.
  - Faixa: ok, a ≈20 px da base da nuvem.
- **Evitar:** ok.
- **Teste de fidelidade:** sim.
- **Genérico a olho:** nenhum.
- As teclas não fazem nada, como pede o brief.
- O PNG é idêntico ao da rodada 7.
- **Um ajuste:** nenhum: ótimo.

## Contrato do brief, conferido nas quatro

| | 1 | 2 | 3 | 4 |
|---|---|---|---|---|
| 24° em `.text-display-lg-*`, tabular, ° alto à metade | sim | sim | sim | sim |
| São Paulo e a palavra em `.text-body-sm-medium`; palavra em muted | sim | sim | sim | sim |
| Faixa em `.text-footnote-medium` / `.text-body-sm-medium`, muted, uma só | sim | sim | sim | sim |
| Um objeto, PNG, única cor; card neutro, sem gradiente de tema | sim | sim | sim | sim |
| Peças alcançáveis com contorno em repouso; escolhida pequena e baixa | sim (células) | seletor isento (§9.5) | sim (dias; Ter invertido e pequeno) | não se aplica (estática) |
| Movimento com os tokens do kit | não se aplica | não se aplica | sim (corrigido) | não se aplica |

## Uma direção ou quatro?

É uma direção, com as distâncias legíveis:
- a 4 é a ref. 5 traduzida;
- a 2 é a ref. 4;
- a 3 é a ref. 10 em série;
- a 1 é o contraponto centrado, com o objeto atrás e embaixo do grupo.

O que as quatro têm em comum:
- o número em display como arquitetura (14,3% a 19,8% do card);
- um único objeto de tempo como a única cor;
- a mesma mão de desenho: luz do alto à esquerda, paleta amarelo / branco-azulado / lavanda, e raio em pílula com halo na 1, na 2 e na 4;
- o card neutro;
- a palavra em muted no grupo;
- uma faixa só.

A nuvem da 1 continua a mais lisa da série. É diferença de grau, não de mão, e foi vista e aceita na rodada 7.

A variedade se mantém. O objeto ocupa uma região diferente em cada opção (banda do meio, canto de cima, metade de cima, borda direita), e são quatro padrões de interação: expandir no lugar, seletor, trilho e estático. Nenhuma "difere só no layout".

**As quatro estão Tem a cara, sem ajuste. Loop fechado.**
