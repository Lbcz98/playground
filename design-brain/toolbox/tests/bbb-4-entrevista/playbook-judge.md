# Juiz: bbb-4-entrevista

Fatos medidos:
- `node scripts/check-explore-tokens.mjs docs/explorations/bbb-4-entrevista`: **ok**; avisos: `tuned off-token --photo-h: 160px` e `tuned off-token --name-bottom: 0px`, ambos da opção 2.
- `node scripts/check-explore-layout.mjs docs/explorations/bbb-4-entrevista`: **ok**; aviso: `Opção 2: superfície: <div.card> tem respiro de 0px com raio 40px; o kit usa 32px (--dimension-spacing-semantic-card-inset-expanded)`.
- Repetição do layout com `--shots "$TMPDIR/judge-bbb-4-entrevista" --keys ArrowRight,Enter`: **ok**, mesmo aviso. As quatro folhas PNG foram inspecionadas: repouso, → e Enter. Nenhuma ficha muda.

Medições complementares no Chromium, com Inter carregada: largura de 288px nas quatro fichas; alturas de 311,97 / 249,59 / 263,11 / 378,39px. Contraste mínimo da tag, calculado sobre o pixel de fundo mais claro na área do texto, ocultando somente os glifos na cópia renderizada: **8,01:1 / 3,27:1 / 6,19:1 / 5,66:1**. Não houve alteração dos arquivos da exploração para medir.

O catálogo foi consultado com `--padroes` e `--teclas`. Aqui não há padrão de interação a classificar: o brief determina fichas estáticas. Ausência de interação não é comportamento inventado. São Content Cards de uma interatividade contextual; a grade da página compara alternativas e não transforma as fichas nos tipos 1–4 de cards navegáveis do playbook §3. O clique, o hover e os SVGs do alternador Grade/Lista pertencem ao chrome da exploração, fora de `.opt-content`.

Limite da medição: a página apresenta alternativas em uma grade de comparação, não uma tela final de TV. A safe area de 40px nas laterais e 32px na vertical, em 1280×720, não foi aferida numa composição final. DESIGN §11 registra 32pt em todos os lados, enquanto o playbook §3 e §10 determina 40/32; essa divergência documental fica como **Note**, sem presumir uma violação das fichas.

## Opção 1: Tag no canto

Mais perto de: **bom** (como o pôster e o seletor do conjunto ouro, concentra a leitura numa imagem, mantém um eixo para nome e dados e reúne o apoio numa faixa curta; não apresenta a multiplicação de caixas e controles do conjunto claustrofóbico).

Padrão de interação: **não se aplica — informativo estático**, conforme o brief.

Intenção declarada: tag no canto inferior da foto, nome imediatamente abaixo e dados em segundo plano, para identificar a participante de relance. A imagem medida ocupa 56,42% da altura, e o nome está 8px abaixo dela.

Inventário do fonte e da renderização: estado único `repouso`; nenhuma tecla tem ação interna. ←, →, ↑, ↓, Enter e Voltar (Esc/Backspace) passam sem `preventDefault`. Não há clique, hover, arraste, rolagem interna, tooltip, dropdown, entrada de texto ou animação no card. O menor texto é 14px; nome em 28px e valores em 16px. Superfícies opacas `#3F3F3F` e `#191919`, nome `#EEEEEE`, apoio `#FFFFFFB3` composto sobre a superfície; a cor não neutra vem dos quatro emojis do conteúdo (🐍, 💔, 🌱, 🎯). A pílula “Paredão” é uma etiqueta de estado translúcida, sem foco ou tecla associada; não há outro elemento com aparência de controle.

| Nível | Elemento | Regra ou token | Valor documentado | Encontrado |
| --- | --- | --- | --- | --- |
| Note | Nome em relação aos valores de apoio | DESIGN §2.1 × §3.1 e §3.7 | Âncora de pelo menos 2× o apoio; título limitado a 28px; valores de apoio em 16–18px | Nome de 28px e valores de 16px: 1,75×. A escala não oferece título permitido de 32px para cumprir simultaneamente essas regras. A imagem ainda sustenta o grupo focal; cabe ao designer resolver a incompatibilidade, sem aumentar o título para display ou encolher os valores. |
| Note | Degrau da foto | Brief, “Foto em ~60% do card”; DESIGN §6.1; kit, “Surfaces” | Brief pede imagem G de 320px e 55–65% da altura; Content Card tem teto de 456px | Usa imagem P de 176px e alcança 56,42%. Há conflito no pedido: 320px já seriam 70,18% de um card de 456px, acima de 65%. A proporção visual foi atendida; o degrau G não foi. |

## Opção 2: Nome no véu

Mais perto de: **bom** (aproxima imagem e nome, como as duas referências ouro, e deixa o apoio numa faixa única; a composição preserva um protagonista, embora a tag perca legibilidade sobre a silhueta).

Padrão de interação: **não se aplica — informativo estático**, conforme o brief.

Intenção declarada: nome sobre o scrim, tag no alto e apoio abaixo. A imagem ocupa 64,10% da altura. O scrim usa `--gradient-semantic-card-scrim`, com os mesmos stops de `--gradient-complementary-dark`; não é um gradiente inventado.

Inventário do fonte e da renderização: estado único `repouso`; ←, →, ↑, ↓, Enter e Esc/Backspace não têm ação interna nem são consumidos. Não há clique, hover, arraste, rolagem interna, tooltip, dropdown, entrada de texto ou animação no card. O menor texto é 14px, inclusive valores; nome em 28px. Fundo `#3F3F3F`, silhueta e tag em `#FFFFFF33`, nome `#EEEEEE` e apoio `#FFFFFFB3`; as transparências foram compostas, não contadas como branco puro. As únicas cores não neutras são as dos quatro emojis e a nuance do scrim do kit. A tag é estado, sem tecla associada; não há botão ou seletor na ficha.

| Nível | Elemento | Regra ou token | Valor documentado | Encontrado |
| --- | --- | --- | --- | --- |
| Warning | Texto “Paredão” sobre a interseção com os ombros | Brief, “Tag de estado na foto”; playbook §3, contraste e legibilidade | Contraste mínimo de 4,5:1 nos pixels reais do fundo da tag | O fundo mais claro atrás do texto é `#838383`; com texto `#EEEEEE`, o contraste cai a **3,27:1**. A sobreposição dos ombros ocupa a parte direita da tag. O fundo deve voltar a uma zona calma que cumpra o contraste especificado. |
| Note | Altura da imagem e posição do nome ajustadas | DESIGN §6.1; tokens `content-card-image-p/m/g` e espaçamentos; playbook §10 | Degraus de imagem de 176/264/320px; inset do Content Card de 32px | A configuração de ajuste registra foto em 160px e nome a 0px da base da foto, ambos marcados `/* tune */`. São desvios explícitos da versão ajustada, não falhas do script de tokens. |
| Note | Aviso de inset do script | DESIGN §7.3; `--dimension-spacing-semantic-card-inset-expanded` | Respiro de 32px medido até o conteúdo visível | `.card` tem padding 0, mas foto sangrada e apoio com padding lateral/inferior de 32px realizam a composição declarada. O aviso não demonstra, por si só, texto a 0px da borda externa: nome e tag começam a 32px da lateral. |
| Note | Valores da faixa de apoio | DESIGN §3.7; direção aprovada no brief | Valores de apoio em 16–18px, com rótulos menores; brief admite apoio em body-sm | Idade, estalecas e contagens estão em 14px, como o apoio previsto no brief. É divergência da regra de hierarquia da faixa, não texto abaixo do piso de 14px. |

## Opção 3: Coluna ao lado

Mais perto de: **claustrofóbico** (a coluna de apenas 96px concentra nome em duas linhas, idade, estalecas e uma grade de emojis; comparada ao eixo largo e à faixa de apoio do conjunto ouro, a leitura se fragmenta numa coluna apertada, mesmo sem caixas ou controles extras).

Padrão de interação: **não se aplica — informativo estático**, conforme o brief.

Intenção declarada: testar foto e informação lado a lado, mantendo a identificação como foco. Essa reinterpretação horizontal está prevista no brief; a avaliação recai sobre a distribuição efetivamente desenhada, não sobre a mudança de orientação.

Inventário do fonte e da renderização: estado único `repouso`; nenhuma ação interna de ←, →, ↑, ↓, Enter ou Esc/Backspace, nenhuma dessas teclas consumida. Não há clique, hover, arraste, rolagem interna, tooltip, dropdown, entrada de texto ou animação. Menor texto: “estalecas” em `.text-footnote-medium`, 12px; demais dados em 14px, emojis em 16px e nome em 28px. Superfícies `#3F3F3F` e `#191919`, transparências claras e scrim do kit; cor não neutra vem dos quatro emojis e da nuance do scrim. A etiqueta “Paredão” não recebe foco ou tecla. A grade 2×2 é só informação; não há navegação em dois eixos nem incompatibilidade entre disposição e teclas.

| Nível | Elemento | Regra ou token | Valor documentado | Encontrado |
| --- | --- | --- | --- | --- |
| Warning | Distribuição entre foto, coluna e tag | Brief, opção 3 e “Tag de estado na foto”; DESIGN §7.3; playbook §3 e §4.3 | Foto em cerca de 60% da largura; tag em no máximo cerca de 1/3 da foto; respiro sem compressão do conteúdo | Foto de 148px em 288px: **51,39%**. A coluna útil tem **96px** e concentra toda a informação, com “Camila” / “Duarte” em duas linhas. A tag de 78,33px toma **52,92%** da largura da foto. A divisão não alcança a proporção proposta e deixa a tag relativamente grande na imagem estreita. Requer rever a composição, sem reduzir tipo para acomodá-la. |
| Note | Rótulo “estalecas” | DESIGN §3.3; `.text-footnote-medium` | 12px permitido para rótulo secundário sem decisão | 12px apenas no nome da unidade, ao lado do valor 3.250 em 14px, numa ficha sem decisões. Não é Critical. |
| Note | Valores secundários | DESIGN §3.7; direção do brief | 16–18px para valores de apoio; brief admite body-sm | Idade, saldo e contagens em 14px. A escolha acompanha a direção de apoio discreto do brief, mas reduz a hierarquia prescrita para valores na faixa. |

## Opção 4: Emojis como segunda massa

Mais perto de: **bom** (a ilustração e o nome conservam a maior massa visual, e os emojis ficam sem caixas; aproxima-se do pôster ouro pelo texto sobre a imagem, embora o apoio esteja mais disperso que nas referências).

Padrão de interação: **não se aplica — informativo estático**, conforme o brief.

Intenção declarada: testar uma segunda massa de cor nos emojis. A ilustração ocupa 59,20% da altura; nome em 28px, emojis em 24px e contagens em 14px. A segunda massa é um contraponto explicitamente pedido, não um acento decorativo inventado.

Inventário do fonte e da renderização: estado único `repouso`; ←, →, ↑, ↓, Enter e Esc/Backspace não agem dentro da ficha nem são consumidos. Não há clique, hover, arraste, rolagem interna, tooltip, dropdown, entrada de texto ou animação. O menor texto é 14px. Superfície `#3F3F3F`, nome e contagens `#EEEEEE`, apoio `#FFFFFFB3`, tag `#FFFFFF33` e scrim do kit; os tons quentes vêm do PNG da participante e as outras cores dos quatro emojis. Não há cor de seleção. A tag não é alcançável por tecla e comunica somente “Paredão”; as reações são pares soltos de emoji e contagem, sem aparência de botão.

| Nível | Elemento | Regra ou token | Valor documentado | Encontrado |
| --- | --- | --- | --- | --- |
| Warning | Nome separado de idade e estalecas | DESIGN §7.5; playbook §3, proximidade e dados do mesmo assunto; brief, opção 4 | Nome, idade e estalecas devem ser lidos como um grupo; brief coloca idade e saldo na faixa do nome, com vão entre grupos de 16px | O nome termina 16px antes da base da foto; os dados começam outros 16px abaixo dela: **32px** entre a caixa do nome e o apoio. No PNG, nome e dados ficam em faixas distintas. Reunir esses dados no grupo de identificação. |
| Note | Segunda massa de emojis | DESIGN §2.0 e §4.3; playbook §10, desvio justificado | Um grupo focal; cor do conteúdo não conta como segundo acento da interface | Emojis de 24px com contagens em 14px bold e `text-primary` ganham mais peso que o apoio. É o contraponto declarado no brief; foto e nome ainda precedem essa massa na imagem. |
| Note | Altura da foto | DESIGN §6.1; brief, contraponto | Imagem nos degraus 176/264/320px; proporção visual pedida de 55–65% | Altura própria de 224px, fora dos três degraus, alcançando 59,20%. A proporção sustenta a tese declarada; o degrau continua uma divergência para decisão do designer. |
| Note | Valores de apoio | DESIGN §3.7; direção do brief | Valores em 16–18px; brief admite apoio em body-sm | Idade, saldo e contagens em 14px. Dentro do piso de leitura, mas abaixo do tamanho prescrito para valores da faixa. |

## Resumo

Nenhuma opção apresenta **Critical**. O relatório não classifica vencedora nem impede a decisão do designer (playbook §4 e §10).
