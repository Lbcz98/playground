# Brief: card de programação (reconstrução do caso Pompeia)

Reconstruído de `design-brain/toolbox/interview-notes.md`. O pedido original do designer não está no repo. O que vem das notas está sem marca; o que foi deduzido está marcado `Suposição`. Não descreve o layout do card bom: só o problema, para que a exploração tenha que achá-lo.

## Para quê e onde
Card com informações do filme "Os Últimos Dias de Pompeia", usado nas interatividades contextuais (pedido do designer). `Suposição`: aparece em contexto, enquanto o filme está no ar, e o espectador decide se entra ou se vê mais tarde. O card é o botão.

## Intenção
Sentir que o filme é o protagonista: uma imagem forte chama, o resto é pouco e claro. Não quer: card cheio, claustrofóbico, com várias cores de destaque, sem elemento mais forte que os outros, nem dois ou três tipos de interação no mesmo card.

## Prioridade
1. A imagem do filme (o chamariz).
2. O título.
3. Horário e classificação.
4. O estado "ao vivo" e quanto falta.
Descrição e metadados longos ficam fora; vão para a página de detalhe.

## Controle
Interativo no controle remoto. Um único padrão de interação no card. Só valem ←/→, Enter e Voltar; ↑/↓ pertencem à navegação entre cards. Sem hover nem arrastar.

## Estados
Foco, padrão (sem foco) e selecionado. `Suposição`: desabilitado e carregando fora do escopo.

## Conteúdo
- Título: "Os Últimos Dias de Pompeia"
- Imagem do filme (cor dominante azul)
- Classificação indicativa 14
- Dados fixos (usar exatamente estes, sem inventar outros):
  - Agora (no ar): 20h30 – 22h50, duração 2 h 20, são 22h22, "Ao vivo · restam 28 min" (já passaram 1 h 52).
  - Mais tarde: reprise às 01h10 – 03h30.
  - Gênero: Aventura histórica.
- Duas visões do tempo do programa: o que está no ar agora e o que vem mais tarde

## O que varia
6 opções (pedido do designer). Variam a tese, a hierarquia e o padrão de interação. Ficam iguais: o conteúdo acima, a superfície (um card de interatividade contextual, 1280×720, área segura 40 nas laterais e 32 em cima e embaixo) e o foco por controle remoto.

## Superfície
Content Card do kit (painel alto de uma interatividade contextual), a mesma nas 6 opções.

## Direções

### 1. Expandir no lugar
- **Tese:** a imagem chama e o título ancora; o foco abre o detalhe no próprio card, sem sair dele.
- **Referência:** `cartoes-contexto-evento-voz-clima-voo` (dado âncora e ação primária única).
- **Interação:** Expandir no lugar. ←/→ move entre as peças expansíveis; Enter expande ou recolhe a peça.
- **Peças:** imagem com título; horário e classificação; estado "Ao vivo"; ação de entrar.

### 2. Seletor segmentado
- **Tese:** "Agora" e "Mais tarde" trocam o card inteiro; a imagem é o contexto fixo.
- **Referência:** `cidade-foto-com-seletor` (foto de fundo, seletor que troca o card).
- **Interação:** Seletor segmentado. ←/→ troca o segmento na hora; Enter não faz nada.
- **Peças:** imagem de fundo com título; seletor de 2 segmentos; horário e classificação; estado do segmento.

### 3. Estado muda o card
- **Tese:** o card conta em que ponto o filme está (começou, no meio, quase no fim) e muda a peça de estado, não o fundo.
- **Referência:** `estados-por-cor-e-brilho` (esqueleto fixo, uma zona variável).
- **Interação:** Estado muda o card. ←/→ percorre as fases; Enter não faz nada.
- **Peças:** título com imagem; barra ou rótulo da fase; "restam 28 min"; classificação.

### 4. Alternar visão
- **Tese:** o mesmo tempo do filme em duas visões: quanto falta e a que horas começa e termina.
- **Referência:** `semana-barras-e-radial` (duas visões do mesmo dado, legenda fixa).
- **Interação:** Alternar visão. ←/→ percorre os itens; Enter troca entre as duas visões.
- **Peças:** título e imagem; visão do tempo (barra); visão do horário; classificação.

### 5. Fileira de escolha
- **Tese:** duas ou três escolhas iguais ("assistir agora", "ver mais tarde") em cartões do mesmo molde, com foco e escolhido diferentes.
- **Referência:** `cartoes-de-humor-gradiente` (cartões iguais, foco e escolhido distintos).
- **Interação:** Fileira de escolha. ←/→ move o foco; Enter escolhe.
- **Peças:** título com imagem; fileira de cartões de escolha; estado "Ao vivo"; classificação.

### 6. Trilho de passos
- **Tese:** o filme visto como horários de exibição numa fileira; o horário selecionado inverte a cor e mostra o detalhe.
- **Referência:** `trilho-de-dias-com-seletor` (trilho, item selecionado inverte).
- **Interação:** Trilho de passos. ←/→ move a seleção; Enter abre o detalhe do horário no card.
- **Peças:** título com imagem; trilho de horários; detalhe do horário; classificação.
