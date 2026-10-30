crie 4 explorações de uma interatividade de previsão do tempo. Quero que seja um card com as seguintes informações: temperatura atual, temperatura média, nome do local, ícones comunicando visualmente o clima e informações metereológicas como umidade, tempo sensação térmica. Use essa imagem como referência (selo azul "Replay": muito espaço vazio, tipografia minimalista e bem posicionada), eu gosto do uso do espaço vazio dentro desse componente, com espaço para ser mais visual.

**Para quê e onde:** o espectador consulta o clima na TV, sem trocar de dispositivo, para planejar o dia ou a semana.
**Intenção:** calmo, arejado, mais visual que informativo. Evitar: card cheio/denso, ícones genéricos de app de clima, visual frio de tabela.
**Foco:** objetivo = saber como está o tempo agora onde estou. Grupo de destaque (um só) = **temperatura atual (24°) + local (São Paulo) + ícone do clima**, juntos num bloco. Segundo plano, numa faixa quieta: média do dia, sensação, umidade, horas e dias.
**Referências:** selo azul "Replay". Gosta: espaço vazio, tipografia mínima bem posicionada, título pequeno no canto. Não gosta: a cor azul e o picote (suposição, já dita no pedido original).
**Fio condutor:** arejado e visual; o grupo temperatura + local + ícone é a atração, com a maior área livre em volta; todo o resto recua e é pequeno e quieto.
**Controle:** interativo. ←/→ navega pelos dias/horas, Enter abre o detalhe; Voltar recolhe.
**Estados:** foco, selecionado e expandido. Suposição: sem carregando nem vazio.
**Conteúdo:** São Paulo · agora 24° · média do dia 22° · sensação 26° · umidade 68% · ícone de nuvem com sol; horas de hoje (09h–21h) e próximos dias (Ter–Dom) com ícone e temperatura.
**O que varia:** tese, referência principal e padrão de interação; 4 opções. Fica igual: o grupo focal, o fio condutor e os dados do card.
Superfície: Content Card

## Opção 1
- **Tese:** o tempo é um número grande no ar; escolher o dia só troca o número, e um trilho de 3 dias fica quieto embaixo.
- **Foco em cena:** número 3× maior, sozinho na maior área livre, local pequeno colado a ele, ícone grande no mesmo bloco; trilho em muted e pequeno.
- **Referência:** trilho-de-dias-com-seletor (fileira de casas iguais, dia escolhido invertido); cartoes-contexto-evento-voz-clima-voo (âncora gigante) só no tamanho do número.
- **Interação:** Trilho de passos. ←/→ move o dia (Hoje e os 3 seguintes); Enter abre sensação e umidade do dia no lugar.
- **Peças:** bloco focal (local + temperatura + ícone); trilho de 4 dias.

## Opção 2
- **Tese:** o dia é uma curva de temperatura que nasce do número; o gráfico é fundo, o número é a atração.
- **Foco em cena:** número grande no topo-esquerdo, curva fina e discreta atrás/abaixo, só o ponto de agora em destaque; legenda mínima.
- **Referência:** semana-barras-e-radial (duas geometrias do mesmo dado, marcador de agora).
- **Interação:** Alternar visão. ←/→ percorre as horas de hoje; Enter troca entre curva e barras.
- **Peças:** bloco focal fixo (local + temperatura + ícone); gráfico das horas; legenda média/sensação.

## Opção 3
- **Tese:** o card mostra só o grupo focal; cada detalhe é uma linha recolhida que se abre quando você a procura.
- **Foco em cena:** o bloco ocupa quase todo o card, com ícone enorme; as 3 linhas são finas, no rodapé, em muted.
- **Referência:** cartoes-contexto-evento-voz-clima-voo (âncora, linha que se abre "Umidade ⌄").
- **Interação:** Expandir no lugar. ←/→ move entre as linhas (Sensação, Umidade, Média); Enter abre a linha e mostra a explicação.
- **Peças:** bloco focal (local + temperatura + ícone); 3 linhas expansíveis.

## Opção 4
- **Tese:** o clima é a paisagem do card; o ícone grande vira o fundo e o grupo focal fica sobre a parte calma dele.
- **Foco em cena:** ilustração grande de fundo com scrim, o grupo focal sobre a faixa calma, o seletor pequeno e quieto na base.
- **Referência:** cidade-foto-com-seletor (contexto grande de fundo, seletor que troca tudo, texto nas faixas calmas).
- **Interação:** Seletor segmentado. ←/→ troca o segmento (Agora, Hoje, Semana) na hora; Enter não faz nada.
- **Peças:** ilustração do clima de fundo; bloco focal (local + temperatura); seletor de 3 segmentos.
