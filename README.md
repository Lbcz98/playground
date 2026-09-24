# ScreenFlow Studio

Internal desktop app for building screen flows with a **strict, swappable Design
System** and a built-in AI agent that generates UI **directly onto the canvas**
(never raw HTML). Design systems are imported from Storybook exports, persisted,
and hot-swapped — the Canvas, the Property Inspector and the AI agent all operate
strictly against whichever one is currently active.

## Stack

| Concern      | Choice                                        |
| ------------ | ---------------------------------------------- |
| Shell        | Electron + Vite + React + TypeScript           |
| State        | Zustand (per-turn undo/redo, design-system library) |
| Styling      | Tailwind CSS, token dictionary only            |
| Validation   | Zod — both hand-written and compiled at runtime from imported manifests |
| Interactions | `@dnd-kit/core` (installed, not yet wired)     |
| AI           | Orchestrator in the Electron **main** process  |

## Run

```bash
npm install
npm run dev          # launches Vite + Electron
npm run build        # typecheck + production build
npm run typecheck
npm run test          # vitest — adapters, interpreter, providers, prompts, undo, storage
cp .env.example .env  # pick an AI provider (else the app serves a built-in fixture)
npm run lint:tokens   # fails on hard-coded colors / px / arbitrary Tailwind values
npm run tokens:build  # regenerate src/styles/global.css + global-tokens.ts from tokens/tokens.json
npm run tokens:check  # fails if those generated files have drifted from tokens.json
npm run storybook     # UI Kit + Primitives on :6006
npm run tokens:audit  # which tokens each component references, by tier
npm run test:visual   # pixel-diff every story against tests/visual/baselines (needs Storybook running)
```

## Architecture

```
tokens/
  tokens.json           THE design-token contract (W3C DTCG) — every token value is authored here
  README.md             Figma-change workflow + naming conventions
scripts/
  build-tokens.ts       tokens:build / tokens:check
  tokens/compile.ts     Strict DTCG -> CSS compiler (aliases stay var(), typography -> .text-*)
  check-tokens.mjs      lint:tokens — no raw hex / px outside the allowlist
  tokens/audit.ts       tokens:audit + audit.test.ts — components reference semantic tokens only
  visual/regression.mjs test:visual — offscreen Electron capture + per-pixel diff per story
docs/
  ui-kit-token-audit.md Token architecture, the per-batch refactor plan, before/after results
electron/
  main.ts               Window creation + dotenv + registerIpcHandlers()
  ipc.ts                 Binds ai/handler.ts + storage.ts to ipcMain.handle
  preload.ts             The audited renderer<->main bridge: window.flow
  storage.ts             Design-system persistence — userData/design-systems/*.json
  ai/
    ai-orchestrator.ts   generateUI(prompt, history, options, manifest?) — 3-step pipeline
    validateBlueprint.ts Strict validation against the ACTIVE manifest (pipeline step 3)
    handler.ts           Transport-agnostic request handler (Zod-validated, never throws)
    llm.ts               Façade over ./providers
    providers/
      apiKey.ts          Anthropic Messages API + key; complete() + renderUi() (forces render_ui)
      claudeCli.ts       Shells out to `claude -p` (runs on your Claude Code / subscription)
      index.ts           resolveProvider() — AI_PROVIDER=auto|api-key|claude-cli
src/
  styles/
    global.css           GENERATED — --color-* / --dimension-* / --typography-* / --opacity-* + .text-*
    global-tokens.ts     GENERATED — CssVar / TextStyle unions that primitives type their props with
  primitives/            Text, Heading, Box, Stack, Button, FocusRing, Spinner — built only on
                         global.css; every appearance prop is a generated token name, and
                         token() / size() / spacing() type-check names (Storybook: Primitives/*)
  ui-kit/                Figma UI Kit components (card Button, WideButton, MainMenu, …) —
                         semantic tokens only, composed from the primitives
  shared/
    blueprint.ts         Blueprint DSL types + IPC/tool contract constants
    models.ts            Model list, effort levels, pricing for the spend estimate
    fixtures/
      pricingCard.ts     The hardcoded pricing card (used when no AI provider is set up)
    design-system/       Framework-free — shared by the renderer AND Electron main
      manifest.ts        DesignSystemManifest / ManifestComponent / ManifestProp / ManifestTokens
      storybook-adapter.ts  parseStorybookDocgen() — react-docgen / argTypes -> manifest
      token-adapter.ts   parseDesignTokens() — DTCG / Style Dictionary / grouped / flat -> tokens
      manifest-zod.ts    Compiles a manifest into per-component Zod schemas at runtime
      screenflow-manifest.ts  The built-in system, DERIVED from design-system/catalog.ts
      ipc.ts             DS_IPC channel names shared by preload + main
  services/
    aiClient.ts          Renderer wrapper for window.flow, with a web-only fallback
  interpreter/
    interpret.ts         Blueprint -> validated CanvasNode tree, against the active manifest
                          (drops hallucinations, assigns ids, forces a container root)
  design-system/
    primitives.ts        The ONLY file allowed to contain raw hex / px values
    tokens.ts            Semantic token unions (SpaceToken, ColorRole, ...)
    catalog.ts            The built-in system's Zod schemas + control metadata (no React)
    registry.tsx          hydrateRegistry(manifest) — code renderers for ScreenFlow; every
                          imported component gets a generic renderer whose background /
                          text / radius / padding are driven by --sfs-* (Phase 7B)
    cssVars.ts            Manifest tokens -> `--sfs-*` CSS custom properties;
                          screenflowBaseVars() so imported partial sets never dangle
    DesignSystemProvider.tsx  Hydrates the library on boot ONLY — no CSS vars here
                          (spec §7b: the app shell stays insulated, see Canvas.tsx)
    promptSpec.ts         Active manifest -> machine spec + the LLM system prompt +
                          tokenVocabulary() (real token names, not just "string")
  model/
    nodeTree.ts           CanvasNode { id, type, props, children } + tree helpers
  store/
    flowStore.ts          Zustand doc store; commit(recipe,label) == one undo step
    designSystemStore.ts  Library + active manifest + hydrated registry; import/remove/switch
    chatStore.ts           The AI conversation; send() -> IPC -> applyAgentBlueprint; session usage
    settingsStore.ts       Chosen model + effort, persisted to localStorage
  canvas/
    Canvas.tsx             The stage (Stack/flex layout only — no absolute X/Y). The ONLY
                          place --sfs-* tokens land — on [data-canvas-theme="active"],
                          never :root (Phase 7B)
    NodeRenderer.tsx       Tree -> React via the hydrated registry; bad nodes render a placeholder
  app/                     Toolbar, DesignSystemSwitcher, ComponentPalette, LayersPanel,
                           PropertyInspector + PropertyControl, AgentPanel (chat)
```

## IPC contract

```
renderer                         main process
--------                         ------------
aiClient.generateUI(prompt, history, options, manifest)
  window.flow.generateUI(...)
    ipcRenderer.invoke('ai:generateUI', { prompt, history, options, manifest })
      ───────────────────────────────▶  ipcMain.handle -> handleGenerateUI
                                          Zod-validates the whole request (incl. manifest)
                                          orchestrator.generateUI(prompt, history, options, manifest)
      ◀───────────────────────────────  GenerateUIResponse (Blueprint JSON only)

window.flow.designSystems.{list,save,remove,getActiveId,setActiveId}
      ───────────────────────────────▶  ipcMain.handle -> electron/storage.ts
                                          reads/writes userData/design-systems/*.json + meta.json
      ◀───────────────────────────────  DesignSystemManifest[] | void
```

The renderer never sees the API key, model config, or network call — only a
`GenerateUIResponse` ({ ok, blueprint | error, meta }), and design systems only ever
travel as validated `DesignSystemManifest` JSON.

## Design System Manifest — import, persist, swap

The app supports more than one design system at a time. Everything — the Canvas'
component palette, the Property Inspector's controls, and the AI's schema — is
compiled from whichever `DesignSystemManifest` is currently **active**:

- **Components** are imported via *"Import Storybook JSON…"* — `parseStorybookDocgen()`
  accepts react-docgen (`{ Button: { props: {...} } }`) or Storybook `argTypes`
  JSON, capturing variant enums, required/default values, and the children slot.
  It does not require a live Storybook — any JSON in that shape works (e.g. the
  `react-docgen-typescript` library run directly against your component files).
- **Tokens** are imported via *"Import tokens…"* — `parseDesignTokens()` accepts
  W3C Design Tokens (DTCG, `$value`/`$type`), pre-DTCG Style Dictionary
  (`value`/`type`), an already-grouped `{ colors, spacing, … }` object, or a flat
  `{ "color-brand": "#…" }` map, resolving `{alias}` references. Tokens can also
  ride along in the same JSON as the components, under a `tokens` key.
- **The built-in "ScreenFlow" system** is derived from `design-system/catalog.ts` —
  never re-authored — and is always present; it can't be removed or re-themed.
- **Rendering**: the built-in system uses hand-written React renderers; every
  imported system renders through a generic, token-driven structural renderer
  (`hydrateRegistry()` in `registry.tsx`) — no external Storybook React modules
  are ever loaded. A component's own token-typed prop (e.g. `background: 'brand'`)
  genuinely re-themes it — but only when that name is a real token in the active
  manifest; a hallucinated or stale name falls through to the base look instead of
  a dangling CSS reference.
- **Scoped, not global (spec §7b)**: the active manifest's tokens land as `--sfs-*`
  CSS custom properties on the canvas surface only (`[data-canvas-theme="active"]`
  in `Canvas.tsx`) — never on `:root`. The app shell (toolbar, sidebars, the
  Property Inspector's own controls) stays on static Tailwind classes and never
  re-themes, no matter which design system is active.
- **Persistence**: imported manifests are written to
  `app.getPath('userData')/design-systems/*.json` (Electron's filesystem, not
  localStorage) via `electron/storage.ts`; the last-active system is restored on
  launch.
- **AI schema injection**: `promptSpec.ts` compiles the Planner/Generator prompts
  and `manifest-zod.ts` compiles the strict Zod validator fresh, from the active
  manifest, on every call — the model can only ever see the components, props and
  tokens the active system actually declares. A prop that draws from a token scale
  is validated as an enum of the manifest's *real* token names, not a free string,
  and the Property Inspector renders it as a `<select>` of those same names (with a
  color swatch for color tokens) instead of a text field.
- **The layer rule (Camadas)** (`manifest.screenLayers`; the DTV rule is
  `DTV_SCREEN_LAYERS` in `shared/design-system/screen-layers.ts`) is the rule the
  whole system is built on. Every screen is three layers, bottom to top: **video →
  overlay → content**. The overlay is never free-form: a blueprint names one layer
  model next to its root — `"screen": { "model": "home", "level": 1 }` — and the
  canvas paints that model's fixed shade combination (the Figma "Overlay" page,
  section Modelos) between the frame surface, which stands in for the video, and
  the content. Each model sits on a navigation level (the Figma "Camadas" frame):
  0 · Transmissão limpa (alert or notification only), 1 · Home, 2 · Trilho focado
  and 3 · Interatividade única (one content module each, plus an optional anchored
  cluster where allowed). The prompts carry it as global law 6 with the active
  system's levels and models; the validator (via the frame QA's `layers` check)
  rejects a missing or unknown model, a level that doesn't match the model, too
  many modules for the level, a painted root (the content layer is transparent),
  and content on the other side from a one-sided model. The interpreter repairs
  what it can (Home by default, the model's level, a clear root), and the canvas
  adds a live check: the TV focus must sit on the side the model shades. The Frame
  panel picks the model by hand. Both built-in systems declare the DTV rule, and
  it is the fallback for imported ones.
- **Several frames, and a live prototype** (`shared/blueprint.ts`, `shared/design-system/flow.ts`,
  `store/playStore.ts`). A document is its first screen (`root`) plus up to 5 more in
  `screens: [{ id, name, screen, root }]` — "give me three versions" is three screens,
  and the canvas shows every frame as a live thumbnail under the open one (click to
  edit, × to keep only the option you picked). Any element may carry
  `"goTo": "<screen id>"`; **Play** (toolbar, or automatic after a generation that
  has links) runs those links: a click opens the screen, Back / Esc steps out, Restart
  returns to the start. Links follow the layer rule — a link from level N opens level
  N + 1 (Home → rail → one interactivity) or goes back up, never skipping a level; the
  validator rejects a broken link (with the list of real screen ids) and the
  interpreter drops it with a warning. Every screen is one undo step together.
- **The stack that holds the components always stretches.** The root's `align` is
  `"stretch"` (validator rejects anything else, the interpreter repairs it, the
  templates follow it); a module that belongs on one side positions itself inside it —
  the menu's own `align`, or a row set to `justify: "end"`. The layer check reads the
  side off that module.
- **The token tier rule** (`manifest.tokenTiers`, `TOKEN_TIER_RULE` in `manifest.ts`)
  is part of every manifest: each token is `core` (a raw value), `semantic` (an
  intent that aliases core) or `layout` (a grid spacing or radius step, for layout
  props only). Generated screens follow it without exception — the prompts carry it
  as global law 5 with the active system's tiers and core → semantic translations
  (white text is `semantic-functional-text-primary`), the token enums never contain
  a core token, a core default is swapped for its semantic twin, and a blueprint
  that names a core token or a raw value is rejected with a retry message naming
  the semantic token to use. The Property Inspector never offers a core token
  either. Tiers come from the token tree (`core` / `semantic` groups, and raw groups
  beside a `semantic` one, like `color.opacity`); a manifest saved without
  `tokenTiers` gets them inferred from `core` / `semantic` segments in its token
  names, and one saved under the old `layers` key is migrated on load.

## AI providers (`AI_PROVIDER` in `.env`)

Claude Pro/Max and the Anthropic API are **separate products, billed separately** —
there is no "sign in with Pro" for direct API calls. So there are two backends:

| `AI_PROVIDER` | Backend | Auth / billing | Notes |
| --- | --- | --- | --- |
| `claude-cli` | shells out to `claude -p` (Claude Code, headless) | your Claude Code login — **works on a Pro/Max subscription** | needs the `claude` CLI installed + `claude login`; set `CLAUDE_CLI_PATH` if it's not on PATH; no forced tool call (JSON is parsed from the reply); subject to your plan's Claude Code limits |
| `api-key` | Anthropic Messages API | `ANTHROPIC_API_KEY` (prepaid credits) | forces the `render_ui` tool; ~cents per generation |
| `auto` (default) | `claude-cli` if available, else `api-key` | — | falls back to the built-in fixture if neither is set up |

**Model & effort** are chosen in the AI Agent panel (dropdowns above the prompt),
persisted per browser, and sent with each request — `AI_GENERATOR_MODEL` / `AI_CLI_MODEL`
/ `AI_EFFORT` are only fallback defaults. The panel shows **session** token/cost totals
(reported cost for `claude-cli`, estimated from token counts for `api-key`). Your
**plan usage limit** is not exposed to the CLI or API — check `claude` → `/usage` or
claude.ai/settings/usage.

## Build phases

- **Phase 1 (done): Token Foundation & Canvas Core** — tokens, registry, Zustand node
  tree, canvas renders a Stack + Button, undo/redo, inspector, layers.
- **Phase 2 (done): Agent IPC Bridge** — `window.flow.generateUI` → `ipcMain.handle`
  → Zod-validated → `ai/orchestrator.ts` returning the hardcoded pricing-card
  Blueprint. AgentPanel shows the round-trip. Covered by vitest.
- **Phase 3 (done): DSL Interpreter** — `interpreter/interpret.ts` validates the
  Blueprint against the registry (drops unknown components, removes unknown props,
  coerces non-token values to defaults, drops orphan children, forces a container
  root, assigns ids). `flowStore.applyAgentBlueprint()` renders it in one `commit`
  → one Undo reverts the whole turn. AgentPanel shows the correction report.
- **Phase 4 (done): Live AI & Chat UI** — docked chat (`chatStore` + `AgentPanel`),
  system prompt built from `promptSpec.ts` (the registry, verbatim), registry split
  into `catalog.ts` (data) + `registry.tsx`. Two AI providers (`electron/ai/providers/`):
  the Anthropic API (key) and the local `claude` CLI (your Pro/Max subscription),
  chosen by `AI_PROVIDER`. `.env` read only in main. No provider → fixture. Model
  & effort picker added, with per-request cost estimate.
- **Phase 5 (done): Orchestration pipeline** — `electron/ai/ai-orchestrator.ts`
  `generateUI(userPrompt)`: **Planner** (prose plan from the "Product Blueprint"
  system prompt) → **Generator** (strict Blueprint JSON via the `render_ui` tool) →
  **Validate** (strict Zod, *rejects* rather than repairs; errors fed back for up
  to 2 retries, then the best attempt is returned and the interpreter cleans up
  the rest). Usage is summed across every call; the trace shows under each reply.
- **Phase 6 (done): Manifest-driven design system engine** — replaced the single
  hardcoded catalog with importable, persistent, swappable design systems:
  - **6A** — `DesignSystemManifest` (reconciling a semantic-token dictionary with
    Storybook-docgen-shaped component/prop schemas), `parseStorybookDocgen()`
    adapter, runtime Zod compilation, the built-in manifest derived from the old
    catalog. The AI orchestrator, prompt builder and validator all take the active
    manifest as an argument, threaded over IPC.
  - **6B** — Electron-filesystem persistence (`electron/storage.ts` + IPC),
    `designSystemStore` (library + active manifest + hydrated registry),
    `DesignSystemProvider` (injects the active tokens as CSS custom properties),
    `hydrateRegistry()` (code renderers for the built-in system, a generic
    structural renderer for everything imported), and the `DesignSystemSwitcher` UI.
  - **6C** — `PropertyControl` (a token-styled native control factory: select /
    toggle / number / text, no external UI library) and `PropertyInspector`,
    which renders one control per prop of the selected node's manifest component.
- **Phase 7 (done): Storybook design-token ingestion & consumption** — imported
  systems now carry real color/spacing/typography/radius/shadow scales, and those
  scales genuinely re-theme the canvas:
  - **7A** — `token-adapter.ts` normalises W3C DTCG, pre-DTCG Style Dictionary,
    already-grouped, and flat token JSON (resolving alias references);
    `storybook-adapter.ts` picks up tokens carried in the same JSON and infers
    which token scale a prop draws from (`ManifestProp.tokenGroup`);
    `designSystemStore.importTokens()` merges them into the active imported
    system and persists the result.
  - **7B** — token injection is scoped to `[data-canvas-theme="active"]` on the
    canvas surface, never `:root` (the app shell stays insulated); the generic
    renderer's chrome and any token-typed prop resolve from `var(--sfs-*)`, with
    a real-token-name check so a hallucinated value never dangles; `manifest-zod.ts`
    compiles a `tokenGroup` prop to an enum of the manifest's real names, so the
    AI's validate/retry loop and the interpreter's repair path both enforce it;
    the Property Inspector renders those props as a token `<select>` (with a
    color swatch) instead of free text.

136 tests across adapters, the interpreter, providers, prompt compilation, storage
and undo/redo.

## The pipeline

```
generateUI(prompt, history, options, manifest)   electron/ai/ai-orchestrator.ts
  resolveProvider()  ── none ─▶ built-in fixture
       │
  1. provider.complete(buildPlannerPrompt(manifest), [..history, prompt], effort:low)
       │  └─▶ prose plan (compiled from the ACTIVE manifest's components/tokens),
       │      opening with "Template: <id>" — which reference screen to start from
       │
  1b. chooseTemplate(plan, templatesFor(manifest))   src/shared/templates
       │  └─▶ the named template, else the one matching the planned screen model;
       │      "none" is honoured, and an imported design system is offered none
  2. ┌── provider.renderUi(buildSystemPrompt('tool'|'json', manifest), ["<template JSON> + build this plan: …"])
     │       └─▶ Blueprint JSON
  3. │  validateBlueprint(json, manifest)  ── ok ─▶ return
     │       │ errors
     └───────┤  push {assistant: json}, {user: "invalid: …\nfix it"}   (≤ 2×)
             ▼
        return best attempt (interpreter repairs residue in the renderer)
```

## Design System rules

1. No component or the AI may invent styles — only pre-approved token variants,
   compiled fresh from whichever design system is currently active.
2. No absolute positioning. Layout is a container component (flexbox) with token gaps.
3. Every appearance-affecting prop is a token union, enforced at runtime by Zod —
   hand-written for the built-in system, compiled at runtime for imported ones.
4. Imported design systems render through a generic, token-driven placeholder by
   default. Attaching a live component bundle (Phase 8) is opt-in per system and
   sandboxed to DOM-only privileges (no Node.js or Electron APIs) via a narrow
   `design-system://` protocol that only ever serves a bundle you attached to a
   system you already imported — never an arbitrary file, never unprompted. A
   crash in a live component is caught by an error boundary and falls back to
   the generic placeholder rather than taking the canvas down.
5. Design-system tokens re-theme the canvas only, never the tool's own UI — the
   app shell is insulated from whichever design system is active (spec §7b).
6. `tokens/tokens.json` is the only place a token value is authored. `global.css`,
   its typed names, and the built-in "Global CSS Tokens" system are all derived
   from it, and `npm test` fails while the generated files are stale.
7. Components (`src/ui-kit`, `src/primitives`) reference **semantic** tokens only —
   never a core value — through the typed `token()`, `size()` and `spacing()`
   helpers, and `npm test` fails otherwise. Every focus state is the one
   `<FocusRing>`; every loading state is the one `<Spinner>`.
8. Interactive components take one `interactionState` prop (a subset of
   `default | focus | selected | loading | disabled`); composites name their one
   focused child instead (`MainMenu focusedItem`, `InteractivityMenu activeIndex`).
   The old `state` / `status` / `focus` / `bugFocused` props still work, map onto it,
   carry `@deprecated`, and warn once in development. `npm run test:visual` fails
   any story that still uses one.
