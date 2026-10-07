# T06 — ScreenFlow boundary guard

**Goal.** Make "the new path does not depend on ScreenFlow" a tested fact, and a ratchet that can only get smaller.
**Requirement.** R7 (Q14). **Depends on.** T00. **Wave.** 1 (parallel with T01, T05).

## Touches
`tests/checks/boundary.test.ts` (new). Nothing else.

## Read first
`src/design-system/catalog.ts`, `registry.tsx`, `src/shared/design-system/screenflow-manifest.ts`, the imports of `scripts/check-laws.ts`, `scripts/render-check.ts`, `scripts/deploy.ts`, `src/shared/export/*.ts`, `scripts/dtv-manifest.ts`.

## Requirements
1. Build the import graph (TypeScript's import scanning with the repo's path alias; relative and `@/` imports) from these entry points: `scripts/check-laws.ts`, `scripts/render-check.ts`, `scripts/deploy.ts`, `src/shared/export/*.ts`, and the sources under `web/` (excluding `node_modules`).
2. Forbidden set, reachable from none of them: `src/design-system/catalog.ts`, `src/design-system/registry.tsx`, `src/shared/design-system/screenflow-manifest.ts`, `src/store/**`, `src/canvas/**`, `src/app/**`, `electron/**`.
3. **First compute the real graph.** If the TSX path already reaches a forbidden module (transitively), do not hide it: record each current offender in an explicit allowlist with a comment saying the chain (entry → … → forbidden). The allowlist may only shrink: the test fails if an allowlisted offender is no longer reachable (so it must be removed from the list).
4. Nothing is deleted or moved. The exporter, the 9 templates and the round-trip test stay as they are.

## Acceptance criteria
- **AC1** `npx vitest run tests/checks/boundary.test.ts` passes at the task commit.
- **AC2** The report lists the allowlist (or states it is empty) with the chain for each entry.
- **AC3** Probe (scratch copy): add `import '@/canvas/Canvas'` to `scripts/check-laws.ts` → the test fails and names the chain.
- **AC4** Probe (scratch copy): remove an allowlisted offender's import → the test fails asking for the allowlist entry to be removed.
- **AC5** `git diff <base>..HEAD --stat` shows only the new test file.
- **AC6** Gates green, test count up by the new tests only.

## Out of scope
Removing any dependency found. (Report it; the user decides.)

## Report back
Status, commit sha, the allowlist with chains.
