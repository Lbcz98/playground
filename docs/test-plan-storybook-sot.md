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
| `npm test` | Phases 1–3 (unit and contract tests, 589 tests) | nothing |
| `npm run storybook:manifest:check` | Phase 0: the snapshot matches Storybook | builds Storybook (~1 min) |
| `npm run storybook:manifest` | Phase 0: refresh the snapshot after a story or component change | builds Storybook |
| `npm run dtv:export` | Phase 4: the DTV system as an external import — `dist-dtv/dtv-storybook.json` (Storybook's components manifest cut to UI Kit + Primitives, with `tokens.json` inside) and `dist-dtv/dtv.bundle.js` (the same components as a live bundle) | builds Storybook |
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
  code's, each with a reason. One reason exists today: the kit's controls default
  to their focused Figma variant, but a screen focuses one element, so the catalog
  rests them (`interactionState: "default"`).

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
| E2.4 | Weakly typed props don't sink the import | a union with a free-text member becomes a `string` with no `options`, plus a warning; a type docgen only knows by name is left out, with a warning (a string in its place could break the component); a plain `string` gives no warning | a bogus empty enum (the old behaviour), or a rejected import | same |
| E2.5 | No components → a readable error | throws "No component definitions found…"; the store returns `{ ok: false }` and the switcher shows it | crash, or an empty system imported | same, `designSystemStore.test.ts` |
| E2.6 | An index or docs file says what to import instead | "…Import manifests/components.json instead." | — | `storybook-adapter.test.ts` |
| E2.7 | An imported manifest holds a Blueprint to its own components | the schemas compile; a Blueprint using only its ids passes; an off-union value fails on that prop; a built-in-only id (`MainMenu`) fails | — | same |
| E2.8 | Tokens the import leaves out are reported | an alias to a missing token, an alias to a broken one, and a non-CSS value each give a warning naming the token, both in the export (`tokens: {…}`) and through Import tokens…; a clean file gives none | a token dropped silently | `token-adapter.test.ts`, `storybook-adapter.test.ts`, `designSystemStore.test.ts` |
| E2.9 | Scale steps a prop names are measured | a spacing or radius option (`gap: "lg"`) is recorded under its own name from its core token (`spacing-core-lg`), so margins, gutters and the 8pt grid are checked on an imported screen; an option with no token gives a warning | the frame rules silently skip it | `storybook-adapter.test.ts` |
| E2.10 | Event handlers and deprecated aliases are left out | a `function` prop and an `@deprecated` prop are dropped, with a warning | the agent sets `onClick` to a string, or reaches for an old alias | same |
| E2.11 | Lists of text are lists; other shapes are left out | `string[]` imports as a list, `[string, string]` as a list of exactly 2 (validator and prompt both say so); a list of objects, an object, or a type docgen only knows by name is dropped with a warning | a string where the component expects a list or object — it breaks the component | same |
| E2.12 | A component's words go in its `children` prop | `"props": { "children": "…" }` validates; text in a node's own `children` is rejected with the fix, and the interpreter moves it; the prompt says so | text silently lost | same |
| E2.13 | Nullable focus props and documented defaults reach the one-focus rule | a `… \| null` union is nullable (`or null` in the prompt, rests at `null`); a JSDoc "Default \`program\`." becomes the default, so an unset menu counts as focused | the validator asks for a value it then rejects | same |

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
| 7 | `npm run dtv:export`; in the app, Design system › Import Storybook JSON… `dist-dtv/dtv-storybook.json`, then Import component bundle… `dist-dtv/dtv.bundle.js`; repeat step 5 | the switcher shows the warning count and "19 live"; generation only uses the imported ids; screens render as the real DTV components |

Undo steps 1 and 4 afterwards.

### Run of 2026-09-23 — the DTV system from Storybook alone

Steps 1–3 passed (the snapshot check caught the new union, P1.4 named it, and
offering it in the catalog made everything green again). Step 4 was stopped
before it ran to completion and reverted.

Step 7 was run with the DTV system built **only** from Storybook's export:
`dtv-storybook.json` (16 story components — 19 with the card zones — and the
DTCG tokens) imported through the real importer, generated with the real
pipeline (planner → generator → strict validator → retry, `claude-cli`), and
drawn by the real `dtv.bundle.js` in the canvas `ScreenFrame`.

| Prompt | Screen model | Validator | Layout QA | Looks right | Cost |
| --- | --- | --- | --- | --- | --- |
| Estatísticas Equador x Argentina, à direita | interactivity-cards-right, nível 3 | ok, attempt 1 | 5/5 | yes — match title, three scout rows with value pairs, footer timestamp, close anchored and focused | $0.21 |
| Classificação do Grupo A, à esquerda | interactivity-cards-left, nível 3 | ok, attempt 1 | 5/5 | mostly — rows, columns and headings right; the header showed the placeholder "Título" (fixed since: no placeholder defaults) | $0.16 |
| Notificação do paredão | notification, nível 0 | ok, attempt 2 | 5/5 | yes | $0.15 |
| Home com menu e trilho à direita | home-buttons-right, nível 1 | ok, attempt 2 | 5/5 | **no** — the rail is cut off at the top left and the menu floats mid-screen (the "AO VIVO" / "Overline" / "Subtitle" placeholders it also showed are fixed since) | $0.10 |

Getting there took five import gaps closed first (see below), and the run itself
found seven more — all fixed except the two under "Still open". The last round of
four prompts cost $0.61; the whole session's live runs about $3.

## Phase 5: reference screens for an imported system

Built-in templates (`SCREEN_TEMPLATES`) are now just the built-in manifest's
`templates` field — `DesignSystemManifest.templates?: ManifestScreenTemplate[]`
— so any manifest, imported or not, can carry its own. `templatesFor` reads it
off the active manifest; nothing is special-cased to the built-in id any more.

| ID | Check | PASS | FAIL | Where |
| --- | --- | --- | --- | --- |
| T1 | The manifest schema carries reference screens | `templates` round-trips through `manifestZodSchema`; a template missing `id`, `name`, `when` or `blueprint` is rejected | a malformed template is accepted silently | `manifest.test.ts` |
| T2 | `templatesFor` reads the active manifest, not a hardcoded id | the built-in manifest carries `SCREEN_TEMPLATES`; an imported manifest with none gets none; one that ships its own shows them, exactly like the built-in | an imported system with real templates is still told "none" | `screenflow-manifest.test.ts`, `promptSpec.test.ts` |
| T3 | `chooseTemplate` works on any manifest's templates | generic over `ManifestScreenTemplate`, so it takes the built-in's typed `ScreenTemplate[]` or an import's own array with no cast, and keeps the stronger type when it has one | a cast papering over a type mismatch | `choose.test.ts` (unchanged — the generic doesn't change behaviour) |
| T4 | An import's own templates are held to its own manifest | a template that validates is kept; a missing field, a duplicate id, or a Blueprint that fails validation against its own manifest is dropped, each with a warning naming why | a broken reference screen reaches the Planner | `storybook-adapter.test.ts` E2.14 |
| T5 | `npm run dtv:export` ships DTV's own six reference screens, self-checked | it re-imports its own output through the real importer and refuses to write the file if any of the six no longer validates | a reference screen regresses silently when the kit's components change | `scripts/storybook/dtv-templates.ts`, `export-dtv.ts` |
| T6 (manual, live) | The home screen composes correctly once the import ships a template | the Planner's `template:` step names `home (named)`; the generated screen's structure matches the reference (rail resting above the menu, menu along the bottom) | the model still invents its own layout despite a reference existing | see below |

**What T5 caught immediately:** the DTV import's `UiKitButton` documents "Default
`focus`." (a real JSDoc default this session started reading, E2.13) — so a rail
card with no `interactionState` set focuses itself. The built-in catalog hides
this behind `interactionState: RESTS` (a `defaultOverrides` entry), but nothing
rests it for an import. `dtv-templates.ts`'s home screen now sets
`interactionState: "default"` on every un-entered card explicitly. Before this
was fixed, the self-check refused to write the export: "5 elements are focused."

**T6, run live (2026-09-23):** the same home prompt from Phase 4's run — the one
that previously scored 5/5 on layout QA while still looking wrong (menu floating
mid-screen, rail cropped) — now shows `template: home (named)` in the Planner's
step log, validates on attempt 1, and the rendered screen matches the reference:
the rail's three cards rest above the main menu, the first one focused with its
ring, the menu's weather and programme text along the bottom edge. $0.13.

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
- **An imported system had no reference screens to start from**, so its
  composition was the model's alone — this is what made the home screen's rail
  and menu land in the wrong places despite passing every rule. Templates are
  now a manifest field any system can carry (Phase 5).

Found while making the DTV system importable from Storybook alone (Phase 4):

- **Storybook couldn't read the primitives' props.** Box/Stack spacing, background,
  border and radius, and Text's variant, colour and opacity were types derived
  from `CssVar`, which react-docgen reads as `unknown`. `npm run tokens:build`
  now also writes `src/primitives/token-names.ts` — the same families as literal
  unions — and `primitives/tokens.ts` proves each equals its derived twin.
  `tokens:check` keeps it current.
- **Text given as `children` never showed.** The live renderer always passed the
  Blueprint's child nodes as children, overriding the text. It now keeps the
  component's `children` prop when there are no child nodes; Heading declares its
  `children` so docgen sees it.
- **Two components named `Button` — one was dropped.** The importer now keeps both,
  named by their story (`PrimitivesButton`, `UiKitButton`).
- **Token names didn't match prop values**, so the grid rules couldn't measure an
  imported screen (E2.9).
- **No way to get real components into an imported system from the repo.**
  `npm run dtv:export` builds the bundle.
- **The app rejected any `forwardRef` or `memo` component in a bundle.** Its
  validator wanted plain functions; the primitive Button is a `forwardRef`. It now
  accepts React's wrapped component types.
- **Handlers and deprecated aliases were offered to the agent** (E2.10).
- **Lists came through as free text.** `readonly` arrays read as `unknown`, so the
  agent wrote `"62% / 38%"` where the component needs `["62%", "38%"]` — a string
  there breaks the component. The kit's list props dropped `readonly`, and lists
  are a prop kind now (E2.11), in the manifest, the validator, the prompt and the
  Properties panel (a comma-separated field).
- **The prompt never showed what a prop is for.** Each prop line now carries its
  description — for an imported system the agent's only guide; the model had
  used a `team` row where a `scout` row was meant.
- **Text in a node's `children` was dropped silently** (E2.12).
- **The one-focus rule asked for a value the prop refused.** An imported MainMenu
  takes `null` for "focus is elsewhere", but the rule told the model to set
  `"none"`; the model looped until the retries ran out (E2.13).
- **An optional prop with no default got its first option.** The interpreter
  filled `background: "primary"` and `border: "subtle"` into every imported
  Stack — a painted panel over the video. An optional prop without a default now
  stays unset, so the component does what it does without it.
- **Placeholder defaults leaked onto screens.** The kit's components defaulted
  their copy to Figma placeholders — the card's `Title`/`Overline`/`Subtitle` and
  live badge, the header's `Título`, the notification's text, the menu's weather
  and programme lines, the pill's `Label` — so a prop the model left out showed
  them. Flagging text defaults in the prompt helped but not reliably, so the
  placeholders moved into the stories' `args`: the components now default to no
  text (the live badge off), the catalog's defaults follow (P1.9 holds them
  together), and the home templates name their menu's weather line. Every
  story and template is pixel-identical; a live rerun of the two screens that
  leaked shows none. The icon controls' accessible labels (`Fechar`, `Voltar`,
  `Conteúdo interativo`) stay: they are meaning, not placeholders.

## Closed since (2026-09-25)

- **Gradient tokens are parsed by the importer.** DTCG `gradient` tokens become a
  `gradients` token group (`linear-gradient(...)`, stop aliases resolved, the
  `com.screenflow.css` angle kept, `--sfs-gradient-*` on the canvas). `tokens.json`
  now imports with 1 warning instead of 29 — the one left is the motion easing, a
  cubic-bézier with no CSS value of its own.
- **Step 4 of Phase 4 ran to completion.** `radius.semantic.content-card` moved from
  core 6xl (40px) to 5xl (36px), `tokens:build`, `tokens:check` passed, and
  `test:visual -- --probe` showed V3 following the token (14 Content Cards
  measured, no failure) and exactly 7 stories changed — the five Content Card
  stories and the two level-3 templates, nothing else. Reverted; 113 unchanged.

## Still open

- Nothing from this plan.

To keep in mind: the visual baselines depend on the OS, so re-baseline only after
proving the drift against committed code.

## Numbers

- Tests went from 363 to 594.
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
