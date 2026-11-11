# Juiz: queridometro

Fatos medidos: tokens: ok (advisory de width e height 64px é a opção 3, fora desta leva). layout: ok.

## Opção 1: Fase na fileira
Mais perto de: bom (os três rostos são a maior massa, a fileira é a única interação, o nome fica acima e as fases abaixo, com o inset de 32px e o vão de 16px do content card)
Padrão de interação: Estado muda o card
| Nível | Elemento | Regra ou token | Valor documentado | Encontrado |
| --- | --- | --- | --- | --- |
| Warning | círculos da fileira em repouso (`.disc` fora de `.is-current`) | foco: peça que ←/→ alcança precisa de contorno em repouso | contorno em repouso; o anel fica só na fase corrente | fill `--color-semantic-functional-background-primary` (#191919), sem traço, 36px |
| Note, kit vs playbook | `.disc` em repouso | tamanho fora da escala; o kit não tem 36px | 32px (`--dimension-spacing-core-xl`) ou 40px (`--dimension-size-semantic-control-height`) | 36px, o tamanho que o designer pediu contra o círculo corrente de 40px |

## Opção 2: Rostos no miolo
Quebra uma lei.
Mais perto de: bom (os três rostos ocupam o miolo como a maior massa, ←/→ só troca a reação, o cabeçalho fica na faixa de cima e os quatro círculos na borda, com o inset de 32px do content card)
Padrão de interação: Foco revela
| Nível | Elemento | Regra ou token | Valor documentado | Encontrado |
| --- | --- | --- | --- | --- |
| Critical | brilho do `.card` | gradiente inventado com superfície conforme no kit | `var(--gradient-primary-noite)` ou `var(--gradient-semantic-overlay-bottom-right)` | `radial-gradient(ellipse 72% 48% at 100% 100%, color-mix(noite-dark 58%, transparent), transparent)` |
| Warning | número da reação (`.total`) | hierarquia: a contagem fica quieta e sem cor própria | o mesmo corpo e a mesma cor da palavra (`text-body-sm`, `text-muted`) | `text-body-lg-medium` (18px) em `text-primary` (#EEEEEE); a palavra fica `text-body-sm-medium` e `text-muted` (#FFFFFFB3) |

## Resumo
Opção 2 carrega um Critical: o brilho do card é um gradiente inventado.
Opção 1 não carrega Critical.
