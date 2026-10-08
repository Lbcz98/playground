# Playground DTV

The DTV kit, its rules book, and the checks that hold a screen written as TSX to both.
Designers write screens with Claude Code in `web/protos/<designer>/`; the screens are the
handoff to developers, so they use kit components, kit props and tokens only.

The Electron desktop app this repository started as (canvas, store, AI orchestrator) was
retired in October 2026. What is left of it is listed under "Legacy still in the tree".

## The path a screen takes

```
Claude Code  →  web/protos/<designer>/<screen>.tsx  →  npm run check:laws  →  /deploy  →  pull request  →  CI
```

- How to write a screen: [`web/protos/CLAUDE.md`](web/protos/CLAUDE.md).
- The shared app that shows them: [`web/README.md`](web/README.md).
- A flow is a folder with one `.tsx` per state and a `flow.ts`: [`web/protos/standards/flow.md`](web/protos/standards/flow.md).

## Run

```bash
npm install
npm run browsers:install   # once: the Chromium the render check uses
npm run storybook          # the kit, and the Storybook MCP agents read (http://localhost:6006)

npm run check:laws -- web/protos/<designer>/<screen>.tsx   # or a flow folder
npm run typecheck
npm test
npm run lint:tokens        # no hard-coded colors, px or arbitrary Tailwind values in src/
npm run tokens:check       # generated tokens and guides match tokens/tokens.json and rules.ts
```

The shared app has its own install: `cd web && npm install && npm run dev`.

## What is where

```
tokens/tokens.json           the design tokens (source); npm run tokens:build compiles them
src/primitives/              Box, Stack, Text and the token helpers
src/ui-kit/                  the DTV components and <Screen>
src/shared/design-system/    the rules book (rules.ts), the validator, layer models, flow rules
src/shared/layout/           frame rules, and the audit of a rendered screen (renderAudit.ts)
src/shared/export/           TSX ↔ blueprint (toTsx.ts, fromTsx.ts), flow.ts reader, comment grammar
scripts/check-laws.ts        the gate: tsc, raw values, imports, layers, focus, the rules book, the render audit
scripts/render-audit.ts      paints a screen in headless Chromium (scripts/render-harness) and measures it
scripts/deploy.ts            /deploy: branch, commit, pull request, CI, for one designer folder
scripts/pr-report.ts         the sticky pull request comment, from check:laws --json
scripts/build-guides.ts      writes web/protos/generated/{tokens,rules}.md
web/                         the shared Next.js app: web/protos/<designer>/<screen>.tsx → /<designer>/<screen>
tests/checks/                the conformance corpus and the end-to-end run of the gate
.github/workflows/protos.yml CI: `kit` (typecheck, tests, tokens) and `protos` (folder lock, laws, build)
```

## The rules

`src/shared/design-system/rules.ts` is the one book. A **law** always holds. A **pattern** may be
broken on purpose with `@deviation <ruleId>: <why>`. A **convention** only produces a note.
`web/protos/generated/rules.md` is generated from it; `npm run tokens:check` fails when they drift.

`check:laws` reads a screen back into a blueprint (`fromTsx.ts`) and runs the same validator on it,
then renders it and measures the real DOM. What the reader cannot follow (a `.map`, a computed prop)
is listed as "not read" and counted; the render audit still applies to it.

## Legacy still in the tree

These are reached only by tests, and stay until those tests are moved to the DTV manifest, because
they are the fixtures the validator's own tests are written against:

- `src/interpreter/` (Blueprint → canvas tree, with repairs) and `src/model/nodeTree.ts`
- `src/shared/design-system/screenflow-manifest.ts`, `src/design-system/catalog.ts`, `registry.tsx` (the built-in ScreenFlow catalog)
- `src/shared/templates/` (reference screens written against that catalog)
- `src/design-system/promptSpec.ts` (the prompts of the retired orchestrator)
- `src/canvas/ScreenFrame.tsx` and `ScreenTemplates.stories.tsx` (the reference screens in Storybook)

`docs/plan-AI-Orchestration.md` and `docs/rules-checks/` describe the work that led here; they are history.
