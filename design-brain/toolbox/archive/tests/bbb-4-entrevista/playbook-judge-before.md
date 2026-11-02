# Juiz: bbb-4-entrevista

Fatos medidos:

- `node scripts/check-explore-tokens.mjs docs/explorations/bbb-4-entrevista`: `ok`.
- `node scripts/check-explore-layout.mjs docs/explorations/bbb-4-entrevista`: `advisory: Opção 2: superfície: <div.card> tem respiro de 0px com raio 40px; o kit usa 32px (--dimension-spacing-semantic-card-inset-expanded)`; `ok`.
- Repetição do layout com `--shots "$TMPDIR/judge-shots-bbb-4-entrevista" --keys ArrowRight,Enter`: mesmo advisory; `ok`. Os quatro PNGs foram inspecionados em repouso, após → e após Enter.
- Medição adicional no Chromium: cards de 288px de largura; alturas de 307,19 / 418,39 / 284,44 / 355,19px, respectivamente. Valores abaixo são de estilos computados e caixas renderizadas, arredondados a duas casas.

Escopo: o componente é o filho de `.opt-content`. Grade/lista, seus SVGs, cliques, tooltips e transições pertencem ao comparador, fora dos quatro cards. Os JSONs `data-tune` descrevem controles de edição, não interações do espectador. A referência visual foi conferida na folha ouro e nos HTMLs de `pompeia-poster-card` e `pompeia-seletor-card`; a comparação usa respiro, imagem protagonista e agrupamento, conforme playbook §10, sem transportar os controles dessas referências para uma ficha estática.

Limite de medição: as opções estão no comparador, sem uma tela TV de 1280×720 que estabeleça sua posição final. A safe area da tela não foi medida. Não há nesta rodada indicação de substituição de uma opção anterior; não se presume regressão histórica de riqueza visual.

| Nível | Elemento | Regra ou token | Valor documentado | Encontrado |
| --- | --- | --- | --- | --- |
| Note | Margem da tela, kit vs playbook | DESIGN §11; playbook §§3 e 10 | DESIGN registra 32pt em todos os lados; playbook determina 40 nas laterais e 32 no topo/baixo | As fontes divergem na margem lateral e na unidade registrada. A posição final dos cards não está representada; cabe ao designer resolver a divergência. |

## Opção 1: Tag no canto

Mais perto de: **bom** (como nos dois cards ouro, uma imagem domina a composição e o texto se reúne numa faixa inferior; não há a multiplicação de controles e focos do conjunto claustrofóbico).

Padrão de interação: **nenhum — ficha informativa estática**. O catálogo de `--padroes` não contém uma interação a atribuir a este caso; ausência de interação não é um padrão inventado. Os tipos 1–4 de cards navegáveis em grade não se aplicam.

Fonte e imagem: foto reservada de 288×176px, 57,29% da altura do card; nome 8px abaixo; apoio 16px depois do nome. Tese declarada: juntar retrato e nome, deixando os dados numa faixa discreta para leitura rápida. Menor fonte: 14px; nome 28px; emojis e contagens 14px. Quatro reações: 🐍 12, 💔 7, 🌱 5, 🎯 3. A cor não neutra vem somente dos emojis. Superfície `#3F3F3F`, foto `#191919`, silhueta `#3F3F3F`, texto principal `#EEEEEE`; apoio `rgba(255,255,255,0.7)` sobre `#3F3F3F` resulta aproximadamente em `#C5C5C5`; tag branca a 20% sobre `#191919` resulta em `#474747`.

Teclas e estados: nenhuma tecla tem ação dentro do card; ←, →, Enter, Esc, Backspace, ↑ e ↓ não são canceladas. Só repouso. Sem hover, clique, arraste, rolagem interna, tooltip, dropdown, campo ou animação. “Paredão” é o único elemento com formato de pílula: nenhuma tecla o alcança; seu preenchimento translúcido, sem inversão ou contorno de controle, o apresenta como estado, como solicitado no brief. O `tabindex` da opção pertence ao comparador.

| Nível | Elemento | Regra ou token | Valor documentado | Encontrado |
| --- | --- | --- | --- | --- |
| Warning | Idade, estalecas e contagens | DESIGN §3.7 | Valores da faixa de apoio em 16–18px, `.text-body-md-*` ou `.text-body-lg-*` | Todos em `.text-body-sm-medium`, 14px; “3.250 estalecas” usa o mesmo tamanho para valor e rótulo. Atende ao piso de §3.3, mas não à hierarquia de valores de §3.7. |
| Warning | Degrau da foto | DESIGN §6.1; brief, “Foto em ~60% do card” | Foto G: `--dimension-size-semantic-content-card-image-g`, 320px, para título de uma linha e apoio curto | Usa P, `--dimension-size-semantic-content-card-image-p`, 176px, apesar do título em uma linha. A proporção de 57,29% atende ao intervalo do brief, mas o degrau G também exigido não foi usado nem justificado. |

## Opção 2: Nome no véu

Mais perto de: **bom** (retrato amplo, nome sobre a imagem e poucos grupos neutros lembram o pôster ouro; o apoio está mais separado do nome que nas referências, mas o card não acumula controles nem informações concorrentes).

Padrão de interação: **nenhum — ficha informativa estática**; catálogo e tipos 1–4 de grade não se aplicam.

Fonte e imagem: foto reservada de 288×264px, 63,10% da altura; nome sobre o scrim; 72px entre a caixa do nome e a linha de idade/estalecas. Tese declarada: unir foto e nome sobre o véu, com vão largo antes do apoio. Menor fonte: 14px; nome 28px; emojis 24px e contagens 14px. As mesmas quatro reações, numa fileira. Cor não neutra somente nos emojis. Fundo `#3F3F3F`, silhueta e tag em branco a 20% sobre esse fundo, compostas em aproximadamente `#656565` antes do véu; nome e tag `#EEEEEE`; apoio aproximadamente `#C5C5C5`. O scrim computado de `--gradient-semantic-card-scrim` termina em `#17161B` e é transparente no início: não é superfície preta pura.

Teclas e estados: nenhuma ação ou cancelamento de ←/→, Enter, Esc/Backspace ou ↑/↓; só repouso. Sem hover, clique, arraste, rolagem interna, tooltip, dropdown, entrada ou animação. A pílula “Paredão” é estado translúcido, sem contorno nem inversão; nenhuma tecla a alcança. Não há outro elemento com aparência de controle.

| Nível | Elemento | Regra ou token | Valor documentado | Encontrado |
| --- | --- | --- | --- | --- |
| Warning | Idade, estalecas e contagens | DESIGN §3.7 | Valores em 16–18px; rótulo menor | Idade, “3.250 estalecas” e contagens em 14px; valor e rótulo de estalecas sem diferenciação de tamanho. |
| Warning | Degrau da foto | DESIGN §6.1; brief, direção visual | Degrau G, 320px, para título em uma linha e apoio curto | Usa `--dimension-size-semantic-content-card-image-m`, 264px. A proporção pedida foi atingida, mas a troca de degrau não foi justificada. |
| Note | Nome separado da idade e das estalecas | DESIGN §§7.1 e 7.5; playbook §3, proximidade; §10, desvio justificado | Dados da participante lidos como um grupo; vão entre grupos em 12–16px | Nome termina em y=240px e dados começam em y=312px: vão de 72px. O PNG mostra duas zonas separadas. O brief justifica expressamente o “vão largo” nesta opção; por isso é Note. |
| Note | Advisory de inset da superfície | `--dimension-spacing-semantic-card-inset-expanded`; DESIGN §7.3 | 32px de margem ao conteúdo visível | O script lê `padding: 0` no contêiner. A foto sangra deliberadamente; tag e nome têm 32px de margem lateral, e o apoio tem 32px nas laterais e embaixo. O advisory descreve o contêiner, sem demonstrar texto colado à curva. |

## Opção 3: Coluna ao lado

Mais perto de: **claustrofóbico** (na coluna de dados: o nome ocupa duas linhas em apenas 100px, os emojis se comprimem em 2×2 e o texto fica a 16px da borda; os cards ouro reservam largura e inset para um grupo inferior contínuo, mesmo quando o título quebra).

Padrão de interação: **nenhum — ficha informativa estática**; catálogo e tipos 1–4 de grade não se aplicam. A grade 2×2 de emojis é apenas informativa, portanto não configura conflito de eixo com ←/→.

Fonte e imagem: foto reservada de 160×284,44px, 55,56% da largura do card; coluna com 100px úteis para o texto. Nome “Camila” / “Duarte” em 28px, com quebra entre os nomes; 57,28px até a idade. Tese declarada: testar foto e informação lado a lado, com nome no topo e apoio abaixo. Menor fonte: 12px apenas no rótulo “estalecas”; idade, valor e contagens 14px; emojis 16px. Quatro reações em duas linhas. Cor não neutra somente nos emojis. Fundo `#3F3F3F`, foto `#191919`, nome/tag `#EEEEEE`; apoio aproximadamente `#C5C5C5`. Silhueta em branco a 20% e scrim do kit, terminado em `#17161B`; a tag se compõe sobre esses elementos, sem fundo branco opaco.

Teclas e estados: nenhuma ação ou cancelamento de ←/→, Enter, Esc/Backspace ou ↑/↓; só repouso. Sem hover, clique, arraste, rolagem interna, tooltip, dropdown, entrada ou animação. A tag de estado não tem alvo de tecla e não recebe inversão ou contorno de controle. Os emojis não têm caixas nem sinais de botão.

| Nível | Elemento | Regra ou token | Valor documentado | Encontrado |
| --- | --- | --- | --- | --- |
| Warning | Coluna e margem direita | DESIGN §§7.3 e 8.3; `--dimension-spacing-semantic-card-inset-expanded` | Content Card com inset de 32px; uma superfície própria deve corresponder a outra ideia de forma | Mantém o Content Card de 288px e raio 40px, mas usa só 16px à direita; foto de 160px e vão de 12px deixam 100px para texto. `data-surface="own"` evita a medição do script, sem transformar este painel em outra superfície. O PNG mostra o apoio apertado nessa faixa. |
| Warning | Nome separado dos dados | DESIGN §7.5; playbook §3, dados relacionados | Nome, idade e estalecas próximos, lidos como um grupo | `justify-content: space-between` põe 57,28px entre o nome e o apoio. O PNG mostra o nome no alto e os dados no pé, em dois blocos. A tese justifica a coluna lateral, mas não explica a separação desses dados. |
| Warning | Valores do apoio | DESIGN §3.7 | Valores em 16–18px; rótulo secundário menor | “27 anos”, “3.250” e as quatro contagens usam 14px. A distinção do rótulo de estalecas existe, mas o valor permanece abaixo do tamanho de apoio documentado. |
| Note | Rótulo “estalecas” | DESIGN §3.3; judge, severidade | `.text-footnote-*`, 12px, permitido para rótulo secundário sem decisão | `.text-footnote-medium`, 12px, apenas nomeando a unidade do valor 3.250; não é Critical. |
| Note | Imagem lateral | DESIGN §§6.1 e 6.3; playbook §10, desvio justificado | Receita geral de imagem no topo | O brief autoriza expressamente a foto lateral em cerca de 60% da largura para esta opção. É uma reinterpretação justificada, não uma infração de navegação. |

## Opção 4: Emojis como segunda massa

Mais perto de: **bom** (a imagem e o nome ainda dão a entrada, com idade e estalecas logo abaixo; os quatro emojis ocupam uma zona espaçosa, sem caixas ou controles extras, mais próxima da composição dos cards ouro que da acumulação do conjunto claustrofóbico).

Padrão de interação: **nenhum — ficha informativa estática**; catálogo e tipos 1–4 de grade não se aplicam.

Fonte e imagem: ilustração PNG reservada de 288×224px, 63,07% da altura; nome e dados sobre o scrim, separados por 4px; quatro reações em grade 2×2. Tese declarada: dar aos emojis uma segunda massa para testar a energia de reality show. Menor fonte: 14px; nome e emojis 28px; contagens 14px em bold. Cores não neutras pertencem ao retrato (pele, cabelo, roupa e fundo da ilustração) e aos emojis, sem acento cromático de interface. Superfície `#3F3F3F`, nome/tag/contagens `#EEEEEE`, apoio `rgba(255,255,255,0.7)` sobre a imagem e o scrim do kit. O composto exato desse apoio e da tag sobre a ilustração não foi medido; não se infere branco/preto puro a partir dos canais de um token translúcido.

Teclas e estados: nenhuma ação ou cancelamento de ←/→, Enter, Esc/Backspace ou ↑/↓; só repouso. Sem hover, clique, arraste, rolagem interna, tooltip, dropdown, entrada ou animação. “Paredão” é tag translúcida sem inversão/contorno; nenhuma tecla a alcança. Reações não têm contorno, fundo próprio ou semântica de controle.

| Nível | Elemento | Regra ou token | Valor documentado | Encontrado |
| --- | --- | --- | --- | --- |
| Warning | Idade, estalecas e contagens | DESIGN §3.7 | Valores em 16–18px; rótulo menor | Idade, “3.250 estalecas” e contagens em 14px; estalecas têm rótulo e valor no mesmo tamanho. |
| Warning | Altura da foto | DESIGN §6.1; brief, direção visual | Degraus P/M/G: 176/264/320px; o brief pede G | Usa `--photo-h: 224px`, fora dos três degraus. A proporção atende ao brief, mas a altura inventada não tem justificativa. |
| Note | Segunda massa de emojis | DESIGN §2.0; playbook §3, hierarquia; §10, desvio justificado | Um grupo focal; apoio numa faixa quieta | Emojis a 28px, no mesmo tamanho nominal do nome, com contagens em bold e duas linhas. A área ganha peso próprio no PNG, mas o retrato e o nome continuam a entrada. O contraponto é expressamente autorizado no brief; não se transforma em Critical nem se presume competição maior que a observada. |

## Resumo

- Opção 1: maior nível **Warning**; mais perto do conjunto **bom**. Sem Critical.
- Opção 2: maior nível **Warning**; mais perto do conjunto **bom**. Sem Critical.
- Opção 3: maior nível **Warning**; mais perto do conjunto **claustrofóbico**. Sem Critical.
- Opção 4: maior nível **Warning**; mais perto do conjunto **bom**. Sem Critical.
