# T00 — Baseline and conformance corpus

**Goal.** Record a green baseline on the base branch, and build the corpus every later task extends. This is the evaluation harness for the whole effort.
**Requirement.** R1 (behavior locked). **Depends on.** nothing. **Wave.** 0.

## Touches
`docs/rules-checks/BASELINE.md` (new), `tests/checks/**` (new), `.gitignore`, `package.json` (one script). **No production code.**

## Read first
`scripts/check-laws.ts`, `src/shared/export/checkLaws.test.ts` (fixture style to copy), `src/shared/export/renderAudit.test.ts` (how Chromium tests skip themselves), `vitest.config.ts`.

## Gates (stop and report `spec_conflict` if any is false)
- The base branch's `typecheck`, `test`, `lint:tokens`, `tokens:check` are green on a clean install. If red, do not fix anything; report which command and the first failure.

## Requirements
1. Run on a clean install and write `BASELINE.md`: each gate command, exit code, number of test files and tests, wall time. Also state whether Chromium is installed and whether the render integration tests ran or skipped.
2. Create `tests/checks/corpus/cases.ts` exporting `CorpusCase[]`:
   ```ts
   interface CorpusCase {
     id: string                       // unique, kebab-case
     title: string
     files: Record<string, string>    // relative path -> TSX/TS source, as strings
     entry: string                    // the file check:laws is run on
     expect: {
       exit: 0 | 1
       laws: string[]                 // problem rule ids, sorted
       notRead?: number               // minimum count of "not read" warnings
       deviations?: string[]          // declared rule ids
       render?: boolean               // needs Chromium; the case self-skips without it
       note?: string                  // why the expectation is what it is
     }
   }
   ```
3. Create `tests/checks/corpus.test.ts` (static + validator, no render) and `tests/checks/corpus.render.test.ts` (cases with `render: true`; self-skips like the existing integration test). Fixtures are written at test time into `.checks-corpus/<id>/`, which is git-ignored and removed afterwards.
4. Add `"test:checks": "vitest run tests/checks"` to `package.json`.
5. Initial cases, **characterizing current behavior** (run the current code, review the output, then record it; never guess an expectation): `clean-home`, `tokens-raw-hex`, `tokens-inline-style`, `host-element`, `foreign-import`, `no-screen`, `unknown-model`, `focus-two`, `focus-zero`, `level0-no-focus`, `pattern-undeclared`, `deviation-declared-ok`, `deviation-unused`, `logic-map-not-read`, plus render cases `render-covering-fill` and `render-clipped`. At least 16 cases in total.
6. If a recorded behavior looks wrong, keep it, add `note:` and report it. Do not fix it here.

## Acceptance criteria
- **AC1** `docs/rules-checks/BASELINE.md` exists with all four gate results, counts and times.
- **AC2** `npm run test:checks` exits 0, with ≥ 16 cases and unique ids (the test itself asserts uniqueness).
- **AC3** After running it, `git status --short` shows nothing new; `.checks-corpus` is in `.gitignore`.
- **AC4** `npm run typecheck` and `npm run lint:tokens` are still green (the corpus is invisible to both).
- **AC5** `git diff <base>..HEAD --stat` touches only the files under Touches.
- **AC6** Render cases either run and pass, or the report says plainly that they skipped (and the task is `BLOCKED` for AC-render, not passed).

## Mutation probes
- Empty the `RAW` array in a scratch copy of `scripts/check-laws.ts` → `tokens-raw-hex` and `tokens-inline-style` fail.
- Make the import check always pass in a scratch copy → `foreign-import` fails.

## Out of scope
Fixing any behavior. Changing production code. Adding cases for features that do not exist yet.

## Report back
Status, commit sha, the list of case ids, anything that looked wrong (with the case id), and what could not run.
