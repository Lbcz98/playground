# Juiz: tabela-de-campeonato

Fatos medidos: `check-explore-tokens.mjs`: ok. `check-explore-layout.mjs`: ok (as capturas com ArrowRight e Enter foram geradas e lidas; o script não apontou `eixo`, `anel`, `cortado`, `itens` nem `svg` nas duas opções). A página tem só 2 opções; o brief pede 3 (falta a Direção 3, "O líder como âncora").

## Página
| Nível | Elemento | Regra ou token | Valor documentado | Encontrado |
| --- | --- | --- | --- | --- |
| Warning | Conjunto de opções | brief.md ("3 opções") | 3 opções, uma por direção | só as opções 1 e 2 estão em `index.html`; a Direção 3 (Expandir no lugar, âncora do líder) não existe |

## Opção 1: O título diz quem lidera
Mais perto de: bom (uma interação só, título-conclusão como elemento mais forte, líder em branco e demais em cinza suave, respiro generoso e só 4 linhas).
Padrão de interação: Lista de métricas (←/→ vão à linha anterior/próxima, Enter abre o detalhe no lugar, Voltar fecha; ↑/↓ passam, sem `preventDefault`).
| Nível | Elemento | Regra ou token | Valor documentado | Encontrado |
| --- | --- | --- | --- | --- |
| Critical | `.rows` (as 4 linhas empilhadas) | Playbook §3 "Arrangement follows the keys" / judge.md passo 4 "Axis mismatch" | itens que ←/→ percorrem ficam lado a lado; lista vertical sob ←/→ é controle quebrado | 4 linhas em coluna, percorridas por ←/→ (`ArrowLeft` sobe, `ArrowRight` desce). Ver Note "kit vs playbook" abaixo |
| Note | Padrão "Lista de métricas" x lei do eixo | `explore-ref --padroes` e `--teclas` aceitam coluna lida na ordem; playbook §3 trata como Critical | o catálogo permite, a lei do round 6 proíbe | o brief escolheu esse padrão de propósito. O designer decide qual lado muda; o juiz não edita o kit |
| Warning | `.title` "Palmeiras lidera por 4 pontos" | judge.md passo 4 "Line breaks"; playbook §3 Preferences | a quebra cai depois da palavra funcional, sem começar a linha com preposição | quebra em "Palmeiras lidera / por 4 pontos": "por" abre a 2ª linha |
| Note | `.overline`, `.cols`, `.pos`, `.crest` letra, `.cell .lbl` | DESIGN §3.3 (`.text-footnote-*`, 12px, só rótulo secundário sem decisão) | 12px permitido | 12px em "Campeonato Brasileiro", "Rodada 28", colunas, posição, letra do escudo, "Empates/Derrotas/Saldo": rótulos secundários, o valor ao lado vai a 16px |
| Note | Resto da tabela ("Mais 16 times, do 5º ao 20º lugar") | brief: o resto em segundo plano | rodapé curto | cumpre; só 4 linhas (limite de 4 itens, sem `data-items-ok`) |
| Note | `.row::after` anel | playbook §3 "The focus ring fits its item" | largura 4px + 4px de folga | `--row-pad` 8px = 4 + 4, folga exata; nenhum pai corta (`cortado` ok) |
| Note | Escudo | brief (escudo na linha) | escudo do time | círculo cinza com a inicial; coração branco de CSS (não é SVG, não é cor extra) marca o favorito |

## Opção 2: O pódio em primeiro plano
Mais perto de: bom (um padrão, três peças iguais em fileira com o selecionado invertido, frase-resumo com o número em destaque e bastante respiro; é parente do cartão seletor aprovado).
Padrão de interação: Trilho de passos (←/→ movem a seleção entre 3 times sem laço, Enter abre o detalhe no lugar do resto da tabela, ←/→ continuam trocando o time com o detalhe aberto, Voltar fecha; ↑/↓ passam).
| Nível | Elemento | Regra ou token | Valor documentado | Encontrado |
| --- | --- | --- | --- | --- |
| Warning | `.o2-heart` (favorito BAH) | judge.md passo 5 "second accent hue"; DESIGN (uma cor de acento) | sem segundo acento | coração em `--color-semantic-functional-status-error` (#DE2C2C), o único vermelho do card; a opção 1 marca o favorito em branco |
| Warning | Siglas FLA/PAL/CAP e FLU/BAH/CRU, escudo cinza sem letra | playbook §3 (conteúdo é o protagonista); brief ("times com posição e escudo") | nome ou escudo que identifique o time | o time só se identifica pela sigla de 3 letras; o escudo é um círculo cinza igual para todos; o nome completo só aparece no detalhe aberto |
| Warning | Dados do pódio | brief: "1 Palmeiras 58 28 17", Palmeiras líder | dados do kit | a opção 2 põe Flamengo 60, Palmeiras 57 e Athletico em 3º; a opção 1 tem Palmeiras líder com 58. As opções contam tabelas diferentes |
| Warning | `.o2-sum` "11 pontos separam o 1º do 3º colocado" | judge.md passo 4 "Line breaks" | sem artigo abrindo a linha | quebra em "...separam / o 1º do 3º colocado"; só uma queda leve ("o" abre a 2ª linha) |
| Note | `.o2-over`, `.o2-cols`, `.o2-d-lab`, `.o2-rank` | DESIGN §3.3 | 12px só para rótulo secundário | 12px em "Campeonato Brasileiro · Rodada 28", "Do 4º ao 6º", "Vitórias/Empates/Derrotas/Saldo", posição; os valores ao lado são de 24px |
| Note | `.o2-item` selecionado (invertido) | playbook §3 "A focusable piece says so at rest" | selecionado cheio dispensa contorno; os outros têm contorno de 1px | os 2 não selecionados têm contorno (`::before`); o selecionado usa `#EEEEEE` com texto `#191919` (nem branco nem preto puro) |
| Note | `.o2-item` anel | playbook §3 "The focus ring fits its item" | 4px + 4px | `--item-pad` 12px, folga de 12px no lado; `cortado` ok |
| Note | Trilho de 3 itens (`data-items-ok`) | playbook §3 (máximo 4) | até 4 | 3 times no trilho e 3 linhas no resto; dentro do limite, o atributo é desnecessário |
| Note | Ao fechar com Voltar, a seleção fica no time escolhido | `--teclas`: Voltar "devolve o foco à primeira peça" | volta à primeira peça | fecha o detalhe e mantém o time selecionado; a tecla seguinte sai do card. Desvio pequeno |

## Resumo
- Opção 1: carrega um Critical (linhas empilhadas sob ←/→, eixo diferente das teclas), que é o próprio padrão "Lista de métricas" pedido no brief; ver o Note "kit vs playbook". Mais um Warning de quebra de linha no título.
- Opção 2: sem Critical; Warnings de coração vermelho, identificação do time só por sigla, dados que não batem com o brief e a opção 1, e uma quebra de linha leve.
- Direção 3 do brief não está na página (Warning).
