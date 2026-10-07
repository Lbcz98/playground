# T01 — Render findings: laws block, legibility warns, `--require-render`

**Goal.** Split render findings into blocking and advisory, and let CI refuse to pass when the render audit could not run.
**Requirement.** R2 (Q10). **Depends on.** T00. **Wave.** 1 (parallel with T05, T06).

## Touches
`src/shared/layout/renderAudit.ts` (+ its test), `scripts/render-audit.ts`, `scripts/check-laws.ts`, `src/shared/design-system/rules.ts` (only to register `render.legibility`), `tests/checks/corpus/cases.ts` (add cases), `scripts/render-check.ts` only if a type change forces it.

## Read first
`src/shared/layout/renderAudit.ts` (every message `auditRenderIssues` can emit), `scripts/check-laws.ts` (`main()`: how render problems are appended and how `RenderAuditUnavailable` is swallowed), `scripts/render-audit.ts` (`PLAYWRIGHT_PATH`, `CHROMIUM_PATH`, `RenderAuditUnavailable`), `src/shared/layout/renderAudit.test.ts`.

## Facts to confirm before coding
- Today `RenderIssue.ruleId` is `'frame.layout' | 'layers.stack'`, text overlap and squeezed text are `frame.layout`, and `main()` pushes every render message as `law: 'render'`, so all of them fail the run.
- `RenderAuditUnavailable` prints to stderr and the run continues with exit 0.
If either is false, stop and report `spec_conflict`.

## Requirements
1. Add `severity: 'block' | 'warn'` to `RenderIssue`. **Block:** content cut off by the container that clips it; a node past the frame edge; a container covering the frame with a background (`layers.stack`). **Warn:** text overlapping other text; text squeezed to nothing. Write the full message→severity mapping as a table in the unit test names.
2. Register one `convention`-level rule `render.legibility` in `rules.ts` (title, statement, category, source) and use it as the id of the warn-level findings.
3. `check:laws`: exit 1 only for blocking problems. Legibility goes to a separate `advisories: LawProblem[]` array on `LawReport` and is printed with a distinct `advisory` prefix. `--json` prints `problems`, `advisories`, `deviations`, `warnings` per file. `warnings` (the "not read" strings) is unchanged.
4. `--require-render`: if the render audit cannot run for any reason (missing Playwright or Chromium, harness error), exit 1 with a message that names the cause. Without the flag, behavior is unchanged except that "render check did not run" is now also present in `warnings` (it already prints).
5. `auditRender` (the messages-only function) and every consumer outside `check:laws` (`scripts/render-check.ts`, `electron/**`, the canvas) keep their current behavior: all findings, as before.

## Acceptance criteria
- **AC1** Unit tests in `renderAudit.test.ts` assert the severity of each finding type (all of them, matching requirement 1).
- **AC2** Corpus render cases: covering fill → exit 1; clipped content → exit 1; text overlap → exit 0 with one advisory; squeezed text → exit 0 with one advisory; clean screen → no problems and no advisories. If a legibility case cannot be built from kit components with tokens, cover it at the measurement level and say so in the report.
- **AC3** `npm run check:laws -- <mixed screen> --json` prints `problems` and `advisories` separately, and the exit code follows `problems` only.
- **AC4** With `CHROMIUM_PATH=/nonexistent`: with `--require-render` the exit code is 1 and the message names the cause; without the flag the exit code is 0 for a clean screen and "render check did not run" is visible.
- **AC5** `git diff <base>..HEAD` has no changes in `electron/**`, `src/canvas/**`; their tests are green and the test count has not dropped.
- **AC6** `render.legibility` is in `rules.ts` with flexibility `convention`.

## Mutation probes
- Make overlap blocking in a scratch copy → the overlap corpus case fails (exit 1 instead of 0).
- Make `--require-render` a no-op → AC4's test fails.

## Out of scope
Changing what the audit measures or its thresholds. Touching the blueprint-path retry loop. Wiring CI (T07).

## Report back
Status, commit sha, the message→severity table, how legibility cases were built (or why not), anything unexpected in the existing audit.
