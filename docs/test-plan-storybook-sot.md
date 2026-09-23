# Test plan: catalog.ts, the Storybook importer and Blueprint rules

This plan tests the UI generation engine from end to end. It has three parts:

- **The internal manifest.** `catalog.ts` defines the built-in components. It stays
  the manifest the agent is held to.
- **The external importer.** Other design systems come in through Storybook's
  docgen export.
- **Storybook as the visual truth.** Every component the catalog offers must match
  the code Storybook documents and renders, down to props, values, tokens and the
  8pt grid.

Every check below has an ID, a command, and a PASS/FAIL rule. The Where column
names the test that runs it.

## Run it

| Command | What it runs | Needs |
| --- | --- | --- |
| `npm test` | Phases 1–3 (unit and contract tests, 580 tests) | nothing |
| `npm run storybook:manifest:check` | Phase 0: the snapshot matches Storybook | builds Storybook (~1 min) |
| `npm run storybook:manifest` | Phase 0: refresh the snapshot after a story or component change | builds Storybook |
| `npm run test:visual -- --probe` | Phase 1 V1–V5: pixels plus measurements | Storybook on :6006 |
| `npm run typecheck`, `npm run lint:tokens`, `npm run tokens:check`, `npm run tokens:audit` | The static token gates V4 builds on | nothing |

A change is ready when every command above passes.

## Brief vs repo

The brief this plan answers asked for a few things the repo does differently. The
tests follow the repo. These are decisions, not gaps.

| The brief says | The repo does | Why |
| --- | --- | --- |
| Widgets are 352px wide with a 24px radius | Content Card: `content-card-width` 288, `radius.semantic.content-card` 40, inset `lg` 24 | 40 matches Figma's Button Tall (decided 2026-09-21). Tests read the values from the tokens, never as numbers. |
| The Blueprint carries `focus: 'left' \| 'right' \| 'neutral'` | No focus field. The canvas reads focus from the rendered screen, and the model only marks `anchor: true`. | A TV screen always has something focused (decided 2026-09-15). The validator now **rejects** a `focus` key (G3.4). |
| `.storybook/preview.js` | `.storybook/preview.tsx` | — |
| `docs.json` | Storybook 10.6 writes `manifests/components.json` (react-docgen per component). No `docs.json` is emitted for this project. | `components.json` is what carries the docgen. The importer tells you to use it if you hand it an index or docs file (E2.6). |
| Chromatic | The Electron harness `scripts/visual/regression.mjs` (113 baselines, 1280×720) | It is deterministic, offline, and already gates every story. |
| "4-layer widget" | Content Card plus its Header, Body and Footer zones | The screen's layer rule (Camadas: video → overlay → content) is separate and tested in Phase 3. |

## Phase 0: Storybook metadata export

`.storybook/main.ts` turns on `features.componentsManifest`. With that on,
`storybook build` writes `manifests/components.json`, and
`scripts/storybook/export-manifest.ts` turns it into a committed snapshot,
`tests/storybook/manifest.snapshot.json`. The snapshot holds, per component:
title, story ids, props (type, literal options, default, description,
deprecated) and subcomponents. It carries no absolute paths, and a rebuild with
no source change is byte-identical.

| ID | Check | PASS | FAIL | Where |
| --- | --- | --- | --- | --- |
| S0.1 | The snapshot is current | `storybook:manifest:check` exits 0 | exits 1 and names the file: a story or component changed, so run `storybook:manifest` and commit | `scripts/storybook/export-manifest.ts` |
| S0.2 | The literal resolver reads every union shape react-docgen writes | `union`/`literal`, `Extract<…>`, `Exclude<…>` and PropTypes `oneOf` all resolve; anything non-literal gives `null` | an option list is invented or lost | `storybook-components-manifest.test.ts` |
| S0.3 | Snapshots are deterministic | two runs are byte-identical, with stories grouped per component and no `/Users/` paths | — | same |

## Phase 1: `catalog.ts` ↔ Storybook

`src/shared/design-system/storybook-map.ts` joins the two sides: every catalog id
maps to the Storybook component that renders it, and every Storybook component
maps back. Every catalog component has a story:

- the DTV UI Kit components are under `UI Kit/*`;
- the layout Stack, Text and Button are under `Canvas Kit/*`
  (`src/design-system/canvasKit.tsx`, the very components the canvas draws).

An entry can also declare:

- `codeOnly`: props the code has and the catalog leaves out on purpose, each with
  a reason;
- `valueMap`: catalog values that stand for a different code value (MainMenu's
  `"none"` is the code's `null`);
- `propMap`: where the registry renderer translates instead of passing props
  through. Three components use it:
  - TableCell's flat catalog fields land in its row props: `cellType` → `type`,
    `lead` → `position`/`number`, `stat1–3` → `stats`, and so on;
  - the Content Card header's `homeTeam`/`awayTeam` → `match`, `stat1–3` → `stats`,
    `partnerName`/`partnerVerified` → `partner`, `adLabel` → `ad`;
  - the interactivity card's `advertisingLabel` → `advertising` (its sponsor row).
- `defaultOverrides`: props whose catalog default deliberately differs from the
  code's, each with a reason. Two reasons exist today:
  - the kit's controls default to their focused Figma variant, but a screen
    focuses one element, so the catalog rests them (`interactionState:
    "default"`);
  - as an interactivity, the card carries its title alone, so the catalog turns
    off its overline, subtitle and live badge.

| ID | Check | PASS | FAIL | Where |
| --- | --- | --- | --- | --- |
| P1.1 | Every catalog component is accounted for | the map's keys equal the catalog's ids; every snapshot component is mapped or listed in `STORYBOOK_ONLY` with a reason | a new catalog id, or a new story, with no decision | `catalog-storybook-parity.test.ts` |
| P1.2 | Every catalog component has a story and documents cleanly | ≥1 story, no Storybook error, and the declared subcomponent exists | missing or erroring | same |
| P1.3 | Every catalog prop exists in code, with the same kind of type | each prop (or each `propMap` target) is a real code prop; a direct prop keeps its kind: enum ↔ enum, string ↔ string, boolean ↔ boolean, number ↔ number | the catalog offers a prop the component doesn't take | same |
| P1.4 | Every catalog enum offers exactly the code's literal union | set-equal both ways, after `valueMap` and `propMap` | the agent could send a value the component ignores, or can't send one it has | same |
| P1.5 | Numbers agree with the grid and the spec | ContentCard `height`: step = `frameSpec.grid`, min = two insets rounded up to the grid, max = `contentCardSpec.maxHeight`, default = `contentCardSpec.height` in catalog **and** docgen; every number prop has min, max and step | — | same |
| P1.6 | The Content Card documents its zones in slot order | Header, Body and Footer are Storybook subcomponents; `slots` = Header, Body, Footer; each zone's `parents` = ContentCard | — | same |
| P1.7 | JSDoc reaches docgen | every bound component and every catalog prop has a non-empty description in the snapshot | a component or catalog prop is undocumented | same |
| P1.8 | Nothing leaks | every code prop is in the catalog, a `propMap` target, in `codeOnly`, or an `on*` handler; `codeOnly` entries exist and aren't in the catalog; `deprecated-alias` entries are really `@deprecated`; no component shows an inherited `node_modules` prop, `style`, `className` or `aria-*` | an undeclared prop, a stale entry, or a DOM prop | same |
| P1.9 | Every catalog default is the code's, or says why not | the code's default is react-docgen's (a destructuring default) or the one its JSDoc states (`` Default `x`. ``); the catalog's equals it, or, where the code leaves the prop unset, is empty (`''`, `false`, `0`); every `defaultOverrides` entry really differs | a default drifted on one side, or an override is stale | same |

### Visual and token fidelity (`npm run test:visual -- --probe`)

The probe runs after each story settles, in the same 1280×720 offscreen window as
the pixel diff. Every expected value is resolved from the live CSS custom
properties, which `tokens:check` ties to `tokens.json`. The run prints what it
measured, because a clean probe that measured nothing proves nothing. Today it
covers 113 stories, 14 Content Cards and 6 canvas surfaces.

| ID | Check | PASS | FAIL |
| --- | --- | --- | --- |
| V1 | Pixels | 0 stories changed beyond the per-channel tolerance of 8 | any changed, new, removed, erroring or deprecated story |
| V2 | The 8pt grid on rendered padding and gaps | every value is 0, 4, 12 or a multiple of 8 | an off-grid value whose inline style doesn't take it from a listed token |
| V3 | Content Card geometry | width = `--dimension-size-semantic-content-card-width`, radius = `--dimension-radius-semantic-content-card`, inset on all four sides = `--dimension-spacing-core-lg` | any mismatch |
| V4 | No literal values in use | no hex, `rgb()`, `hsl()` or non-zero px left in an inline style once `var()` is stripped (token definitions like `--sfs-color-surface: …` are allowed) | a hard-coded value |
| V5 | The canvas theme stays on the canvas | every `[data-canvas-theme="active"]` surface carries `--sfs-*` vars and `:root` carries none | a leak into the app shell, or a surface with no theme |

V2 exceptions are listed by token in `GRID_EXCEPTIONS`, each with its reason:

- **`--dimension-border-width-*`:** a stroke, not spacing. RestingBorder draws its
  gradient border as padding under a mask.
- **`--dimension-spacing-semantic-card-inset` (20px):** per tokens.json, it is
  "Figma-exact and internal to the card, so it may sit off the layout grid".

The static gates back V4 up: `lint:tokens` (no raw hex or px in `src/`) and
`tokens:audit` (0 core refs, 0 untyped `var(--`, 0 raw `.text-*`, 0 measured
sizes).

The Canvas Kit adds one compile-time gate. react-docgen can't read a type derived
from a scale's keys, so `canvasKit.tsx` writes each union out, and
`true satisfies Same<…>` pins it to the catalog's schema type. A value added to
one side and not the other is a `tsc` error.

## Phase 2: external importer

`parseStorybookDocgenWithReport(raw, meta)` returns
`{ manifest, warnings }`. `parseStorybookDocgen` is a thin wrapper around it. It
reads three shapes: Storybook 10's `components.json` (subcomponents become
components of their own), a react-docgen `props` map, and Storybook `argTypes`.
Every literal union goes through the same resolver as Phase 0.

Token imports report too: `parseDesignTokensWithReport` names every token it
leaves out, either an alias that points at no token (or at one that doesn't
resolve) or a value that isn't CSS. The switcher shows `Imported "x" · N warnings`
or `Tokens applied · N warnings`, with the list on hover.

| ID | Check | PASS | FAIL | Where |
| --- | --- | --- | --- | --- |
| E2.1 | `components.json` becomes a schema-valid manifest | zones are components, `Extract<…>` unions become their options, height stays a number with default 440; a story with no component, a duplicate name and a prop-less component each give a warning | throws, drops options, or drops something silently | `storybook-adapter.test.ts` |
| E2.2 | `argTypes` give the same component | same options and types as E2.1 | — | same |
| E2.3 | Inherited DOM props are dropped | props declared in a `node_modules` type (react-docgen-typescript `parent` / `declarations`) are removed, and each gives a warning | a DOM attribute reaches the agent | same |
| E2.4 | Weakly typed props are accepted, not rejected | a non-literal union or an unexpanded alias becomes a `string` with no `options`, plus a warning; a plain `string` gives no warning | a bogus empty enum (the old behaviour), or a rejected import | same |
| E2.5 | No components → a readable error | throws "No component definitions found…"; the store returns `{ ok: false }` and the switcher shows it | crash, or an empty system imported | same, `designSystemStore.test.ts` |
| E2.6 | An index or docs file says what to import instead | "…Import manifests/components.json instead." | — | `storybook-adapter.test.ts` |
| E2.7 | An imported manifest holds a Blueprint to its own components | the schemas compile; a Blueprint using only its ids passes; an off-union value fails on that prop; a built-in-only id (`MainMenu`) fails | — | same |
| E2.8 | Tokens the import leaves out are reported | an alias to a missing token, an alias to a broken one, and a non-CSS value each give a warning naming the token, both in the export (`tokens: {…}`) and through Import tokens…; a clean file gives none | a token dropped silently | `token-adapter.test.ts`, `storybook-adapter.test.ts`, `designSystemStore.test.ts` |

## Phase 3: Blueprint DSL and AI rules

`src/shared/layout/conformance.test.ts` is one table with one rule per row, run on
the nível 3 Content Card screen. Each broken Blueprint must be:

1. **rejected** by the strict validator (the agent's retry signal) with a message
   naming the rule;
2. **reported** by the interpreter (the renderer's safety net);
3. where the interpreter can repair it, **repaired** into a screen that then
   passes the validator. A screen that reaches the canvas is always one the agent
   could have sent.

| ID | Rule | Repaired? |
| --- | --- | --- |
| G3.0 | All 6 reference screens pass, and round-trip through the interpreter with no warnings | — |
| G3.1 | Unknown component | yes, dropped |
| G3.2 | Unknown prop | yes, removed |
| G3.3 | Enum value outside the catalog | yes, default |
| G3.4 | A `focus` key on the document | yes, ignored. The validator says the engine reads focus. |
| G3.5 | A `focus` key on a node | yes, ignored |
| G3.6 | Two focused elements | yes: the first in reading order keeps focus, and the others rest |
| G3.7 | Root adds its own margin (the frame owns the 32px safe area) | yes |
| G3.8 | Root gutter isn't 16px | yes |
| G3.9 | Off-grid spacing (the 20px step) | yes, snapped |
| G3.10 | Statically centered master layout | yes, un-centered **to the side the screen model shades** |
| G3.11 | Two anchored groups | reported only: un-anchoring leaves two content modules on a level-3 screen |
| G3.12–G3.15 | Card zone outside a card; zones out of order; a zone twice; a Table Cell outside a Body | yes |
| G3.16–G3.17 | Card height off the 8pt grid; card taller than 456 | yes, snapped and clamped |
| G3.18 | Layer model that doesn't exist | reported: falls back to Home |
| G3.19 | Level the model doesn't have | yes |
| G3.20 | More content modules than the level allows | reported only ("Still breaks a layout rule — …") |
| G3.21 | Root paints over the video | yes, cleared |
| G3.22 | Grid exceptions 4 and 12 (and 8) are allowed in a leaf cluster | — |

PASS means every row holds. FAIL means a rule the validator doesn't name, an
interpreter that stays silent, or a repair that the validator still rejects.

These rules are already covered elsewhere, and the plan counts them. The finer
cases live next to each rule:

- **Frame, 1280×720 shown as 1920×1080:** `frame.test.ts` › "lays out on the
  1280×720 base and shows it as is, or upscaled 1.5× to 1920×1080".
- **32px margin and 16px gutters:** "uses a 32px margin and 16px gutters…".
- **Engine focus side:** "puts the focus on the side its center falls on — dead
  center counts as right", and "anchors bottom-right for right focus or nothing
  focusable, mirrored bottom-left for left".
- **The prompts stay inside the manifest:** `promptSpec.test.ts` › "describes
  every catalog component and no others" and "does not mention any component
  outside the registry".
- **Every prompt number comes from `FRAME`:** "opens the Generator prompt with the
  six global laws, every number from the frame constants".
- **No focus field in the prompt:** "never asks the model to declare a focus side
  — the engine reads it".
- **Imported systems get their own manifest:** "compiles the generator prompt and
  the validator from the active manifest".
- **The retry loop:** `ai-orchestrator.test.ts` › "feeds validation errors back to
  the generator and retries", and "gives up after MAX retries but still returns
  the best attempt".
- **Content Card structure details:** `validateBlueprint.test.ts` › "validateBlueprint
  — Content Card structure".
- **The layer rule in detail:** `screen-layers.test.ts`.

## Phase 4: end-to-end (manual)

Run this before a release, or after a change that crosses layers. Steps 5–7 call
a real model. They cost roughly $0.15–0.50 per run, so they are opt-in.

| Step | Do | PASS |
| --- | --- | --- |
| 1 | Add a value to a ContentCard prop union in code (e.g. `'selected'` to `interactionState`) | — |
| 2 | `npm run storybook:manifest:check` | exits 1 (stale) |
| 3 | `npm run storybook:manifest`, then `npm test` | P1.4 fails on `ContentCard.interactionState` until `catalog.ts` offers the value too; then everything passes |
| 4 | Change a token in `tokens/tokens.json`, then `npm run tokens:build` and `npm run test:visual -- --probe` | `tokens:check` passes, V3 still passes (it follows the token), V1 shows exactly the stories the token touches |
| 5 | `npm run dev`, then prompt "uma tela de estatísticas do jogo, à direita" | AgentPanel steps show `template: interactivity-cards-right`, validation ok, `FRAME RULES []`; the canvas badge shows Layout QA 5/5; the report shows 0 warnings |
| 6 | Compare the canvas frame with `Templates/Screens › Interatividades · Cards Direita` in Storybook | same zones, same side, card at 288 wide with radius 40, the close button anchored bottom-right |
| 7 | Import `manifests/components.json` from a Storybook build (Design system › Import Storybook JSON…), then repeat step 5 | the switcher shows the warning count; generation only uses the imported ids |

Undo steps 1 and 4 afterwards.

## What building this found (and fixed)

- **The importer couldn't read Storybook 10's own export.** Handing it
  `components.json` threw "No component definitions found". It now reads that
  shape, subcomponents included.
- **Unions with no literal options became empty enums.** Any `tsType` union
  compiled to `enum` with no values. Literal unions (including `Extract` and
  `Exclude`) now resolve, and everything else becomes a string plus a warning.
- **The validator accepted unknown keys.** A Blueprint with `focus: "left"` passed
  and the engine silently ignored it. Unknown document and node keys are now
  rejected, with a focus-specific reason.
- **The interpreter didn't enforce one focus.** Only the validator did, so an
  exhausted retry loop could put two focus rings on the canvas. The interpreter
  now rests the extras.
- **Un-centering could break the layer rule.** It always picked `start`, so a
  right-hand model got its content on the left. It now picks the model's side.
- **What the interpreter can't repair went unreported.** Leftover rule breaks
  (a second module, the wrong side) showed on the canvas badge but not in the
  agent's report. They are now reported as warnings.
- **The card zones weren't documented as the card's parts.** The story meta now
  declares them as `subcomponents`.
- **JSDoc was missing.** 10 components had no component-level description, and 11
  catalog props had none. ContentCard's JSDoc sat above a helper instead of the
  component; the others had none. All of them are added.
- **Rounded Button's label defaulted to English.** It was `'Back'` in code and
  `'Voltar'` in the catalog, while its sibling Close Button says `'Fechar'`. The
  code now says `'Voltar'`. Only the accessible label changes, so no pixels
  move. P1.9 found it.
- **Docgen defaults kept their escapes.** A string default came through as
  written (a literal `\n` for a line break). They are now read as the string
  itself, in the snapshot and in the importer.
- **TableCell's props were unreadable by docgen.** They are a discriminated union.
  `TableCell` now has one overload with the strict per-row union, so callers stay
  strict, and a flat, documented implementation signature (`TableCellFields`)
  for docgen to read. Parity runs through a `propMap`.
- **Stack, Text and Button had no story.** They were hand-written renderers inside
  `registry.tsx`. They are now the `Canvas Kit` components, each with a story. The
  registry calls them as plain functions, so the canvas still decorates their own
  root element. The canvas DOM is unchanged: the 101 existing baselines are
  pixel-identical.
- **Input was in the catalog, but the DTV kit has no input component.** It is
  retired from the catalog and the registry. The planner's worked example (a
  sign-up card) and its form pattern went with it, and so did the AgentPanel's
  sign-up suggestion.
- **Token imports dropped broken aliases silently.** They are now reported (E2.8).

## Still open

- **Phase 4 has not been run against a live model.**

To keep in mind: the visual baselines depend on the OS, so re-baseline only after
proving the drift against committed code.

## Numbers

- Tests went from 363 to 580.
- Visual: 113 stories (11 new `Canvas Kit` baselines, plus the sponsored interactivity card).
- Each negative check below was run once and reverted. Each turned its test red:
  - dropping `'replay'` from the catalog's LabelVideo kinds → P1.4;
  - adding `style` to the primitive Button → S0.1 (stale snapshot) and P1.8;
  - setting a story gap to the 20px step → V1 and V2;
  - giving a template `focus: 'left'` → G3.0 and `templates.test.ts`;
  - dropping `'scout'` from the catalog's TableCell rows → P1.4 on TableCell,
    through its `propMap`;
  - adding `'baseline'` to the catalog's Stack align → a `tsc` error in
    `canvasKit.tsx`;
  - changing the catalog's MainMenu weather title default → P1.9;
  - removing Close Button's `defaultOverrides` entry → P1.9;
  - adding an override where catalog and code already agree → P1.9 ("drop it").
