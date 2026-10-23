# Playbook test log

One entry per round. The test is consistency across rounds (playbook section 8), so each entry says what was held fixed and what was not.

## Round 1: Pompeia card, baseline against playbook-only

Brief: a card for the film "Os Últimos Dias de Pompeia", for contextual interactions, 6 options. The original Pompeia brief is not in the repo; this one was rebuilt from `interview-notes.md` (assumptions marked `Suposição` in the brief). Times were not fixed, so each option invented its own.

| | `pb-test-0` baseline | `pb-test-1` playbook-only |
|---|---|---|
| Who | the `/explore` flow, 6 `proto-explorer`, 6 directions written by the command | one agent told to read `playbook.md`, no explorer instructions |
| Check scripts | ok | ok |

- **Designer's verdict:** `pb-test-1` was closer to the good card, with "much more of a TV look". The baseline kept using more than 2 interaction patterns and some web patterns, not TV.
- **Caveat:** `pb-test-1` also read the exploration template and the kit guides on its own, so the result is playbook plus repo, not playbook alone.
- **Judge (first version of `judge.md`):** baseline 6 of 6 Critical (type of 10 and 12px, `#000000` text on the selected item); playbook-only 3 of 6 Critical (translucent tokens counted as black), 3 Warning only. The judge did **not** find the multiple patterns or web patterns the designer saw; open until the designer points to examples.

## Round 2: same brief, fixed times, playbook-only (`pb-test-2`)

Held fixed: the brief, now with exact data (on air 20h30–22h50, "restam 28 min", rerun 01h10–03h30, genre). Changed: the agent could not read the template, other explorations, `.claude/agents`, `.claude/commands` or the kit guides other than tokens. It could read `judge.md` and run the check scripts.

- Check scripts ok; 6 options, each with one catalog pattern; nothing handles ↑/↓.
- The agent avoided the kit tokens that break the playbook (`text-inverse` is `#000000`, the 10 and 12px type styles, the black scrim) by choosing compliant ones.
- **Judge (second version of `judge.md`):** no Critical; every option has a Warning at most. Closer to the good set: 1, 2 and 4 (closed). Partly crowded: 3 and 5. Closest to the crowded set: 6.
- Not measured: card height in the open states (options 4 and 6) against the 456px cap, contrast of text and the "14" badge over the poster, option 1's 408px `min-height`.

## Gaps the rounds showed

- The kit and the playbook disagree: type styles of 10 and 12px, `text-inverse` as `#000000`, card widths of 158 to 288px against a 1280×720 screen with 40/32 safe area. The playbook gives no rule for how a card relates to the screen.
- No rule for Enter on a whole card (the judge treats it as default, an assumption the designer must confirm), nor for the official age-rating color.
- The page structure the checks need (`.opt[data-option]` with `.opt-content`) is documented only in the exploration template.
- Two judge runs of the same `judge.md` read the rules differently; the second version tightened the pure-black, kit-token and pattern rules. Re-run the judge on a known case after every change to it.

## Calibration against the designer's web-pattern examples

The designer named two web patterns in the baseline: option 1 hides information behind a dropdown (not used on TV), and option 4 underlines "Falta" and "Horário" like hyperlinks with no interaction tied to them. The first judge missed both, because it read option 1 as the catalog pattern "Expandir no lugar". `judge.md` now has a "disclosure look" (Critical) and a "false affordance" (Warning) check.

- **Baseline (`pb-test-0`), re-judged:** found both, plus a third: the "Entrar" button only expands a note. The calibration case now reproduces the designer's reading.
- **Round 2 (`pb-test-2`), re-judged:** option 4 ("Título e um toque") has the same disclosure look (a chevron that turns 180°) and is Critical. The playbook-only run is not free of web looks; what held is type at 14px or more and no pure black.
- The "more than 2 interaction patterns" the designer saw in the baseline is still not reproduced by any judge run; open.

## Page and server

`/__explore/tokens.css` (the kit's tokens, served by the explore server) must be linked in the page head. Round 2 did not link it because its agent could not read the template, so the page rendered unstyled on the server while the check scripts (which open the file directly) still passed. Fixed by hand in `pb-test-2`. The checks do not catch a missing link; the judge should open the page through the server.

## Designer's verdict on round 2

Option 1 of `pb-test-2` ("Pôster inteiro", seletor Agora / Mais tarde) is "the best example the agent has generated": size, use of white space, the title with its info right below, alignment and a working interaction, "even if not so conventional". The judge also put it among the options closest to the good set (Note at most). Candidate for the small "good" set of reference cards (playbook section 10), next to the Pompeia card. Not added yet: that needs the designer's go-ahead and a saved copy of the option.

## Round 3: same brief and fixed data, playbook-only (`pb-test-3`)

Changed from round 2: `judge.md` now names the disclosure look and the false affordance, and carries the page format (`/__explore/tokens.css` link, `.opt[data-option]` structure); the agent had to open the page through the explore server before finishing; it could not read `design-brain/toolbox/references/` (the saved good card).

- Page styled on the server (the page and its CSS answered 200). Check scripts ok. No chevron, no arrow, no false affordance in the agent's own check.
- **Judge:** no Critical. Options 1 (Cartaz) and 2 (Agora e Mais tarde): Note only, closer to the good set. Option 4 (Entrar ou ver depois): Warning, closer to the good set (the selected card's text is about 3.8:1 and its soft text about 3.0:1, the judge's own calculation). Options 3 (Linhas que crescem), 5 (O tempo como protagonista) and 6 (Texto primeiro): Warning, closer to the crowded set (many pieces, an image of 72 to 112px, and in 5 and 6 Enter does not open the film).
- Option 3's rows unfold in place with no arrow: a borderline case, a Note for the designer.
- Option 6 invented a function ("Avisar na reprise") that the brief does not have.
- Not measured: the card sits loose in a grid, not on a 1280×720 stage with 40/32 safe area; the browser could not be driven by the judge, so "styled" comes from the 200s and the CSS content, not a capture.

## Three playbook-only rounds, side by side

| | Round 1 (`pb-test-1`) | Round 2 (`pb-test-2`) | Round 3 (`pb-test-3`) |
|---|---|---|---|
| Critical options | 3 of 6 (first judge, translucent tokens as black) | 1 of 6 (chevron, option 4) | 0 of 6 |
| Closest to the good set | not recorded | 1, 2, 5 | 1, 2, 4 |
| Closest to the crowded set | 5 | 3, 6 | 3, 5, 6 |
| Pure black, type under 14px | none in the options | none | none |

The judge changed between rounds, so the columns are not strictly comparable. What repeats: type at 14px or more, no pure black, one catalog pattern per option, and the same two or three options landing near the crowded set (many pieces, a small image, Enter that does not open the film).

## Open rule: Enter on a whole card

Three rounds produced options where Enter does something else (switches a view, turns on a reminder, expands a row) while the playbook says the card is the button. The playbook has no rule for it; the judge's assumption (Enter that activates the card does not count as a pattern) does not say what to do when Enter already has another use. The designer decides.

## Designer's review of round 3

- **Option 1 (Cartaz), "by far the best, again":** the framed use of the image, the gap between the info in the body, and the status, time and schedule section stand out. To improve: (1) the title broke after "Dias", leaving "de" to start the second line and a large river; the break should come after "de". (2) A capital on every word of the title is unnecessary. (3) The age rating is loose in the layout, in no group of information: it could overlay the image or, better, sit in a metadata section under the title.
- **Option 2:** the best use of this interactive element so far. The content (image and title) on top and the interaction below, with each section's info, is well divided. To improve: switching sections should show the correct info for that section.
- **Option 6:** the path was very interesting. The genre should sit next to the age rating to form a metadata group right under the title. The reminder toggle ("Avisar na reprise") was "simply EXCELLENT": the function the agent invented and the judge flagged as a Warning was valued by the designer. An invention that is justified and fits the interaction can be a strength, so the judge should not count it against an option by itself.
- None of the three points the designer made on options 1, 2 and 6 was found by the judge. `judge.md` now has four more checks (line breaks, capitalization, loose element, a selector that does not change the content). The checks are not yet calibrated: re-run the judge on `pb-test-3` to see if it now finds them.
- The playbook's explorer role does not point to `design-brain` concepts (`tipografia-de-detalhe` already has the balanced-break rule, `grupo-por-espaco` has grouping), so the explorer never read them. Open: whether the Explorer role should.

## Enter and focus rule (designer's decision)

The designer wrote a rule for cards: direct focus, Enter fires only the focused node, four card types, D-pad resolution, no long press, no nested horizontal controls. Scope chosen: **grid cards only**; the Content Card of a contextual interactivity (the Pompeia card) keeps its internal ←/→, so the saved good card and the segmented selector stay valid. Added to `playbook.md` ("Focus and Enter in grid cards") and to the judge's checks. The repo's key table (`--teclas`) is correct and stays: in a prototype Down from a card with nothing below focuses the Back button, Up with nothing above does nothing. The playbook's vertical order applies only to type 4 (two buttons inside one card), rare but possible; the playbook text was changed to say "the nearest element" instead of "the adjacent row". `rules.ts` was not compared. The rounds so far were Content Cards, so none was tested against the grid-card table.
