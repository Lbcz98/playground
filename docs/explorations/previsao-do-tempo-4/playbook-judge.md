# Juiz: previsao-do-tempo-4

Fatos medidos:
- `check-explore-tokens.mjs`: ok.
- `check-explore-layout.mjs` (com `--shots` e `--keys ArrowRight,Enter`): ok. Não imprimiu `itens`, `anel`, `eixo` nem `svg` com problema; as medidas de folga do anel abaixo vêm do CSS (anel de 4px em `inset: 0`, respiro interno de 32px).
- A página tem 2 opções (`data-option` 1 e 2), rotuladas "Opção 2" e "Opção 3" (restos da numeração das 4 direções do brief). Nota: o rótulo não bate com a posição.
- Fonte e captura vistas: nenhuma opção trata tecla. O script só muda `data-state` com o foco e o blur do DOM; não há `preventDefault`, então ↑/↓ passam.

## Opção 1 (rotulada "Opção 2 - Título que diz como é lá fora")
Mais perto de: claustrofóbico, de leve. São cerca de 15 peças de texto (local, frase, "Agora", número, 4 nomes, 4 valores, 4 comparações) em uma coluna, sem imagem e sem um ponto de respiro. Está mais perto do conjunto ruim (muitas peças, nada como isca) do que do cartão bom (uma interação, uma imagem de isca, respiro generoso).
Padrão de interação: nenhum (Enter no card inteiro é o padrão de todo card e não conta). Sem hover, clique, arrastar, rolagem ou animação necessária.

| Nível | Elemento | Regra ou token | Valor documentado | Encontrado |
| --- | --- | --- | --- | --- |
| Warning | Peças de texto no card (lista de 4 provas, cada uma com nome, valor e comparação) | Playbook §3 (respiro; elementos demais); DESIGN §7.3 e §12.7 | Um card com respiro generoso, poucas peças | Uns 15 textos empilhados. Cada prova ocupa 2 linhas, então a coluna é longa e o olhar não tem pausa. O brief pede "sem cara de planilha" |
| Warning | Colunas de valor (`.proof-value`, alinhada à direita) contra nome e local (à esquerda) | DESIGN §7.2 (um eixo à esquerda alinha todos os grupos) | Um único eixo à esquerda | Dois eixos: nomes à esquerda e valores colados na borda direita. Lê-se como linha de tabela |
| Warning | Local "São Paulo" (`.place`, 14px, `text-muted`) | Playbook §3, "Reduce items, not richness": o nome do lugar nunca se perde | Local legível como parte do conteúdo | O local é a linha mais fraca do cabeçalho; a frase bold logo abaixo o supera. Tem o mesmo peso visual dos nomes de métrica ("Sensação", "Vento") |
| Warning | Hierarquia número/frase | Playbook §1 (conteúdo protagonista); DESIGN §2 | Âncora claramente mais forte que o resto | A âncora (24°, `text-heading-3-bold`, 28px) é só 2× o 14px da frase e dos valores. A frase bold e os valores bold competem com ela |
| Note | `.proof-words` (12px, comparações em palavras) e `.proof-unit` ("km/h", 12px) | DESIGN §3.3: 12px só para rótulo secundário sem decisão | `.text-footnote-*` permitido; decisão pede 14px ou mais | 12px em texto que informa mas não leva decisão (só leitura). Permitido; viraria Critical se o espectador agisse a partir dele |
| Note | Rótulo da opção "Opção 2" | Página (chrome) | Numeração igual à posição | A opção é a 1ª da página |

## Opção 2 (rotulada "Opção 3 - O ambiente como fundo")
Mais perto de: bom. Uma imagem como isca (o céu de ponta a ponta), informação nas faixas de cima e de baixo, uma faixa livre no meio, 4 dados em grade de 2 colunas. É o conjunto do cartão de pôster/seletor (imagem à frente, texto nas faixas calmas), sem a densidade da lista.
Padrão de interação: nenhum (só Enter no card inteiro).

| Nível | Elemento | Regra ou token | Valor documentado | Encontrado |
| --- | --- | --- | --- | --- |
| Warning | Escurecimento do card (`.veil`, `--gradient-semantic-card-scrim`) com alturas ajustáveis (`--veil-top` 42%, `--veil-bottom` 56%) | DESIGN §5.4: o scrim de card é `--gradient-complementary-dark`; §5.5: "agents do not tune it" | `--gradient-complementary-dark`, com os pontos e a força do kit | Usa outro token do kit (`--gradient-semantic-card-scrim`) e ainda muda a extensão do véu em % (e o espelha no topo). Não é gradiente inventado, mas foge do token nomeado e da regra de não ajustar |
| Warning | `.sky` troca de opacidade com o foco (`--sky-rest` 0.8 para `--sky-focus` 1) | DESIGN §9.1: o foco não muda a cor; §12.5 | Foco só pelo anel | O céu fica mais vivo ao receber foco. O anel continua sendo o sinal principal, mas o brilho extra é uma mudança de cor ligada ao foco |
| Warning | Céu laranja (`--gradient-primary-tarde`) | DESIGN §4.3 e §12.10 (identidade vem do conteúdo; sem dado decorativo) | Tarde só quando o conteúdo é uma tarde | O card nunca diz que é tarde nem o clima. O laranja fixo funciona como ambiente decorativo ligado a nenhum dado; vale pela tese do brief, mas a decisão é do designer |
| Warning | Dados relacionados separados (24° "agora" no topo; Sensação e Média do dia no rodapé, a ~96px) | DESIGN §7.5; playbook §3 (dados do mesmo assunto juntos) | Temperaturas do mesmo local próximas | A faixa de céu de 96px afasta a temperatura atual da sensação e da média. É a tese da opção; pesa a favor do céu, contra a leitura de uma comparação |
| Note | `.fact-label` (12px: "Sensação", "Média do dia", "Vento", "Umidade") | DESIGN §3.3 | 12px só para rótulo secundário | Cada rótulo é o único nome do dado; sem decisão. Contraste do `text-muted` sobre o véu não medido pelos scripts (a captura lê bem). Fica como Note |
| Note | `.band` (96px de altura fixa) | DESIGN §7.3: altura nunca reservada | Sem altura reservada | A faixa reserva altura para o céu aparecer; justificada pela tese |

## Resumo
- Nenhuma opção carrega Critical: não há tecla tratada, ↑/↓ passam, não há SVG de ícone nos cards, o anel de 4px tem 32px de respiro em volta, as duas têm 4 itens repetidos no máximo, nenhuma usa branco ou preto puro.
- Opção 1: 4 Warnings (card longo e denso, dois eixos, local fraco, âncora pouco acima do resto) e 2 Notes.
- Opção 2: 4 Warnings (scrim com outro token e ajustado, foco muda o brilho do céu, céu laranja sem dado, dados relacionados afastados) e 2 Notes.
