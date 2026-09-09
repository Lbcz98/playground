# ScreenFlow Studio

Internal desktop app for building screen flows with a **strict Design System** and a
built-in AI agent that generates UI **directly onto the canvas** (never raw HTML).

## Stack

| Concern        | Choice                                        |
| -------------- | --------------------------------------------- |
| Shell          | Electron + Vite + React + TypeScript          |
| State          | Zustand with a per-turn undo/redo stack       |
| Styling        | Tailwind CSS, token dictionary only           |
| Interactions   | `@dnd-kit/core` (wired in a later phase)       |
| AI             | Orchestrator in the Electron **main** process |

## Run

```bash
npm install
npm run dev        # launches Vite + Electron
npm run build      # typecheck + production build
npm run typecheck
npm run test        # vitest — interpreter, providers, system prompt, undo
cp .env.example .env # pick an AI provider (else the app serves a built-in fixture)
npm run lint:tokens # fails on hard-coded colors / px / arbitrary Tailwind values
```

## Architecture

```
electron/
  main.ts            Window creation + dotenv + registerIpcHandlers()
  ipc.ts             Binds ai/handler.ts to ipcMain.handle (the only channel)
  preload.ts         The one audited renderer<->main bridge: window.flow
  ai/
    ai-orchestrator.ts  generateUI() — the 3-step pipeline (see below)
    validateBlueprint.ts Strict Zod validation in the main process (pipeline step 3)
    handler.ts       Transport-agnostic request handler (Zod-validated, never throws)
    llm.ts           Façade over ./providers
    providers/
      apiKey.ts      Anthropic Messages API + key; complete() + renderUi() (forces render_ui)
      claudeCli.ts   Shells out to `claude -p` (runs on your Claude Code / subscription)
      index.ts       resolveProvider() — AI_PROVIDER=auto|api-key|claude-cli
src/
  shared/
    blueprint.ts     Blueprint DSL types + IPC/tool contract constants
    fixtures/
      pricingCard.ts The hardcoded pricing card (used when no ANTHROPIC_API_KEY)
  services/
    aiClient.ts      Renderer wrapper for window.flow, with a web-only fallback
  interpreter/
    interpret.ts     Blueprint -> validated CanvasNode tree (drops hallucinations,
                     assigns ids, forces a container root); returns an issue report
  design-system/
    primitives.ts    The ONLY file allowed to contain raw hex / px values
    tokens.ts        Semantic token unions (SpaceToken, ColorRole, ...)
    catalog.ts       Pure-data half: Zod schemas + controls + metadata (no React)
    registry.tsx     catalog.ts + the React render() for each component
    promptSpec.ts    catalog.ts -> machine spec + the LLM system prompt
  model/
    nodeTree.ts      CanvasNode { id, type, props, children } + tree helpers
  store/
    flowStore.ts     Zustand doc store; commit(recipe,label) == one undo step
    chatStore.ts     The AI conversation; send() -> IPC -> applyAgentBlueprint; session usage
    settingsStore.ts Chosen model + effort, persisted to localStorage
  shared/
    models.ts        Model list, effort levels, pricing for the spend estimate
  canvas/
    Canvas.tsx       The stage (Stack/flex layout only — no absolute X/Y)
    NodeRenderer.tsx  Tree -> React via the registry; bad nodes render a placeholder
  app/               Toolbar, ComponentPalette, LayersPanel, Inspector, AgentPanel (chat)
```

## IPC contract

```
renderer                         main process
--------                         ------------
aiClient.generateUI(prompt)
  window.flow.generateUI(prompt)
    ipcRenderer.invoke('ai:generateUI', { prompt })
      ───────────────────────────────▶  ipcMain.handle -> handleGenerateUI
                                          Zod-validates { prompt }
                                          orchestrator.generateUI(prompt)
      ◀───────────────────────────────  GenerateUIResponse (Blueprint JSON only)
```

The renderer never sees the API key, model config, or network call — only a
`GenerateUIResponse` ({ ok, blueprint | error, meta }).

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
  chosen by `AI_PROVIDER`. `.env` read only in main. No provider → fixture.
- **Phase 5 (done): Orchestration pipeline** — `electron/ai/ai-orchestrator.ts`
  `generateUI(userPrompt)`:
  1. **Planner** — `provider.complete()` with the "Product Blueprint" system prompt
     (design guidelines + a11y rules + layout patterns) → a short prose plan.
  2. **Generator** — `provider.renderUi()` constrained to the `render_ui` tool schema
     → strict Blueprint JSON from the plan.
  3. **Validate** — `validateBlueprint()` (strict Zod, main process; *rejects* rather
     than repairs). On failure the error list is fed back to the Generator; up to
     `AI_MAX_VALIDATION_RETRIES` (2) retries, then the best attempt is returned and
     the renderer's interpreter cleans up the rest.
  All steps' token/cost usage is summed; the trace shows under each chat reply.

## The pipeline

```
generateUI(prompt)                          electron/ai/ai-orchestrator.ts
  resolveProvider()  ── none ─▶ built-in fixture
       │
  1. provider.complete(buildPlannerPrompt(), [..history, prompt], effort:low)
       │  └─▶ prose plan
  2. ┌── provider.renderUi(buildSystemPrompt('tool'|'json'), ["build this plan: …"])
     │       └─▶ Blueprint JSON
  3. │  validateBlueprint(json)  ── ok ─▶ return
     │       │ errors
     └───────┤  push {assistant: json}, {user: "invalid: …\nfix it"}   (≤ 2×)
             ▼
        return best attempt (interpreter repairs residue in the renderer)
```

## Design System rules

1. No component or the AI may invent styles — only pre-approved token variants.
2. No absolute positioning. Layout is the `Stack` component (flexbox) with token gaps.
3. Every appearance-affecting prop is a token union, enforced at runtime by Zod.
