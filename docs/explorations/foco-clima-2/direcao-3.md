# Crítica de direção, rodada 3: foco-clima-2

Julgado a partir dos PNGs de repouso, → e Enter de cada opção, gerados pelo `check-explore-layout.mjs` (layout `ok`), e de uma captura em 3× de cada card, para ver o volume dos objetos. As caixas foram medidas no DOM e as cores, amostradas nos PNGs. Os quatro objetos de tempo carregaram, então todas as opções foram julgadas por inteiro. As medidas estão em px, no card de 288 de largura. O 24° (`.text-heading-3-bold`, 28 px) tem algarismo de ≈20 px nas quatro opções.

A régua é a Direção visual reescrita no brief: o objeto de tempo é a única cor, o fundo é neutro, a palavra vai no grupo e há uma faixa só. Contra ela ficam as referências 4, 5 e 10:

- **Ref. 4:** o algarismo tem ≈14% do card. O sol, com os raios, tem ≈25% da altura, ou seja ≈1,6–1,8× o algarismo. "Sunny" é o segundo maior texto.
- **Ref. 5:** o algarismo tem ≈12% do card. A nuvem tem ≈47% da altura, ≈4× o algarismo. Ela é cortada pela borda direita e encosta no "C".
- **Ref. 10:** as faixas de luz com grão ocupam ≈60% de cima. O texto fica na parte escura que sobra.

## Veredito por opção

**Opção 1 (contraponto): Quase.**
- **Levar:**
  - Objeto: ok. É um PNG só, nuvem larga com sol. A nuvem vai de borda a borda (288 px) e o objeto tem ≈150 px de altura (y 53 a 202), ≈49% do card de 304.
  - Número: falta. O algarismo tem 20 px num card de 304, ou seja **6,7%**, abaixo dos 10% das referências. O objeto tem ≈7,5× a altura do algarismo, contra 1,6× na ref. 4 e 4× na ref. 5.
  - Palavra: ok. "Sol entre nuvens" está em `text-muted` sob o 24°.
- **Evitar:**
  - **Trio separado.** São Paulo fica sozinho na borda de cima (y 32). O 24° fica a 89 px dele (y 138), com o sol no meio. O grupo lê em duas peças.
  - **Células iguais contornadas como único apoio.** São três caixas de 77×58 na base.
  - **Sombra escura no objeto.** A barriga da nuvem é desenhada quase preta (34,36,44 sobre o 63 do card). Ela forma uma faixa escura de ponta a ponta, e a nuvem passa a ler carregada, não "entre nuvens".
- **Teste de fidelidade:** não. O grupo não está junto nem preso a uma borda.
- **Banco de ícones ou específico:** específico na forma: um banco de nuvem cortado pelas laterais, que nenhum app de clima usa. Mas o desenho tem duas mãos: a nuvem é borrada, sem contorno de cúmulo, e o sol é nítido, com raios em pílula. Ao lado da nuvem da ref. 5, ela lê como neblina.
- **Genérico a olho:**
  - pilha centrada de cidade, número e palavra;
  - três células de mesmo peso na base;
  - a sombra do PNG fazendo papel de scrim escuro.
- **Um ajuste:** levar São Paulo para dentro do grupo, logo acima do 24°, sobre a nuvem. Assim a borda de cima fica só para o sol, e cidade, número e palavra viram uma peça de ≈75 px sobre a parte calma do objeto.

**Opção 2 (reinterpretada, ref. 4): Quase.**
- **Levar:**
  - Objeto: ok no tamanho. Tem 106×101 px no canto superior esquerdo, ≈5× o algarismo (o Levar pede ≥2×).
  - Número: falta como arquitetura. O algarismo tem 20 px num card de 338, ou **6,0%**. O objeto é a maior massa do card, com ≈2,5× a área da caixa do 24°. Na ref. 4 o número domina e o sol é coadjuvante; aqui é o contrário.
  - Eixo e faixa: ok. O texto fica no eixo esquerdo, preso a cima e embaixo, e o vazio fica à direita do 24°.
- **Evitar:**
  - **O ícone de banco, agora em 3D.** É o "sol atrás da nuvem pequena" (sol em cima à esquerda, nuvem embaixo à direita, metade e metade), a composição padrão de qualquer app. O sol está apagado: amostra 218,201,147, um bege sem saturação. O sol da ref. 4 e o da opção 4 (242,204,72) são amarelos com halo.
  - A palavra fica num segundo eixo, em x 156, quebrada em duas linhas de `text-muted` de 14 px. Ela flutua no vazio da direita. "Sunny" é o segundo maior texto da ref. 4; aqui a palavra é o menor.
- **Teste de fidelidade:** sim, com a palavra fora do eixo (a ref. 4 faz o mesmo).
- **Genérico a olho:**
  - o objeto ⛅ de app;
  - a pílula "Agora" invertida (fundo #EEE, texto preto, 64×41), a superfície mais clara do card, mais alta no contraste que o 24°. É um controle mais alto que o conteúdo que ele controla.
- **Um ajuste:** redesenhar o objeto como o da ref. 4. Um sol só, saturado e com halo, ocupa ≈2/3 do quadro, e a nuvem vira um pedaço pequeno à frente dele. Hoje sol e nuvem dividem o quadro meio a meio, num bege apagado.

**Opção 3 (reinterpretada, ref. 10): Quase.**
- **Levar:**
  - Objeto: ok, e é o mais perto de uma referência. As faixas verticais com grão vão do cinza ao creme e ao amarelo (251,234,141), com o pico de luz em cima à direita. Ocupam os 176 px de cima, ≈49% do card de 357, cortadas pelas bordas de cima e dos lados, e se fundem no fundo. Uma nuvem volumétrica e nítida (251,252,252, com grão) fica embaixo à esquerda.
  - Série: ok. Em Ter a imagem vira chuva com névoa e grão, o número vira 21° e a palavra "Chuva fraca"; o resto fica. É o mecanismo das refs. 2 e 11.
  - Número: falta. O algarismo tem 20 px num card de 357, ou **5,7%**, o menor dos quatro.
- **Evitar:**
  - **Células iguais contornadas como único apoio.** O trilho tem quatro caixas de ≈56×58. Hoje é a célula branca invertida, a superfície mais clara da metade de baixo.
  - Sob a nuvem há uma laje cinza plana (119,122,125, de y ≈140 a 170, de lado a lado). Ela lê como chão ou prateleira, não como base de nuvem.
  - No Enter, a faixa de média, sensação e umidade entra entre o grupo e o trilho, e o trilho desce ≈50 px. A tese diz que "nada mais se move".
- **Teste de fidelidade:** sim. O grupo fica no eixo esquerdo, preso ao bloco de baixo junto do trilho.
- **Banco de ícones ou específico:** o mais específico dos quatro. A luz com grão é a linguagem da ref. 10, e a chuva de Ter tem o mesmo grão. A imagem fala do tempo do dia, não de um ícone.
- **Genérico a olho:**
  - fileira de quatro células de mesmo peso;
  - célula selecionada mais clara que o 24°.
- **Um ajuste:** levar a imagem a ≈2/3 do card (≈240 px) e pôr o grupo sobre a parte esmaecida dela, como o "Cloudy +23°C" da ref. 10, que fica na parte escura da própria luz. A imagem passa a envolver o grupo, e o trilho vira uma base quieta embaixo, em vez de um segundo bloco que disputa com ele.

**Opção 4 (fiel, ref. 5, estática): Tem a cara.**
- **Levar:**
  - Número: ok. O card tem 186 px, e o algarismo tem **10,9%** dele, a primeira opção das três rodadas acima do piso das referências.
  - Objeto: ok. O sol com a nuvem é cortado pela borda direita. A caixa visível tem ≈162×126, ≈38% do card, perto do "≈1/3" do brief. O sol tem ≈57 px de diâmetro, saturado (242,204,72) e com halo, como o da ref. 4. A nuvem tem a barriga lavanda (164,177,205), como a da ref. 5.
  - Grupo: ok. São Paulo, 24° e "Sol entre nuvens" ficam no canto superior esquerdo, no inset de 32.
  - Faixa: ok. Média, sensação e umidade estão numa linha só de 12 px em `text-muted`, presa embaixo (33 px até a borda).
  - Sem gráfico e sem células.
- **Evitar:**
  - **O objeto é cortado por uma caixa invisível.** A base da nuvem termina numa reta horizontal em y ≈131, a 55 px da borda de baixo do card. Ali o lavanda passa direto ao cinza do card (de 164,177,205 a 63,63,63 em 20 px). É o `object-fit` recortando o PNG quadrado em 240×128. Na ref. 5 a nuvem só é cortada pela borda do card; embaixo ela termina na própria curva.
  - O sol fica a ≈46 px do 24° e a nuvem a ≈22 px da palavra: perto, mas não encosta, como a nuvem da ref. 5 encosta no "C".
- **Teste de fidelidade:** sim.
- **Banco de ícones ou específico:** volumétrico, e específico na composição (cortado pela borda, como a ref. 5). A nuvem, porém, é um cacho de esferas com a borda serrilhada de ruído, não o cúmulo da ref. 5. O sol, sozinho, é o sol 3D de qualquer pacote.
- **Genérico a olho:** nenhum dos movimentos de estoque; o que sobra é o desenho da nuvem.
- **Um ajuste:** deixar a nuvem inteira dentro do PNG até a curva de baixo, com a caixa da imagem descendo até a borda do card ou passando dela. Hoje a nuvem termina num corte reto no meio do card.

## Contra a rodada 2

**O que melhorou, nas quatro:**
- **A palavra entrou.** "Sol entre nuvens" está no grupo das quatro, e "Chuva fraca" em Ter na 3. Na rodada 2 não aparecia em nenhuma.
- **O verde de marca saiu.** Nenhum gradiente de tema e nenhum gradiente CSS no card. A única cor é o objeto.
- **Glifo e ícone de app viraram objeto volumétrico.** O glifo branco de 32–40 px e o ícone colorido de 40 px viraram PNGs de 100 a 288 px, com volume e grão.
- **O eixo esquerdo apareceu.** Antes ele só existia na 4. Agora está na 2, na 3 e na 4; a 1 centra de propósito.

**Por opção:**
- **Opção 1.** Saiu o glifo de 40 px sobre o cinza liso. Entrou a nuvem cortada pelas duas laterais, atrás do número. Ficou o número em 6,7% e as três células contornadas, que eram o "Tiburon ampliado" da rodada 2. Entrou um problema novo: a cidade separada do número.
- **Opção 2.** Saíram o ícone de app de 40 px e o leque verde; o grupo deixou de ser centrado. O que falta: o objeto ainda é o ícone de app, agora em 3D e grande. O número caiu de 5,3% para 6,0%, sem ganho real.
- **Opção 3.** O quarto de círculo verde (8–10% do card) virou uma imagem de luz de 49% do card, cortada pelas bordas, e cada dia agora troca a imagem. É o maior salto do conjunto. Ficaram o número (5,2% para 5,7%) e as quatro células contornadas.
- **Opção 4.** O gráfico e o triângulo de canto saíram e o card ficou estático, com a composição da ref. 5. O número foi de 4,7% para 10,9%, porque o card caiu de 430 para 186 px. Falta só o corte da nuvem.

## Uma direção ou quatro?

É uma direção, pela primeira vez nas três rodadas. As quatro opções dividem:
- o card cinza neutro (63,63,63) sem gradiente;
- um objeto de tempo volumétrico em PNG como única cor;
- o grupo com a palavra;
- uma faixa só de apoio em `text-muted`.

As distâncias são legíveis: a 4 é a ref. 5 traduzida, a 2 é a ref. 4, a 3 é a ref. 10 em série e a 1 é o contraponto, com o objeto atrás do grupo.

O conjunto ainda fala com **três mãos de ilustrador**:
- a nuvem borrada da 1;
- o sol bege e fosco da 2;
- o grão nítido da 3 e da 4.

O sol da 1 e o da 4 são o mesmo; o da 2 é outro. Um objeto de tempo de uma família só (mesma luz, mesmo grão, mesmo sol) faria das quatro uma série, como as refs. 2 e 11.

Há também um choque que não é de quem escreve:
- O Evitar "células iguais contornadas como único apoio" bate no `DESIGN.md` §9.5, que pede o contorno em repouso em toda peça que o controle remoto alcança, e no §2.5, que pede a peça escolhida invertida.
- Nas opções 1 e 3 essas regras fazem o trilho e as linhas parecerem células de widget.
- O designer decide qual vale num card que navega.

**O que só o passo display do kit resolve:**
- Com o teto em `.text-heading-3-bold` (algarismo de ≈20 px), um card interativo de 304 a 357 px fica em 5,7–6,7%.
- A opção 4 só chegou a 10,9% porque é estática e cabe em 186 px. Um card com trilho ou seletor não desce a esse tamanho.
- O piso de 10% pede algarismo de ≈30–36 px (corpo ≈42–49 px). A mediana de 14% das referências pede ≈43–50 px (corpo ≈59–69 px).
- Isso decide também a relação entre o objeto e o número. Nas referências o objeto tem de 1,6× (ref. 4) a 4× (ref. 5) a altura do algarismo. Aqui tem de 5× (opção 2) a 9× (opção 3).
- Encolher o objeto para chegar a essa proporção o faria voltar a ser ícone. O único caminho que mantém o objeto grande e devolve ao número o papel de arquitetura é um número maior.
- Enquanto o kit não tiver esse passo, nenhuma opção interativa passa no traço 1 do fio. O objeto vai continuar sendo a maior massa do card, e o número, o segundo.
