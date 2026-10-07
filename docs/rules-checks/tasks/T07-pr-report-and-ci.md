# T07 — PR report and CI gate

**Goal.** Reviewers see, on the PR, every declared deviation, reuse, proposal and unread construct; blocking findings fail the job; a render audit that could not run fails the job.
**Requirements.** R8 (Q10, Q11). **Depends on.** T01, T02, T03, T04. **Wave.** 3.

## Touches
`scripts/check-laws.ts` (`schemaVersion` only), `scripts/pr-report.ts` (+ test, new), `scripts/post-pr-comment.ts` (+ test, new), `.github/workflows/protos.yml`, `package.json`, `tests/checks/__snapshots__/**`.

## Read first
`.github/workflows/protos.yml`, `scripts/deploy.ts` and `scripts/deploy.test.ts` (how `gh` is simulated in tests), the final `LawReport` type after T01–T04.

## Requirements
1. **Stable JSON.** `check:laws --json` prints `{ "schemaVersion": 1, "reports": LawReport[] }`. Before changing the shape, `grep` for consumers of `--json` and update them.
2. **`scripts/pr-report.ts`** — a pure function from that JSON to markdown, plus a CLI (`npm run pr:report -- report.json`). The output starts with the marker `<!-- protos-report -->`, then a one-line summary (screens checked; blocking problems; advisories; deviations; reuses; proposals; unread constructs and coverage), then sections: Blocking problems, Legibility warnings, Declared deviations (`ruleId — why`, file:line), Primitives and proposals, Not read, Flow edges. Sorted and deterministic; truncated at 60,000 characters with "and N more".
3. **`scripts/post-pr-comment.ts`** — finds a comment containing the marker and updates it, else creates one (via `gh api`). Never creates a second comment. On a fork or a read-only token it does nothing and exits 0; the same markdown always goes to `$GITHUB_STEP_SUMMARY`.
4. **Workflow.** Replace the laws step with: `npm run check:laws -- --json --require-render <screens> > report.json` capturing the exit code without stopping; then build the markdown, post it, write the summary; last, fail the job if the laws step failed. `permissions: pull-requests: write`. The folder-lock step and the build step stay unchanged.
5. A legibility-only report exits 0 and still appears in the comment. A blocking report exits 1.

## Acceptance criteria
- **AC1** A corpus-built folder containing every feature (logic, a primitive with reuse, a local component with proposal, links, one deviation, one legibility warning) → `check:laws --json --require-render` → `pr-report` → markdown equal to a committed snapshot, and containing every section.
- **AC2** The comment poster, tested with a fake `gh` as in `deploy.test.ts`: first run creates, second run updates the same comment, no duplicates; a read-only-token run exits 0 without posting.
- **AC3** The workflow YAML parses, every script and `npm run` it references exists, and (if `actionlint` is installed) it passes.
- **AC4** A legibility-only fixture exits 0 and the comment lists the warning; a blocking fixture exits 1; with `CHROMIUM_PATH=/nonexistent` the job's laws step exits 1.
- **AC5** Report output for the same JSON is byte-identical across runs and independent of file order in the input.
- **AC6** Gates green, test count not lower.

## Mutation probes
Drop `--require-render` from the workflow command in a scratch copy → AC3's reference test fails. Make the poster always create → AC2 fails.

## Honest limit (state it in the report)
The workflow was not run against real GitHub. The first real PR is the test (Q18).

## Out of scope
Preview hosting. Branch protection. Changing the folder lock.

## Report back
Status, commit sha, the final JSON schema (field list), the consumers of `--json` that were updated, the snapshot path.
