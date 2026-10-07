# T04 — Flow across screens with `<Link>`

**Goal.** Navigation is real `next/link`, and the existing `flow.*` rules check it across the designer's folder.
**Requirement.** R5 (Q13). **Depends on.** T03. **Wave.** 2.

## Touches
`src/shared/export/fromTsx.ts`, `src/shared/export/flow.ts` (new, if useful), `scripts/check-laws.ts`, `scripts/render-harness/**` (alias for `next/link`), a type shim so the root `tsc` resolves `next/link` (see requirement 1), `web/README.md` (one paragraph), `tests/checks/corpus/cases.ts`, tests.

## Read first
`src/shared/design-system/flow.ts`, the `flow.*` rules in `rules.ts`, how `goTo` and `screens[]` are modeled in `src/shared/blueprint.ts`, `deviations.ts` (`ruleScope`), `scripts/render-harness/main.tsx`, `web/shims.d.ts`, `web/next.config.mjs`.

## Requirements
1. **`next/link` resolves in three places**, with a documented mechanism for each: the root `tsc` that `check:laws` runs (the root repo is Vite; Next is in `web/`), the Vite render harness (alias to a shim whose `Link` renders its child inside an `<a href>` with no layout box of its own), and the `web/` build (the real one). Allowed import in a screen: `next/link`.
2. **Reading.** `<Link href="/<designer>/<screen>">` around exactly one kit element becomes `goTo` on that element, targeting `web/protos/<designer>/<screen>.tsx`. The `href` must be a string literal. A computed `href`, a `<Link>` around zero or several kit elements, or one with no `href` goes to `notRead` (T02's structure), not to a problem. A link to a file that does not exist, or into another designer's folder, is a problem; the message lists the real screen names.
3. **Cross-file validation.** From the screen being checked, load the screens reachable through links in the same folder (read-only) and build a multi-screen document. Run the existing flow rules (`flow.next-level`, `flow.link-roles`, `flow.rail-consistency`) with the DTV manifest in Exploratório. Declared `@deviation flow.*` is honored with the same placement rules as in the blueprint path.
4. **More than 6 screens.** Validate each connected component of the link graph. If one component alone has more than 6 screens, add a `notRead` entry saying the flow rules were not checked for it and do not block.
5. **Attribution.** Checking file F reports F's own problems and the flow problems on links whose source is F. Other files' own problems appear only when those files are passed explicitly.
6. `LawReport` gets `flow: { edges: { from: string; to: string; line: number }[] }`.
7. The `<Link>` wrapper must not change measured layout.

## Acceptance criteria (corpus; multi-file cases)
- **AC1** `link-home-to-rail` (level 1 → 2) → exit 0, one edge in `flow.edges`.
- **AC2** `link-skips-level` (1 → 3) → `flow.next-level`. The same case with `@deviation flow.next-level: …` in the source component's JSDoc → exit 0 and the deviation listed.
- **AC3** `link-missing-screen` → a problem listing real screen names. `link-cross-designer` → a problem.
- **AC4** `link-href-computed` and `link-wraps-two` → exit 0 with `notRead` entries.
- **AC5** `folder-eight-screens` (a linear chain of 8 valid screens) → exit 0; no error about the count.
- **AC6** (render) The kit-node rectangles measured for a screen are identical with and without `<Link>` wrappers.
- **AC7** `npm run typecheck` (root) is green. In `web/`, a screen with two linked routes passes `npm run build --prefix web`; paste the command output in the report. If `web` dependencies are not installed, say so and mark AC7's `web` half `BLOCKED`.
- **AC8** Gates green, test count not lower; `fromTsx.test.ts` round trip untouched and green.

## Mutation probes
Skip the cross-file validation in a scratch copy → `link-skips-level` fails. Make a broken link silent → `link-missing-screen` fails.

## Risks to look at and report on
A `<Link>` renders an `<a>` around a kit element that may itself be a button: check nested interactive content and the focus ring in the `web/` build and say what you see.

## Out of scope
Making the exporter write `<Link>` for `goTo` (note it as a follow-up). Imperative navigation (`useRouter`).

## Report back
Status, commit sha, the three `next/link` mechanisms, the rule ids used for missing and cross-designer links, the AC7 output.
