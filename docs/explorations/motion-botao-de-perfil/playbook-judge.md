# Juiz: motion-botao-de-perfil

Fatos medidos: `check-explore-tokens.mjs`: ok. `check-explore-layout.mjs`: ok (sem linhas de falha; capturas lidas: opção 1 após Enter e opção 3 após Enter).

Contexto da leitura: o componente é o botão de perfil do MainMenu, não um card. Padrão do catálogo e interação por teclas não se aplicam (o brief diz isso; é uma suposição declarada, não um desvio). Só há Enter no wrapper da opção, que apenas reinicia a animação da página de análise; ↑/↓ passam (nenhum `preventDefault` fora de Enter). Os botões "Tocar efeito" têm `tabindex="-1"` e são controle de análise da página, não do produto.

## Opção 1: Ondas
Mais perto de: bom (um único gesto, dois anéis finos em cascata, 7 s de silêncio, muito respiro ao redor; sem competir com o conteúdo).
Padrão de interação: nenhum (só visual, ocioso).
| Nível | Elemento | Regra ou token | Valor documentado | Encontrado |
| --- | --- | --- | --- | --- |
| Warning | Contexto da página | Brief: avatar "ao lado dos outros botões do MainMenu" e repouso ao lado como referência | MainMenu com Schedule, Misc, Program e o repouso sem motion | Só o avatar isolado; `schedule.png` e `weather.png` existem em `assets/` e nenhum é usado (0 referências). A opção só tem o estado "repouso" dentro do /tune, não visível ao lado. Não dá para julgar se a onda (até 1,45 × 72 = ~104px) invade os vizinhos nem se o resto da barra fica quieto |
| Note | Anéis | Restrição do designer: não mudar layout | Anel por cima, sem empurrar vizinhos | `transform: scale` em camada absoluta, sem mexer no layout; cresce fora da caixa de 88px (alcance 104px), não medido contra os vizinhos |
| Note | Compatibilidade Chrome 68 | Restrição técnica do brief | Sem `inset`, sem gap, só CSS | Atendida: `top/right/bottom/left`, `-webkit-` em keyframes |
| Note | "Tocar efeito" | Sem hover (playbook §3) | Sem hover | `:hover` no botão de análise da página (fora do componente) |

## Opção 2: Brilho que passa
Mais perto de: bom (um passe de luz clipado ao círculo, sem camadas extras; o recorte com `overflow` + `clip-path` está garantido).
Padrão de interação: nenhum.
| Nível | Elemento | Regra ou token | Valor documentado | Encontrado |
| --- | --- | --- | --- | --- |
| Warning | Contexto da página | Brief: vizinhos do MainMenu e repouso ao lado | Menu inteiro e referência | Só o avatar; sem repouso ao lado (a opção nem declara o estado "repouso" no /tune, só "ocioso") |
| Note | Faixa de luz | Cores só do kit; sem branco puro | `--color-opacity-light-50` (translúcido) | Token do kit, translúcido a 0,5: composição não medida; não é branco puro por si |
| Note | Brilho cobre o círculo de 72px, não só o avatar de 40px | Brief: faixa "atravessa o avatar" | Brilho sobre o avatar | A faixa corre sobre o círculo translúcido inteiro, o que lê como reflexo no botão e não só no avatar; é leitura, não quebra |
| Note | "Tocar efeito" | Sem hover | Sem hover | `:hover` no botão de análise |

## Opção 3: Respiração do contorno
Mais perto de: bom (o halo é a camada mais discreta; um sobe-e-desce por ciclo e depois silêncio).
Padrão de interação: nenhum.
| Nível | Elemento | Regra ou token | Valor documentado | Encontrado |
| --- | --- | --- | --- | --- |
| Warning | Alcance do halo | Brief: sutil mas "capturar a atenção" e conduzir o olhar | Halo "em volta" do avatar | `--halo-size` 72px é igual ao círculo (72px), então só os ~10px de difusão passam da borda, sob o círculo translúcido; na captura após Enter o halo não aparece. Pode ficar fraco demais para guiar o olhar. Não medido em contraste |
| Warning | Contexto da página | Brief: vizinhos do MainMenu e repouso ao lado | Menu inteiro e referência | Só o avatar; sem estado "repouso" (estados: ocioso, tocando, cta-hover, cta-pressed) |
| Note | Halo | Sem sombra projetada (DESIGN) | Brilho de camada, não `box-shadow` | `filter: blur` num disco `--color-semantic-functional-text-primary` (#EEEEEE) com opacidade 0,35; não é sombra projetada. Opacidade medida por token do kit, não pura |
| Note | Estados `cta-hover`/`cta-pressed` | §3: estados poucos, sem hover | focado, padrão, desabilitado, selecionado | Estados extras de hover existem só no controle de análise da página |

## Opção 4: Arco que orbita
Mais perto de: bom (um arco de 2px dá uma volta, some e há 7 s de silêncio; limpo, sem competir).
Padrão de interação: nenhum.
| Nível | Elemento | Regra ou token | Valor documentado | Encontrado |
| --- | --- | --- | --- | --- |
| Warning | Contexto da página | Brief: vizinhos do MainMenu e repouso ao lado | Menu inteiro e referência | Só o avatar; o repouso só existe como estado do /tune |
| Warning | Arco sobre o contorno de repouso | Kit: contorno 1px `--gradient-semantic-border-default` | Contorno em repouso do botão | O arco (2px, #EEEEEE, `border-top-color`) fica no mesmo raio do contorno de 1px e o cobre durante a volta; um quarto de borda com bordas afinadas (curva de uma borda só) pode ficar com pontas pouco definidas. Não medido na imagem em movimento |
| Note | Compatibilidade Chrome 68 | Brief: sem `conic-gradient`, sem máscara sem prefixo | Só CSS permitido | Atendida: o arco é uma borda de um lado rotacionada, sem conic |
| Note | Prefers-reduced-motion | Playbook §3 "a tela funciona sem o motion" | Funciona sem | Cai em `o4-glow` (pulso de opacidade); correto |

## Resumo
Nenhuma opção carrega Critical.
Opção 1: sem Critical; Warning de contexto (só avatar isolado, sem menu nem repouso ao lado).
Opção 2: sem Critical; Warning de contexto.
Opção 3: sem Critical; Warning de contexto e de alcance do halo (mesmo tamanho do círculo).
Opção 4: sem Critical; Warning de contexto e do arco sobre o contorno de repouso.
