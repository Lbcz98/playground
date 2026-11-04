# Juiz: tooltip-perfil-login

Fatos medidos:
- `check-explore-tokens.mjs`: violações apenas em opções fora do escopo desta rodada (opções 2 e 3); advisory em opção 1: `.scene` 272 px (próximo a `content-card-image-m` 264 px) e `.main-menu` 80 px (próximo a `alert-bug-mark` 82 px); nenhum advisory nem violação em opção 4.
- `check-explore-layout.mjs`: ok

## Opção 1: Fiel: rótulo no eixo
Mais perto de: bom — pílula única centrada no eixo do avatar, texto como única peça, cena simples com respiro generoso acima da barra; sem elementos secundários que disputem o ponto focal.
Padrão de interação: fora do catálogo (brief declara ausência de padrão no catálogo).

| Nível | Elemento | Regra ou token | Valor documentado | Encontrado |
| --- | --- | --- | --- | --- |
| Nota (kit vs playbook) | `.tooltip` — animação | Kit não tem token para duração de 200 ms nem para `blur` de entrada; brief registra a ausência explicitamente | `motion.semantic.easing` 800 ms mola de sistema | `200ms ease`, `filter: blur(2px)` — pedido explícito do designer; valores literais declarados no brief |
| Nota | `.scene` — altura | `check-explore-tokens` advisory: medida próxima a `content-card-image-m` | `--dimension-size-semantic-content-card-image-m` = 264 px | 272 px — a caixa é a tela da Home, não um `content-card-image`; valor intencional |
| Nota | `.main-menu` — altura | `check-explore-tokens` advisory: medida próxima a `alert-bug-mark` | `--dimension-size-semantic-alert-bug-mark` = 82 px | 80 px — a caixa é a barra do menu, não um `alert-bug-mark`; valor intencional |

## Opção 4: Contraponto: dois degraus
Mais perto de: bom — pílula única centrada no eixo do avatar, superfície dois degraus distingue a forma sem contorno nem brilho, mas o contexto mais rico (textos de programa e clima em `text-body-lg-bold`) enfraquece a hierarquia tipográfica do ponto focal.
Padrão de interação: fora do catálogo (brief declara ausência de padrão no catálogo).

| Nível | Elemento | Regra ou token | Valor documentado | Encontrado |
| --- | --- | --- | --- | --- |
| Aviso | `.o4-tooltip` texto vs contexto | `focal-point.md`: ponto focal separado por ≥ 3 alavancas, lido primeiro | Foco = "Faça o login"; `.text-body-sm-medium` | `.o4-misc-text` ("Previsão do tempo") e `.o4-program-text` ("Copa do Mundo…") usam `.text-body-lg-bold` — escala e peso maiores que o ponto focal; a pílula depende exclusivamente de forma e posição para ser lida primeiro; a escala tipográfica trabalha contra o Foco |
| Nota (kit vs playbook) | `.o4-tooltip` — superfície | `elevation.md`: gradiente fora da lista permitida; kit não tem superfície dois degraus acima | `--color-semantic-functional-background-elevated` (um degrau) | `linear-gradient(var(--color-opacity-light-20), var(--color-opacity-light-20)), var(--color-semantic-functional-background-elevated)` — tese explicitamente justificada no brief como "contraponto"; ambos os valores são tokens do kit; kit vs playbook |
| Nota (kit vs playbook) | `.o4-tooltip` — animação | Kit não tem token para duração de 200 ms nem para `blur` de entrada | `motion.semantic.easing` 800 ms mola de sistema | `200ms ease`, `filter: blur(2px)` — mesmo caso das outras opções; declarado no brief |

---

*Segunda leva — opções 6 e 8 (variações da opção 4; ponto entre pílula e botão é pedido literal do designer)*

Fatos medidos (segunda leva):
- `check-explore-tokens.mjs`: nenhum advisory nem violação novo em opções 6 e 8.
- `check-explore-layout.mjs`: ok

## Opção 6: Texto um degrau maior
Mais perto de: bom — pílula com texto um degrau maior (`text-body-md-medium`) reduz a inversão tipográfica em relação à opção 4; ponto confirma a âncora visual; o gap hierárquico persiste mas é menor.
Padrão de interação: fora do catálogo (brief declara ausência de padrão no catálogo).

| Nível | Elemento | Regra ou token | Valor documentado | Encontrado |
| --- | --- | --- | --- | --- |
| Aviso | `.o6-tooltip` hierarquia tipográfica | `focal-point.md`: ponto focal separado por ≥ 3 alavancas, lido primeiro | Foco = "Faça o login"; máximo permitido pelo brief = `.text-body-md-*` | Contexto usa `.text-body-lg-bold` ("Previsão do tempo", "Copa do Mundo…"); tooltip em `.text-body-md-medium` reduz o gap da opção 4 (sm→md) mas escala ainda trabalha contra o Foco |
| Nota | `.o6-dot` | `surfaces.md` / `principles.md`: pedido literal do designer; 4 px até a pílula, 8 px até o círculo de 72 px | `--dimension-spacing-core-2xs` = 8 px (largura e altura); vãos confirmados no cálculo do `bottom` | Superfície dois degraus (mesmo gradiente da pílula); animação sincronizada; `aria-hidden="true"`; sem role interativo |
| Nota (kit vs playbook) | `.o6-tooltip` — superfície | `elevation.md`: gradiente fora da lista permitida; kit sem token para dois degraus acima | `--color-semantic-functional-background-elevated` | `linear-gradient(var(--color-opacity-light-20), var(--color-opacity-light-20)), var(--color-semantic-functional-background-elevated)` — mesma construção da opção 4; tese justificada; tokens do kit |
| Nota (kit vs playbook) | `.o6-tooltip` — animação | Kit não tem token para `200ms ease` nem `blur(2px)` de entrada | `motion.semantic.easing` 800 ms mola de sistema | `200ms ease`, `filter: blur(2px)` — mesma situação das outras opções; declarado no brief |

## Opção 8: Ponto mais apagado
Mais perto de: bom — pílula dois degraus, ponto um degrau recuando em relação à pílula; hierarquia tipográfica idêntica à opção 4; ícones de Schedule e Misc quebrados (regressão em relação à opção 4).
Padrão de interação: fora do catálogo (brief declara ausência de padrão no catálogo).

| Nível | Elemento | Regra ou token | Valor documentado | Encontrado |
| --- | --- | --- | --- | --- |
| Aviso | `.o8-btn[schedule]`, `.o8-btn[misc]` — ícones | `data-card.md`: gráfico ilegível é Warning | Ícones PNG carregados com caminho relativo; opção 4 usa base64 e renderiza corretamente | `src="../assets/schedule.png"` e `src="../assets/weather.png"` não resolvem a partir de `docs/explorations/tooltip-perfil-login/index.html` (caminho correto: `assets/`); ícones aparecem quebrados no PNG — regressão visual em relação à opção 4 |
| Aviso | `.o8-tooltip` hierarquia tipográfica | `focal-point.md`: ponto focal separado por ≥ 3 alavancas, lido primeiro | Foco = "Faça o login"; `.text-body-sm-medium` | `.o8-misc-text` e `.o8-program-text` usam `.text-body-lg-bold` — mesmo achado da opção 4; a pílula depende de forma e posição para ser lida primeiro |
| Nota | `.o8-dot` | `surfaces.md` / `principles.md`: pedido literal do designer; ponto um degrau recede em relação à pílula dois degraus | `--color-semantic-functional-background-elevated` (sem overlay) | Superfície um degrau; 4 px até a pílula, 8 px até o círculo de 72 px; `aria-hidden="true"`; sem role interativo; tokens do kit |
| Nota (kit vs playbook) | `.o8-tooltip` — superfície | `elevation.md`: gradiente fora da lista permitida; kit sem token para dois degraus acima | `--color-semantic-functional-background-elevated` | `linear-gradient(var(--color-opacity-light-20), …), background-elevated` — mesma construção da opção 4 |
| Nota (kit vs playbook) | `.o8-tooltip` — animação | Kit não tem token para `200ms ease` nem `blur(2px)` de entrada | `motion.semantic.easing` 800 ms mola de sistema | `200ms ease`, `filter: blur(2px)` — mesma situação das outras opções; declarado no brief |

## Resumo
Opção 1: sem Críticos nem Avisos; todos os achados são Notas por desvios justificados no brief (kit vs playbook).
Opção 4: um Aviso de hierarquia tipográfica (texto do ponto focal usa corpo e peso menores que os textos de contexto); desvios de superfície e animação são Notas, justificados no brief.
Opção 6: um Aviso de hierarquia tipográfica (corpo md-medium vs contexto lg-bold; gap reduzido em relação à opção 4); demais achados são Notas.
Opção 8: dois Avisos — caminho de ícone quebrado (`../assets/` não resolve, regressão em relação à opção 4) e hierarquia tipográfica (mesmo achado da opção 4); demais achados são Notas.
