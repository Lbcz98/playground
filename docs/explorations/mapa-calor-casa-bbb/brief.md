Pedido: "crie 3 variações de layouts para uma interatividade de mapa de calor da casa do BBB. Essa interatividade é um card que apresenta o desenho da casa [casa-bbb.png] junto com a porcentagem de presença dos participantes em cada cômodo. A intenção é fazer com que o usuário consiga navegar entre os cômodos e, a cada mudança, a imagem dá um zoom no cômodo selecionado"

Imagem da casa: /Users/lucas.cruz/Downloads/casa-bbb.png (casa isométrica, 3 blocos: jardim com piscina e academia; quarto do líder e quarto colorido; sala, cozinha e quartos).

- **Para quê e onde:** o espectador explora, só com o controle remoto, onde os participantes passam mais tempo; é um card dentro de uma tela de estatísticas da cobertura do reality, na TV.
- **Intenção:** dado limpo e legível; sem poluição visual. Evitar cara de planilha e excesso de texto. A casa é o contexto, o dado é o que se lê.
- **Prioridade:** a porcentagem de presença do cômodo selecionado, em número herói. Cômodos vizinhos, calor dos outros e participantes ficam em segundo plano.
- **Controle:** interativo. ←/→ passam de cômodo ao anterior/seguinte, sem laço, e a casa dá zoom no cômodo selecionado; Enter abre "quem está lá" (participantes do cômodo); Voltar fecha o detalhe, e sem detalhe aberto, volta ao primeiro cômodo / sai do card.
- **Estados:** foco/selecionado (cômodo com zoom), detalhe aberto (participantes), primeiro e último cômodo (← / → sem efeito), visão geral inicial. `Suposição:` sem carregando/vazio.
- **Conteúdo:** 7 cômodos, % da presença de todos os participantes somando 100%. Ex.: Sala 24%, Cozinha 19%, Jardim 16%, Quarto Azul 14%, Quarto Colorido 11%, Quarto do Líder 9%, Academia 7%. Detalhe do cômodo: 4 a 5 participantes com nome e tempo (ex.: "Marcos · 3h20"). `Suposição:` os cômodos e dados são fictícios; a % é o tempo acumulado na semana.
- **O que varia:** muda a tese, a referência principal e o padrão de interação (como se navega e onde mora o número). Fica igual: a ilustração da casa com zoom no cômodo, o mapa de calor (cor por intensidade, só tokens do kit), os 7 cômodos e a regra das teclas. **3 opções.**

Superfície: Content Card (painel alto de uma interatividade; a mesma nas 3 opções).

## Direção 1: Trilho de cômodos
- **Tese:** a casa é o palco e a navegação é uma fileira de cômodos abaixo dela: o cômodo selecionado inverte a cor, e a casa dá zoom nele.
- **Referência:** trilho-de-dias-com-seletor (fileira de casas iguais em bandeja, selecionado inverte fundo e número, frase-resumo com número em negrito acima).
- **Interação:** Trilho de passos. ← → move a seleção entre os 7 cômodos (casa dá zoom); Enter abre os participantes do cômodo no lugar do resumo.
- **Peças:** casa com zoom e calor; frase-resumo ("**24%** do tempo na Sala"); trilho de 7 casinhas com a % de cada; detalhe de participantes (Enter).

## Direção 2: Ranking lado a lado
- **Tese:** o mapa de calor responde "onde estão?" e a lista responde "quanto?": casa à esquerda, ranking de cômodos à direita, os dois girando juntos.
- **Referência:** saude-anel-metricas-e-barras (título como conclusão, métrica com valor grande e comparação em palavras, mini-gráfico terminando em ponto).
- **Interação:** Lista de métricas. ← → vai ao cômodo anterior/seguinte na ordem do ranking (casa dá zoom); Enter abre a linha, que empurra as outras e mostra os participantes.
- **Peças:** casa com zoom e calor; título-conclusão ("A galera vive na Sala"); lista de cômodos com % e barra; linha aberta com participantes.

## Direção 3: Número em cima da casa
- **Tese:** a casa dá zoom ocupando o card inteiro e um único número gigante sobre ela diz a presença; o resto é só apoio mínimo.
- **Referência:** cartoes-contexto-evento-voz-clima-voo (um dado âncora gigante por card, linha recolhida que se abre, acentos com papel único).
- **Interação:** Expandir no lugar. ← → troca de cômodo (casa dá zoom, número muda); Enter expande a linha "Quem está aqui · 5" no pé do card; Voltar recolhe.
- **Peças:** casa em zoom como fundo do card; nome do cômodo + número âncora; barra fina de posição (3 de 7); linha recolhível de participantes.

*Nota:* as direções 2 e 3 usam padrões de expansão parecidos (linha que se abre); diferenciam-se pela estrutura: 2 é lista com ranking ao lado da casa, 3 é casa em tela cheia com número âncora e uma única linha. Nada de hover, arrastar ou swipe.
