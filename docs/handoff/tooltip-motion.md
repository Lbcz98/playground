# Tooltip "Entrar na conta"

Spec for an implementation agent. Copy these values. The course page `docs/handoff/tooltip-motion.html` is a demo of this file.

Source of truth:

- Motion: `web/protos/lucas/components/MenuComTooltip.tsx`
- Phase: `web/protos/lucas/components/tooltipLogin.ts`

Done when the entrance, the exit, the 1000 ms wait, and the phase table below match a screen recording of the home.

## Place

Anchor is the login `round-button`, 88 × 88, centered on the visible 72 circle (8 px inset).

Pill center, on that anchor:

```
x = 44
y = 88 - (88 + 72) / 2 - 8 - 8 - 4 - 33 / 2 = -28.5
```

| Piece | Element | Rest |
| --- | --- | --- |
| Travel | `.mpt-pillpath` | 0 × 0 point. `translate(44px, -28.5px)` moves the pill. |
| Pill | `.mpt-tooltip` | 124 × 33. Own `translate(-50%, -50%)` centers it on the point. Radius 16.5. Fill `#3F3F3F`. |
| Dot | `.mpt-dot` | 8 × 8. Bottom edge on the anchor top. `left: 50%` and `translate(-50%, 0)`. Same fill. |
| Veil | `.mpt-veu-pilula`, `.mpt-veu-ponto` | `#fff` at opacity 0.2, on the pill and the dot. |
| Word | `.mpt-tip-text` | `Entrar na conta`. 14 px, weight 500, letter-spacing −0.01em, line-height 1.2. |

Gap: pill bottom to anchor top is 12 px. Pill bottom to dot top is 4 px.

## Curve

Every timed property uses `cubic-bezier(0.25, 0.1, 0.25, 1)` (CSS `ease`).

Time starts when `data-tip` becomes `on`.

## Entrance

| Layer | Delay | Duration | From | To |
| --- | --- | --- | --- | --- |
| Dot `.mpt-dot` | 0 | 280 ms | opacity 0, blur 2 px, y +8, scale 1 | 55% (154 ms): opacity 1, blur 0, y 0, scale(1.05, 1.18). 100%: scale 1 |
| Pill travel `.mpt-pillpath` | 140 ms | 350 ms | opacity 0, blur 2 px, y +8 | opacity 1, blur 0, y 0. Arrives at 490 ms |
| Pill shape `.mpt-tooltip` | 140 ms | 300 ms | `scale(0.0798, 0.3)`, elliptical radius `62 / 16.5` | `scale(1, 1)`, radius 16.5. Done at 440 ms |
| Pop `.mpt-squash` | 140 ms | 600 ms | scale 1 | 60% (500 ms): scale(1.07, 0.95). Back to 1 at 740 ms |
| Word `.mpt-tip-text` | 410 ms | 100 ms | opacity 0, y +4 | opacity 1, y 0. Done at 510 ms |

Shape scale `0.0798 = 0.3 × 0.266` (`--grow-d` × `--pill-ratio`). Word delay is `140 + 300 × 0.9`. The pop is a scale on the wrapper, so it runs after the shape is already full. Keyframes: `mpt-dot-sobe`, `mpt-crescer`, `mpt-pico`, `mpt-texto-entra`. One `transform` per keyframe. Elliptical radius uses the slash form: `border-radius: calc(var(--pill-h) / 2 / var(--pill-ratio)) / calc(var(--pill-h) / 2)`.

## Exit

`data-tip=off`. Paint the on pose for two frames first, then switch, or the browser has no from-state and the shrink does not run.

| Layer | Delay | Duration | End |
| --- | --- | --- | --- |
| Word | 0 | 100 ms | opacity 0, y +4 |
| Pill shape | 0 | 200 ms | small circle `scale(0.0798, 0.3)`, y +10, `forwards` |
| Pill travel | 0 | 200 ms | opacity 0, blur 2 px, y +8 |
| Dot | 80 ms | 280 ms | opacity 0, blur 2 px, y +8 |

The shape's +10 px and the parent's +8 px add. The pill falls 18 px and is gone at 200 ms. The dot finishes at 360 ms. Keyframes: `mpt-encolher`, `mpt-texto-sai`. The dot exit is the base transition, not a keyframe.

## When it plays

`ESPERA_HOME = 1000`. `marcaHome()` stores the first home time and ignores later calls. `atrasoEntrada()` is `max(0, 1000 - elapsed)`.

Right items: `program`, `channel-bug`. Left items: `login`, `schedule`, `miscellaneous`.

| Moment | Wait | Plays |
| --- | --- | --- |
| First home, focus on the right | 1000 ms minus time already spent | Full entrance |
| Back to the right after it shrank | 0 | Full entrance |
| Still on the right, entrance already finished | none | Hold. No replay |
| Left before the 1000 ms is up | the original start stays | Nothing. The remaining time waits |

Phase lives outside the screen (`tooltipLogin.ts`). A remount does not reset it.

| Phase | Meaning | Next right focus | Next left focus |
| --- | --- | --- | --- |
| `novo` | Entrance has not started | Wait out the rest of the 1000 ms, then play | Stay `novo`. Clear the pending play. Keep the original start |
| `visivel` | Pill is on screen, or the entrance just started | If 900 ms have passed since play started, hold. Otherwise the play continues | Go to `feito` and play the shrink |
| `feito` | It shrank on the left | Play the entrance now. Ignore the 1000 ms | Stay `feito` |

`entrouTooltip()` at 900 ms sets the lock. The pop settles at 740 ms. The lock is longer so a remount during the settle does not restart the gesture. Once locked, a new home on the right paints the pill at rest (`data-snap`, animations forced off).

`abreTooltip()`: from `feito`, clear the lock, set `visivel`, return true (replay now). From `novo`, call `marcaHome()`, return true, leave the phase `novo` until `mostraTooltip()` (so the 1000 ms survives a remount). Otherwise return `!jaEntrou`.

`irParaEsquerda()` sets `feito` only when the phase was `visivel`. Leaving before the entrance keeps `novo`.

## Properties

On `.mpt-raiz`:

| Property | Value |
| --- | --- |
| `--tip-in-dur` / `--tip-in-ease` | 350 ms, ease |
| `--pill-delay` | 140 ms |
| `--tip-travel` / `--tip-blur` | 8 px, 2 px |
| `--dot-dur` | 280 ms. Peak scale 1.05 × 1.18 at 55% |
| `--grow-dur` / `--grow-d` / `--pill-ratio` | 300 ms, from scale(0.0798, 0.3) |
| `--pop-dur` / `--pop-x` / `--pop-y` | 600 ms, 1.07 × 0.95 at 60% |
| `--text-dur` / `--text-travel` | 100 ms, 4 px, delay 410 ms |
| `--tip-out-dur` / `--exit-travel` | 200 ms, +10 px on the pill |
| `--dot-out-delay` | 80 ms |
| `--pill-w` / `--pill-h` | 124 × 33 |

Declared and unread: `--squash-dur` 400 ms, `--squash-ease`, `--stretch-x`, `--stretch-y`, `--squash-x`, `--squash-y`, `--squash-peak` 35, `--squash-land` 80. The pop that ships is `mpt-pico`.

## Constraints

Chrome 68. One `transform` function list per keyframe. No `@property`, no separate `translate` / `scale` properties, no `color-mix`, `:is`, `:where`, `:has`, `inset`, `gap` on flex, `aspect-ratio`, `clamp`.

Reduced motion (`prefers-reduced-motion: reduce` and `data-reduced`): drop translate, blur, scale, and the pop. The dot and the pill still fade, dot at once, pill at 140 ms. The word rides the pill fade. The 1000 ms wait stays.

The profile button gains no badge. The pill shrinks. It does not morph into a seal.
