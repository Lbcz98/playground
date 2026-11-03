# QA: Capacity-Based Truncation for the Technical Sheet Card

## Purpose

Evaluate a capacity-based line rule for `TechnicalSheetCard` before implementation: show more of a field when there is room, without making the card taller than the About card next to it.

Three rounds were run. Round 1 tested a first version and found where it breaks. Round 2 applied a field priority and a 2-line cap. Round 3 applied the decisions recorded below. The component is not changed; everything here is a test of the rule.

## Final Rule

1. **Capacity.** The Technical Sheet uses the height of the About card as its line budget. Budget = lines that fit after padding, title and gaps. The 4 px gap between fields is charged once per visible field boundary, not per line (4 lines at the standard About height of 177 px, 5 lines at 194 px).
2. **Priority.** Cast, Directors, Screen Writers, Author, Art Director.
3. **Allocation.**
   1. Each field gets 1 line, in priority order, while the budget lasts.
   2. Fields that need more get a second line, in priority order. The cap is 2 lines per field.
   3. Cast only: if budget is left once every field has what it needs, Cast gets a third line (cap 3 for Cast).
4. **Cast is always visible**, even in a 4-field card where every field gets one line.
5. **Not enough budget.** Fields left without a line are hidden, lowest priority first. This is accepted behavior (the viewer gets no sign that a field was dropped). Hiding a field also frees its gap, which can free one more line.
6. **Single field.** Capped like any other: 2 lines, or 3 for Cast. An ellipsis can appear.
7. **Long names.** `overflow-wrap: anywhere` on the fields, so a name without spaces wraps instead of being clipped sideways.
8. **Recalculation.** Re-run when the About card height or the sheet width changes, and when fonts finish loading. Run it on the next animation frame, never inside the `ResizeObserver` callback, and only when the observed inputs changed.

Field display order stays as it is today (Direção, Direção artística, Elenco, Roteiro/Autor). Priority only decides who gets lines.

## Decisions Recorded

| Question | Decision |
| --- | --- |
| Can Cast be hidden or reduced to nothing? | No. Cast is high priority in every content, even when 4 fields share 4 lines. |
| Silent hiding of lower-priority fields | Accepted; documented here. |
| 2-line cap | Applies to every field. If the other fields are on one line and Cast still has room, Cast may use a 3rd line. |
| Long names | Add `overflow-wrap: anywhere`. |

## Method

- Prototype: `web/protos/lucas/bug-home-login`, screen `schedule-detalhe-1` ("Por Você"), at `http://localhost:3000` (not `127.0.0.1`: the dev server blocks that host).
- Stage: 1280 × 720 scaled to 1920 × 1080. Line height 20 px.
- The rule is a temporary script run in the page. Script: `docs/qa-technical-sheet-stress.js`. Paste it in the DevTools console on the detail screen. It labels each scenario on screen, shows the card before and after, and prints a results table.
- Note: an intermediate version of the script charged the field gap to every line, which under-counted lines on About cards taller than standard (194 px gave 4 lines instead of 5). That was a test bug, fixed before the results below. A run started while another was still going also interleaved and was discarded; the script now refuses to start twice.

## Round 1: First Version

Spare lines handed out in row order, minimum one line per field, no cap.

| Problem | Result |
| --- | --- |
| Short About card (budget 2) with 3–4 fields | Sheet grew to 151–175 px against 137 px. "One line per field" and "never taller than About" cannot both hold. |
| Single field with 40 names | Current behavior: 323 px against 177 px. Capacity rule: stopped at 4 lines with an ellipsis, breaking the old "single field has no ellipsis" rule. |
| Three fields each needing 2 lines, 1 spare | Row order decided who won. Not a product decision. |
| Name without spaces | Clipped sideways by 225 px with no ellipsis. |
| About text shortened after allocation | About shrank to 137 px, sheet stayed at 171 px until re-run. |

These led to the priority, the cap, the hide fallback, `overflow-wrap` and the recalculation.

## Round 3: Final Results

23 scenarios. Every one keeps height parity with the About card and keeps Cast visible. `…` marks a field that ends in an ellipsis.

### Standard About height (177 px, budget 4)

| # | Scenario | Lines per field |
| --- | --- | --- |
| 01 | Direção short, Elenco 4 names | Direção 1, Elenco 2 (in full) |
| 02 | Elenco 15 names | Direção 1, Elenco 3 … |
| 03 | Série, 4 long fields | 1 line each; Direção, Elenco, Roteiro truncated |
| 04 | Novela, 4 long fields | 1 line each; Direção, Elenco, Autor truncated |
| 05 | 4 short fields | 1 line each, nothing truncated |
| 06 | 3 fields each needing 2 lines | Direção 1 …, Elenco 2 …, Roteiro 1 … (priority gives the spare line to Cast) |
| 07 | Elenco short; Direção and Roteiro need 2 | Direção 2, Elenco 1, Roteiro 1 … |
| 11 | Single field, 40 names | Elenco 3 … |
| 12 | Single field, short | Elenco 1 |
| 14 | Elenco needs 4 lines | Direção 1, Elenco 3 … |
| 15 | Name without spaces | Wraps onto 2 lines, no sideways clipping |
| 17 | Direção needs 2 lines, long cast | Direção 2, Elenco 2 … (Cast cannot take a 3rd line: the budget is used) |
| 19 | 4 fields, long cast | 1 line each; Elenco visible on 1 line … |

### Smaller or taller About card

| # | Scenario | Budget | Lines per field |
| --- | --- | --- | --- |
| 08 | 1-line synopsis, 3 fields | 2 | Direção 1, Elenco 1 …, **Roteiro hidden** |
| 09 | 1-line synopsis, 4 fields | 2 | Direção 1, Elenco 1 …, **Direção artística and Autor hidden** |
| 10 | 2-line synopsis, 4 fields | 3 | Direção 1, Elenco 1 …, Roteiro 1, **Direção artística hidden** |
| 18 | 1-line synopsis, 4 fields, long cast | 2 | Direção 1, Elenco 1 … (visible), **Direção artística and Roteiro hidden** |
| 13 | 2-line title, Direção 2 + long cast | 5 | Direção 2, Elenco 3 … |
| 16 | 2-line title, short Direção and Roteiro, long cast | 5 | Direção 1, Elenco 3 …, Roteiro 1 |

### Dynamic changes (no manual re-run)

| # | Change | Result |
| --- | --- | --- |
| 20 | About shrinks to a 1-line synopsis | Re-ran once; Roteiro hidden; parity kept |
| 21 | About grows (2-line title) | Re-ran once; lines redistributed; parity kept |
| 22 | Sheet narrowed to 340 px | Re-ran once; parity kept |
| 23 | Fonts finish loading (simulated) | Re-ran; parity kept |

Running the recalculation inside the `ResizeObserver` callback raised `ResizeObserver loop completed with undelivered notifications`. Moving it to the next frame removed the warnings.

## Findings

### What works
- Priority makes the outcome predictable (06, 07).
- Cast gets the room: 3 lines whenever the budget allows it (02, 11, 13, 14, 16) and stays visible when it cannot (18, 19).
- Height parity holds in every scenario.
- Long names wrap instead of clipping.
- Resize, narrower sheet and font events are handled automatically.

### Accepted trade-offs
- **Four fields share the budget evenly.** A Série or Novela with Direção, Direção artística, Elenco and Roteiro/Autor uses all 4 lines at 1 line each, so Cast is cut after about three names. Cast is visible, as decided.
- **Fields can disappear.** With a short About card, up to two fields are hidden with no indication.

### Remaining limits
1. **Mid-name ellipsis.** A plain line clamp can cut a name in half ("Lázar…"). Truncating only between names needs item-aware fitting. Not decided yet.
2. **Cast stays at 2 lines when other fields use the budget.** In 17 the cast needs more but Direção has the second line. This follows from the priority-then-leftover rule.
3. **Font loading was simulated.** The font-ready path is wired and re-runs, but a real slow font was not observed.

## Implementation Notes

- Measure each field's unclamped height, then apply `-webkit-line-clamp` per row.
- Line budget = `floor((available height − gaps between visible fields) / line height)`. Each hidden field frees its gap, so pick the largest number of visible fields `v` where `linesFor(v) >= v` (one line each), then share `linesFor(v)` lines among the top `v` fields by priority. (The shipped component does this; the QA script iterated instead, which gave the same results in these scenarios.)
- Implemented in `src/ui-kit/TechnicalSheetCard.tsx` (measuring and observing) and `src/ui-kit/technicalSheetLines.ts` (the allocation, unit-tested in `technicalSheetLines.test.ts`).
- Observe the About card height and the sheet width with `ResizeObserver`. Re-run on the next animation frame, only when those inputs changed.
- Also re-run on `document.fonts` `loadingdone` and whenever the field values change.
- Use `overflow-wrap: anywhere` on the fields.
