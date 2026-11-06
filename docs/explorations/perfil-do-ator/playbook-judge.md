# Juiz: perfil-do-ator

Fatos medidos: `check-explore-tokens.mjs`: ok. `check-explore-layout.mjs`: ok (itens, eixo, anel, cortado e svg sem linhas de falha; só ok, sem medidas impressas). Capturas lidas (repouso, →, Enter) das 6 opções.

## Opção 1: Personagem como âncora
Mais perto de: bom (um dado-âncora em 28px, três peças com contorno em repouso e respiro generoso; só uma ideia por card).
Padrão de interação: Expandir no lugar
| Nível | Elemento | Regra ou token | Valor documentado | Encontrado |
| --- | --- | --- | --- | --- |
| Note | `.t-label` (Idade, Cidade, Bio) e `.overline` ("Personagem em cena") | `.text-footnote-*`, DESIGN §3.3 | 12px só em rótulo secundário sem decisão | 12px; o valor que decide fica em 14px bold. Permitido |
| Note | peça aberta | Expandir no lugar; ←/→ | ←/→ move entre peças | Com a peça aberta, ←/→ ficam inertes e as outras somem; sem seta ou chevron, o sinal é o anel e o crescimento da peça (correto para TV) |
| Note | estrutura do card | playbook §2.3 (conceitos diferentes) | opções com conceitos distintos | Mesma estrutura da opção 6 (nome grande + fileira de 3 peças); ver opção 6 |

## Opção 2: Ator ↔ Personagem
Mais perto de: bom (um padrão, respiro, imagem como isca), com o retrato ainda vazio.
Padrão de interação: Seletor segmentado
| Nível | Elemento | Regra ou token | Valor documentado | Encontrado |
| --- | --- | --- | --- | --- |
| Warning | `.portrait` na face Personagem | DESIGN §4.3: cor de identidade vem do conteúdo (dia, tarde, noite) | `--gradient-primary-*` só como identidade de conteúdo | `--gradient-primary-tarde` (laranja-amarelo) num bloco sem foto, sem relação com horário nem com a novela; é o único matiz quente da página e compete com o foco |
| Warning | face Ator | brief: personagem e nome do ator são lidos primeiro; proximidade | dados do mesmo assunto juntos | Em repouso a face Ator mostra só nome, idade e cidade; o personagem e a bio ficam atrás de uma tecla, sem pista do que há na outra face além do rótulo |
| Note | `.portrait` ("HD" / "OR") | DESIGN §6 (imagem como isca) | foto do ator | Retângulo escuro com iniciais como substituto; a opção só é avaliada em composição |
| Note | segmento "Atriz" | brief e título da opção dizem "Ator" | rótulo coerente | Rótulo trocado para "Atriz"; ok pela persona, vale confirmar |

## Opção 3: Trilho de fatos
Mais perto de: bom (um trilho de 4 itens, nome em destaque, resumo e detalhe abaixo, respiro bom).
Padrão de interação: Trilho de passos
| Nível | Elemento | Regra ou token | Valor documentado | Encontrado |
| --- | --- | --- | --- | --- |
| Critical | `.step` selecionado (texto) | playbook §3 Laws: sem preto puro; `--o3-sel-color` | nada de `#000000`; token conforme: `--color-semantic-functional-background-primary` (#191919) | `--color-semantic-functional-text-inverse` = #000000 sobre fundo `text-primary` (#EEEEEE) |
| Note | trilho | itens repetidos | 4 no máximo | 4 pílulas (Papel, Idade, Cidade, Bio): no limite; contorno de 1px em repouso presente; anel sem corte segundo o script |

## Opção 4: Ator em órbita
Mais perto de: bom (um padrão, meia órbita com 3 itens, rodapé de identidade), mas com texto menos direto.
Padrão de interação: Órbita
| Nível | Elemento | Regra ou token | Valor documentado | Encontrado |
| --- | --- | --- | --- | --- |
| Warning | `.item` "54" e "RJ" | clareza; peça solta (playbook §3 Preferences) | peça com rótulo ou grupo que a explique | Em repouso são dois círculos de 52px com "54" e "RJ" sem rótulo; só o foco revela o significado (o rótulo abaixo do retrato) |
| Warning | `.readout` entre o retrato e o rodapé | dados do mesmo assunto juntos | nome, personagem e fatos como um grupo | O texto do item focado fica entre o retrato e o rodapé; personagem e nome ficam separados do detalhe de bio por espaço, em vez de um grupo só |
| Note | `.portrait` (silhueta) | DESIGN §6 | foto do ator | Silhueta genérica como substituto |

## Opção 5: Carreira em fases
Mais perto de: bom (personagem e ator em destaque, três fases curtas, zona de texto fixa).
Padrão de interação: Estado muda o card
| Nível | Elemento | Regra ou token | Valor documentado | Encontrado |
| --- | --- | --- | --- | --- |
| Note | `.o5-seg` não selecionadas | playbook §3: peça focável com contorno em repouso (§9.5), exceto seletor segmentado | seletor segmentado fica isento | Início e Virada aparecem como texto puro; é um seletor, então fica isento; o item ativo preenche e leva anel |
| Note | idade e cidade | brief: 5 informações | todas no card | Só aparecem na fase de origem; na fase Vale Tudo (o repouso) não há idade nem cidade na tela |

## Opção 6: Ficha em lista
Mais perto de: bom na composição, mas é gêmea da opção 1.
Padrão de interação: Lista de métricas
| Nível | Elemento | Regra ou token | Valor documentado | Encontrado |
| --- | --- | --- | --- | --- |
| Critical | `.linha.is-focus` aberta (texto) | playbook §3 Laws: sem preto puro; token conforme `--color-semantic-functional-background-primary` (#191919) | sem `#000000` | `--color-semantic-functional-text-inverse` = #000000 sobre `text-primary` (#EEEEEE), valor e rótulo (rótulo ainda a 0.8 de opacidade) |
| Warning | `.personagem` + `.ator` | playbook §10 (quebras e pontuação) | título limpo | O título termina em vírgula solta ("Odete Roitman,") antes do "por Helena Marques Duarte", em linhas separadas |
| Warning | estrutura | playbook §2.3 (conceitos diferentes, não variações de um) | seis conceitos distintos | Mesmo esqueleto da opção 1 (nome grande, fileira de 3 peças com contorno, anel); troca só a expansão (aqui, o detalhe aparece embaixo) |
| Note | `.rotulo` | `.text-footnote-*`, DESIGN §3.3 | 12px em rótulo secundário | 12px, permitido; o padrão "Lista de métricas" prevê valor e mini-gráfico por linha, aqui é uma fileira sem gráfico |

## Resumo
- Opção 3: Crítico (texto do passo selecionado em #000000, `text-inverse`).
- Opção 6: Crítico (texto da peça aberta em #000000, `text-inverse`).
- Opções 1, 2, 4 e 5: sem Crítico. A opção 2 e a 4 têm Warnings; as 1 e 5 só Notas.
