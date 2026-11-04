# Juiz: schedule-card-live-titulo

Fatos medidos: `check-explore-tokens.mjs`: ok.

Fatos medidos: `check-explore-layout.mjs`: ok.

Fatos medidos: capturas `--shots` com ArrowRight e Enter. O Enter da opção 2 é idêntico ao → (0 px de diferença). O Enter das opções 3 e 4 substitui o poster por uma placa cinza. O Enter da opção 1 só acrescenta o check no canto (cerca de 216–239 × 81–104 px).

## Opção 1: Faixa baixa

Mais perto de: bom (poster em tela cheia, nome e faixa num grupo só na base, um padrão, com a arte livre acima do texto).

Padrão de interação: Fileira de escolha, cartão tipo 1 (←/→ trocam o programa no mesmo cartão, Enter marca o focado, ↑/↓ passam sem `preventDefault`)

| Nível | Elemento | Regra ou token | Valor documentado | Encontrado |
| --- | --- | --- | --- | --- |
| Warning | Título | DESIGN §3.5; playbook, quebra de linha | A quebra fica depois da palavra funcional («de», «do»), em fronteira de palavra; o que passa leva reticências | A foto do foco mostra «A Grande Conquista / Sertão Nordestino…»: o «do» não está no texto. A foto do → mostra «Jornal Nacional / Especial: Cobertura», sem reticências, e «Completa das Eleições» não aparece. No HTML, o terceiro nome é «Big Brother Brasil — / A Eliminação Mais…». |
| Warning | Transição da arte | DESIGN §10; `--motion-semantic-duration`, `--motion-semantic-easing` | Dissolução de 800ms no easing do kit | 150ms e `cubic-bezier(0.2, 0, 0, 1)`. O bloco de reduced-motion repete esses 150ms. |
| Note | Check | DESIGN §7.4; playbook, preferência do check | Ao lado do nome, na mesma linha de base | Na foto do Enter, o check fica no canto superior direito do cartão, longe do título. |

## Opção 2: Zona limpa

Mais perto de: bom (uma imagem, um padrão e o texto agrupado na base; a arte fica livre acima da placa).

Padrão de interação: Fileira de escolha, cartão tipo 1 (←/→ trocam o cartão da fileira cortada a um cartão, Enter deveria marcar o focado, ↑/↓ passam)

| Nível | Elemento | Regra ou token | Valor documentado | Encontrado |
| --- | --- | --- | --- | --- |
| Warning | Título | DESIGN §3.5; playbook, quebra de linha | A quebra fica depois da palavra funcional, em fronteira de palavra | A foto do foco quebra em «A Grande Conquista / do Sertão…»: «do» abre a segunda linha. A foto do → mostra «Jornal Nacional / Especial: Cobertur…», corte no meio de «Cobertura». |
| Warning | Enter | DESIGN §9.2; catálogo Fileira de escolha | O escolhido fica marcado de outro jeito que o foco, com check ao lado do nome | A foto do Enter é igual à do →, 0 px de diferença. O CSS liga o check por máscara (`assets/check.png`) e ele não pinta. |
| Warning | Easing da arte | DESIGN §10; `--motion-semantic-easing` | O easing do kit (mola de 800ms) | A duração usa `--motion-semantic-duration`. O easing é `cubic-bezier(0.2, 0, 0, 1)`. |
| Note | Placa da zona | DESIGN §5.4, §6.4 | O texto sobre a imagem assenta no scrim `--gradient-complementary-dark` (o token `--gradient-semantic-card-scrim` tem os mesmos stops) | A zona do texto é uma placa opaca `--color-core-neutral-charcoal` (#17161B). A tese da opção pede essa zona limpa. |
| Note | Pílula AO VIVO fora do índice | DESIGN §4.2, §9.1 | A cor de ao vivo marca o estado ao vivo, não o foco | Nos cartões que não estão no índice, a pílula troca `--gradient-semantic-status-live` por `--color-semantic-functional-background-tint`. A fileira cortada não os mostra; a foto só tem o cartão focado, já vermelho. |

## Opção 3: Âncora empilhada

Mais perto de: bom (no foco o poster ocupa o cartão e o nome é a âncora, com a faixa quieta por baixo).

Padrão de interação: Fileira de escolha, cartão tipo 1 (←/→ trocam o programa no mesmo cartão, Enter marca, ↑/↓ passam)

| Nível | Elemento | Regra ou token | Valor documentado | Encontrado |
| --- | --- | --- | --- | --- |
| Warning | Título | DESIGN §3.5; playbook, quebra de linha | A quebra fica depois da palavra funcional, em fronteira de palavra, com reticências no corte | A foto do foco mostra «A Grande Conquista / Sertão Nordestino…»: o «do» não está no texto. A foto do → mostra «Jornal Nacional / Especial: Cobertura», sem reticências, e «Completa das Eleições» não aparece. No HTML, o terceiro nome é «Big Brother Brasil — / A Eliminação Mais…». |
| Warning | Poster no Enter | DESIGN §9.1, §12.5 | O foco é o anel; a imagem não entra e sai com o estado | A foto do Enter apaga o poster (a opacidade 1 só vale em `foco-*`; `--art-rest` é 0) e o cartão fica a placa `--color-semantic-functional-background-elevated` (#3F3F3F), com o check no canto. |
| Warning | Transição | DESIGN §10; `--motion-semantic-duration`, `--motion-semantic-easing` | Dissolução de 800ms no easing do kit | 150ms e `cubic-bezier(0.2, 0, 0, 1)`. O bloco de reduced-motion repete esses 150ms. |
| Note | Tamanho do título | DESIGN §3.1; `.text-body-md-bold` | 16px, peso 700, −0.01em, entrelinha 1.2, via o estilo do kit | A classe está no nome e o número coincide, mas `--title-size`, `--title-lh` e `--title-track` são literais (16px, 1.2, −0.01em), sem token. |
| Note | Check | DESIGN §7.4; playbook, preferência do check | Ao lado do nome, na mesma linha de base | Na foto do Enter, o check fica no canto superior direito, longe do título. |

## Opção 4: Assunto ao centro

Mais perto de: bom (poster em tela cheia e o nome na base, um padrão só, com o assunto no centro do quadro).

Padrão de interação: Fileira de escolha, cartão tipo 1 (←/→ trocam o programa no mesmo cartão, Enter marca, ↑/↓ passam)

| Nível | Elemento | Regra ou token | Valor documentado | Encontrado |
| --- | --- | --- | --- | --- |
| Warning | Título | DESIGN §3.5; playbook, quebra de linha | A quebra fica depois da palavra funcional («do» fica com a palavra que liga) | A foto do foco quebra em «A Grande Conquista / do Sertão…»: «do» abre a segunda linha. |
| Warning | Cartão no Enter | DESIGN §2.0, §9.1, §9.2 | O título segue a âncora; o escolhido se marca com check; a imagem não é o sinal do estado | A foto do Enter apaga o poster (opacidade 0 fora de `foco`) e a copy cai a `--opacity-semantic-content-muted` (0.5). O composto medido do título é #969696 sobre #3F3F3F, 3,56:1. Não há check claro na foto. O mesmo esmaecimento vale para `repouso` no CSS. |
| Warning | Transição da arte | DESIGN §10; `--motion-semantic-duration`, `--motion-semantic-easing` | Dissolução de 800ms no easing do kit | 150ms e `cubic-bezier(0.2, 0, 0, 1)`. O bloco de reduced-motion mantém os 150ms. |

## Resumo

Nenhuma opção quebra uma lei. O maior nível nas quatro é Warning: quebra ou corte do título na 1, no 2 e na 4; Enter sem marca visível na 2; Enter que apaga o poster na 3 e na 4.
