# Juiz: tabela-anuncio

Fatos medidos: check-explore-tokens: ok. check-explore-layout: ok. As capturas de ArrowRight e Enter saíram iguais ao repouso nas opções 2 e 3 (o foco do kit não aparece), então o foco não foi julgado. Pesos de fonte e opacidade lidos do CSS, sem medição de contraste.

## Opção 2: Rodapé dividido, selo à esquerda
Mais perto de: bom (um só card, uma só interação, a tabela lida primeiro e o rodapé é uma linha muda; a assinatura "Oferecimento + logo" fica no mesmo tom que a legenda e não vira banner).
Padrão de interação: nenhum (só visual; o clique do kit segue como hoje).
| Nível | Elemento | Regra ou token | Valor documentado | Encontrado |
| --- | --- | --- | --- | --- |
| Warning | `.shield` das 9 linhas | color: cor de status não é decoração | escudo neutro, como na opção 3 | `background: status-error` (vermelho) em todos os 9 escudos; a única cor saturada do card e mais forte que o selo e que a tabela |
| Warning | Rodapé: "Oferecimento", logo e "Clique para ver mais" | focal point: no máximo 3 alavancas separando o foco; proximidade | duas peças de apoio com a mesma força, uma de cada lado | selo e legenda têm o mesmo tom, tamanho e peso; nenhum recua em relação ao outro, e a legenda de ação passa a competir com a assinatura |
| Note | "Oferecimento", "Clique para ver mais", posição 1-9 | type: footnote só em rótulo secundário | rótulo secundário sem decisão | `text-footnote-medium` em tudo isso. "Clique para ver mais" é a legenda original do kit, então fica como "kit vs playbook": o designer decide se ela sobe para body-sm |
| Note | Foco | focus | estado do kit | PNGs de ArrowRight e Enter idênticos ao repouso; não medido |

## Opção 3: Rodapé dividido, só a logo
Mais perto de: bom na ideia (o rodapé mais silencioso e a tabela como foco), mas o resultado visual aproxima-se do claustrofóbico/desligado: o card inteiro está a 50% de opacidade e o selo não se lê.
Padrão de interação: nenhum (só visual).
| Nível | Elemento | Regra ou token | Valor documentado | Encontrado |
| --- | --- | --- | --- | --- |
| Warning | `.zones` (cabeçalho, 9 linhas e rodapé) | principles: tom contra o produto; focal point: a tabela deve ser lida primeiro, não apagada | texto em `text-primary`/`muted` sem opacidade global; a opacidade de `content-muted` marca estado inativo/desabilitado | `opacity: var(--opacity-semantic-content-muted)` (50%) em todo o conteúdo no repouso; o card parece desabilitado e o contraste de todos os 9 times cai, contra a intenção do brief de a tabela ser protagonista |
| Warning | `.logo` (selo) | data card: a peça de apoio existe e é legível; sinal próprio | logo de 16px visível, no rodapé à direita | na captura de repouso a logo não aparece (50% de `.zones` somado a `text-secondary` sobre máscara em `text-primary`); o patrocínio não é reconhecido, o objetivo da opção. Confirmar o render no navegador |
| Warning | `.logo` | proximidade / peça solta | a logo pertence ao grupo do rodapé | `position: absolute; right: 0` fora do fluxo, sem eixo comum com as colunas Pts/J/V; flutua sem alinhamento com a tabela |
| Warning | Pontos (coluna Pts) | principles: hierarquia | um destaque para a tabela | Pts em `text-body-sm-bold` ou semelhante em todas as 9 linhas, só nesta opção, enquanto o card está a 50%: peso extra sem ajuda de contraste |
| Note | "Clique para ver mais", posição 1-9 | type | footnote só em rótulo sem decisão | `text-footnote-medium`; a legenda original do kit é o único sinal de ação, então "kit vs playbook" |
| Note | Foco | focus | estado do kit | PNGs de ArrowRight e Enter idênticos ao repouso; não medido |

## Resumo
Nenhuma das duas opções carrega Critical medido.
Opção 2: Warning (escudos em vermelho de status como decoração; rodapé com duas peças de apoio de igual peso).
Opção 3: Warning (conteúdo inteiro a 50% de opacidade, parece desabilitado; logo não visível no repouso; logo fora do fluxo e sem alinhamento).
