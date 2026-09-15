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
- **Layers:** `core` holds raw values. `semantic` holds intent, as aliases to
  core. Components should reach for semantic tokens first.
- **Typography:** `typography.<style>.<weight>` composites become utility classes
  (`.text-body-md-bold`), not variables.
- **Platform hints** that DTCG has no field for go under
  `$extensions["com.screenflow.css"]`. So far that is only a gradient's `angle`
  (the default is `180deg`).
- **`$description`** is carried into `global.css` as a comment. Use it for where
  a value came from and why.
