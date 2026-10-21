# cartoes-contexto-evento-voz-clima-voo
Tags: dado-âncora por card, linha que se abre, ação primária única, fileira de dias
Padrão: Expandir no lugar
Resumo: Quatro cards de contexto (evento, assistente de voz, clima, voo), cada um com um único dado âncora gigante e o resto em camadas de apoio.
Fonte: imagem fora do repositório · 2026-10-15

## Cerne
Cada card responde a uma pergunta só e põe a resposta num único elemento muito maior que o resto: o título do evento, o "24°", o par "SFO → JFK". Tudo o que vem depois é apoio em tamanho de texto comum, organizado em grupos separados por espaço. O painel mais instrutivo é o **evento** ("Launch review"): mostra numa só peça o âncora, linhas de metadado com ícone, uma linha recolhida que se abre ("Attendees · 5 going ⌄") e o par de ações primária/secundária.

## Peças
Quatro cards, cada um um grupo próprio:
- **Evento:** mapa no topo (cerca de 1/3 da altura, estimado), chip de data sobreposto ("Thu 14"), título, duas linhas de metadado com ícone, linha "Attendees" recolhida, fila de dois botões. Seis peças.
- **Voz:** cabeçalho (avatar com iniciais + nome + papel), divisor, balão de fala, texto quase invisível "Listening…", botão redondo de microfone, brilho colorido na base. Cinco peças.
- **Clima:** cidade + dia, temperatura gigante com ícone de sol à direita, condição + máx/mín, fileira de cinco dias numa barra translúcida com "Mon" selecionado. Quatro peças.
- **Voo:** linha de código/data com selo "On time", rota (dois códigos de aeroporto ligados por trilha tracejada com avião e duração), horários, picote de cartão de embarque, grade de quatro dados (Gate, Seat, Boards, Zone), rodapé com passageiro e "Check in". Cinco peças.

## Tipografia
- Uma família sem serifa, geométrica-humanista, em todos os cards. Em cada card há três níveis de tamanho (estimado): âncora, texto de apoio, rótulo.
- O âncora vai muito acima do apoio: título do evento cerca de 2× o metadado; "24°" cerca de 4× o nome da cidade; "SFO/JFK" cerca de 3× os nomes das cidades (estimado).
- Pesos: só dois. O âncora é médio/semibold; o apoio é regular. No voo e no clima o âncora tem espaçamento apertado (códigos de aeroporto quase encostados).
- Rótulo sobre valor na grade do voo: "Gate" cinza e menor, "B12" escuro e um pouco maior. O rótulo nunca compete com o valor.
- O chip de data inverte a convenção: o dia da semana pequeno, em cor de acento (vermelho), sobre o número grande neutro.
- No clima, o "°" é parte do número e quase do mesmo peso; "H:26° L:17°" fica em tamanho de legenda, mais claro.
- Horários alinham às bordas do card que lhes corresponde (08:45 à esquerda sob SFO, 17:05 à direita sob JFK).

## Posição e espaço
- Margem interna generosa e igual em todos os cards, cerca de 1/12 da largura (estimado); tudo na mesma borda esquerda, exceto o que pertence ao lado direito (JFK, selo, "5 going ⌄", "Check in").
- Evento: o chip de data monta metade sobre o mapa e metade sobre o corpo, amarrando as duas zonas. Gap entre as duas linhas de metadado cerca de metade do gap que as separa da linha "Attendees".
- Voo: lido em três faixas horizontais (rota, dados, passageiro) separadas por um picote e um divisor finíssimo. A rota é simétrica: códigos nas pontas, avião e duração no centro.
- Grade do voo: quatro colunas iguais de rótulo/valor; os valores alinham na mesma linha de base.
- Clima: a fileira de dias fica dentro de uma barra recuada com raio menor que o do card (raios aninhados, a barra parece encaixada).
- Botões em pílula (raio total); cards com raio grande e moderado. O botão primário ocupa cerca de 2/3 da largura da fila, o secundário o restante.

## Cor e superfícies
- Fundo da folha quase branco; três cards brancos com sombra muito difusa e borda quase imperceptível. O clima é a única superfície saturada (degradê azul de cima para baixo, mais escuro em cima).
- Neutros carregam quase tudo: preto para âncora e botão primário, cinza médio para metadado e rótulos.
- Acentos, cada um com um papel: vermelho só no dia da semana e no pino do mapa; azul só no link "Directions ›"; verde só no selo "On time" (fundo verde muito claro + texto verde); amarelo só no sol. Nenhum acento se repete com outro sentido.
- Ação primária é o único preenchimento escuro em cada card (Join call, Check in); a secundária ("Decline") é cinza-claro preenchido, sem borda.
- No clima, o dia selecionado tem fundo branco translúcido sobre a barra, também translúcida: duas camadas de opacidade.
- Brilho multicolor na base do card de voz é decoração que sinaliza "escutando".

## Hierarquia e leitura
Em cada card: âncora → contexto imediato (horário, condição, cidades) → detalhes → ação. Evento: título, horário, local, convidados, botões. Voo: rota, horários, dados de embarque, passageiro/check-in. O olho sempre cai primeiro no maior texto, depois desce em linha reta pela borda esquerda.

## Interação
- **Visível:** cursor de mão sobre a linha "Attendees" (com chevron ⌄ apontando para baixo); cursor sobre o botão de microfone; "Mon" selecionado na fileira de dias.
- **Inferido:** a linha "Attendees" se abre no lugar e mostra a lista de convidados; o chevron gira. O microfone alterna entre escutando e parado ("Listening…" aparece). Trocar o dia no clima troca temperatura e condição. A imagem não mostra nenhum desses resultados.

## Minúcias
- A linha "Attendees" tem um fundo cinza quase invisível que a separa como alvo clicável, diferente das linhas de metadado acima, que não têm fundo.
- Picote do cartão de embarque: dois semicírculos recortados nas bordas laterais e uma linha tracejada entre eles.
- A trilha do voo usa círculos vazios nas pontas e tracejado; o avião fica no meio, a duração logo abaixo dele.
- Avatar com iniciais em cinza claro tanto no voz (AR) quanto no voo (MC): mesma peça reaproveitada.
- Ícones de linha fina (relógio, pino, câmera, nuvens), mesmo traço em todos os cards.

## Por que funciona
- **Hierarquia por tamanho, não por cor** (better-typography): um âncora por card, dois pesos, apoio sempre menor e mais claro.
- **Uma cor, um significado** (better-colors): cada acento ocupa um papel só; a ação primária é o único preenchimento forte.
- **Agrupar com espaço** (better-layout): o gap entre grupos é visivelmente maior que dentro dos grupos; divisores só onde o voo precisa de faixas.
- **Controle distinto de conteúdo** (better-layout): a linha expansível ganha fundo e chevron; o link ganha cor e "›".
- **Raios concêntricos** (better-ui): a barra de dias aninhada no card de clima.

## Receita
1. Escolha um só dado âncora por card e ponha-o a pelo menos 2× o texto de apoio (até 4× quando é um número curto).
2. Use dois pesos; o rótulo fica acima do valor, menor e mais claro que ele.
3. Cada cor de acento tem um papel único (link, estado, data); o resto é neutro.
4. Só uma ação preenchida forte por card; a secundária é neutra e menor.
5. O que se abre ganha fundo próprio e um indicador de direção; o que é só leitura não ganha nada.
6. Separe grupos com um gap pelo menos 2× o gap interno; use divisor só quando há faixas de dados densos.
7. Peça aninhada dentro do card leva raio menor que o do card.
Lição: âncora único, acentos com papel, linha expansível marcada. Só aparência (não carregar): mapa, picote de bilhete, degradê azul, brilho colorido.

## Falhas
- "Listening…" no card de voz tem contraste tão baixo que quase some.
- O card de voz tem um vazio grande no meio, sem função; o espaço não está agrupando nada.
- Cursor de mouse: não existe na TV; o estado de foco não é mostrado em nenhum card.
