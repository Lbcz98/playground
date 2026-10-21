# ancora-e-apoio
Tags: hierarquia por tamanho, dado âncora, valor forte e apoio fraco, escolhido como âncora
Padrão: nenhum
Resumo: um dado âncora por card, a pelo menos 2× o texto de apoio, que fica menor, mais claro e na mesma linha de base.
Fonte: destilado de metrica-com-barras-de-sessoes, medidor-com-escala-e-marcador, semana-barras-e-radial, saude-anel-metricas-e-barras, cartoes-contexto-evento-voz-clima-voo · 2026-10-21

## Cerne
A hierarquia de um card vem de tamanho e peso, não de cor. Um só dado é a âncora (o que a pessoa veio ver) e tudo o mais existe para explicá-lo. Sem âncora o olho não sabe onde começar; com duas, elas competem.

## Receita
- Escolha um só dado âncora e ponha-o a pelo menos 2× o texto de apoio; vá a 3× quando for um número curto.
- Use dois pesos no card: um para a âncora, um mais leve para o resto.
- Rótulo acima do valor, menor e mais claro. Unidade e variação ficam na mesma linha de base do valor, com cerca de metade do tamanho.
- Pergunta, título ou frase que acompanha a âncora fica a no máximo metade dela. Se pede mais, ela é a âncora e o número vira apoio: escolha qual dos dois a pessoa lê primeiro.
- Se um segundo elemento pede o tamanho da âncora, ele é outra âncora: rebaixe-o ou corte-o.
- Numa fileira de itens iguais (três perfis, sete dias), a âncora é o item escolhido, que se destaca por inversão de fundo e não por um texto maior: todos os nomes ficam no mesmo tamanho, e nenhum texto precisa do tamanho grande. Se o card tem também um dado à parte, como um total, esse dado é a âncora e a inversão só marca o escolhido.
- Mantenha a âncora fixa quando a visualização muda (gráfico trocável, fases).
- Número e unidade juntos: o número pesado, a unidade em cinza.

## Uso no kit
- Âncora: `.text-heading-3-bold`. Apoio: `.text-body-sm-medium` (2×) ou `.text-footnote-medium` (cerca de 2,3×). Número curto: `.text-heading-3-bold` sobre `.text-caption-medium` (cerca de 2,8×).
- Pergunta ou título que acompanha a âncora: `.text-body-sm-bold` ou `.text-body-sm-medium`, a metade de `.text-heading-3-bold`. Os degraus `.text-body-md-*` (cerca de 1,75×) e `.text-heading-5-*` (cerca de 1,4×) ficam perto demais e disputam com ela.
- Fileira de itens iguais: os nomes todos em `.text-body-sm-bold` (ou todos em `.text-body-sm-medium`), do mesmo tamanho. O escolhido inverte o fundo para `--color-semantic-functional-text-primary` e o texto para `--color-semantic-functional-text-inverse`; o foco é o anel do kit, outra linguagem (veja `foco-e-selecao`).
- Dimensione com a classe `.text-*`, não com `font-size` à mão.
- Cor: âncora em `--color-semantic-functional-text-primary`; apoio em `--color-semantic-functional-text-muted`. Sobre `--color-semantic-functional-background-elevated`, `text-secondary` e `text-subtle` ficam abaixo de 4,5:1: não os use em texto pequeno.
- Variação positiva ou negativa: `--color-semantic-functional-status-success` ou `-status-error`, e só nela.

## Ajuste
- Em card pequeno, 2× pode não caber; nunca vá abaixo de cerca de 1,5×, onde a hierarquia some.
- Quando a própria frase é a resposta (um título-conclusão), a âncora é ela e o número vira apoio. Isso muda a hierarquia inteira, então decida antes de dimensionar e confira com a prioridade do brief.
- Entre os itens de uma fileira de iguais a razão de 2× não se aplica: eles são iguais de propósito. Ela volta a valer entre o nome do item e a frase que o explica, que fica a no máximo metade do nome.
- A razão vale entre tamanhos que a pessoa lê. Texto decorativo, como a textura de letras de um cartaz, segue outra regra.
