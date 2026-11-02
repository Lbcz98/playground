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
