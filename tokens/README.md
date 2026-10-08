# Design tokens

`tokens.json` is the single source of truth for the visual language: the contract
between Design (Figma) and Engineering. It uses the
[W3C Design Tokens (DTCG)](https://www.designtokens.org/tr/drafts/format/) format.
Its git history is the design system's version history.

Nothing else in the repo holds token values by hand. Everything below is derived from
this file:

| Output | Built by | Used by |
| --- | --- | --- |
| `src/styles/global.css` | `npm run tokens:build` | the app (`main.tsx`) and Storybook (`preview.tsx`): `--*` custom properties and `.text-*` classes |
| `src/styles/global-tokens.ts` | `npm run tokens:build` | typed names (`CssVar`, `TextStyle`) that `src/primitives/` accept as props |
| the "Global CSS Tokens" design system | imported at runtime (`w3c-token-source.ts`) | the canvas and the AI agent |

## When a design decision changes in Figma

1. Edit `tokens.json`. Keep aliases (`"{color.core.neutral.white}"`) wherever
   Figma binds a variable to another variable.
2. Run `npm run tokens:build`.
3. Commit `tokens.json` and the regenerated files together, in one commit that
   names the Figma change.

`npm test` fails while the generated files are out of date with `tokens.json`, and
so does `npm run tokens:check`. The compiler also rejects aliases that don't
resolve, malformed values, and unknown `$type`s.

## Conventions

- **Naming:** a token's path is its CSS name. `dimension.spacing.core.sm` becomes
  `--dimension-spacing-core-sm`, and camelCase segments are kebab-cased.
- **Tiers (the token tier rule):** `core` holds raw values. `semantic` holds intent,
  as aliases to core (or, for a measured component size with no matching step, a
  literal). The raw spacing and radius steps are the one exception — layout scales,
  named only by layout props. Components reference semantic tokens only; `npm test`
  fails if one names a core token (see `docs/ui-kit-token-audit.md`). Screens the
  app generates follow the same rule: the design system manifest carries each
  token's tier, and the AI pipeline rejects a core token (see `manifest.ts`).
  A group with a `semantic` child makes its other children core — that is how
  `color.opacity` counts as core.
- **Typography:** `typography.<style>.<weight>` composites become utility classes
  (`.text-body-md-bold`), not variables.
- **Platform hints** that DTCG has no field for go under
  `$extensions["com.screenflow.css"]`: a gradient's `angle` (the default is
  `180deg`), and a colour's `alpha`.
- **Alpha variants** never restate their base. A translucent colour aliases the
  base and sets `alpha` from 0 to 1:
  `{ "$value": "{color.core.neutral.black}", "$extensions": { "com.screenflow.css": { "alpha": 0.6 } } }`.
  `global.css` gets `color-mix(in srgb, var(--color-core-neutral-black) 60%, transparent)`,
  and the design system manifest gets the literal `#00000099`, both from that one
  pair. Use an 8-digit hex only for a translucent colour whose RGB is no token
  (`color.opacity.light.*`, `greymid-30`, `background`).
- **`$description`** is carried into `global.css` as a comment. Use it for where
  a value came from and why.
