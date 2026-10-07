# Progress ledger

Maintained by the orchestrator. Statuses: `todo`, `in_progress`, `verified`, `blocked`. Update this file and commit it (`progress: Txx <status>`) after every verdict.

Base: `spike/tsx-exporter` @ `786521d` · Branch: `feat/rules-and-checks`

| Task | Title | Depends on | Status | Commit | Rounds | Verdict file | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| T00 | Baseline and conformance corpus | — | verified | 8d99e29 | 0 | verdicts/T00.md | |
| T01 | Render findings: laws block, legibility warns | T00 | todo | | 0 | | |
| T05 | Generated guides and drift check | T00 | todo | | 0 | | |
| T06 | ScreenFlow boundary guard | T00 | todo | | 0 | | |
| T02 | Free-form TSX: logic, local imports | T01 | todo | | 0 | | |
| T03 | Primitives and local components | T02, T05 | todo | | 0 | | |
| T04 | Flow across screens with `<Link>` | T03 | todo | | 0 | | |
| T07 | PR report and CI gate | T01, T02, T03, T04 | todo | | 0 | | |
| T08 | Designer guide, e2e, final sweep | T01–T07 | todo | | 0 | | |

## Spec conflicts raised
_(task, what the spec assumed, what the code showed, the user's decision)_

## Decisions taken during the work
_(date, task, decision, who decided)_
