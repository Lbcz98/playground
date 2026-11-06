# Opção 3 - Duas leituras do dia

> 1 value(s) on the stage are not applied to the option yet ("Aplicar valores"); this file uses the stage values.

## Properties

### Superfície (`data-part="card"`)

| Property | CSS variable | Value | Original | Token | Range |
| --- | --- | --- | --- | --- | --- |
| Raio | `--o3-radius` | 15px | 40px | `--dimension-radius-semantic-content-card` | 0–64px, step 1 |
| Respiro | `--o3-inset` | 32px | 32px | `--dimension-spacing-semantic-card-inset-expanded` | 0–48px, step 1 |
| Fundo | `--o3-bg` | #3f3f3f | #3f3f3f | `--color-semantic-functional-background-elevated` | - |
| Vão entre grupos | `--o3-group-gap` | 16px | 16px | `--dimension-spacing-core-sm` | 0–40px, step 1 |
| Vão no grupo | `--o3-inner-gap` | 4px | 4px | `--dimension-spacing-core-3xs` | 0–16px, step 1 |

### Resumo (`data-part="resumo"`)

| Property | CSS variable | Value | Original | Token | Range |
| --- | --- | --- | --- | --- | --- |
| Cor da âncora | `--o3-anchor-color` | #eeeeee | #eeeeee | `--color-semantic-functional-text-primary` | - |

### Gráfico (`data-part="grafico"`)

| Property | CSS variable | Value | Original | Token | Range |
| --- | --- | --- | --- | --- | --- |
| Altura | `--o3-chart-height` | 96px | 96px | - | 48–160px, step 4 |
| Vão entre horas | `--o3-col-gap` | 8px | 8px | `--dimension-spacing-core-2xs` | 0–24px, step 1 |
| Raio da barra | `--o3-bar-radius` | 4px | 4px | `--dimension-radius-core-xs` | 0–16px, step 1 |
| Raio da casa | `--o3-cell-radius` | 8px | 8px | `--dimension-radius-core-sm` | 0–16px, step 1 |
| Barra em foco | `--o3-bar-active` | #eeeeee | #eeeeee | `--color-semantic-functional-text-primary` | - |

### Agora (`data-part="agora"`)

| Property | CSS variable | Value | Original | Token | Range |
| --- | --- | --- | --- | --- | --- |
| Ponto | `--o3-dot` | 4px | 4px | - | 2–12px, step 1 |

### Movimento

| Property | CSS variable | Value | Original | Token | Range |
| --- | --- | --- | --- | --- | --- |
| Troca de foco e visão | `--o3-dur, --o3-ease` | 150ms, cubic-bezier(0.2, 0, 0, 1) | - | - | - |

## States

The option reads its state from `data-state` on its root. Resting state: `barras`.

- `barras`
- `numeros`

## Keys

TV remote model inside the card (source: `node scripts/explore-ref.mjs --teclas`): ←/→ move the one focus without wrapping, Enter acts on the focused piece, Back (Esc / Backspace) undoes the last action and, at the initial state, leaves the card; ↑/↓ leave the card and are never handled inside it.

- **Controle:** interativo. ←/→ move entre os itens (dias ou horas), Enter abre/alterna o detalhe, Voltar desfaz; ↑/↓ passam para a tela.

## Motion

- Movimento › Troca de foco e visão: 150ms, cubic-bezier(0.2, 0, 0, 1)
- With `prefers-reduced-motion: reduce`, slides and scales become an opacity crossfade and the focus ring stays.

## Token candidates

Values that are not a kit token (moved off their token, or a free literal in the design):

- Superfície › Raio: 15px (was `--dimension-radius-semantic-content-card`)
- Gráfico › Altura: 96px
- Agora › Ponto: 4px
- Movimento › Troca de foco e visão: 150ms, cubic-bezier(0.2, 0, 0, 1)
