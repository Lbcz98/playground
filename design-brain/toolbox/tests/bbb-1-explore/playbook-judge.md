# Juiz: bbb-1-explore

Fatos medidos:
- `check-explore-tokens.mjs`: ok (3 avisos de advisory: `height: 200px` da opção 1 perto de `card-expanded-width`; `72px` da foto da opção 3 é o tamanho `round-button-circle`). O script não mede o tamanho de fonte vindo das classes `.text-*`; medi no navegador (abaixo).
- `check-explore-layout.mjs`: ok.
- Página pelo servidor de explorar: renderiza estilizada (tokens.css e inter.css 200). Só `../../../src/styles/global.css` dá 404 (conhecido, inofensivo). Nada mais linkado falha. Servidor que eu subi foi parado.
- Fontes medidas no navegador: 12px em opção 1 (idade, "estalecas", as 4 contagens de emoji), opção 2 (idade, "Estalecas"), opção 4 (idade, "estalecas"). Opção 3: mínimo 14px. Texto `#EEEEEE` e muted `rgba(255,255,255,0.7)` sobre `#3F3F3F` em todas; nenhum branco ou preto puro em texto.
- Teclas e interação: nenhuma opção tem script, `preventDefault`, hover, cursor, foco, animação ou seta. Nenhum padrão do catálogo se aplica, como pede o brief (só visual).

## Opção 1: Foto como contexto
Mais perto de: claustrofóbico (nome, idade, estalecas e quatro pílulas ficam empilhados e colados no pé do card, sobre um véu quase preto, enquanto o alto é só a silhueta; a densidade se concentra num bloco).
Padrão de interação: nenhum (só visual, conforme o brief)
| Nível | Elemento | Regra ou token | Valor documentado | Encontrado |
| --- | --- | --- | --- | --- |
| Crítico | idade "27 anos", "estalecas", contagens 12/7/5/3 | Tipo mínimo 14px (playbook 3, Laws) | 14px; token conforme existe: `text-body-sm` (14px) | `text-footnote-medium` e `text-footnote-bold`, 12px |
| Aviso | pílulas de emoji (fundo `opacity-light-10`, raio, padding) | Falsa affordance (judge, passo 4); nenhuma tecla as alcança | só aparência de leitura | formato de pílula/chip que lembra botão ou filtro, sem tecla associada |
| Aviso | texto sobre o véu `gradient-semantic-overlay-bottom` | Sem preto puro; contraste não medido só no monitor | gradiente termina em `#000000E6` | composição sobre a foto não medida; no pé o fundo atrás do texto chega a quase preto |
| Aviso | pé do card: nome 28px, idade, estalecas 14px, pílulas | Respiro e proximidade (playbook 3, princípios) | grupo claro, respiro generoso | quatro peças coladas (gap xs/3xs) no mesmo bloco, sem separação entre estalecas e emojis |
| Aviso | `.zone` 200px | Escala do kit | usar token se for o `card-expanded-width` (208px) | altura fixa de 200px, o card fica com cerca de 378px de altura |
| Nota | foto como silhueta cobrindo o card | Brief: espaço reservado | sem foto real | silhueta genérica, aceitável |

## Opção 2: Estalecas em destaque
Mais perto de: bom (um número-herói com respiro, identidade pequena em cima, emojis embaixo; sem divisores).
Padrão de interação: nenhum (só visual, conforme o brief)
| Nível | Elemento | Regra ou token | Valor documentado | Encontrado |
| --- | --- | --- | --- | --- |
| Crítico | idade "27 anos" e rótulo "Estalecas" | Tipo mínimo 14px | 14px; token conforme: `text-body-sm` | `text-footnote-medium`, 12px |
| Aviso | 4 chips de emoji, largura igual, em linha | Falsa affordance; arranjo de seletor segmentado | só leitura | fileira de 4 cartões iguais com mesmo tamanho lembra um seletor/fileira de escolha, sem tecla |
| Aviso | nome 14px bold junto da foto | Hierarquia: o conteúdo é o protagonista; prioridade do brief 1 é foto e nome | nome mais forte que dados de apoio | o nome (14px) é menor que o número 28px e que o glifo do emoji (16px) |
| Nota | "3.250" em 28px, maior que o nome | Status mais alto que o conteúdo (judge, passo 4) | justificado pela tese da opção ("estalecas é o dado âncora") | número 28px contra nome 14px; desvio justificado |

## Opção 3: Ficha em dois grupos
Mais perto de: bom (dois grupos separados pelo espaço, nome em destaque, todo texto a partir de 14px, respiro generoso).
Padrão de interação: nenhum (só visual, conforme o brief)
| Nível | Elemento | Regra ou token | Valor documentado | Encontrado |
| --- | --- | --- | --- | --- |
| Aviso | 4 cartões de emoji em grade de 4 colunas, glifo sobre contagem | Falsa affordance; fileira de escolha ("cartões de humor") | só leitura | quatro cartões iguais com fundo `opacity-light-10` lembram uma fileira para escolher, sem tecla |
| Aviso | foto 72px fixa | Tokens do kit (check-explore-tokens) | `var(--dimension-size-semantic-<name>)`; as opções 2 e 4 usam `avatar` | `width/height: 72px` literal (coincide com `round-button-circle`, que é outro componente) |
| Aviso | foto sobre o nome (empilhada) | Proximidade / arranjo | foto e nome formam uma identidade | foto no alto, nome e idade abaixo, sem ficar solta; apenas o espaço entre a foto e o nome é pequeno |

## Opção 4: Emojis como protagonista
Mais perto de: bom (os emojis são o assunto, em grade de 2×2 com respiro; identidade pequena em cima). Fica no limite por ter 3 blocos grandes.
Padrão de interação: nenhum (só visual, conforme o brief)
| Nível | Elemento | Regra ou token | Valor documentado | Encontrado |
| --- | --- | --- | --- | --- |
| Crítico | idade "27 anos" e "estalecas" | Tipo mínimo 14px | 14px; token conforme: `text-body-sm` | `text-footnote-medium`, 12px |
| Aviso | 4 células 2×2 com fundo `opacity-light-10`, emoji no alto e contagem embaixo | Falsa affordance; molde "cartões de humor" | só leitura | células grandes com cara de cartões de escolha (opção marcável), sem tecla |
| Aviso | "3.250 estalecas" | Elemento solto (judge, passo 4) | uma peça só pertence a um grupo | fica entre a identidade e a grade, com o mesmo gap que separa os grupos, sem ligação clara com nome ou com emojis; 14px bold, o dado mais fraco do card |
| Nota | contagens 28px, maiores que o nome 14px | Status mais alto que o conteúdo | justificado pela tese ("a reação do público é o assunto") | desvio justificado |
| Nota | arranjo 2×2 | Eixo (judge, passo 4) | sem teclas internas, não há eixo | sem desencontro de eixo |

## Resumo
- Opção 1: carrega 1 Crítico (12px onde existe `text-body-sm`).
- Opção 2: carrega 1 Crítico (12px onde existe `text-body-sm`).
- Opção 3: sem Crítico (maior severidade: Aviso).
- Opção 4: carrega 1 Crítico (12px onde existe `text-body-sm`).

Sobre linhas quebradas: o nome "Camila Duarte" cabe em uma linha em todas as opções (sem quebra). Capitalização: sentence case em todas ("Estalecas", "27 anos"). Eixo: não se aplica, não há teclas dentro do card.
