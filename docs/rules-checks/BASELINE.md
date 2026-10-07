# Baseline (T00)

Branch `feat/rules-and-checks`, code identical to base `786521d`, existing `node_modules`, 7 Oct 2026.

| Command | Exit | Test files | Tests | Wall time |
| --- | --- | --- | --- | --- |
| `npm run typecheck` | 0 | - | - | 4 s |
| `npm test` | 0 | 88 | 1324 | 20 s |
| `npm run lint:tokens` | 0 | - | - | < 1 s |
| `npm run tokens:check` | 0 | - | - | < 1 s |

After T00 (adds the corpus): `npm test` = 90 files, 1341 tests; `npm run test:checks` = 2 files, 17 tests, about 9 s.

Chromium: installed (Playwright `chromium-1243`) and launches. The render integration tests
(`renderAudit.test.ts`) and the two render corpus cases ran; none skipped.
