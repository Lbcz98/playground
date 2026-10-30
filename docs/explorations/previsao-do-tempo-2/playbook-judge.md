# Juiz: previsao-do-tempo-2

Fatos medidos:
- `check-explore-tokens.mjs`: ok (só avisos: larguras e alturas em px perto de tokens do kit, como 184px perto de `content-card-image-p` 176px, 152px, 256px, 200px, 120px; tamanhos exatos de kit escritos em px: 20px = `icon-md`, 24px, 72px, 88px, 208px).
- `check-explore-layout.mjs`: ok (itens, anel, cortado, eixo e svg sem falha). Capturas lidas: Enter na opção 1, 2 e 3, e → na opção 4.

## Opção 1: Trilho sob o número
Mais perto de: bom (um só número no canto, o vazio embaixo dele é a maior área do card, o trilho de 4 dias é a única peça de ação e o resto fica quieto).
Padrão de interação: Trilho de passos (←/→ move o dia; Enter troca a frase por sensação e umidade).
| Nível | Elemento | Regra ou token | Valor documentado | Encontrado |
| --- | --- | --- | --- | --- |
| Warning | Número `.o1-temp` | DESIGN §2.1 (âncora com pelo menos 3x o texto de apoio, para número curto) | 3x de 14px = 42px | `text-heading-3-bold`, 28px, 2x do `text-body-sm-medium` (14px). O maior estilo bold que achei na tabela do kit é 28px: se não há maior, é "kit vs playbook" e o designer decide. |
| Note | Dia `.o1-day`, ícone de 20px | DESIGN §9.5, `--dimension-size-semantic-icon-md` | 1px `--gradient-semantic-border-default` em repouso | Cumpre: contorno em `::before` em repouso, anel em `::after` no escolhido. Sem achado; registrado só porque o escolhido é ao mesmo tempo foco e seleção (casa invertida com anel), o que o DESIGN §9.2 aceita. |

## Opção 2: Curva do dia
Mais perto de: bom (número e local no canto, um gráfico só, legenda em uma fileira; há ar entre os três grupos).
Padrão de interação: Alternar visão (←/→ percorre as 4 horas; Enter troca curva e barras; Voltar desfaz).
| Nível | Elemento | Regra ou token | Valor documentado | Encontrado |
| --- | --- | --- | --- | --- |
| Critical | `.o2-views` ("curva • barras") | Judge, severidade: texto que carrega uma decisão com menos de 14px; DESIGN §3.3 | `.text-body-sm-*` (14px) ou maior | `.text-footnote-medium` (12px). Diz qual visão está ativa e o que o Enter troca. Token conforme existe: `.text-body-sm-medium`. |
| Warning | Legenda `.o2-legend` ("média", "sensação", "umidade") | DESIGN §3.6 (rótulo que precisa de legenda falhou), §2.0 (um grupo focal, o resto quieto) | cada item de legenda corresponde a uma marca no gráfico | Só "média" tem marca (linha tracejada com amostra). "sensação" e "umidade" não aparecem no gráfico e levam o nome de legenda; leem como três dados soltos sob o gráfico. |
| Warning | Ícone `.o2-icon` (máscara PNG) | DESIGN §4.1 e §12.1 (um só acento; o resto neutro); brief ("evitar ícone genérico de app de clima") | ícone no token `text-primary` (#EEEEEE) | O PNG de origem é a nuvem azul com sol laranja, a mesma de app de clima. Não medi a cor final do render (a máscara deveria deixá-lo em `text-primary`); o render lido mostra o sol amarelado: conferir. |
| Warning | Número `.text-heading-3-bold` | DESIGN §2.1 | 3x o apoio | 28px = 2x o apoio de 14px (mesmo caso da opção 1). |
| Note | Título "Hoje", eixo (09h, 13h, 17h, 21h), rótulos da legenda | DESIGN §3.3 | `.text-footnote-*` (12px) só em rótulo secundário que não carrega decisão | 12px. O eixo também diz onde o foco está; se o designer quiser lê-lo à distância, sobe para 14px. |
| Note | Gráfico (`.o2-col`) | DESIGN §9.5 / rodada 7 | em gráfico, a célula só mapeia o foco; a marca que reage é o sinal | Cumpre: ponto de 8 para 12px e barra de 20% para 70% de opacidade. Sem achado. |
| Note | Alturas e larguras do gráfico (112px, 224px, 8px e 12px nos pontos, 20px na barra) | kit, tamanhos em token | `--dimension-*` | px soltos; não há token que case exatamente. |

## Opção 3: Linhas que se abrem
Mais perto de: claustrofóbico quando a linha está aberta (cinco grupos empilhados: ícone, local e número, trilho de 3 botões, frase, série de 4 barras; cada grupo a 16px do outro e sem área livre). Fechada, o card é arejado.
Padrão de interação: Expandir no lugar (←/→ move entre Sensação, Umidade e Média; Enter abre e fecha; Voltar recolhe).
| Nível | Elemento | Regra ou token | Valor documentado | Encontrado |
| --- | --- | --- | --- | --- |
| Warning | Ícone `.o3-icon` (`assets/o3-clima.png`) | DESIGN §4.1 e §12.1; §6.4; brief | um acento, o resto neutro | PNG colorido (nuvem azul, sol laranja), sem máscara nem token: duas matizes fora do kit e o ícone que o brief mandou evitar. |
| Warning | Card aberto | DESIGN §7.3 (respiro é o critério que mais separa), §2.0; playbook seção 4, item 4 | um grupo focal e uma faixa quieta | Aberto, o detalhe (frase + série com 4 pontos, valores e rótulos) compete com o número e o ícone: mais peças que o card irmão de referência. |
| Warning | Número `.o3-temp` | DESIGN §2.1 | 3x o apoio | 28px = 2x o apoio de 14px. |
| Note | Disclosure | Judge, passo 4 (aparência de disclosure) | sem seta ou cheiro de dropdown | Sem seta, bom. Mas o detalhe abre num bloco abaixo do trilho; a peça focada não cresce, como o catálogo descreve ("a peça cresce"). A linha aberta só ganha o tom `background-tint`. Leitura próxima de abas com painel. |
| Note | Rótulos de série "12h", "15h", "18h", "21h" | DESIGN §3.3 | 12px só em rótulo secundário | 12px; os valores de decisão ficam em 14px. Permitido. |
| Note | Linha aberta | DESIGN §9.1 e §9.2 | um foco só; selecionado marcado de outro jeito | Cumpre: aberta e focada são estados diferentes (tom e anel). |

## Opção 4: Paisagem por segmento
Mais perto de: bom (uma imagem grande como isca no alto, informação embaixo, seletor no fim; o espaço vazio da paisagem é o que o card tem de mais perto do selo de referência).
Padrão de interação: Seletor segmentado (←/→ troca na hora; Enter não faz nada).
| Nível | Elemento | Regra ou token | Valor documentado | Encontrado |
| --- | --- | --- | --- | --- |
| Warning | `.o4-summary` do segmento Hoje ("Média do dia, com mínima de 18° / e máxima de 27°.") | DESIGN §3.5 e playbook seção 3 (a quebra cai depois da palavra de função, nunca antes) | a linha 2 não começa em conjunção | A segunda linha começa em "e". `text-wrap: pretty` não evitou. |
| Warning | Número `.o4-temp` | DESIGN §2.1 | 3x o apoio | 28px = 2x o apoio de 14px. |
| Warning | Paisagem do segmento Hoje | brief ("ícones comunicando visualmente o clima"); DESIGN §12.10 (dado decorativo ligado à intenção) | o gráfico comunica clima | Um arco fino com um disco cinza não diz que tempo faz; só o contexto ("Média do dia") explica. Agora e Semana têm nuvem; Hoje é a mais pobre das três. |
| Note | `.o4-stage` height 184px | DESIGN §6.1 (passos P 176px, M 264px, G 320px), aviso do script | token `content-card-image-p` (176px) | 184px, perto de P. O designer decide se é de propósito. |
| Note | Voltar | `--teclas` (Voltar desfaz a última ação e volta à primeira visão) | volta ao primeiro segmento | O handler não trata Esc/Backspace; em "Semana" o Voltar sai do card em vez de voltar a "Agora". |
| Note | Escolhido e foco | DESIGN §9.5 (seletor segmentado não leva contorno em repouso) | sem contorno em repouso | Cumpre; o escolhido é invertido com anel. |

## Resumo
- Opção 2 carrega um Critical: o rótulo "curva • barras" a 12px, token conforme `.text-body-sm-medium` (14px).
- Opções 1, 3 e 4 não carregam Critical. As quatro têm o número a 2x do apoio (28px contra 14px) onde o DESIGN §2.1 pede 3x; as opções 2 e 3 trazem o ícone de nuvem e sol colorido; a opção 3 aberta fica mais perto do claustrofóbico que as outras.
