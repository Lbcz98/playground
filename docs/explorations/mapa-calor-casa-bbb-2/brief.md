Pedido: "quero 6 opções para uma interatividade que vai ser um card contendo o mapa de calor da casa BBB onde é possível ver a porcentagem de presença que o participante tem dentro dos comodos. Nessa primeira exploração vamos para um formato tradicional de mapa de calor, com uma planta baixa da casa."

- **Para quê e onde:** o espectador vê onde um participante passa o tempo, no card do perfil dele, na TV; descobre os cômodos favoritos só com o controle remoto.
- **Intenção:** mapa de calor tradicional sobre uma planta baixa (vista de cima, 2D), legível à distância. Evitar: genérico e cheio de legenda; nada de planta técnica com mil rótulos, poucos elementos. `Suposição:` a planta é um desenho simples em SVG (paredes finas, cômodos como blocos), com cômodos baseados na casa de casa-bbb.png; a cor do calor usa só tokens do kit, uma rampa de uma cor (do mais claro ao mais forte).
- **Prioridade:** o cômodo mais frequentado lido primeiro (o ponto mais quente da planta); depois a % do cômodo em foco; o resto fica em segundo plano.
- **Controle:** interativo. ←/→ passam de cômodo ao anterior/seguinte, sem laço; Enter abre o detalhe do cômodo (padrão da opção); Voltar fecha o detalhe, e sem detalhe, volta ao primeiro cômodo / sai do card.
- **Estados:** foco (cômodo em destaque), detalhe aberto, primeiro e último cômodo (← / → sem efeito). `Suposição:` sem carregando/vazio/desabilitado.
- **Conteúdo:** 7 cômodos, % do tempo do participante somando 100%. Ex.: Sala 28%, Cozinha 18%, Jardim 15%, Quarto Azul 14%, Academia 10%, Quarto Colorido 9%, Quarto do Líder 6%. Detalhe do cômodo: "Mais tempo à noite · 3h40 esta semana" ou uma linha equivalente. `Suposição:` participante e dados fictícios (ex.: "Marcos"); a % é o tempo acumulado na semana.
- **O que varia:** muda a tese, a referência principal, o padrão de interação e o arranjo planta × número. Fica igual: a planta baixa como mapa de calor, os 7 cômodos, o mesmo dado e a regra das teclas. **6 opções.**

Superfície: Content Card (painel alto de uma interatividade; o mesmo nas 6 opções).

## Direção 1: Planta cheia, o foco abre
- **Tese:** a planta ocupa o card e é a única protagonista; o foco passa de cômodo em cômodo e o detalhe se abre no próprio card, sem trocar de tela.
- **Referência:** cartoes-contexto-evento-voz-clima-voo (um dado âncora gigante, linha recolhida que se abre, acento com papel único).
- **Interação:** Expandir no lugar. ← → move o foco entre os cômodos (a % do cômodo vira o número âncora); Enter expande uma linha no pé com o detalhe; Voltar recolhe.
- **Peças:** planta com calor; número âncora com o nome do cômodo; linha recolhível de detalhe.

## Direção 2: Zonas da casa
- **Tese:** a casa é lida por zonas, e escolher a zona troca o card inteiro: a planta enquadra só aquela parte e o título diz o quanto o participante vive ali.
- **Referência:** cidade-foto-com-seletor (o seletor é um filtro que troca o contexto todo; o escolhido é a única superfície opaca).
- **Interação:** Seletor segmentado. ← → troca entre 3 zonas (Social, Quartos, Jardim e academia), na hora; Enter não faz nada neste padrão (o detalhe vem junto com a zona).
- **Peças:** planta enquadrada na zona com calor; título-conclusão com a % da zona; seletor de 3 segmentos.

## Direção 3: Trilho de cômodos
- **Tese:** a planta mostra onde, o trilho abaixo mostra quanto: cada cômodo tem uma pílula com a sua %, e a selecionada inverte a cor e acende o cômodo na planta.
- **Referência:** trilho-de-dias-com-seletor (fileira de iguais, selecionado inverte a cor, frase-resumo com o número em destaque).
- **Interação:** Trilho de passos. ← → move a seleção entre as 7 pílulas; Enter abre o detalhe do cômodo no lugar da frase-resumo.
- **Peças:** planta com calor; frase-resumo ("**28%** do tempo na Sala"); trilho de 7 pílulas com %; detalhe (Enter).

## Direção 4: Calor ou barras
- **Tese:** o mesmo dado em duas leituras: a planta responde "onde", as barras respondem "quanto, em ordem"; o espectador alterna entre as duas sem mudar de card.
- **Referência:** semana-barras-e-radial (duas visões do mesmo dado, total e legenda fixos, marcador de agora).
- **Interação:** Alternar visão. ← → percorre os cômodos nas duas visões; Enter troca entre planta de calor e barras por cômodo; a visão atual vem marcada.
- **Peças:** visão atual (planta ou barras); nome e % do cômodo em foco; marcador da visão (Planta · Ranking).

## Direção 5: Planta e ranking
- **Tese:** o título já é a conclusão ("Vive na Sala") e a lista abaixo é a prova: uma planta pequena de um lado e os cômodos em ordem de presença do outro, com o foco girando nos dois.
- **Referência:** saude-anel-metricas-e-barras (título como conclusão, valor com comparação em palavras, mini-gráfico terminando em ponto).
- **Interação:** Lista de métricas. ← → vai ao cômodo anterior/seguinte na ordem do ranking; Enter abre a linha, que empurra as outras e mostra o detalhe.
- **Peças:** título-conclusão; planta pequena com calor; lista de cômodos com % e barra; linha aberta com detalhe.

## Direção 6: Cartões-cômodo
- **Tese:** cada cômodo é um cartão do mesmo molde com um recorte da planta já pintado pelo seu calor; olhar a fileira é comparar, e escolher um cartão o fixa como "o favorito" da leitura.
- **Referência:** cartoes-de-humor-gradiente (molde fixo, variável coerente por cartão, frase em duas vozes, ícone que carrega o sentido).
- **Interação:** Fileira de escolha. ← → move o foco entre os cartões (foco = contorno); Enter escolhe o cartão e mostra o detalhe; o escolhido fica marcado de outro jeito que o foco.
- **Peças:** fileira de cartões com recorte da planta e %; frase em duas vozes ("Passa **28%** na **Sala**"); marca de escolhido.

*Nota:* as direções 1 e 3 usam a planta inteira com um número; diferenciam-se pela estrutura: 1 tem a planta sozinha e o detalhe se abre embaixo, 3 tem um trilho de pílulas como navegação principal. A 2 e a 6 trocam a planta inteira por recortes (zonas e cartões). Nada de hover, arrastar ou swipe.
