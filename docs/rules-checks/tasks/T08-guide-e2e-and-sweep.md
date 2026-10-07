# T08 — Designer guide, end-to-end acceptance, final sweep

**Goal.** What designers read matches what the checker does, one end-to-end test covers a realistic folder, and the whole effort is measured.
**Requirement.** R9. **Depends on.** T01–T07. **Wave.** 4.

## Touches
`web/protos/CLAUDE.md`, `.claude/commands/deploy.md` (minimal edit), `tests/checks/e2e.test.ts` (new), `docs/rules-checks/REPORT.md` (new), `docs/rules-checks/PROGRESS.md`, regenerated guides.

## Requirements
1. **`web/protos/CLAUDE.md`** (Portuguese, same voice, about 120 lines at most): logic and own-folder imports; primitives with `@reuse`; local components with `@proposal`; `<Link>` for flow; blocking findings vs legibility warnings; no mode to choose; links to `generated/tokens.md` and `generated/rules.md` (never copy their content). Every command it names must exist.
2. **`/deploy` command**: one added line saying legibility warnings do not block and the `@reuse`/`@proposal` comments are part of the contract. Nothing else.
3. **`tests/checks/e2e.test.ts`**: build a temporary designer folder (`web/protos/ana/` layout inside `.checks-corpus/e2e/`) with four screens: home with a `.map`, a primitive with `@reuse`, a local component with `@proposal`, links home → rail → detail, one declared deviation, one legibility warning (render part self-skips without Chromium). Run `check:laws --json --require-render`, pipe into `pr-report`, and assert every section is present. A second variant with one broken law must exit 1.
4. **`REPORT.md`**: for each of R1–R9, what changed and the evidence (command and result). Measured numbers: test count before and after, `check:laws` wall time per screen with and without render, corpus size, rounds per task and spec conflicts raised (from `PROGRESS.md`). Open follow-ups, including: the exporter writing `<Link>`; the `--json` consumers; anything marked BLOCKED.
5. **Final sweep** (by a fresh verifier): all gates; `guides:check`; `git diff <base>..HEAD --stat` reviewed against the Touches of every task; no `TODO`/`FIXME` introduced without a line in `REPORT.md`.

## Acceptance criteria
- **AC1** Every `npm run …`, file path and `@` token mentioned in `web/protos/CLAUDE.md` exists (a script extracts and tests them).
- **AC2** `e2e.test.ts` passes; the broken-law variant exits 1.
- **AC3** `REPORT.md` has all nine requirements with evidence and the measured numbers filled in, no placeholders.
- **AC4** `npm run guides:check`, `typecheck`, `test`, `lint:tokens`, `tokens:check` are green.
- **AC5** `git diff <base>..HEAD --stat` shows no file outside the union of the tasks' Touches.
- **AC6** (informational, not pass/fail) A fresh subagent given only `web/protos/CLAUDE.md` and the generated guides writes two linked screens for a prompt of the user's choice; record the number of `check:laws` rounds it needed in `REPORT.md`.

## Out of scope
Anything in the "Out of scope" list of the spec.

## Report back
Status, commit sha, the REPORT summary (five lines), BLOCKED items.
