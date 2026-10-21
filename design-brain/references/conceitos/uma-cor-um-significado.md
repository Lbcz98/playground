# uma-cor-um-significado
Tags: papéis de cor, acento com função, neutro como estrutura
Padrão: nenhum
Resumo: cada acento tem um papel só, o resto é neutro, e a cor nunca é o único sinal.
Fonte: destilado de estados-por-cor-e-brilho, medidor-com-escala-e-marcador, metrica-com-barras-de-sessoes, semana-barras-e-radial, cartoes-de-humor-gradiente, trilho-de-dias-com-seletor · 2026-10-21
Vale para: qualquer card com cor; a cor identifica ou sinaliza, nunca enfeita

## Cerne
Cor carrega significado, então cada matiz serve a uma coisa e nada mais: estado, exceção, identidade ou fase. Tudo que não é um desses papéis fica em neutro. Quando a cor aparece, a pessoa já sabe o que ela diz.

## Receita
- Liste os papéis de cor do card. Dê um matiz a cada um; o resto é neutro.
- Repita o matiz em tudo que diz a mesma coisa (fundo, ícone e palavra no mesmo tom), e nunca misture um segundo matiz na mesma fase.
- Série de dados numa cor só; uma segunda cor apenas nos itens que são exceção, com a legenda dizendo o que ela quer dizer.
- Diga também em texto ou em forma: a cor nunca é o único sinal.
- Identidade (quem, qual serviço) usa matiz; estado de foco e seleção não usam, porque têm linguagem própria (veja `foco-e-selecao`).
- Profundidade vem de degraus de neutro, não de sombra nem de um matiz extra.

## Uso no kit
- Neutros: `--color-semantic-functional-background-primary` (a TV), `--color-semantic-functional-background-elevated` (a superfície do card), `--color-semantic-functional-border-subtle` e `-border-default`.
- Estado: `--color-semantic-functional-status-success`, `-status-warning`, `-status-error`, `-status-live`. Um por significado.
- Fase ou identidade: `--color-semantic-theme-dia-dark`, `-tarde-dark`, `-noite-dark` (e as `-light`). Derive todas as camadas de uma fase do mesmo tema.
- Camadas translúcidas sobre o fundo: `--color-opacity-light-10`, `-light-20` e afins, em vez de inventar um cinza.
- `--color-semantic-focus-*` é só do foco; não o reuse para destacar dado.

## Ajuste
- Com muitas categorias (sete pessoas), a cor identifica mas não ordena e vizinhas se confundem. Acima de cerca de cinco matizes, some a cor a uma forma ou a uma inicial.
- Um tema de fase pode tingir o painel inteiro, mas só se a fase também aparece em texto.
