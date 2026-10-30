crie 4 explorações de uma interatividade de previsão do tempo. Quero que seja um card com temperatura atual, temperatura média, nome do local, ícones comunicando visualmente o clima e informações metereológicas como umidade e sensação térmica. Use essa imagem como referência (selo azul "Replay": muito espaço vazio, tipografia minimalista e bem posicionada), eu gosto do uso do espaço vazio dentro desse componente, com espaço para ser mais visual.

**Para quê e onde:** o espectador consulta o clima na TV, sem trocar de dispositivo, para planejar o dia ou a semana.
**Intenção:** calmo, arejado, mais visual que informativo. Evitar: card cheio/denso, ícones genéricos de app de clima, visual frio de tabela.
**Foco:** objetivo = saber como está o tempo agora onde estou. Grupo de destaque (um só) = **24° + ícone do clima + São Paulo**, juntos. Segundo plano, numa faixa quieta: média do dia, sensação, umidade, horas e dias.
**Controle:** interativo nas opções 2 e 3 (←/→ navega; Voltar volta ao início); as opções 1 e 4 são só visuais, estáticas, sem teclas. Em todas, o card tem a mesma altura em qualquer estado (DESIGN.md §9.6): nada cresce nem pendura abaixo do card.
**Estados:** foco, selecionado e expandido. Suposição: sem carregando nem vazio.
**Conteúdo:** São Paulo · agora 24° · média do dia 22° · sensação 26° · umidade 68% · nuvem com sol; horas de hoje (09h, 12h, 15h, 21h) e próximos dias (Ter a Sex) com ícone e temperatura.
**O que varia:** tese, referência principal e padrão de interação; 4 opções. Fica igual: o grupo focal, a Direção visual e os dados.
Superfície: Content Card

**Direção visual**
- Tom: tipográfico, volumétrico, contido · temperatura: vem do objeto de tempo (sol amarelo, nuvem branca), que é a única cor do card. O card é a superfície neutra do kit.
- Fio condutor: o número é a arquitetura, e um único objeto de tempo, grande, volumétrico e específico, diz o tempo. O texto fica num eixo esquerdo, preso às bordas, e o resto do card é desse objeto ou do vazio neutro.
- Referência principal: as 12 referências de widgets de clima do designer (`referencias/`, fio revisto em `referencias/fio-das-referencias.md`), com destaque para a 4 (sol 3D brilhante + "Sunny" + 32° + faixa cinza embaixo), a 5 (nuvem 3D que passa da borda, cidade e 20°C no topo esquerdo) e a 10 (faixas de luz com grão sobre preto) · teoria confirmada:
  - o número é a maior massa do card (12 de 12);
  - eixo esquerdo, texto preso às bordas (9 de 12);
  - o tempo dito por um objeto grande ou por uma imagem gráfica, nunca por um glifo pequeno (11 de 12);
  - o tempo dito em palavra (10 de 12);
  - pouco apoio, numa faixa só (12 de 12);
  - esqueleto fixo entre estados (séries 2 e 11);
  - nenhum gráfico (0 de 12).
- Mantido do selo Replay: o grupo focal como uma peça só, e a contenção: nenhuma pílula, caixa colorida ou divisor, e uma faixa de apoio só. Caem a folga igual nos quatro lados e o grupo no centro óptico, salvo no contraponto.
- Levar: **o número como arquitetura, em tamanho display.**
  - O 24° vai em `.text-display-lg-*` (72px; regular ou medium nas referências de peso fino, bold nas de peso cheio) com `font-variant-numeric: tabular-nums`, e o `°` sobe ao topo dos algarismos com metade do tamanho (`DESIGN.md` §2.3). Nada de `calc` sobre o tamanho da fonte.
  - A altura do algarismo é de 10% a 25% da altura do card (mediana ≈14%). Num card de 288 px de largura isso pede um card baixo: a menor altura que o conteúdo permite, sem vão reservado e sem `min-height`. O relatório diz a razão medida.
  - O objeto de tempo tem de 1,5× a 4× a altura do algarismo (as referências; a ref. 4 mede ≈1,5×), nunca 5× ou mais: o número, não o objeto, é a atração.
  - Todos os objetos de tempo das quatro opções partem da mesma mão de desenho: luz do alto à esquerda, volume suave, grão fino, mesma paleta (amarelo do sol, branco-azulado da nuvem, cinza de chuva). Uma opção não pode parecer de outro ilustrador.
- Levar: **um único objeto de tempo, e ele é a única cor.**
  - É um PNG desenhado e convertido com `scripts/icon-to-png.mjs`, específico do tempo de agora (nuvem com sol).
  - Volume e grão ficam dentro do PNG (sombreamento interno). Nenhuma sombra projetada no card.
  - Ele aparece de uma de três formas, por opção:
    - (a) o ícone do grupo crescido, de 1,5× a 4× a altura do 24°, ao lado da palavra (ref. 4);
    - (b) um objeto grande cortado pela borda e encostado no grupo, ocupando ≈1/4 a 1/3 do card (ref. 5);
    - (c) uma imagem gráfica de luz ou de chuva, com grão, cortada pelas bordas (ref. 10).
  - Nunca dois objetos: quando há objeto grande, ele é o ícone do trio, e o grupo não leva glifo.
- Levar: **eixo esquerdo, texto preso às bordas, o tempo também em palavra.**
  - O grupo é 24° + objeto ou ícone + São Paulo + a palavra do tempo ("Sol entre nuvens"), no inset `--dimension-spacing-semantic-card-inset-expanded`, preso à borda de cima ou à de baixo.
  - São Paulo e a palavra vão em `.text-body-sm-medium`; a palavra em `--color-semantic-functional-text-muted`, o resto em `--color-semantic-functional-text-primary`.
  - O lado que não tem texto é do objeto ou do vazio neutro.
- Levar: **pouco apoio, esqueleto fixo, gráfico só em card estático.**
  - Em repouso, a faixa presa à borda de baixo tem no máximo 3 dados (média, sensação, umidade) ou o controle que os troca, em `.text-footnote-medium` ou `.text-body-sm-medium` e `text-muted`.
  - Horas e dias aparecem só num estado ou num passo, e como texto.
  - Entre estados mudam só o objeto, o número, a palavra e os dados da faixa. Posição, margens e raio ficam.
  - Card com gráfico é estático (decisão do designer), e o fio prefere nenhum gráfico.
- Evitar: **o ícone de banco de ícones.** Um glifo pequeno, chapado ou de linha no lugar do objeto; um sol ou nuvem genérico do tamanho do texto; o objeto centrado sobre o número numa pilha ícone/número/rótulo.
- Evitar: **cor fora do objeto.**
  - Nenhum `--gradient-primary-dia`, `-tarde` ou `-noite` como atmosfera, nenhum fundo de cor e nenhum texto colorido (o número laranja da ref. 10 não entra).
  - Nenhuma pílula ou caixa de cor. O anel de foco do kit é a única cor funcional.
- Evitar: **dois objetos e o widget de app.**
  - Ícone pequeno no grupo junto de uma nuvem grande.
  - Células iguais contornadas como único apoio.
  - Gráfico ou curva num card que navega.
  - Mais de uma faixa de apoio.
- Pendente de decisão do kit (não é Levar):
  - foto de céu por condição, com texto sobre a foto;
  - vidro e desfoque;
  (a unidade ° alta saiu daqui: virou a exceção do `DESIGN.md` §2.3.)
- Decisão sobre peças que o controle alcança: o contorno em repouso e a peça escolhida invertida seguem o `DESIGN.md` §9.5/§2.5/§9.2 (a regra do kit vale), mas a peça escolhida é pequena e baixa, nunca mais massa branca do que o 24°.
- Palavras do designer: "o fio das referências manda", "Uma peça, ar igual em volta", "Mais presente", "calmo, arejado, mais visual que informativo". Decisões dele nesta rodada: gráfico só em card sem interação; sem cor de gradiente; o tempo dito por ícone ou imagem gráfica.
- Inegociável: exatamente um objeto de tempo, grande, volumétrico e específico, que é a única cor do card; 24° + objeto + São Paulo + palavra juntos, presos a uma borda no eixo esquerdo (o contraponto pode centrar); card na superfície neutra do kit. Descarta-se a opção que tiver gradiente de cor no card, glifo de banco no lugar do objeto, dois objetos, gráfico num card que navega ou o trio separado.
- Teste de fidelidade: há um só objeto de tempo, grande (de 1,5× a 4× a altura do 24° ou cortado pela borda) e volumétrico, e ele é a única cor? O 24° é o maior texto e o grupo, com a palavra, está preso a uma borda no eixo esquerdo? O fundo é neutro, sem gradiente de cor?
- Distância por opção: 1 contraponto · 2 reinterpretada · 3 reinterpretada · 4 fiel

## Opção 1
- **Tese:** um card de informação: o grupo no topo sobre a superfície neutra, o banco de nuvem embaixo, e nada para apertar.
- **Foco em cena:**
  - Grupo centrado (como as refs. 6 e 12) e preso ao topo, todo sobre a superfície neutra do card: São Paulo, 24° e a palavra, sem nada atrás (o branco do texto precisa de fundo escuro, e uma nuvem branca não o dá).
  - Embaixo, o "berço da nuvem": um banco de nuvem volumétrico, cortado pelas duas bordas laterais (cristas dos lados, vale no meio, base de barrigas redondas), com o sol atrás da crista esquerda e pelo menos 60% dele à vista. É o objeto único do card.
  - A faixa de 3 itens fica presa à borda de baixo, logo abaixo do banco.
  - Decisão tomada no loop de qualidade (crítica 6): a composição "número sobre a nuvem" foi descartada porque obriga a nuvem a ficar escura.
- **Distância:** contraponto (inverte só o eixo esquerdo; o objeto fica atrás do grupo, como na ref. 12).
- **Referência:** refs. 12 e 6 do designer; cartoes-contexto-evento-voz-clima-voo (linha que se abre).
- **Interação:** Estático (decisão do designer: a interação complicava demais e a informação que ela dava não a justificava). Sem teclas, sem `tabindex`, sem script. Diferencia-se da opção 4 pela estrutura (grupo centrado sobre o berço de nuvem cortado pelas duas bordas), não pela interação.
- **Peças:** objeto de tempo (PNG); grupo focal; faixa de apoio de 3 dados (Sensação, Umidade, Média) só em texto: rótulo sobre valor, sem contorno, sem células (não há nada para apertar).
- **Decisões do designer:** (1) a composição está ótima (cidade em corpo menor, temperatura em display, palavra do tempo mais apagada): não mexer. (2) Largar a interação por inteiro. (3) A nuvem não pode ser cortada por baixo pelo palco: o PNG termina na própria curva e nada a recorta pela base (as bordas laterais podem cortá-la, como desenhado). (4) Os valores da faixa de apoio ficam maiores: 16 a 18 px, com o rótulo menor acima.

## Opção 2
- **Tese:** o tempo é a manchete: o sol cresce ao lado da palavra, o número vem embaixo, e o seletor troca só a faixa.
- **Foco em cena:**
  - No canto superior esquerdo, a nuvem com sol volumétrica (de 1,5× a 4× a altura do 24°) e "Sol entre nuvens" na mesma linha; embaixo, no mesmo eixo, o 24° e São Paulo.
  - O vazio neutro fica à direita.
  - O seletor e os dados formam uma faixa só, presa à borda de baixo.
- **Distância:** reinterpretada (a composição da ref. 4 com um seletor).
- **Referência:** ref. 4 do designer; cidade-foto-com-seletor.
- **Decisões do designer (rodada 3):** (1) composição mais apertada: a palavra do tempo vai para junto da cidade, na mesma linha, com o ponto médio como separador ("São Paulo · Sol entre nuvens"), porque o grupo a que o status pertence não é a ilustração; (2) a ilustração vai para a direita, no canto superior direito, como na opção 4, e o grupo (24° e a linha da cidade) fica à esquerda: isso tira o vazio grande da direita e reduz a altura do card; (3) os botões de baixo estão bons (juntos): manter; (4) a faixa de dados de baixo ganha hierarquia: os números maiores (16 a 18 px), com o rótulo menor acima; (5) os segmentos não escolhidos em cor secundária (text-muted), não primária.
- **Interação:** Seletor segmentado. ←/→ troca o segmento na hora: Agora (média, sensação, umidade), Hoje (horas em texto) e Semana (dias em texto). Enter não faz nada.
- **Peças:** objeto de tempo (o ícone do grupo crescido, PNG); grupo focal; seletor; faixa do segmento.
- **Decisão do designer:** Agora, Hoje e Semana precisam ter cara de botão (affordance): cada segmento leva o contorno de repouso do kit (DESIGN.md §9.5/§9.7), não só texto; o escolhido é o único invertido, pequeno e baixo, e o 24° continua sendo a maior massa clara.

## Opção 3
- **Tese:** os dias são imagens de luz: trocar o dia troca a imagem, o número e a palavra, e nada mais se move.
- **Foco em cena:**
  - A imagem gráfica do tempo do dia ocupa a metade de cima, cortada pelas bordas de cima e dos lados: faixas de luz com grão para sol, riscos e névoa com grão para chuva.
  - Logo abaixo, no eixo esquerdo, ficam o 24°, a palavra e São Paulo. A imagem é o ícone do trio, sem glifo.
  - O trilho de 4 dias fica preso à borda de baixo.
- **Distância:** reinterpretada (a imagem de luz da ref. 10, em série como nas refs. 2 e 11).
- **Referência:** refs. 10, 2 e 11 do designer; trilho-de-dias-com-seletor.
- **Interação:** Trilho de passos. ←/→ move o dia (Hoje e os 3 seguintes); Enter troca a palavra do tempo pela linha "Sensação · Umidade" do dia, no mesmo lugar (a palavra volta com Voltar ou ao mover de dia). O card tem a mesma altura sempre: nada cresce.
- **Peças:** imagem do dia (um PNG por dia); grupo focal; trilho de 4 dias.
- **Decisões do designer (rodada 3):** (1) as quatro células do trilho têm a mesma largura (hoje cada uma tem a sua); (2) os ícones precisam estar centrados de verdade na célula (o da nuvem está deslocado: centralize pelo centro óptico do traço, não pela caixa do PNG, e confira cada um); (3) os ícones com opacidade menor (secundários, abaixo do nome); (4) o vão entre ícone e texto merece mais trabalho: ajuste fino, sem encostar nem soltar; (5) os dias não escolhidos com o texto em cor secundária (text-muted), não primária.
- **Decisão do designer:** cada dia do trilho mostra, além do nome, um ícone pequeno do tempo previsto daquele dia (Hoje nublado com sol, Ter sol, Qua chuva, Qui nublado, por exemplo), para dar previsibilidade. Ícones monocromáticos em PNG na cor do texto da célula (a única cor do card continua sendo a imagem do dia), todos na mesma mão de desenho, legíveis em 24 px. Quatro dias, no máximo, como já era.

## Opção 4
- **Decisão do designer (rodada 3):** a melhor das quatro; a única mudança: os números da faixa de baixo (média, sensação, umidade) ficam maiores (16 a 18 px), com o rótulo menor acima. Não mexer em mais nada.
- **Tese:** um card que só se olha: a nuvem passa da borda, o número fica no canto, e não há nada para apertar.
- **Foco em cena:**
  - São Paulo, o 24° e a palavra ficam no canto superior esquerdo.
  - A nuvem com sol, volumétrica e grande, fica cortada pela borda direita, encostada no 24°, ocupando ≈1/3 do card.
  - A faixa quieta fica presa à borda de baixo: média · sensação · umidade, em texto.
  - Sem gráfico (0 de 12 referências).
- **Distância:** fiel (ref. 5).
- **Controle:** visual (estático). Sem ←/→ nem Enter e sem tabindex de interação; a página só desenha o card.
- **Referência:** ref. 5 do designer.
- **Interação:** Estático.
- **Peças:** objeto de tempo (PNG); grupo focal; faixa quieta.
