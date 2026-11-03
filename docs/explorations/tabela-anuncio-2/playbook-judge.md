# Juiz: tabela-anuncio-2

Fatos medidos: check-explore-tokens: ok. check-explore-layout: ok (superfície, respiro e ritmo sem linhas de falha). Capturas geradas com --keys ArrowRight,Enter; as três imagens de cada opção não mostram diferença entre foco e repouso além do que está descrito abaixo. Tamanhos de fonte e cor resolvida não foram medidos além do que os scripts reportaram.

## Opção 1: Rodapé dividido, selo à direita
Mais perto de: bom (uma interação, a tabela como âncora, as 9 linhas e o respiro do card intactos; legenda e selo recuam no mesmo tom na mesma linha, sem faixa nem caixa).
Padrão de interação: card de conteúdo com um clique (o da story); o selo não tem interação.
| Nível | Elemento | Regra ou token | Valor documentado | Encontrado |
| --- | --- | --- | --- | --- |
| Warning | Escudos dos times vs. anel de foco | color.md: um só acento | um acento; o anel de foco é o do kit | os 9 escudos são vermelhos saturados e o anel degradê azul/ciano aparece também em repouso: dois acentos competem com os números da tabela |
| Warning | Anel de foco em repouso | estados do kit: repouso, foco, desabilitado | anel só no foco | o anel aparece na captura "repouso" e nas demais, então o estado de repouso não se distingue do foco (pode ser o card focado por padrão; não confirmado) |
| Note | "Oferecimento" e "Clique para ver mais" | type.md: `.text-footnote-*` em rótulo secundário | footnote permitido se não carrega decisão | footnote-medium em `text-secondary`; "Clique para ver mais" sugere uma ação, mas o clique é o gesto do card; justificado no brief (piso do kit) |
| Note | Logo do selo | brief: logo neutra de 16px | neutra, sem placa | o losango aparece como glifo neutro; não medi se é SVG de ícone ou imagem de marca; se for ícone SVG vira Critical |
| Note | Rodapé alinhado às margens | kit vs playbook | `ContentCardFooter` só aceita legenda centralizada | a composição nova exige alterar o rodapé do kit; o designer decide o lado |

## Opção 3: Rodapé dividido, só a logo
Mais perto de: bom (o rodapé mais silencioso; a logo é a única peça nova e recua; a tabela domina e há respiro no card).
Padrão de interação: card de conteúdo com um clique (o da story); o selo não tem interação.
| Nível | Elemento | Regra ou token | Valor documentado | Encontrado |
| --- | --- | --- | --- | --- |
| Warning | Tabela: colunas J e V | principles.md: hierarquia; brief diz "a tabela fica igual" | tabela e card idênticos entre as opções | J e V aparecem apagadas e Pts em negrito, o que a opção 1 não faz; a variação vai além da posição do selo |
| Warning | Superfície do card | brief: Content Card igual em todas as opções | mesma superfície | o card é translúcido e mais claro que o da opção 1, com cantos diferentes, sem anel em nenhum estado (a opção 1 tem anel); não dá para ver o estado de foco |
| Warning | Logo "vértice" | color.md: logo no tom da legenda; focal-point | selo sussurro, mesmo tom da legenda | o V e o nome ficam um pouco mais claros que a legenda ao lado; a logo (palavra + glifo) tem mais peso que a legenda e é lida antes dela. Cor resolvida não medida |
| Note | "Clique para ver mais" | type.md: footnote em rótulo secundário | footnote permitido | footnote-medium em `text-secondary`, justificado no brief |
| Note | Logo sem a palavra "Oferecimento" | brief: distância reinterpretada | selo = palavra + logo | sem a palavra, o selo pode não ser lido como patrocínio; o brief previu isso nesta opção |

## Resumo
Nenhuma opção traz Critical: nenhuma quebra uma lei. A opção 1 tem Warning de segundo acento (escudos vermelhos mais o anel degradê) e de repouso igual ao foco. A opção 3 tem Warning por alterar a tabela e a superfície além do selo e por uma logo mais pesada que a legenda. A opção 1 está mais perto do conjunto bom; a opção 3 também, com ressalvas. Sem ranking e sem escolha.
