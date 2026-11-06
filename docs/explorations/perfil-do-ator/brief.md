Pedido: "crie 6 opções de uma interatividade de perfil do ator, esse card precisa ter as seguintes informações: Nome completo, idade, cidade, mini biografia, personagem. Leve em consideração o cenário que essa interatividade vai ser exibida na novela vale tudo."

**Para quê e onde:** o espectador conhece o ator enquanto o personagem está em cena em Vale Tudo (a interatividade aparece sobre a novela na TV).
**Intenção:** moderno e limpo; evitar visual datado/nostalgia forçada, ficha técnica fria e excesso de texto. Contexto de novela (drama, personagem forte) entra por conteúdo e hierarquia, não por enfeite.
**Prioridade:** o personagem e o nome do ator são lidos primeiro; idade, cidade e mini biografia ficam em segundo plano.
**Controle:** interativo no controle remoto. ←/→ percorre as informações, Enter aprofunda (abre o detalhe/bio), Voltar desfaz.
**Estados:** foco, selecionado/aberto (bio completa). `Suposição:` sem desabilitado, carregando nem vazio.
**Conteúdo:** `Suposição:` ator fictício (não usar dados reais de pessoas). Nome completo: Helena Marques Duarte · 54 anos · Niterói (RJ) · Personagem: Odete Roitman · Mini bio: "Começou no teatro aos 17 anos e fez da vilania elegante sua marca. Em Vale Tudo, dá vida à empresária que manda em todos." (até ~140 caracteres).
**O que varia:** tese, referência principal e padrão de interação; as 5 informações e o exemplo ficam iguais. 6 opções.
**Superfície:** Content Card (painel alto de uma interatividade), a mesma em todas.

## Direções

### Opção 1 — Personagem como âncora, o resto se abre
- **Tese:** o personagem em grande é o dado-âncora; cada informação do ator é uma linha que se abre sob ele sem sair do card.
- **Referência:** cartoes-contexto-evento-voz-clima-voo (dado-âncora gigante, linha que se abre).
- **Interação:** Expandir no lugar. ←/→ move entre idade, cidade e bio; Enter expande/recolhe.
- **Peças:** personagem (âncora), nome do ator, linhas expansíveis (idade/cidade, bio).

### Opção 2 — Ator ↔ Personagem
- **Tese:** o perfil tem duas faces, quem é o ator e quem ele faz; trocar de face muda o card inteiro.
- **Referência:** cidade-foto-com-seletor (seletor que troca o card inteiro, foto como contexto).
- **Interação:** Seletor segmentado. ←/→ troca entre "Ator" e "Personagem"; Enter não faz nada.
- **Peças:** seletor, retrato/fundo, nome e idade/cidade (Ator) ou personagem e bio (Personagem).

### Opção 3 — Trilho de fatos
- **Tese:** o perfil é um trilho curto de 4 passos; o passo selecionado inverte a cor e conta o seu pedaço.
- **Referência:** trilho-de-dias-com-seletor (trilho, item selecionado inverte a cor).
- **Interação:** Trilho de passos. ←/→ move a seleção (Personagem, Idade, Cidade, Bio); Enter abre o detalhe no card.
- **Peças:** nome do ator, trilho de 4 pílulas, frase-resumo do passo.

### Opção 4 — Ator em órbita
- **Tese:** o ator é o centro e suas informações orbitam em volta dele; o item focado ganha rótulo.
- **Referência:** orbita-de-pessoas (arranjo radial, foco com rótulo flutuante, rodapé de identidade).
- **Interação:** Órbita. ←/→ vai ao item anterior/seguinte; Enter abre o detalhe do item.
- **Peças:** retrato central, 3 a 4 itens em meia órbita, rodapé com nome e personagem.

### Opção 5 — Carreira em fases
- **Tese:** a mini biografia é contada em fases já vividas; a fase atual vem marcada e muda o conteúdo.
- **Referência:** estados-por-cor-e-brilho (fases com esqueleto fixo e zona variável).
- **Interação:** Estado muda o card. ←/→ percorre as fases (Início, Virada, Vale Tudo); Enter não faz nada.
- **Peças:** nome e personagem fixos, marcador de fase, trecho da bio da fase, idade/cidade na fase de origem.

### Opção 6 — Ficha em lista
- **Tese:** o perfil é uma lista lida na ordem, onde o título já diz o personagem e as linhas provam com o resto.
- **Referência:** saude-anel-metricas-e-barras (título como conclusão, linhas com valor, linha aberta empurra as outras).
- **Interação:** Lista de métricas. ←/→ vai à linha anterior/seguinte; Enter abre a bio completa no lugar.
- **Peças:** título-conclusão ("Odete Roitman, por Helena Marques Duarte"), linhas idade, cidade e bio.
