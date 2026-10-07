# Progress ledger

Maintained by the orchestrator. Statuses: `todo`, `in_progress`, `verified`, `blocked`. Update this file and commit it (`progress: Txx <status>`) after every verdict.

Base: `spike/tsx-exporter` @ `786521d` · Branch: `feat/rules-and-checks`

| Task | Title | Depends on | Status | Commit | Rounds | Verdict file | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| T00 | Baseline and conformance corpus | — | verified | 8d99e29 | 0 | verdicts/T00.md | |
| T01 | Render findings: laws block, legibility warns | T00 | verified | 0f8d468 | 1 | verdicts/T01.md | |
| T05 | Generated guides and drift check | T00 | verified | 5b4a53c | 0 | verdicts/T05.md | |
| T06 | ScreenFlow boundary guard | T00 | verified | 48279bc | 0 | verdicts/T06.md | |
| T02 | Free-form TSX: logic, local imports | T01 | verified | 4ed92ca | 0 | verdicts/T02.md | |
| T03 | Primitives and local components | T02, T05 | verified | 23a08bd | 0 | verdicts/T03.md | |
| T04 | Flow across screens with `<Link>` | T03 | verified | 341e4b8 | 0 | verdicts/T04.md | |
| T07 | PR report and CI gate | T01, T02, T03, T04 | in_progress | | 0 | | |
| T08 | Designer guide, e2e, final sweep | T01–T07 | todo | | 0 | | |

## Spec conflicts raised
_(task, what the spec assumed, what the code showed, the user's decision)_
- T03 · Gate 2 · spec gave `@proposal <proposed API>` only, but the validator needs why, description, proposedApi · user: structured `@proposal` JSDoc block with fields `why`, `description`, `figma`, `proposedApi` (map of prop -> type string). Designers do not hand-write it: a conversational agent intake (4 questions: what/behavior/why new/Figma link) compiles it. Intake instructions are agent-md content; not part of T03 code unless inside its Touches (otherwise T08 designer guide).
- T03 · Gate 1 · TSX `Stack` is always the kit Stack container (PRIMITIVE_TAGS maps only Box/Text) · user: keep as container, leave rules.ts alone, record in AC5 case note.
- T04 · AC2 · spec expected a JSDoc `@deviation flow.next-level` on the component to be honored; RULE_SCOPE marks flow.next-level and flow.link-roles as node-scope, so a screen-level declaration is a blueprint.dsl error · user: declare on the node, `{/* @deviation flow.next-level: … */}` right before the <Link>; AC2 amended accordingly; JSDoc declaration gets the existing "declare it on the node" message; flow.rail-consistency stays declarable in JSDoc; no rule or flexibility change.
- T04 · Touches · next/link render alias must live in scripts/render-audit.ts (outside Touches) · user: allowed, minimal edit, reported as a deviation.

## Decisions taken during the work
_(date, task, decision, who decided)_
- 2026-10-07 · T05 · one-word `export` on NAME_FAMILIES in scripts/tokens/compile.ts (outside Touches) accepted · orchestrator (no spec approval category)
- 2026-10-07 · T01 · merging T01 after T05 made rules.md stale (render.legibility); regenerate via guides:build in a T01 fix commit · orchestrator
- 2026-10-07 · T04 · optional `measured` field added to RenderResult in scripts/render-audit.ts (beyond the approved next/link alias) accepted · orchestrator, reported to user
