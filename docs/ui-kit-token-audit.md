# UI Kit token audit

Scope: `src/ui-kit/` (the Figma UI Kit components) and `src/primitives/`, stories
included. Regenerate the numbers with `npm run tokens:audit`. Visual baselines for
every story are in `tests/visual/baselines/` (`npm run test:visual`).

## Token architecture

| Tier | What it holds | Who may reference it |
| --- | --- | --- |
| **Core** (`color.core`, `color.opacity`, `gradient.primary/inverse/complementary`, `*.core`) | Raw values: `#414FFD`, `4px`, `0.6` | Only other tokens. Never a component. |
| **Semantic** (any `semantic` group) | Intent, as an alias to core: `color.semantic.focus.glow → color.core.primary.noite.light` | Components, through `token()`, which only type-checks semantic names |
| **Layout scales** | The grid spacing steps, the radius steps, and the `.text-*` styles | Only through typed primitive APIs: `spacing()`, `<Box>`/`<Stack>` props, `<Text variant>` |

A raw value change (a new Noite blue, say) touches only `tokens.json`. A change of
intent (focus glows green) repoints one semantic alias. Neither edits a component.

The same three tiers bind the screens the app generates: the design system
manifest records every token's tier (`tokenTiers` in
`src/shared/design-system/manifest.ts`), the agents get the rule as global law 5,
and the validator rejects a blueprint that names a core token or a raw value.

Overlays follow it too: `<Overlay direction>` and `<ScreenOverlay model>`
(`src/ui-kit/Overlay.tsx`) name only `color.semantic.overlay.scrim` and
`gradient.semantic.overlay.*`; the raw shades live in `gradient.overlay.*`. Those
shades are the pieces of the layer rule (Camadas, `screen-layers.ts`) and follow
the Figma Sombras set (2072:6605): → and ← fade from 57.45% to 97.16% of the width
and end at 60% black (`color.opacity.dark.60`), ↗ ends at full black, and ↙ is the
exact mirror of ↘.

## Baseline — before the refactor (commit `d2a4472`)

| File | Core refs | Semantic refs | Untyped `var()` strings | Raw `.text-*` strings | Measured sizes |
| --- | ---: | ---: | ---: | ---: | ---: |
| `src/primitives/Box.tsx` | 0 | 1 | 0 | 0 | 0 |
| `src/primitives/Button.tsx` | 9 | 4 | 0 | 0 | 0 |
| `src/ui-kit/Button.stories.tsx` | 2 | 1 | 3 | 0 | 0 |
| `src/ui-kit/Button.tsx` | 27 | 5 | 31 | 4 | 4 |
| `src/ui-kit/InteractivityMenu.stories.tsx` | 1 | 1 | 2 | 0 | 0 |
| `src/ui-kit/InteractivityMenu.tsx` | 3 | 1 | 4 | 1 | 0 |
| `src/ui-kit/LabelVideo.stories.tsx` | 4 | 1 | 5 | 0 | 0 |
| `src/ui-kit/LabelVideo.tsx` | 10 | 1 | 11 | 2 | 0 |
| `src/ui-kit/MainMenu.stories.tsx` | 1 | 1 | 2 | 0 | 0 |
| `src/ui-kit/MainMenu.tsx` | 20 | 4 | 24 | 4 | 0 |
| `src/ui-kit/RoundButtonShell.tsx` | 8 | 3 | 11 | 0 | 4 |
| `src/ui-kit/RoundedButton.stories.tsx` | 2 | 1 | 3 | 0 | 0 |
| `src/ui-kit/RoundedButton.tsx` | 1 | 0 | 1 | 0 | 1 |
| `src/ui-kit/untokenized.ts` | 0 | 0 | 1 | 0 | 0 |
| `src/ui-kit/WideButton.stories.tsx` | 2 | 1 | 3 | 0 | 0 |
| `src/ui-kit/WideButton.tsx` | 20 | 4 | 23 | 1 | 1 |
| **Total** | **110** | **29** | **124** | **12** | **10** |

## Findings

1. **Components are bound to raw values.** 110 references reach core tokens
   directly. The worst are the focus colours (`color-core-primary-noite-light`,
   `color-core-neutral-charcoal`, `color-opacity-dark-70`) and `color-opacity-background`,
   each re-spelled in 3–4 files.
2. **Nothing checks the names.** 124 `var(--…)` strings are plain strings, so a typo
   or a core-tier leak compiles fine and renders as nothing.
3. **Four focus rings, four recipes.** They share only the Noite gradient:

   | Component | Inner fill | Glow |
   | --- | --- | --- |
   | WideButton | `opacity-dark-70` + charcoal fade from the bottom | bottom, full inner height, 60% |
   | primitives/Button | copy of WideButton | bottom, 80% of inner height, 60% |
   | card Button | charcoal at 60% + a translucent scrim on top | bottom, 65%, 80%, blurred |
   | RoundButtonShell | `opacity-dark-70` + charcoal fade from the top | **top**, 50%, 80% |

4. **"Pill" is spelled three ways.** WideButton uses `radius-2xl` on the root and
   `radius-4xl` on its inner layers. Both clamp to a pill at its height. Everything else
   uses `radius-full`.
5. **Spacing tokens stand in for other things.** The card's ring inset uses
   `spacing-3xs` for what is the focus-ring width, its glow blur is `spacing-3xs`, and
   every icon or avatar size is a spacing step.
6. **Text colour is done three ways.** MainMenu uses white plus an opacity. The card
   uses `opacity-light-70` plus a luminosity blend. WideButton uses plain white. And 12
   text styles are applied as raw class strings.
7. **An intentional off-grid value.** The resting card's padding and WideButton's
   spinner use `spacing-md` (20px). This is Figma-exact and internal to the component,
   not layout, so it gets a semantic name rather than being snapped to the grid.
8. **Sizes live outside the contract.** `untokenized.ts` holds 9 measured component
   sizes that `tokens.json` doesn't know about.
9. **No shadows, and no hover or active states.** No box-shadows exist, and the kit
   is D-pad driven (focus only), so there is nothing to standardise for hover or active.
10. **Out of scope, left as follow-ups:**
    - State props are named four ways: `state` (card), `status` (WideButton,
      primitives/Button), a `focus` boolean (RoundedButton, LabelVideo) and
      `bugFocused`. Renaming them would break callers.
    - Resting strokes differ: the card and WideButton use the Diagonal Light
      gradient, the round button a solid `border-default`. That needs a design call.
11. **Stories decorate with raw strings** for padding, backgrounds and flex gaps.

## Plan

### Batch 1 — colours, gradients, opacity, typography

| Core token (before) | Semantic token (after) | Used by |
| --- | --- | --- |
| `color.opacity.background` | `color.semantic.functional.background-translucent` | card fill/scrim, WideButton, RoundButtonShell |
| `color.opacity.light.10` | `color.semantic.functional.background-tint` | LabelVideo (rest) |
| `color.opacity.light.70` | `color.semantic.functional.text-muted` | card overline/subtitle |
| `color.opacity.light.20` | `color.semantic.functional.border-default` (existing) | RoundButtonShell rest stroke |
| `color.core.neutral.white` | `color.semantic.functional.text-primary` (existing, same value) | MainMenu, InteractivityMenu, WideButton |
| `color.opacity.dark.70` | `color.semantic.focus.inset` | focus rings |
| `color.core.neutral.charcoal` | `color.semantic.focus.inset-fade` | focus rings |
| `color.core.primary.noite.light` | `color.semantic.focus.glow` | focus rings |
| `color.semantic.theme.noite-dark` | `color.semantic.focus.outline` | MainMenu channel bug |
| `gradient.primary.noite` | `gradient.semantic.focus.ring` | focus rings |
| `gradient.complementary.diagonal-light` | `gradient.semantic.border.default` | card, WideButton rest stroke |
| `gradient.complementary.live` / `.replay` | `gradient.semantic.status.live` / `.replay` | LabelVideo (focus) |

- Raw `.text-*` strings become `<Text variant>`, or the typed `textClass()` where the
  text element is also the pill (LabelVideo).
- "White at 90%" is a colour plus an opacity role: `<Text opacity="title">`.
- Expected visual change: **none** (every alias resolves to the value it replaces).

### Batch 2 — spacing, radius, sizes

| Before | After |
| --- | --- |
| `radius.core.full`, and WideButton's `2xl`/`4xl` | `dimension.radius.semantic.pill` |
| `radius.core.3xl` / `6xl` | `dimension.radius.semantic.card` / `card-expanded` (card now aliases `2xl`, 24px — see below) |
| `radius.core.5xl` (card inner) | derived: `card-expanded` minus `focus-ring` width |
| `spacing.core.md` / `lg` as card padding | `dimension.spacing.semantic.card-inset` / `card-inset-expanded` |
| `spacing.core.3xs` as the card ring inset | `dimension.border-width.semantic.focus-ring` |
| `border-width.core.thin` (channel bug) | `dimension.spacing.semantic.focus-offset` — the gap between the bug and its outside outline. Planned as `border-width.semantic.section-focus`; that token was never used and has been dropped, along with `pill-focus`, so the kit names exactly one ring width. |
| icon/avatar sizes spelled as spacing steps | `dimension.size.semantic.icon-*`, `avatar`, `program-logo`, `channel-bug`, `control-height*` |
| `untokenized.ts` (`CARD`, `ROUNDED`, `WIDE`) | `dimension.size.semantic.card-*`, `round-button*`, `wide-button-width`, `icon-round-rest` — file deleted |
| on-grid paddings and gaps | typed `spacing()` / `<Box>` / `<Stack>` |

- Story decorators and layouts become `<Box>` / `<Stack>`.
- Expected visual change: **none**.

### Batch 3 — interactive states

- **One focus ring** (decision: one look, WideButton's treatment is the standard):
  `<FocusRing shape>` in `src/primitives/`, reading only:
  - `gradient.semantic.focus.ring`
  - `dimension.border-width.semantic.focus-ring`
  - `color.semantic.focus.inset` + `inset-fade` (fade from the bottom)
  - `color.semantic.focus.glow` at `opacity.semantic.focus-glow`, from the bottom, across the full inner height

  The card Button, WideButton, RoundButtonShell and primitives/Button all render it.
- **Disabled:** content at `opacity.semantic.state-disabled` everywhere.
- **Loading:** the same animated spinner, `aria-busy`, and click suppressed, everywhere.
- **Channel bug:** keeps its thin `focus.outline`. Its logo fills the whole hit target,
  so an inset ring would cover it.
- **Expected visual change:** yes, on the card, round button and primitive Button focus
  states, and on the stories that contain them. Reviewed in the regression report, then
  re-baselined in the same commit.

### Sync — enforcement

- `token()` accepts only semantic names, so a core name fails `tsc`.
- `scripts/tokens/audit.test.ts` fails `npm test` if a component references a core
  token, writes a `var(--…)` string, applies a raw `.text-*` string, or reads a measured
  size.

## Results

| Measure | Before | After |
| --- | ---: | ---: |
| Core-token references in components | 110 | **0** |
| Untyped `var(--…)` strings | 124 | **0** |
| Raw `.text-*` class strings | 12 | **0** |
| Measured sizes outside `tokens.json` | 10 (+ `untokenized.ts`) | **0** (file deleted) |
| Focus-ring implementations | 4 | **1** (`<FocusRing>`) |
| Loading spinners | 2 (one static) | **1** (`<Spinner>`) |

Visual regression, per batch (48 stories, 1280×720, per-pixel):

| Batch | Unchanged | Changed |
| --- | ---: | --- |
| 1 — colours, gradients, typography | 48 | none |
| 2 — spacing, radius, sizes | 48 | none |
| 3 — interactive states | 33 | 15, all focus states and all intended (re-baselined in the Batch 3 commit, see below) |

Batch 3's changes:
- **Card Button** (and InteractivityMenu, which is built from it), about 3.1%:
  - the old translucent scrim no longer dims the ring, so the ring is brighter;
  - the inner fill is darker;
  - the blurred glow that bled below the card is gone.
- **RoundedButton and the MainMenu logo**, 0.15–0.33%: the glow moves from the top to the bottom.
- **primitives/Button**, about 0.1%: the glow fills the whole inner area.
- **WideButton**: pixel-identical, because its recipe is the standard.

### Kept in place

- **`scripts/tokens/audit.test.ts`** fails `npm test` on any core token, untyped
  `var()` string, raw text class or measured size in `src/ui-kit` or `src/primitives`.
- **`token()`, `size()` and `spacing()`** type-check their names. A core token passed
  to `token()` is a compile error.
- **`npm run test:visual`** catches any unreviewed pixel change.

### Open follow-ups

- **Figma binding.** The Figma UI Kit components still have no bound variables.
  Binding them to the new semantic names would make Figma and code share the contract.


### Resolved after review

- **Resting strokes:** reconciled on the gradient. `<RestingBorder>` draws
  `gradient.semantic.border.default` on every interactive control: the card,
  WideButton, the round button and primitives/Button. The round button's resting
  circle also stops being 2px larger than its focused one.
- **Channel bug focus:** the ring moves outside the logo. `focusOutline` is the
  focus-ring width as a CSS `outline`, `dimension.spacing.semantic.focus-offset`
  (2px) away from the edge.
- **State prop names:** one `interactionState` prop, with a deprecation path rather
  than a breaking change. The legacy props map onto it, carry `@deprecated`, and warn
  once in development. MainMenu's `bugFocused` becomes `focusedItem`, the one focused
  item. The only behaviour difference is that a legacy `bugFocused` now also moves
  focus off the program logo, instead of showing two focused items at once.
- **Card radius (2026-09-16):** code used 28px (`radius.core.3xl`), Figma 24px. Figma
  is right: `dimension.radius.semantic.card` now aliases `radius.core.2xl` (24px), and
  the 28px step is gone from both sides. The resting card stories changed on purpose.
- **Theme names (2026-09-16):** the themes are named in Portuguese, by colour —
  `noite` is blue, `dia` green, `tarde` yellow and orange — in the primitives
  (`color.core.primary.*`), the gradients (`gradient.primary.*`,
  `gradient.inverse.*`) and the semantic themes (`color.semantic.theme.*`). The
  semantic themes used to be shifted against the primitives (`theme.day-*` pointed
  at `primary.night`); each now takes the name of the colour it always had, so no
  component changed colour. The tables above use the current names.
