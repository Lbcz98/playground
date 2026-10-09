# Report — rules and checks for the Next/TSX path

Branch `feat/rules-and-checks`, 7 Oct 2026. Nothing was pushed. Commands below were run on the T08 commit unless noted.

## Honest limits (read first)

- Nothing was pushed. The CI workflow (`.github/workflows/protos.yml`) has never run against real GitHub. It was checked by a YAML parse and regex only (actionlint is not installed).
- The PR comment poster (`pr:comment`) was tested only against a fake `gh`. The `gh api` argument shape, `--jq` marker selection, `--paginate`, the PATCH path and fork detection are unverified. The first real PR is the test (Q18, owned by the user).
- There is no squeezed-text corpus case: about 15 variants were tried and no kit component collapses text below 4 px. Squeezed text is covered at the measurement level only.
- Intake agent text for `@proposal`: the user wants a conversational intake (4 questions: what is it / how does it behave / why new / Figma link) that compiles the structured `@proposal` block. It is described briefly, in Portuguese, in `web/protos/CLAUDE.md` ("Primitivos e componentes locais"). It is not a separate agent or command, and nothing enforces that the agent follows it.
- AC6 (fresh subagent writing two linked screens from the guide only) was **not run** by the T08 implementer; the orchestrator handles it. Rounds needed: not run.

## R1–R9: what changed and the evidence

| Id | What changed | Evidence |
| --- | --- | --- |
| R1 | One flow, no mode: `check:laws` always validates Exploratório; `@deviation` declares a pattern break; laws are never declarable. Locked by a conformance corpus (T00). | `npm run test:checks` (corpus 51 cases); verdicts T00, T02. |
| R2 | `frame.layout` and `layers.stack` block; `render.legibility` (new convention rule) warns, exit 0; `--require-render` fails when Chromium cannot start. | `tests/checks/checkLaws.cli.test.ts` (4 CLI cases + routing unit test); corpus `render-text-overlap`; verdict T01 (1 round). |
| R3 | Hooks, `.map`, computed props and own-folder imports are allowed; unreadable constructs are listed, counted and in `--json` (`notRead`, `coverage`). | corpus `logic-map-clean`, `data-module-raw-value`; CLI `--json` test; verdict T02. |
| R4 | `@reuse <Kit>: <why>` for `Box`/`Text`; `@proposal` block for components in `components/`; primitive budget enforced. `Stack` stays a kit container. | corpus `primitive-*`, `local-component-*`; verdict T03. |
| R5 | `<Link href="/<designer>/<screen>">` is read as `goTo`; `flow.*` run across linked screens; broken links fail. Render alias for `next/link`; `web` build green. | corpus `link-*`; `tests/checks/link.render.test.ts`; `npm run build --prefix web` (T04 verdict). |
| R6 | `web/protos/generated/tokens.md` and `rules.md` generated; drift fails `tokens:check`, `guides:check` and `npm test`. | `npm run guides:check`: green on the T08 commit. |
| R7 | Boundary guard: the TSX path does not import ScreenFlow catalog, canvas, store or Electron (one allowlisted type-only import). | `tests/checks/boundary.test.ts`; verdict T06. |
| R8 | CI posts one sticky PR comment with every section; blocking findings fail the job. | `scripts/pr-report.ts`, `scripts/post-pr-comment.ts`, `scripts/workflow.test.ts` (fake `gh` only); the e2e test renders every section from a real run. Not run on GitHub. |
| R9 | `web/protos/CLAUDE.md` rewritten (about 70 lines, Portuguese); `/deploy` got one line; end-to-end test over a realistic folder; a test checks that every `npm run`, path and `@` token the guide names exists. | `tests/checks/e2e.test.ts` (5 tests, ran with Chromium); `npm test`. |

## Measured numbers

- **Tests**: 88 files / 1324 tests at baseline (`BASELINE.md`); 99 files / 1425 tests on the T08 commit (`npm test`).
- **Corpus**: 51 cases in `tests/checks/corpus/cases.ts` (17 tests at T00).
- **`check:laws` wall time** (Chromium installed, includes `npm run` and vite-node start-up, one run each, noisy):
  - one screen (`web/protos/lucas/home-schedule.tsx`): 1.4 s with `--no-render`, 2.5 s with `--require-render`;
  - two screens: 2.0 s without render, 3.7 s with render.
  - The render audit costs about 1.1 s for the first screen (browser launch) and about 0.6 s per further screen.
- **Rounds per task** (from `PROGRESS.md`): T00 0, T01 1, T05 0, T06 0, T02 0, T03 0, T04 0, T07 0. T08: see its verdict.
- **Spec conflicts raised**: 4 entries in `PROGRESS.md` (`@proposal` grammar, `Stack` as container, flow deviation scope, and the T04 Touches exception for `scripts/render-audit.ts`). 3 decisions taken during the work.

## Open follow-ups

- The exporter (`toTsx`) still writes no `<Link>` for `goTo`; exported TSX has no navigation.
- `--json` consumers: only `pr-report` reads it. `check:laws --json` and `check:flow --json` both write `{ schemaVersion: 1, reports, findings }` (`scripts/findings.ts`); `pr:report` reads one file or a folder of them. Declared deviations carry `file:line`.
- `<a><button>` nested interactive content and the focus ring were not checked in a browser; the web `<a>` is inline while the harness uses `display: contents` (T04).
- T06 saw one unexplained failure in a parallel probe run, not seen again.
- First real PR: the workflow, the poster and fork detection are untested.
- A squeezed-text corpus case.
- A skipped render case reports as passed with only a `console.warn`; this also holds for the new e2e test when Chromium cannot start. CI uses `--require-render`, so the gate itself does not skip.
- T08 scope deviation: `.gitignore` got one line (`.checks-corpus-e2e`) because other tests clean the shared corpus folders in parallel.
- No `TODO`/`FIXME` was introduced in the T08 diff.
- BLOCKED items: none.
