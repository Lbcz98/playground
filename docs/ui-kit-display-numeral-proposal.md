# Proposal: a display step for the focal numeral

Status: proposal, nothing implemented. Decision needed from the design-system owner before `tokens/tokens.json` changes.

## Why

The explorations are held back by one gap: the kit's largest text style is `.text-heading-3-bold` (28 px). In the 12 weather references the designer brought, the temperature is the card's architecture: its digits are 10% to 25% of the card height (median near 14%). On a 288 × 400 card that is 40 to 100 px. Our options reach 4.7% to 6.6% of the card height, so none of them can match the references however well the rest is composed.

Today agents work around it with `calc(var(--typography-font-size-3xl) * 2.5)`. That passes the token check, but it is a size outside the kit, invented per option (56, 70 and 84 px appeared in one round), so two options never share a scale.

## What to add

Two font sizes and two text styles, nothing else. Line height and letter spacing reuse tokens that exist.

| New token | Value |
|---|---|
| `typography.fontSize.4xl` | 56px |
| `typography.fontSize.5xl` | 72px |

| New style (class) | Size | Weights | Line height | Letter spacing |
|---|---|---|---|---|
| `.text-display-md-{regular,medium,bold}` | 4xl (56) | 400, 500, 700 | `tight` (1.1) | `tighter` (-0.02em) |
| `.text-display-lg-{regular,medium,bold}` | 5xl (72) | 400, 500, 700 | `tight` (1.1) | `tighter` (-0.02em) |

In `tokens/tokens.json` they sit next to `heading-3` as `typography.display-md` and `typography.display-lg`, each with `regular`, `medium` and `bold`, the same shape as `heading-3.bold`. Then `npm run tokens:build` regenerates the CSS and `web/protos/generated/explore-tokens.md`; `npm run tokens:check` confirms.

Why two and not one: 56 px fits four characters on a 224 px content width (`+23°C` is out of range at 72 px), 72 px is the monumental case with three characters (`24°`). Why no `display-sm`: `heading-3` at 28 px already covers it. Why regular is included: display type at 72 px in bold is heavy against the calm references; the designer's references favour regular or medium at this scale. The kit still keeps its three weights (`DESIGN.md` §3.2), and extra-bold stays banned.

## Rules to write with it

1. **Numerals only.** A display style carries one focal number (and its unit), never a title or a sentence. At most one display text per card.
2. **Length.** `display-lg` for up to three characters (`24°`), `display-md` for up to five (`+23°C`). Longer text is not display.
3. **Always `font-variant-numeric: tabular-nums`**, as `DESIGN.md` §3.4 already asks of changing numbers.
4. **The degree sign.** `DESIGN.md` §2.3 puts the unit on the value's baseline at half its size. For the symbol `°` the references raise it to the top of the digits (cap height) at roughly half the size, so the exception reads: *the degree sign is top-aligned at about half the size; every other unit (mph, %, km/h) stays on the baseline.*
5. **The ratio rule** (`conceitos/ancora-e-apoio`) is met by construction: 72 px against 14 px support text is 5×, and 56 px is 4×. The 2× floor stays for the kit's other cards.

## Where it lands (when approved)

- `tokens/tokens.json`: the two sizes and the two style groups. Regenerate with `npm run tokens:build`.
- `design-brain/DESIGN.md`: §2.1 (the anchor can be display), §2.3 (the degree-sign exception), §3 (the new steps in the ladder).
- `design-brain/references/conceitos/ancora-e-apoio.md` and `ponto-focal.md`: `uso` gets "Âncora: `.text-display-lg-*` for a focal numeral".
- `scripts/check-explore-tokens.mjs`: no change needed; the new sizes are kit tokens. A `calc(... * N)` on the font size should become an advisory pointing to the display step.
- `src/` Text variants: only if the kit components should use it (not needed for explorations).

## What this does not solve

The references also ask for things the kit lacks and that are separate decisions: weather colours (the "dia" gradient is green; there is no rain, overcast or fog colour), photographic or illustrated sky by condition, blur and glass. They are listed in `docs/explorations/foco-clima-2/direcao-2.md` and stay out of this proposal.

## Check before approving

Render a 288 px card with `24°` at 72 px regular and at 72 px bold over the neutral dark surface, and compare with the references. If 72 reads too large against the card inset (32 px), `display-lg` can drop to 64; nothing else changes.
