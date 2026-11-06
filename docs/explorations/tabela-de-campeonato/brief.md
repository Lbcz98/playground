Pedido: "faça 3 variações do card de tabela de campeonato que está dentro do kit no storybook"

- **Para quê e onde:** consulta rápida na TV. O espectador passa o olho no card (painel alto, numa fileira da tela inicial ou durante o jogo) e vê a classificação a distância, sem esforço.
- **Intenção:** limpo, sem cara de planilha (evitar linhas e colunas apertadas, card cheio). `Suposição:` mantém os tokens e a cara do kit; as 3 opções repensam a estrutura, não a identidade.
- **Prioridade:** o líder e o topo da tabela lidos primeiro; o resto da tabela fica em segundo plano.
- **Controle:** navegável por linha. ←/→ percorrem as linhas na ordem, sem laço nas pontas; Enter age na linha focada; ↑/↓ saem do card (a tela trata); Voltar desfaz. `Suposição:` o detalhe de um time (mais colunas: E, D, SG, últimos jogos) abre no lugar, sem sair do card.
- **Estados:** repouso, foco no card, linha focada, linha aberta. `Suposição:` sem carregando, vazio ou erro.
- **Conteúdo:** o do componente do kit: "Campeonato Brasileiro · Rodada 28", colunas Pts, J, V, times com posição e escudo (ex.: 1 Palmeiras 58 28 17). `Suposição:` dados fictícios; o time favorito do espectador aparece marcado em uma das linhas.
- **O que varia:** muda a tese, a referência principal e o padrão de interação (como se lê o topo e o que a linha focada abre). Fica igual: o conteúdo, a superfície e só tokens do kit. **3 opções.**

Superfície: Content Card (o do kit, 288 de largura; a mesma nas 3 opções).

## Direção 1: O título diz quem lidera
- **Tese:** o card abre com uma frase-conclusão ("Palmeiras lidera com 4 pontos de vantagem") e a tabela vem como prova, em lista na ordem de leitura, com o topo em destaque e o resto em segundo plano.
- **Referência:** saude-anel-metricas-e-barras (título como conclusão, métrica com tendência e comparação em palavras).
- **Interação:** Lista de métricas. ←/→ vão à linha anterior ou à próxima; Enter abre o detalhe do time no lugar dela (a linha aberta empurra as outras); Voltar fecha.
- **Peças:** título-conclusão; cabeçalho de colunas; linhas do topo (até 4 de partida) e restante recolhido; detalhe do time aberto.

## Direção 2: O pódio em primeiro plano
- **Tese:** os três primeiros ficam como uma fileira de peças grandes ("pódio") e uma frase-resumo diz a distância entre eles; o restante da tabela fica em lista simples abaixo.
- **Referência:** trilho-de-dias-com-seletor (trilho de itens iguais, item selecionado por inversão, frase-resumo com o número em destaque).
- **Interação:** Trilho de passos. ←/→ movem a seleção entre os times do trilho (até 4); Enter abre o detalhe do time selecionado no card; o selecionado inverte a cor.
- **Peças:** trilho do topo (3 a 4 times); frase-resumo com os pontos de diferença; detalhe do selecionado; lista curta do restante.

## Direção 3: O líder como âncora
- **Tese:** um único dado âncora: a posição e os pontos do líder em tamanho grande no alto; abaixo, as linhas viram apoio que se abre ao foco.
- **Referência:** cartoes-contexto-evento-voz-clima-voo (um dado âncora por card, linha que se abre, apoio em camadas).
- **Interação:** Expandir no lugar. ←/→ movem entre as linhas expansíveis; Enter expande a linha focada e mostra o detalhe do time sem sair do card; Voltar recolhe.
- **Peças:** âncora do líder (posição e pontos); linhas dos seguintes recolhidas; linha expandida; rodapé "ver mais".

*Nota:* os três padrões (Lista de métricas, Trilho de passos, Expandir no lugar) e as três referências principais são diferentes entre si. Nada de hover, arrastar ou swipe.

## Como a exploração roda (`/explore-playbook`)
- Slug: `tabela-de-campeonato`, pasta `docs/explorations/tabela-de-campeonato/` com este plano como `brief.md`.
- 3 opções: um `proto-explorer` por opção, em paralelo, cada um lendo `DESIGN.md`, `design-brain/toolbox/playbook.md` e `judge.md`; depois `explore-stitch`, `check-explore-layout` até `ok`.
- Um juiz independente (`general-purpose`) escreve `playbook-judge.md`; ele avisa e não corrige.
- Servidor da exploração com Monitor para variações, comentários e ajuste fino; nada é salvo no repositório.
