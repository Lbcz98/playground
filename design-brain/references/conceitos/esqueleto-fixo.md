# esqueleto-fixo
Tags: molde repetido, zona de dado variável, consistência entre fases
Padrão: nenhum
Resumo: fixe título, margens, raio e subtítulo em todas as fases ou itens e troque só a zona de dado, para a diferença chamar atenção.
Fonte: destilado de estados-por-cor-e-brilho, cartoes-de-humor-gradiente, semana-barras-e-radial, cidade-foto-com-seletor · 2026-10-21

## Cerne
Quando vários itens ou fases dividem o mesmo card, o que não muda deixa ver o que muda. Fixe o esqueleto (onde entra o título, o subtítulo, a margem, o raio) e troque apenas a zona de dado. A comparação fica instantânea e a mudança de fase se lê sem esforço.

## Receita
- Um molde só. Mude no máximo três coisas por item, sempre juntas e coerentes (matiz, ícone, valor).
- Título da fase no canto de entrada da leitura; subtítulo estável embaixo; mesma margem e mesmo raio em todas as fases.
- Troque só a zona de dado, e escolha a visualização pelo que a fase tem: contadores, barra, percentual.
- Total e legenda ficam iguais quando a geometria do gráfico muda.
- Itens repetidos: vão igual entre eles, sem borda.
- A parte constante da frase em peso leve e neutro; a que muda, um passo de peso acima e na cor do item.

## Uso no kit
- Uma superfície para a exploração toda: Card ou Content Card, com os mesmos `--dimension-radius-semantic-*` e o mesmo inset em todas as opções.
- A variação entre itens vem dos temas: `--color-semantic-theme-dia-dark`, `-tarde-dark`, `-noite-dark`. Nenhum valor novo.
- Troca de fase animada com `--motion-semantic-duration` e `--motion-semantic-easing`, não com tempos próprios.
- Uma forma que não é card (anel, mapa, faixa) marca `data-surface="own"` e o relatório diz por quê.

## Ajuste
- Fixar tudo esconde a ideia de uma opção que é sobre a estrutura. Aí o esqueleto é o que varia, e as zonas de dado ficam iguais.
- Com uma única fase, não há o que comparar: o conceito não se aplica.
