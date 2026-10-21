# rotulo-inequivoco
Tags: rótulo de eixo, dia abreviado, texto sem legenda
Padrão: nenhum
Resumo: um rótulo de eixo ou de dia se lê sozinho: se dois itens da fileira dizem o mesmo, o rótulo falhou.
Fonte: destilado de trilho-de-dias-com-seletor, semana-barras-e-radial e da comparação com e sem conceitos na exploração audiencia-semanal · 2026-10-21

## Cerne
Um rótulo existe para dispensar a legenda. Quando a fileira repete o mesmo sinal (S, T, Q, Q, S, S, D), a pessoa conta nos dedos para saber que dia é e o rótulo deixou de funcionar. A forma curta tem de separar todos os itens, e a de uma só letra só vale onde nenhuma se repete.

## Receita
- Use a forma curta que diferencia todos os itens da fileira: três letras para dias (seg ter qua qui sex sáb dom).
- Uma só letra apenas quando nenhuma se repete na fileira.
- Mesmo comprimento em todos os rótulos, centrados na casa, no mesmo alinhamento e no mesmo passo.
- Destaque o item pelo peso e pela cor, nunca trocando o texto (o pico continua "qui").
- O rótulo vai no menor degrau legível e em tom de apoio; só o destacado sobe de contraste.
- Se a fileira não comporta o rótulo, mude a fileira (menos itens, outro arranjo) antes de encurtar o rótulo até ficar ambíguo.

## Uso no kit
- Rótulo: `.text-caption-medium`, em `--color-semantic-functional-text-muted`. O destacado: `.text-caption-bold` em `--color-semantic-functional-text-primary`, ou em `--color-semantic-functional-text-inverse` sobre uma casa invertida.
- `.text-caption-*` é o piso do kit: não desça abaixo dele, e confira no `check-explore-layout` que três letras cabem na casa.
- Sete casas iguais num Content Card: colunas iguais com `--dimension-spacing-core-3xs` entre elas.

## Ajuste
- Em casa estreita demais para três letras, prefira outro arranjo a uma letra repetida; a legenda com o primeiro e o último dia ("seg … dom") só vale quando a ordem é óbvia.
- Em outro idioma, refaça a forma curta: o critério é a fileira não repetir, não as três letras.
