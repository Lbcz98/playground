# Juiz: bbb-4-entrevista

Fatos medidos:

- `node scripts/check-explore-tokens.mjs docs/explorations/bbb-4-entrevista`: `ok`; `advisory: tuned off-token --photo-h: 224px (a candidate token; /proto snaps it to the nearest)`.
- `node scripts/check-explore-layout.mjs docs/explorations/bbb-4-entrevista`: `ok`; `advisory: Opção 2: superfície: <div.card> tem respiro de 0px com raio 40px; o kit usa 32px (--dimension-spacing-semantic-card-inset-expanded)`.
- `node scripts/check-explore-layout.mjs docs/explorations/bbb-4-entrevista --shots "$TMPDIR/judge-shots" --keys ArrowRight,Enter`: `ok`, com o mesmo advisory de superfície; quatro folhas PNG lidas, incluindo repouso, → e Enter.
- Catálogos consultados com `node scripts/explore-ref.mjs --padroes` e `--teclas`. As páginas e os PNGs de `pompeia-poster-card` e `pompeia-seletor-card` foram examinados diretamente. A comparação com o conjunto claustrofóbico segue os critérios do playbook §4 e §10: acentos concorrentes, vários padrões e falta de respiro.

Medição adicional em Chromium: estilos resolvidos, caixas e eventos canceláveis. Nenhuma das sete teclas ←, →, ↑, ↓, Enter, Esc e Backspace foi cancelada pelos cards. O único script executável da página alterna a visualização da ferramenta; os blocos `data-tune` são JSON. Hover, clique, tooltip e animação do seletor Grade/Lista pertencem à ferramenta, fora de `.opt-content`, assim como seus SVGs. Os cards não têm handlers, controles, rolagem interna, dropdowns, campos, drag, hover ou animações. Não são cards navegáveis de uma grade de TV dos tipos 1–4; são Content Cards contextuais informativos.

Paleta resolvida dos cards: superfície `#3F3F3F`, fundo dos espaços reservados 1 e 3 `#191919`, nome e tag `#EEEEEE`, apoio `rgba(255,255,255,0.7)` e tag `rgba(255,255,255,0.2)`. O apoio sobre a superfície compõe aproximadamente `rgb(197,197,197)`, não branco puro. Os scrims 2, 3 e 4 resolvem para transparente → `#17161B`; o token `--gradient-semantic-card-scrim` corresponde ao `--gradient-complementary-dark` documentado. Transparência não foi contada como preto puro. Cores não neutras vêm apenas dos quatro emojis e, na opção 4, da ilustração em `assets/camila.png`; são conteúdo, conforme DESIGN §4.3.

Contraste das tags: texto `#EEEEEE` contra o fundo efetivamente composto. Para medir o fundo, a cor do texto foi tornada transparente somente na cópia temporária do navegador e os pixels sob sua caixa foram amostrados. Os mínimos foram 8,01:1, 5,02:1, 6,22:1 e 5,66:1 nas opções 1–4. Isso verifica os espaços reservados atuais; uma foto substituta exige nova medição. A exploração não fornece uma composição final de tela TV: a safe area de 40/32 em 1280×720 não foi medida como tela final, e a margem da ferramenta não foi tratada como margem do produto.

## Opção 1: Tag no canto

Mais perto de: bom (como nas referências ouro, uma imagem concentra a massa e o nome inicia um grupo curto de informação; não há a competição de controles e acentos do conjunto claustrofóbico).

Padrão de interação: nenhum — card informativo estático autorizado pelo brief; não há comportamento a classificar como padrão fora do catálogo.

Inventário: apenas repouso; nenhuma tecla age dentro do card. A pílula “Paredão” é uma tag de estado, sem contorno de controle, seta ou estado selecionado; nenhuma tecla a alcança. Não há outro elemento com aparência de controle. Menor fonte: 14px; nome 28px bold, valores 16px medium e unidades/emojis 14px medium. Quatro reações: 🐍 12, 💔 7, 🌱 5 e 🎯 3, em uma fileira informativa. Cor não neutra: emojis. Card 288×311,97px; foto 176px, 56,42% da altura; nome a 8px da foto, apoio a 16px do nome. O título fica inteiro em uma linha.

Justificativa observada: foto e nome juntos, com apoio secundário, atendem à identificação rápida; o espaço reservado confirma o arranjo, mas não demonstra ainda o calor de uma foto de participante.

| Nível | Elemento | Regra ou token | Valor documentado | Encontrado |
| --- | --- | --- | --- | --- |
| Note | Altura da foto | DESIGN §6.1; brief, “Foto em ~60% do card”; kit, Content Card | Imagem G = 320px; foto entre 55% e 65%; Content Card até 456px | A opção usa P = 176px e alcança 56,42%. Há conflito entre as exigências: G exigiria card de pelo menos 492,31px para ficar em até 65%. A proporção explica a redução, mas a escolha do degrau precisa de decisão do designer; não cabe exigir G mantendo todas as outras medidas. |
| Note | Relação entre nome e números de apoio | DESIGN §2.1, §3.1 e §3.7; playbook §10, kit vs playbook | Âncora pelo menos 2× o apoio; títulos até 28px; valores de apoio 16–18px | Nome 28px e valores 16px: 1,75×. Não existe combinação na escala que cumpra simultaneamente essas três prescrições para um nome como âncora. Reduzir os valores a 14px contraria §3.7; aumentar o nome ultrapassa §3.1. O designer decide qual regra ajustar. |

## Opção 2: Nome no véu

Mais perto de: bom (a imagem e o título sobre o scrim lembram o pôster ouro; há respiro e uma faixa secundária, embora a distância até os dados enfraqueça a unidade da ficha).

Padrão de interação: nenhum — card informativo estático autorizado pelo brief; não há comportamento fora do catálogo.

Inventário: apenas repouso; nenhuma tecla age dentro do card. A tag “Paredão” não é alcançável e não apresenta seta, contorno de foco ou aparência de seleção. Não há outro aparente controle. Menor fonte: 14px; nome 28px bold; idade, estalecas, emojis e contagens 14px medium. Quatro reações, em uma fileira. Cor não neutra: emojis. Card 288×345,59px; foto 224px, 64,81% da altura pela caixa fracionária; nome em uma linha. O fim da caixa do nome fica 24px acima da base da foto, seguido de 48px de padding antes dos dados: 72px até a primeira linha de apoio.

Justificativa observada: o nome sobre o véu aproxima identidade e imagem; o vão largo pretende reproduzir o vazio de referência. Essa intenção explica o espaço, mas o PNG mostra que ele também separa informações da mesma participante.

| Nível | Elemento | Regra ou token | Valor documentado | Encontrado |
| --- | --- | --- | --- | --- |
| Warning | Idade, saldo e contagens | DESIGN §3.7; `.text-body-md-*`, `.text-body-lg-*` | Valores de apoio em 16–18px, com rótulo menor | “27”, “3.250” e as quatro contagens usam `.text-body-sm-medium`, 14px; valores e unidades têm o mesmo tamanho. É desvio da hierarquia da faixa, não texto abaixo do piso de 14px. |
| Warning | Foto ajustada para 224px | DESIGN §6.1; `--dimension-size-semantic-content-card-image-*` | Degraus P/M/G = 176/264/320px | `--photo-h: 224px`, fora dos três degraus. `data-tuned` explica o advisory do script, mas não documenta uma decisão do designer autorizando a medida. |
| Note | Nome separado de idade e estalecas | DESIGN §7.1 e §7.5; playbook §3, proximidade; §10, desvio justificado | Dados da mesma pessoa próximos; intervalo entre grupos `xs` ou `sm` = 12 ou 16px | Há 72px entre nome e primeira linha de dados. A justificativa pede explicitamente “vão largo”; por isso o desvio fica como Note. No PNG, a faixa inferior se lê apartada da identidade. |
| Note | Advisory de padding do card | DESIGN §7.3; `--dimension-spacing-semantic-card-inset-expanded` | Content Card com inset de 32px | O contêiner tem padding 0 para a imagem sangrar; nome, tag e apoio têm recuo lateral de 32px, e o apoio termina a 32px da base. O advisory não demonstra ausência de respiro lateral no conteúdo visível. |
| Note | Receita G e proporção da foto | DESIGN §6.1; brief; kit, Content Card | G = 320px; foto até 65%; altura máxima 456px | O mesmo conflito geométrico da opção 1 impede satisfazer simultaneamente G, proporção e altura máxima. Isso não autoriza automaticamente o valor intermediário 224px apontado acima. |

## Opção 3: Coluna ao lado

Mais perto de: bom (uma única imagem e um grupo de identidade ainda organizam a leitura, sem múltiplos controles; a coluna estreita tem menos folga que a legenda das referências ouro, mas o conjunto não apresenta a disputa de massas do conjunto claustrofóbico).

Padrão de interação: nenhum — card informativo estático autorizado pelo brief; a coluna de dados e a grade de emojis não são navegação e não configuram conflito de eixo.

Inventário: apenas repouso; nenhuma tecla age dentro do card. “Paredão” é tag informativa sem controle alcançável; não há outros aparentes controles. Menor fonte: 12px, exclusivamente no rótulo “estalecas”; nome 28px bold, dados e contagens 14px medium, emojis 16px medium. Quatro reações em uma grade informativa 2×2. Cor não neutra: emojis. Card 288×284,44px; foto com 160px de largura, 55,56% do card; coluna de texto com 100px úteis. O nome quebra em “Camila” / “Duarte”, sem palavra funcional órfã.

Justificativa observada: a estrutura horizontal foi pedida como reinterpretação, para reconhecer rosto e nome lado a lado. Isso justifica a posição lateral da imagem; não justifica reduzir o inset direito do Content Card. `data-surface="own"` desliga parte da verificação automática, mas o brief continua exigindo a mesma superfície do kit.

| Nível | Elemento | Regra ou token | Valor documentado | Encontrado |
| --- | --- | --- | --- | --- |
| Warning | Margem direita da coluna | DESIGN §7.3; `--dimension-spacing-semantic-card-inset-expanded` | Inset do Content Card = 32px | `--pad-right: var(--dimension-spacing-core-sm)` = 16px, contra 32px acima e abaixo. O `data-surface="own"` não transforma o Content Card solicitado em outra superfície aprovada. |
| Warning | Idade, saldo e contagens | DESIGN §3.7; `.text-body-md-*`, `.text-body-lg-*` | Valores de apoio em 16–18px | “27”, “3.250” e as contagens usam 14px. A faixa perde legibilidade de valor; o problema não é o rótulo secundário de 12px. |
| Warning | Proporção da tag na foto | Brief, “Tag de estado na foto”; DESIGN §2.0 e §2.6 | Tag de até aproximadamente 1/3 da largura da foto | Tag de 78,33px em foto de 160px: 48,96% da largura. No PNG, ela atravessa quase metade da imagem; a adaptação lateral não preserva a pequena escala relativa pedida para a tag. |
| Note | Rótulo “estalecas” | DESIGN §3.3; `.text-footnote-medium` | 12px permitido apenas para rótulo secundário sem decisão | O rótulo usa 12px e apenas nomeia o saldo de 14px. Não há decisão ou controle associado: não é Critical. |
| Note | Foto lateral | DESIGN §6.1; brief, distância da opção 3; playbook §10 | Receita geral com imagem no topo; reinterpretação explicitamente lateral no brief | A foto ocupa 55,56% da largura, ao lado do nome. Desvio autorizado pela direção desta opção, sem interação vertical inventada. |

## Opção 4: Emojis como segunda massa

Mais perto de: bom (a imagem continua sendo a maior massa e o nome permanece a principal linha textual, como nas referências ouro; os emojis ampliam a atenção secundária, mas ainda há espaço entre os grupos e nenhum conjunto de controles concorrentes).

Padrão de interação: nenhum — card informativo estático autorizado pelo brief; não há comportamento fora do catálogo.

Inventário: apenas repouso; nenhuma tecla age dentro do card. Tag sem foco ou aparência de seleção; as quatro reações não têm caixa, contorno ou indicação de ação, e nenhuma tecla as alcança. Menor fonte: 14px; nome e emojis 28px, contagens 14px bold, idade e estalecas 14px medium. Quatro reações em grade informativa 2×2. Cores não neutras: ilustração e emojis. Card 288×387,98px; foto 224px, 57,73% da altura. Nome em uma linha; primeira linha de dados a 32px do fim da caixa do nome.

Justificativa observada: o contraponto do brief pede expressamente uma segunda massa de emojis para testar a energia de reality show. O PNG demonstra esse efeito; a ilustração e o nome ainda permitem reconhecer o foco principal. Esse experimento não transforma os emojis em escolhas do controle remoto.

| Nível | Elemento | Regra ou token | Valor documentado | Encontrado |
| --- | --- | --- | --- | --- |
| Warning | Idade, saldo e contagens | DESIGN §3.7; `.text-body-md-*`, `.text-body-lg-*` | Valores de apoio em 16–18px | Idade e saldo têm 14px medium; as quatro contagens têm 14px bold. O peso maior das contagens não substitui o tamanho de leitura do valor. |
| Warning | Foto de 224px | DESIGN §6.1; `--dimension-size-semantic-content-card-image-*` | Degraus P/M/G = 176/264/320px | `--photo-h: 224px` é uma medida própria. O script de tokens não a cita nesta opção, mas ela também está fora dos degraus documentados. |
| Warning | Nome e dados da participante | DESIGN §7.1 e §7.5; playbook §3, dados relacionados juntos | Entre grupos, `xs` ou `sm` = 12 ou 16px; nome, idade e saldo como um grupo | O nome termina 16px antes da base da foto e o apoio começa 16px depois: vão total de 32px. No PNG, idade e saldo viram uma faixa separada, embora o brief desta opção os coloque na faixa do nome. |
| Note | Segunda massa de emojis | DESIGN §2.0; playbook §3 e §10, desvio justificado | Um grupo focal; apoio recuado | Os emojis têm 28px, como o nome, e as contagens usam texto primário bold. O desvio é o contraponto explicitamente solicitado; a imagem de 57,73% e o nome ainda sustentam a identidade como primeiro grupo. |
| Note | Receita G e proporção da foto | DESIGN §6.1; brief; kit, Content Card | G = 320px; foto até 65%; altura máxima 456px | Repete-se o conflito geométrico da opção 1. A necessidade de conciliar as regras fica para o designer; não equivale a aprovação do degrau próprio de 224px. |

## Resumo

Nenhuma opção contém Critical nesta inspeção. Maior nível por opção: 1 — Note; 2 — Warning; 3 — Warning; 4 — Warning. Todas estão mais perto do conjunto bom, pelas razões registradas em cada seção. Sem ranking ou escolha; conforme playbook §2.4 e §10, este relatório apenas aponta os desvios.
