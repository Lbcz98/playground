# T02 — Free-form TSX: logic, local imports, measured blindness

**Goal.** Let designers write real code (hooks, `.map`, computed props, local data) without losing the safety net, and make the checker's blind spots countable.
**Requirement.** R3 (Q5). **Depends on.** T01. **Wave.** 2 (sequential: T02 → T03 → T04).

## Touches
`scripts/check-laws.ts`, `src/shared/export/fromTsx.ts` (structured "not read"), `tests/checks/corpus/cases.ts`, tests next to the changed modules.

## Read first
The import visitor in `scripts/check-laws.ts` (only `react`, `@/primitives`, `@/ui-kit/*` pass today), the `warn(...)` calls in `fromTsx.ts`, `web/protos/lucas/*.tsx` for real screens.

## Requirements
1. **Import policy.** Allowed: `react`; `@/primitives`; `@/ui-kit/*`; a relative import that resolves **inside the same designer folder** (data `.ts`/`.json`, helpers, and `./components/*.tsx`, which T03 handles). The designer folder is the nearest ancestor path segment pair `web/protos/<name>/`; for files outside `web/protos` (corpus, tests) it is the entry file's directory. Not allowed: another designer's folder, a path that escapes the folder, any other `@/…` path (for example `@/store`), npm packages (T04 adds `next/link`), absolute paths, images and `.svg`. A violation is a `component.api` problem whose message lists the allowed forms.
2. **Data modules.** A local file with no JSX is exempt from the raw-value regexes (assumption 2 in the spec); it is still compiled by tsc. A local file with JSX is held to every law.
3. **Structured "not read".** `fromTsx` keeps the existing human-readable `warnings` strings and adds `notRead: { line: number; kind: string; message: string }[]`, with `kind` one of `computed-prop`, `iteration`, `spread`, `text`, `conditional`, `other`. `LawReport` gets `notRead` and `coverage: { read: number; notRead: number }`, where `read` is the number of JSX elements converted into blueprint nodes and `notRead` the number of skipped constructs.
4. Hooks, `.map`, computed props and conditionals never cause a problem by themselves. The render audit still runs on such screens.

## Acceptance criteria (corpus cases unless stated)
- **AC1** `logic-map-clean`: a rail built with `.map` over a local array: exit 0, `notRead.length ≥ 1`, `coverage.notRead ≥ 1`.
- **AC2** `logic-map-clipped` (render): same shape with too many rows for the card: exit 1 from the render audit.
- **AC3** `import-own-data`: `import { items } from './data'` → exit 0.
- **AC4** Each of these fails with `component.api` and a message that lists the allowed forms: `import-other-designer`, `import-escapes-folder`, `import-alias-store` (`@/store/...`), `import-npm-package`, `import-svg`.
- **AC5** `data-module-raw-value`: a data file with no JSX containing the text `"12px"` → exit 0. The same text in a screen file → `tokens.only`.
- **AC6** `--json` output has `notRead` and `coverage` for every file; the old `warnings` strings are byte-identical to before for the existing cases.
- **AC7** Gates green, test count not lower.

## Mutation probes
Make the import check always pass → the five forbidden-import cases fail. Remove the `tokens.only` exemption logic → AC5's data case fails.

## Out of scope
`next/link` (T04). Local components and `@proposal` (T03). Any change to which constructs `fromTsx` can read.

## Report back
Status, commit sha, the `kind` mapping, how the designer folder is inferred, anything in `web/protos/lucas/*.tsx` that the new policy rejects.
