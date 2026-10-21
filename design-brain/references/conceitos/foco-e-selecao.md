# foco-e-selecao
Tags: foco único, seleção por inversão, uma ação forte
Padrão: nenhum
Resumo: foco, seleção e ação primária são cada um o elemento mais forte do card, só um de cada, com linguagem própria e sem tomar a cor de identidade.
Fonte: destilado de orbita-de-pessoas, cidade-foto-com-seletor, trilho-de-dias-com-seletor, cartoes-contexto-evento-voz-clima-voo, saude-anel-metricas-e-barras · 2026-10-21

## Cerne
Três coisas pedem para ser a mais forte do card: onde está o foco, o que está selecionado e a ação principal. Cada uma é única, e cada uma usa uma linguagem que a cor de identidade não usa (contorno, inversão, único preenchimento). Assim, ninguém confunde "em foco" com "de uma cor".

## Receita
- Exatamente um foco por vez. Marque-o com contorno e deixe folga entre o contorno e a peça; não troque a cor do membro.
- O selecionado é a única superfície invertida ou opaca do conjunto: fundo e número invertem, e o marcador mantém a cor dele.
- Uma ação preenchida forte por card. A secundária é neutra e menor.
- O que se abre ganha fundo próprio e um indicador de direção; o que é só leitura não ganha nada.
- Revele o detalhe só em quem tem o foco (o nome num balão); os outros mostram o mínimo, como a inicial.
- Selecionar troca o contexto inteiro (imagem e título), não só um número.
- Diga o estado em texto também; a cor ou o brilho não são o único sinal.

## Uso no kit
- O anel de foco é do kit, não desenhe outro: `--gradient-semantic-focus-ring` com `--dimension-border-width-semantic-focus-ring` e `--dimension-spacing-semantic-focus-offset`, e as cores `--color-semantic-focus-*`. A receita do anel (máscara) está em `proto-explorer`, passo 5.
- Na TV, ←/→ movem o único foco, Enter age, Voltar desfaz; o card nunca usa hover. As teclas completas: `get_keys`.
- Selecionado, por exemplo: fundo `--color-semantic-functional-text-primary` e número `--color-semantic-functional-text-inverse`.
- A ação preenchida é o componente de botão do kit (`docs-list`), não uma cor própria.

## Ajuste
- Um conjunto de dois ou três segmentos pode inverter o selecionado; com muitos itens, a inversão vira ruído, então use só o contorno.
- Se o foco precisa ser lido de longe, aumente a folga antes de aumentar o contorno.
