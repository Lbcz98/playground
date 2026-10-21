# raios-concentricos
Tags: cantos aninhados, raio menor por dentro, superfície do kit
Padrão: nenhum
Resumo: a peça dentro de outra leva o raio da de fora menos a folga entre as duas, para as curvas dividirem o mesmo centro.
Fonte: destilado de cartoes-contexto-evento-voz-clima-voo, cidade-foto-com-seletor, trilho-de-dias-com-seletor · 2026-10-21
Vale para: peça arredondada dentro de outra: barra, bandeja, chip, mídia

## Cerne
Quando uma caixa arredondada fica dentro de outra, o mesmo raio nas duas abre um vão largo no canto. A relação é uma só: raio de dentro = raio de fora − folga, em que folga é a distância entre as duas bordas (quase sempre o padding do pai, mais a borda, se houver).

## Receita
- Raio interno = raio externo − folga. Nunca abaixo de zero: se a folga é maior que o raio externo, o canto de dentro é reto.
- Vale para a pílula selecionada dentro da barra, a barra de dias dentro do card, linhas e chips dentro de um painel, a mídia dentro do card.
- Cada nível tem raio maior que o de dentro: card > bandeja > casa.
- O mesmo papel tem o mesmo raio em todas as opções.

## Uso no kit
Compute com os valores do kit e escolha o degrau `--dimension-radius-core-*` mais próximo do resultado:
- Card: `--dimension-radius-semantic-card` com `--dimension-spacing-semantic-card-inset`. O raio do card menos a folga dá o degrau `--dimension-radius-core-xs`.
- Content Card: `--dimension-radius-semantic-content-card` com `--dimension-spacing-semantic-card-inset-expanded`. O resultado cai em `--dimension-radius-core-lg`.
- Pílula: `--dimension-radius-semantic-pill`, só até duas alturas de controle (`--dimension-size-semantic-control-height-lg`).
- Nunca invente um raio de painel (12, 16, 20…): o painel é um Card ou um Content Card.

## Ajuste
- A fórmula é um ponto de partida. Ajuste a olho se a folga muda em volta do componente, se o filho não chega ao canto, ou se as superfícies têm formas de canto diferentes.
- Um filho que não toca o canto pode manter qualquer degrau menor que o do pai, sem contar a folga.
