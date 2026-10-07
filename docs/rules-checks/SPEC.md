# Spec — Rules and checks for the Next/TSX path

Status: draft v1 (7 Oct 2026). Source of every requirement: the four-round decision session (Q-numbers below). Base branch: `spike/tsx-exporter`. Work branch: `feat/rules-and-checks` (local only, nothing is pushed).

## 1. Context

The designer's real workflow is Claude Code → TSX in `web/protos/<designer>/` → `npm run check:laws` → `/deploy` → PR → CI. The validator, rules book, exporter, `fromTsx` and the render audit in `src/shared` and `scripts/` are the safety net for that path. The Electron canvas is frozen.

What exists today (verified on `spike/tsx-exporter`):

- `scripts/check-laws.ts` — tsc against the kit, `tokens.only` regexes, host-element and import checks, `layers.stack`/`focus.single` statically, then `fromTsx` → blueprint → `validateBlueprintAgainstManifest(..., 'exploratory')` with the DTV manifest, then the render audit in headless Chromium. Exit 1 on any problem, including every render finding.
- `src/shared/export/fromTsx.ts` — reads `<Screen>`, kit elements, literal props and `@deviation <ruleId>: <why>` comments. Anything else comes back as a "not read" string warning. Only `Box` and `Text` become `primitive:*`.
- `src/shared/layout/renderAudit.ts` — `RenderIssue.ruleId` is `'frame.layout' | 'layers.stack'`. Text overlap and squeezed text are reported as `frame.layout`.
- `.github/workflows/protos.yml` — folder lock, `npm ci`, Chromium install, `check:laws` on touched screens, `web` build. No PR comment.
- `rules.ts` already has `primitives.reuse` (law), `primitives.budget` (law), `registry.new-component` (pattern) and the `flow.*` patterns.

## 2. Scope

In scope: the "rules and checks" decisions — Q5 (free-form code), Q6 (no mode picker), Q10 (render gate), Q11 (PR summary), Q12 (primitives and local components), Q13 (flow via `<Link>`), Q14 (ScreenFlow out of the new path), Q20 (generated guides).

Out of scope (separate work): `npm run doctor`, preview hosting, branch rules and CODEOWNERS, repo move, `/figma`, deleting Electron, Globoplay, any push/PR/merge. Nothing is deleted from the repo in this work.

## 3. Requirements

| Id | Requirement | Decision | Task |
| --- | --- | --- | --- |
| R1 | One flow, no mode choice. `check:laws` always validates in Exploratório with the DTV manifest; a pattern break is declared with `@deviation <ruleId>: <why>`; laws are never deviation-able. Behavior is locked by a conformance corpus. | Q6 | T00 |
| R2 | Render findings: `frame.layout` (cut off, past the frame) and `layers.stack` (covering fill) **block**. Legibility findings (text overlapping text, text squeezed to nothing) **warn** — printed and reported, exit 0. If the render audit cannot run, `--require-render` makes that a failure (CI uses it). | Q10 | T01 |
| R3 | A designer may write TSX with logic (hooks, `.map`, computed props) and import local modules from their own folder. What the checker cannot read is listed as "not read", counted, and exposed in JSON so it can be measured. The render audit still applies. | Q5 | T02 |
| R4 | Primitives (`Box`, `Text`, and `Stack` if T03 finds it is one) need `@reuse <KitComponent>: <why>`; a local component under `web/protos/<designer>/components/` needs `@proposal: <proposed API>`. Missing either is a problem. The primitive budget from `primitives.ts` is enforced. | Q12 | T03 |
| R5 | Navigation between screens is a real `next/link` `<Link href>`. `fromTsx` reads it as `goTo`, and the existing `flow.*` rules run across the folder's linked screens. A broken link is a problem. | Q13 | T04 |
| R6 | `web/protos/generated/tokens.md` and `rules.md` are generated from `tokens/tokens.json` and `rules.ts`. `npm run tokens:check` and `npm test` fail when they drift. | Q20 | T05 |
| R7 | The TSX path does not import the ScreenFlow catalog, the canvas, the store or Electron. Guarded by a test; nothing is deleted; the exporter and the 9 templates stay. | Q14 | T06 |
| R8 | CI posts one sticky PR comment listing every declared `@deviation`, every `@reuse`/`@proposal`, every "not read" item, legibility warnings and flow edges. Blocking findings fail the job. | Q10, Q11 | T07 |
| R9 | `web/protos/CLAUDE.md` and `/deploy` describe the final behavior, and an end-to-end test covers a realistic designer folder. | all | T08 |

## 4. Global definition of done

A task is done only when **all** of these hold, as shown by the independent verifier (not by the implementer's own report):

- **G1** Every acceptance criterion in the task file passes, using the exact commands written there.
- **G2** On the task commit: `npm run typecheck`, `npm test`, `npm run lint:tokens`, `npm run tokens:check` are green; after T05 also `npm run guides:check`.
- **G3** No weakened tests. No deleted or skipped tests, no loosened assertions, and the total test count never goes down against the previous verified commit, unless the task file says so.
- **G4** Every new check has a positive and a negative corpus case, and a mutation probe (disable the check in a throwaway copy) makes the negative case fail.
- **G5** Scope: only files listed under the task's `Touches`, plus tests and generated outputs. Anything else is reported, not changed.
- **G6** Every new problem or advisory names the rule id, the file and line, and what to do about it, in the same style as the existing messages.
- **G7** Rules book: a new rule id is registered in `rules.ts` with flexibility, category and source. No existing rule's flexibility, no layer model and no token value changes without the user's explicit approval. Generated guides are regenerated in the same commit when `rules.ts` or `tokens.json` change.
- **G8** Frozen surface unchanged in behavior: `electron/**`, `src/canvas/**`, `src/app/**`, `src/store/**`, the ScreenFlow catalog. Type-only fallout is allowed if reported.
- **G9** No raw design values in `src/` (`lint:tokens`), no new runtime dependency. A new devDependency needs a line in the task report.
- **G10** Honest status: anything that could not run (for example no Chromium) is stated. A skipped render test is not a pass; the task is `BLOCKED`.
- **G11** One commit per task, titled `Txx: <title>`. No push, no force, no `--no-verify`, no work on `main`.

## 5. How the work is evaluated

1. **Mechanical acceptance criteria** per task (commands with expected exit codes and outputs).
2. **Independent verification.** A verifier agent that never sees the implementer's report re-runs everything on the commit, reviews the diff against G3/G5/G7, and runs mutation probes.
3. **A growing corpus** in `tests/checks/corpus/cases.ts`: each case is a set of TSX files as strings plus the expected laws, exit code and warnings. Created in T00 from current behavior, extended by every later task.
4. **A ledger** in `docs/rules-checks/PROGRESS.md` (status, commit, rounds needed, verdict file) and `docs/rules-checks/REPORT.md` at the end with measured numbers: test count before/after, `check:laws` time per screen with and without render, corpus size, number of spec conflicts raised, rounds per task.

A task is `verified` only if every AC and every gate is PASS. One FAIL is a FAIL. `BLOCKED` means the check could not run.

## 6. Tasks and order

| Task | Title | Depends on | Wave |
| --- | --- | --- | --- |
| T00 | Baseline and conformance corpus | — | 0 |
| T01 | Render findings: laws block, legibility warns, `--require-render` | T00 | 1 (parallel) |
| T05 | Generated guides and drift check | T00 | 1 (parallel) |
| T06 | ScreenFlow boundary guard | T00 | 1 (parallel) |
| T02 | Free-form TSX: logic, local imports, measured blindness | T01 | 2 (sequential) |
| T03 | Primitives and local components | T02, T05 | 2 (sequential) |
| T04 | Flow across screens with `<Link>` | T03 | 2 (sequential) |
| T07 | PR report and CI gate | T01, T02, T03, T04 | 3 |
| T08 | Designer guide, end-to-end acceptance, final sweep | T01–T07 | 4 |

Wave 1 tasks have disjoint file sets and can run in parallel (separate worktrees, merged in task order). Wave 2 tasks all touch `fromTsx.ts` and `check-laws.ts`, so they run one after another.

## 7. Assumptions to confirm (recommended default in bold)

1. **Own-folder imports.** Q5 said "real data" but never said how it gets imported. Default: **allow relative imports that resolve inside the designer's own folder.** (T02)
2. **Data modules.** Files with no JSX are exempt from the raw-value scan, since appearance props are token-typed and tsc catches a raw value at the use site. Default: **exempt.** (T02)
3. **`Stack`.** Existing tests import `Stack` from `@/primitives` and `fromTsx` treats it as a kit container, but `rules.ts` lists `primitive:Stack` under `appliesTo`. Default: **keep `Stack` as a container; the implementer reports the finding and does not edit `rules.ts`.** (T03, gate)
4. **Legibility rule id.** Default: **register one new `convention`-level rule `render.legibility`** so it shows up in the generated guide. (T01)
5. **Links the checker cannot read** (computed `href`, `<Link>` wrapping zero or several kit elements): default: **"not read" warning, not an error.** A link to a screen that does not exist is an error. (T04)
6. **More than 6 screens.** A blueprint document holds at most 6 screens, a folder can hold more. Default: **validate each connected component of the link graph; if one component alone exceeds 6, say flow rules were not checked for it and do not block.** (T04)
7. **Generated guide language.** Default: **rule statements verbatim from `rules.ts` (English), headings in Portuguese like `web/protos/CLAUDE.md`.** (T05)
8. **Claude Code specifics** (the `--agent` flag, the subagent tool name) were not verified against the docs. The kit works through the `/rules-checks` command either way.

## 8. Known hazards

- `next/link` must resolve in three places: the root `tsc` that `check:laws` runs (the root repo is Vite, Next lives in `web/`), the Vite render harness (`scripts/render-harness`), and the `web/` build. (T04)
- `check:laws` currently exits 0 when Chromium is missing (it prints the reason and continues). In CI that is a silent pass. (T01)
- `lint:tokens` and the root `tsc` both see `tests/` and `scripts/`. Corpus fixtures must therefore be strings inside `.ts` files, written at test time into a git-ignored folder, as `src/shared/export/checkLaws.test.ts` already does.
- A `<Link>` renders an `<a>` around a kit element that may itself be a button. Nested interactive content and the focus ring need a look in the `web/` build. (T04)
- CI changes cannot be executed here. The first real PR is the test (this is Q18, owned by the user).
