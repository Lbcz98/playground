# Playbook test log

The explorations of each round live next to this file, in `tests/pb-test-N/` (brief, page and judge report). Serve one with `npm run explore:serve -- design-brain/toolbox/tests/pb-test-N`.

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

## Round 4: the two commands on the same brief (`cmp-1-explore`, `cmp-1-playbook`)

`/explore` (as it is) against the new `/explore-playbook` (`.claude/commands/explore-playbook.md`: the same flow, plus each `proto-explorer` reads `playbook.md` and `judge.md`, and the independent judge runs at the end). Same brief with the fixed data, same 6 directions written by the command, same judge (`judge.md` with the round 3 checks). Single run of each; the 6 explorers of each side ran in parallel.

| | `/explore` | `/explore-playbook` |
|---|---|---|
| Check scripts | ok | ok |
| Options with a Critical | 6 of 6 | 0 of 6 |
| Why | type of 10 and 12px and `#000000` (`text-inverse`) in every option; a disclosure chevron in option 1 | none |
| Closer to the good set | 1, 2, 3, 5, 6 | 2, 5 |
| Closer to the crowded set | 4 (in part) | 1, 3, 4, 6 |
| Title breaks with "de" opening line 2 | all 6 | 2 (options 3, 5); 4 and 6 break after "de" but leave "Pompeia" alone |
| Loose element (rating, status line) | options 4, 5, 6 | options 3, 5, 6 |
| Selector that does not change the content | none | option 5 (the sentence follows the focus, not the choice) |
| Focus ring always drawn, no resting state | not judged | options 1, 3, 4, 5, 6 |

How to read it:
- The Criticals disappear with the playbook because the explorers read `judge.md`, the same checklist the judge uses. That part is coached, not independent evidence.
- On the closeness to the good set, which the explorers were not coached on, the judge put the playbook side **further** from it (4 of 6 near the crowded set against 1 of 6). The playbook side added more pieces and groups (genre, derived data, a status number larger than the title). One judge, one run: treat it as a signal, not a verdict.
- Independence break: option 4 of `/explore-playbook` opened another option's part file to learn the format; the agent said it only used the token names.
- The explorers of `/explore` share a screenshot folder; option 1 of `/explore` saw another option's image and redid its captures.
- The designer's own reading of the two pages is still needed.

## Designer's review of round 4

- **`/explore`, best: option 5** (two-button choice). The info inside the buttons improved a lot: excellent alignment, icon + text + time. To go further: put the live status and the time left above the title, in one group, and use the image on the whole card.
- **`/explore-playbook`, best: option 2**, "even better than the option 1 we had saved": the best hierarchy, contrast, alignment, spacing, rounding and interaction.
- **Honorable mention, `/explore-playbook` option 5:** the best use of the content section, and the buttons reveal the information below when they take focus: no click needed to see the data.
- **Bad, `/explore`:** option 4, "nothing makes sense": the main interaction should be the time / schedule toggle, but navigation moves across the information of each section, a huge "restam 28 min" steals the attention from the content, and the rating is lost among the info. Option 1: the dropdown again, plus items stacked vertically while navigation uses ←/→, which conflicts with the arrangement.
- **Bad, `/explore-playbook`:** option 3 has too much text; option 6 puts navigation on a timeline but the text is compressed, with no breathing room.

### Designer against the judge

| Designer | Judge |
|---|---|
| best: `/explore` 5, `/explore-playbook` 2 | both closer to the good set (2 with no Warning) |
| bad: `/explore` 4 | closer to the crowded set (in part); web look, loose rating and a repeated "restam 28 min" found |
| bad: `/explore` 1 | disclosure chevron found (Critical), but placed "closer to the good set" |
| bad: `/explore-playbook` 3 and 6 | both closer to the crowded set; too much text and the invented figure found |
| honorable: `/explore-playbook` 5 | closer to the good set, but a Warning for the sentence following the focus: the designer praised that |

Where the judge differed: it flagged "the sentence follows the focus, not the choice" as a fault; the designer calls it the strength of option 5. `judge.md` now treats information that follows the focus as a strength. The judge also missed the axis mismatch in `/explore` option 1 (a vertical stack under ←/→) and the oversized status in `/explore` option 4; both checks are now in `judge.md`, and the playbook has a matching preference.

The designer's "best" in `/explore-playbook` (option 2) is a candidate for the good set, replacing or joining the saved `pompeia-poster-card`. Not added yet.

## Round 5: a second brief, the BBB participant card (`bbb-1-explore`, `bbb-1-playbook`)

New brief: an informational card with no interaction (photo, name, age, estalecas, emojis received; one participant per card), 4 options, fixed data (Camila Duarte, 27, 3.250 estalecas, 🐍 12 · 💔 7 · 🌱 5 · 🎯 3; the photo is a placeholder), the same 4 directions for both commands. Same judge. Also: `references/pompeia-seletor-card/` was saved as the second good card (the designer's pick from round 4).

| | `/explore` | `/explore-playbook` |
|---|---|---|
| Check scripts | ok | ok |
| Options with a Critical | 3 of 4 (1, 2, 4) | 0 of 4 |
| Why | text of 12px (`text-footnote`) where 14px exists | none |
| Closer to the good set | 2, 3, 4 (4 at the limit) | 1, 2, 3 |
| Closer to the crowded set | 1 | 4 (in part) |
| Looks clickable with no interaction | emoji pills in all 4 | emoji blocks in options 3 and 4 |
| Loose element | option 4 (estalecas) | option 4 (estalecas) |
| A number or status louder than the name | options 2 and 4 (Note, justified by the thesis) | options 2 and 4 (Note, justified by the thesis) |

- The Criticals disappear on the playbook side for the same reason as in round 4: the explorers read `judge.md`. Not independent evidence.
- On closeness to the good set the two sides tie: 3 of 4 each. The playbook side has no Critical; the `/explore` side has 3. One run each.
- Both sides drew the emojis as chips or blocks that look like controls in a card with no interaction. The brief said "nothing that looks clickable"; neither side avoided it fully.
- Independence breaks: option 4 of `/explore-playbook` read the first lines of another option's part file (it says it drew its own). Round 4 had a similar break.
- The designer's review of these pages is still needed.

## Designer's review of round 5 (the BBB card)

- **`/explore-playbook` was closer to the good cards.** Options 1 and 3 were the best, with a very good layout. Option 1 used a gradient at the bottom of the photo that "was very, very good". Option 4 was also very good, except that the estalecas at the bottom were completely disconnected.
- **Common fault in the playbook side:** the estalecas were separated from the participant's information. Closer together, the cards would be really good.
- **`/explore`, best: option 1.** A very interesting layout: the name highlighted, the age below, the estalecas below. Same wish: the participant's information and the estalecas closer together. The `/explore` options have a font size that is not ideal, too small ("I imagine it is still using 10 and 12px"). The judge agreed: it found `text-footnote` (12px) in 3 of the 4.

### Designer against the judge

| Designer | Judge |
|---|---|
| playbook options 1 and 3 best | both closer to the good set (Warning at most) |
| playbook option 4 very good except the estalecas | closer to the crowded set; found the loose estalecas |
| `/explore` option 1 best | Critical (12px) and **closer to the crowded set**: the judge disagreed |
| `/explore` fonts too small | Critical, 12px: agreed |
| gradient at the bottom of the photo ("very, very good") | Warning for the scrim: the judge disagreed |
| estalecas split from the participant info | not found as such (only option 4's loose estalecas) |

`judge.md` now: a bottom gradient scrim over a full-bleed photo is not a finding; a new check "related data split apart"; and a card is not called crowded only because its information sits together on a full-bleed photo. `playbook.md` has a matching preference. Not re-run: the judge on the BBB pages with these changes.

### Round 5, judge run again with the updated `judge.md`

| | `/explore` | `/explore-playbook` |
|---|---|---|
| Options with a Critical | 3 of 4 (1, 2, 4: `text-footnote` of 12px) | 0 of 4 |
| Closer to the good set | all 4 | all 4 (option 4 at the limit) |
| Related data split apart (Warning) | 2, 3, 4 (option 1: none, "one stack") | all 4 |
| Scrim over the photo | not a finding | a Note, not measured |

- **Now agrees with the designer:** the 12px text in `/explore` (Critical); `/explore` option 1 is no longer "closer to the crowded set"; the bottom gradient in `/explore-playbook` option 1 is a Note, not a Warning; the estalecas split from the participant's info is found in all four `/explore-playbook` options.
- **Still differs:** the designer also wants the estalecas closer to the participant info in `/explore` option 1; the judge found nothing there ("one stack"). The judge's "closer to" is now generous (8 of 8 near the good set), so it no longer separates the two sides; the designer's own reading did.
- The judge changed after the review it is being checked against, so this agreement is partly tuned, not independent.

## Round 6: the BBB brief again, after `DESIGN.md` (`bbb-2-playbook`)

Same brief as round 5 (copied from `bbb-1-playbook`), run with `/explore-playbook` after `design-brain/DESIGN.md` existed: the explorers read it, the judge cites it by section and number. The kit now has the 24/32px insets, the Content Card image variant and the card scrim. Judge run with the updated `judge.md` (12px footnote is a Note, 10px or less is Critical).

| | round 5 `/explore-playbook` | round 6 `/explore-playbook` |
|---|---|---|
| Check scripts | ok | ok (8 advisories for loose px sizes) |
| Options with a Critical | 0 of 4 | 0 of 4 |
| Closer to the good set | 1, 2, 3 (4 in part) | all 4 (3 with a density caveat, 4 at the limit) |
| Estalecas split from name and age (Warning) | all 4 | options 2 and 3, as their thesis asks |
| Scrim over the photo | a Note, not measured | a Note, matches `gradient-complementary-dark` |

- **New findings, citing `DESIGN.md`:** option 2's anchor is 2x the support, not 3x for a short number (§2.1); option 4 puts each emoji in a box (§7.2) and the boxes look like choices no key reaches (§9); option 1 has the same gap between groups as inside them (§7.1); option 3 has nine text pieces (§1).
- **Kit vs playbook (Note):** option 4's 56px emoji is off the type scale; the kit has no token for it.
- **Not measured by the judge:** the name's line break in options 1 and 3, and the final height of options 2 to 4 (option 3 estimated near the 456px limit).
- **Caveats:** one run, no designer review yet; the judge changed after the round-5 review, so the agreement with it is partly tuned. `/explore` (without the playbook) was not re-run.

## Gold set

The two lines above that say "not added yet" (round 2 option 1, round 4 `/explore-playbook` option 2) describe the moment of the review. Both cards were already saved, and the markup matches the test pages:

- `references/pompeia-poster-card/` is pb-test-2 option 1 ("Pôster inteiro"). Designer, round 2: "the best example the agent has generated" — size, white space, the title with its info right below, alignment, and a working interaction, "even if not so conventional".
- `references/pompeia-seletor-card/` is cmp-1-playbook option 2 ("Seletor segmentado"). Designer, round 4: "even better than the option 1 we had saved" — the best hierarchy, contrast, alignment, spacing, rounding and interaction.

Each folder has a `why.md` with that note. `references/gold.json` lists them, and `references/gold-sheet.png` is the contact sheet (`node scripts/gold-sheet.mjs`). `/explore` puts two or three of these, sheet plus notes, in every explorer pack. The explorer studies them and does not copy the HTML.

## Round 7: the BBB brief again, with the closed critique loop (`bbb-3-loop`)

Pending designer review.

Same brief as round 6 (`bbb-2-playbook`), four options, same content and the same four theses. The designer was not available, so the two interview rounds were not run and no new intent was written. The brief has no Direção visual and no Foco; Prioridade from round 6 stands in for the focal group. Two mechanical edits were required before the packer and the stitch would accept that brief, and they are noted under bugs. Nothing in the flow's code, agents or commands was changed.

Who ran what. Round 6 was Claude; this log did not record the exact model id. This round is also Claude, via the local `claude` CLI on the user's account (`claude -p`, cwd = the worktree for `cursor/exploration-gold-critique-d1ea`, never the checkout at `/Users/lucas/playground`):

| Role | Tool | Model the CLI resolved |
|---|---|---|
| Four explorers, and the one follow-up that added option 3's controls | `claude -p --model sonnet --effort high --agent proto-explorer` | `claude-sonnet-5-5` |
| Art director, both critique rounds | `claude -p --model opus --effort high --agent proto-art-director` | `claude-opus-5-5` |
| Playbook judge, both rounds | `claude -p --model opus --effort high` (the judge in `design-brain/toolbox/judge.md`, not the tune judge) | `claude-opus-5-5` |

A Grok explorer pass was started by mistake and its parts were moved aside. Three of those explorers finished after the page was already stitched. The option 1 explorer wrote `docs/explorations/bbb-3-loop/parts/1.html` and replaced option 1 on the stitched page. The published option 1 is that card: the Sonnet adjustment only changed `--cabeca-topo` to 52%, `--ombro-altura` to 50%, and the shoulder radius. Options 2, 3 and 4 stayed the Sonnet cards. The late write did not touch the user's checkout, and it did not change the page again after this round was committed. Codex was only probed (`gpt-6.1-sol`) and did not write an option, a critique or a judgment. The comparison with round 6 is still confounded if that round used an older Claude snapshot than Sonnet 5.5 and Opus 5.5.

The critique loop ran once through. Wall clock from the first critic pair to the second judge finishing was about 9 minutes. The whole Claude run, from the first explorer to the final shots, was about 16 minutes.

| | Before the loop | After one application (second critique said `none: ready`) |
|---|---|---|
| `check-explore-tokens` / `check-explore-layout` | ok / ok | ok / ok, no advisories |
| Options with a Critical | 0 of 4 | 0 of 4 |
| Closer to the gold set | 1, 2, 3 good; 4 closer to the crowded set (filled emoji cells) | all 4 good; 4 still has four equal counts competing for first place |
| Art director | all four Quase, one move each | all four `Um ajuste: none: ready` |
| Estalecas with the name and the age | 1 together on the support line; 2 and 3 split; 4 together | 1 and 4 still together; 3 still split (Note, the thesis asks for two groups); 2 split further (the applied move opened the gap until the name and the estalecas are as far apart as the estalecas and the emojis) |

Moves applied, one per option, then the second critique stopped the loop. No second application.

- Option 1: drop the silhouette so the head fits inside the card and the shoulders start just under it. The black band at the top goes away.
- Option 2: one gap between identity, estalecas and emojis, larger than the gap inside each group (`--dimension-spacing-core-sm`, 16px).
- Option 3: emoji counts to medium and `text-muted`, so 3.250 is the only bold light value in the lower group.
- Option 4: remove the fill and the radius of the four cells; space alone separates each emoji from its count.

Judge, after the loop, besides the estalecas note: option 1's "3.250" is 14px, the same size as the age (Warning, same finding as round 6). Option 2's 56px number is a Note, allowed by the thesis and DESIGN §3.1 for a short numeral, and the 64px avatar is a raw px (Warning). Option 4's 56px emoji is a Warning (round 6 called the same size a Note, "kit vs playbook"), the four 28px counts still share the first place (Warning), and the visible right margin is 77px against 32px on the left (Note). No Critical before or after. The scrim on option 1 was not a finding.

### Against round 6

| | round 6 `/explore-playbook` | round 7 `/explore` + loop |
|---|---|---|
| Check scripts | ok, 8 advisories for loose px | ok, no advisories |
| Options with a Critical | 0 of 4 | 0 of 4 (before and after the loop) |
| Closer to the gold set | all 4 (3 with a density caveat, 4 at the limit) | all 4 after the loop; 4 was on the crowded side before the loop |
| Estalecas with name and age | split on 2 and 3, as the thesis asks; 1 and 4 keep them with the identity | 1 and 4 still keep them. 3 still splits them. 2 is farther apart than in round 6: the number sits in its own band, with a section label, as far from the name as from the emojis |
| Emoji cells that look clickable | option 4, filled boxes | gone after the loop |
| Photo placeholder | a person-shaped silhouette on 1, 2 and 4 | 1 and 3 keep a silhouette; 2 is a generic person icon; 4 invents the initials "CD" |

Shots of both rounds are in `tests/bbb-3-loop/shots/` (final options and `contact-sheet.png`, plus `shots/round6/` re-rendered from the round 6 page). Read against those pictures, not only against the judge:

- This is not a clear improvement on round 6. Criticals were already zero, and they stayed zero.
- Option 1 is the same poster idea as round 6: name on the photo, age and estalecas on one line, emojis along the bottom. The loop fixed a cropped head that round 6 did not have. It did not fix the 14px estalecas.
- Option 4 is the one real gain: the four filled cells that round 6 flagged as fake choices are gone. The cost is the monogram instead of a photo, four equal counts that still compete, and a loose right edge.
- Option 2 got worse for the designer's round-5 request (estalecas closer to the name). Round 6 already separated them; this loop opened the gap on purpose, because the art director asked for equal group spacing. The judge then flagged that equal gap.
- Option 3 is a bit quieter than round 6 (no "Estalecas" / "Emojis recebidos" labels, counts in muted after the loop) and still splits the name from the estalecas, which the thesis asks for and the designer has asked to undo.

### Bugs in the new flow, not fixed here

- `scripts/explore-pack.mjs` exits 1 on **Interação:** `nenhuma (só visual)`, the words round 6 used. It accepts the line only when it contains `estático`. The brief in this folder adds that word; the meaning is unchanged.
- `scripts/explore-stitch.mjs` deletes `parts/` after a successful stitch and refuses to overwrite an existing `index.html`. Option 3 came back without `data-tuned`. Sending it back could only write `parts/3.html`, which the stitch would not merge. The tuned option 3 was spliced into `index.html` by hand (style block and article only).
- The critique expects a Direção visual and a Foco. This brief has neither, because the interview was not re-run. The art director judged Prioridade and each thesis, wrote its own fidelity test, and could still say `none: ready`. "Ready" here does not mean a designer-confirmed thread.
- The untracked `.codex/agents/proto-art-director.toml` in the user's checkout is the older critique ("the designer decides, do not ask the writers to redo"). This run did not use it. The art director was the PR-branch agent `.claude/agents/proto-art-director.md`, which does emit `Um ajuste` / `none: ready`.

The page the explorers wrote also sits, uncommitted, at `docs/explorations/bbb-3-loop/` in the worktree. The saved round is this folder.
