# Crítica de direção, rodada 9: foco-clima-2 (após o feedback do designer)

Julgado a partir dos PNGs de `rodadas/5/` (`opcao-N.png`, `-1-ArrowRight` e `-2-Enter`; as folhas foram ignoradas). As caixas foram medidas no DOM da página costurada, em todos os estados (opção 1: foco, →, →, →, Enter, Escape, Backspace; opção 3: Enter, →, Enter, →, →, Enter, Backspace). A massa clara foi contada nos pixels da captura em 1× (pixels com luminância acima de 180 dentro da caixa de cada peça). O ar entre a nuvem e o texto da opção 1 foi medido numa captura com o texto transparente. Os oito PNGs de ícone da opção 3 foram abertos em 6× e em 24 px, num fundo escuro e num fundo claro.

Todas as imagens carregaram, inclusive os PNGs relativos `assets/o1v9-nuvem-sol.png` e `assets/o3v9-*.png`. As quatro opções foram julgadas por inteiro.

O que mudou desde a rodada 8 (diff contra `v8-index-pos-feedback-base.html.bak`):
- **1:** sem Enter. O foco nas células troca a palavra do tempo por uma frase curta, no mesmo lugar. As células têm altura fixa (60 px) e o palco caiu de 196 para 192 px. O PNG passou a `o1v9`.
- **2:** Agora, Hoje e Semana viraram botões: contorno de repouso do kit, altura `--dimension-size-semantic-control-height` (40 px), escolhido invertido.
- **3:** cada dia ganhou um ícone de 24 px em cima do nome. O Enter troca a palavra por "Sensação · Umidade", no lugar.
- **4:** nada mudou. As 2.305 diferenças de pixel contra a rodada 4 vêm do card que agora começa em y 611,6 (subpixel); a olho a imagem é idêntica.

O algarismo continua com **53,3 px** nas quatro (`.text-display-lg-bold`).

## As quatro em números

| | Card | Altura igual em todos os estados | Algarismo / card | Peça escolhida: massa clara contra o 24° |
|---|---|---|---|---|
| 1 | 320 | sim (320 nos 8 estados) | 16,7% | não há peça invertida |
| 2 | 359,2 | sim (359,2 em Agora, Hoje, Semana, Enter) | 14,8% | Agora: 2.439 px contra 2.275 = **1,07×** |
| 3 | 395,6 | sim (395,6 nos 8 estados, com e sem Enter) | 13,5% | Hoje: 2.288 contra 2.244 = **1,02×** · Ter: 0,64× |
| 4 | 268,8 | estática | 19,8% | não se aplica |

O algarismo fica entre 10% e 25% do card nas quatro.

## Veredito por opção

**Opção 1 (contraponto, refs. 12 e 6): Tem a cara.**
- **Sem o dropdown, a cara ficou.** O card tem 320 px em todos os estados, nada pendura e nada se move (§9.6 ok). O banco de nuvem, o sol e o grupo centrado são os da rodada 8. O que muda com o foco é só uma linha de texto, a da palavra.
- **Levar:**
  - Número: ok, com 16,7% do card.
  - Objeto: ok. Há um só, e ele é a única cor.
  - Células: ok. Cada uma tem contorno de repouso (§9.5/§9.7), e a célula em foco ganha o anel e passa a primário.
- **Evitar:** ok.
- **Visto:**
  - O ar entre a palavra e a crista da nuvem diminuiu. Em repouso, do texto ao topo do vale há 15 px; com a mesma medida, a página da rodada 8 dava 18 px. O palco perdeu 4 px, e a nuvem subiu 3 px.
  - Com "Úmido, sem chuva", a frase mais larga (121,8 px contra 109,8), o fim do texto fica a 12,2 px da crista direita.
  - Em 1× não encosta, mas é o ponto mais apertado do card.
- **Teste de fidelidade:** sim.
- **Genérico a olho:** as três células contornadas de mesmo peso. São regra do kit, e o brief as aceita.
- **Teclas:**
  - Quando o card recebe o foco, a palavra vira "Sente 2° a mais".
  - → passa para "Umidade" e "Úmido, sem chuva", e depois para "Média" e "Entre 18° e 26°".
  - Enter não faz nada: o PNG é idêntico byte a byte ao de →.
  - Escape e Backspace devolvem "Sol entre nuvens". O anel fica em Sensação, sem a frase dela, até a próxima seta. É um estado de passagem, não de direção.
  - Com o foco no card, o grupo focal perde a palavra do tempo. É decisão do designer, registrada no brief.
- **Um ajuste:** descer o banco de nuvem 4 px, devolvendo o palco a 196 px. O card vai a 324 px, e o algarismo a 16,4%. O ar volta a ≈18 px da palavra e a ≈15 px da frase mais larga.

**Opção 2 (reinterpretada, ref. 4): Quase.**
- **Levar:**
  - Número: ok, com 14,8% do card.
  - Objeto: ok, com 1,7× o algarismo, ao lado da palavra, que está em muted.
  - **Botões: a affordance entrou.** Os três segmentos têm o contorno de repouso, e o escolhido é o único invertido.
- **Não cabe no inset:**
  - Os segmentos medem 71,6 + 62,1 + 85,2 px, com 2 vãos de 8 px: 234,9 px numa caixa de 224.
  - "Semana" passa 10,8 px da margem, e sua borda fica a 21,2 px da borda do card, contra os 32 do inset (§7.3).
  - Dá para ver no PNG: "Semana" é a única peça do card que avança na margem da direita.
- **O escolhido compete com o 24°:**
  - "Agora" invertido é um bloco sólido de 71,6 × 40 px, com 2.439 px claros. O 24° tem 2.275, ou seja, o botão tem 1,07× a massa clara do número.
  - O brief pede o contrário: "o 24° continua sendo a maior massa clara".
  - Com os olhos semicerrados, o bloco branco embaixo de São Paulo é a segunda coisa vista, antes da palavra e da nuvem.
- **Evitar:** um controle mais alto que o que ele controla. A fileira de pílulas (40 px de altura, 235 de largura) pesa mais do que os três dados que ela troca (35 px de altura, em footnote e body-sm muted).
- **Visto:**
  - Do fim de São Paulo ao contorno dos botões há 16 px. Na rodada 8 eram 34 px, quando o seletor era texto. Ainda é mais do que os 12 px entre os botões e os dados, então os grupos se leem.
  - As colunas dos dados não se alinham com as dos botões, por 21 e 11,5 px.
- **Teste de fidelidade:** sim.
- **Genérico a olho:** um controle mais alto que o conteúdo; com os olhos semicerrados, peças de massa parecida (o botão e o 24°).
- **Teclas:**
  - → leva o anel e o fundo invertido a "Hoje", e a faixa troca para as horas.
  - Enter não faz nada (o PNG é idêntico ao de →).
- **Um ajuste:** reduzir o padding lateral dos segmentos de `--dimension-spacing-core-sm` para `--dimension-spacing-core-xs`, mantendo a altura de 40 px do kit.
  - A fileira cai para ≈211 px e cabe nos 224 do inset, com 13 px de folga.
  - "Agora" fica com ≈64 × 40 px e ≈2.120 px claros, ≈0,93× o 24°.

**Opção 3 (reinterpretada, refs. 10, 2 e 11): Quase.**
- **Ícones, mesma mão:** sim, entre os quatro.
  - O traço tem ≈2 px em 24 px e as pontas são redondas.
  - O preenchimento interno é translúcido.
  - O sol de Hoje e o de Qui são iguais (8 raios curtos), e a nuvem de Hoje, Ter e Qua é a mesma silhueta.
  - São de outra mão que o objeto volumétrico, de propósito: monocromáticos, como pede o brief.
- **Ícones, legíveis em 24 px:**
  - Ter (nuvem com três gotas inclinadas), Qua (nuvem) e Qui (sol) se distinguem pela silhueta.
  - **Hoje não.** O contorno da nuvem atravessa o disco do sol e um raio corta o topo da nuvem: em 6× o sol parece um "Ø".
  - Em 24 px, invertido (preto sobre branco), o canto superior esquerdo do ícone vira um nó. Hoje é justamente o dia escolhido em repouso, o mais visto.
- **A imagem do dia segue como única cor:** sim.
  - Os oito PNGs de ícone têm 0 pixels saturados.
  - Os normais têm um só valor, o claro do texto. Os invertidos são `--color-semantic-functional-text-inverse`, o mesmo do nome "Hoje" na célula.
  - O trilho em repouso tem 0 pixels de cor.
- **Levar:**
  - Número: ok, com 13,5% do card.
  - Imagem: ok, como na rodada 8.
  - Trilho: ok, a 24 px da palavra.
- **Enter:**
  - "Sensação 22° · Umidade 84%" mede 196,7 px e cabe numa linha dos 224.
  - O card fica em 395,6 px em todos os dias, com e sem Enter (§9.6 ok).
  - A palavra volta ao mover de dia e com Backspace.
- **Evitar:**
  - Células iguais contornadas como único apoio, agora com glifos de linha de app de clima. O brief aceita as duas coisas (regra do kit e decisão do designer), mas é o trecho mais "widget" da série.
- **Visto:** com o ícone, a célula cresceu de ≈36 para 59,6 px de altura.
  - Em repouso, "Hoje" invertido (46,1 × 59,6 px) tem 2.288 px claros contra 2.244 do 24°: empata, com 1,02×.
  - Com Ter escolhido, que é mais estreito, fica em 0,64×.
  - Não há como baixar isso num só movimento sem tirar o ícone de 24 px que o designer pediu. Fica para o designer decidir se aceita o empate em Hoje.
- **Teste de fidelidade:** sim.
- **Genérico a olho:** quatro células de mesmo peso com glifos de linha (aceito pelo brief).
- **Um ajuste:** redesenhar o ícone de Hoje com a nuvem na frente do sol.
  - O traço do sol para a uma largura de traço da borda da nuvem.
  - Nenhum raio cruza a nuvem.
  - Assim o "nublado com sol" se lê em 24 px, também invertido.

**Opção 4 (fiel, ref. 5, estática): Tem a cara.**
- **Levar:**
  - Número: ok, com 19,8% do card, no canto.
  - Objeto: ok, com 2,5× o algarismo, cortado só pela borda direita.
  - Faixa: ok.
- **Evitar:** ok.
- **Teste de fidelidade:** sim.
- **Genérico a olho:** nenhum.
- **Teclas:** não fazem nada; os três PNGs são idênticos byte a byte.
- **Um ajuste:** nenhum: ótimo.

## Contrato do brief, conferido nas quatro

| | 1 | 2 | 3 | 4 |
|---|---|---|---|---|
| Mesma altura em todos os estados (§9.6) | sim | sim | sim | sim (estática) |
| Peças alcançáveis com cara de botão em repouso (§9.5, §9.7) | sim (células) | sim (segmentos) | sim (dias) | não se aplica |
| Peça escolhida pequena, nunca mais massa clara que o 24° | não se aplica | **não** (1,07×) | no limite (1,02× em Hoje) | não se aplica |
| Dentro do inset de 32 px | sim | **não** (Semana a 21,2 px) | sim (o contorno avança 8 px, e o texto e os ícones ficam no eixo) | sim |
| Um objeto, única cor; card neutro | sim | sim | sim (ícones monocromáticos) | sim |

## Uma direção ou quatro?

Ainda é uma direção:
- o número em display como arquitetura (13,5% a 19,8% do card);
- um único objeto de tempo como a única cor;
- o card neutro, a palavra em muted e uma faixa só.

As distâncias continuam legíveis: a 4 é a ref. 5, a 2 é a ref. 4, a 3 é a ref. 10 em série, e a 1 é o contraponto centrado.

O feedback deixou os controles mais presentes:
- Na 2 e na 3 a affordance entrou, e com ela o risco comum às duas: a peça escolhida, invertida e agora maior, chega à massa clara do 24°. Na 2 passa (1,07×); na 3 empata em Hoje (1,02×).
- A série agora tem uma segunda mão de desenho, a dos glifos de linha da 3. Ela fica só no apoio e é monocromática, então o fio aguenta. Mas é o trecho que mais se aproxima do "ícone de banco" que o Evitar descreve.
- A 1 e a 3 agora usam o mesmo mecanismo: o detalhe toma o lugar da palavra do tempo. O gatilho é diferente (foco na 1, Enter na 3), então os quatro padrões de interação continuam distintos: foco revela, seletor, trilho com Enter e estático.

A 4, a favorita, ficou intacta.
