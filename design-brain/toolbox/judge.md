# Playbook judge

The independent judge of playbook step 4 and section 10 ("the independent judge runs again on what the designer chose"). Run it as a separate agent that reads this file; give it only the exploration slug, never the explorer's account of the work.

It **warns, never intervenes**: it changes nothing in the exploration and blocks nothing. The only file it writes is `<folder>/playbook-judge.md`.

## Inputs

- `<folder>/index.html` (the options) and `<folder>/brief.md` (what was asked). `<folder>` is `docs/explorations/<slug>`, or `design-brain/toolbox/tests/<slug>` for a playbook test round.
- `design-brain/DESIGN.md` (the visual language; cite a rule by section and number, for example "DESIGN §5.1").
- `design-brain/toolbox/playbook.md` (sections 3, 4 and 10 are the rules; cite them).
- The kit: `web/protos/generated/explore-tokens.md` for token values.

The page may carry the explorer's own rationale and findings. They are **claims, not evidence**. Read the rationale only to see whether a deviation was justified (that makes a finding a Note, section 10). Never copy the explorer's findings into yours.

## Page format (the explore server and the check scripts need it)

One self-contained `index.html`. In `<head>`, in this order: `<link rel="stylesheet" href="/__explore/tokens.css">` (the kit's tokens, served by the explore server; without it the page renders unstyled while the scripts still pass), `<link rel="stylesheet" href="../../../src/styles/global.css">` and `<link rel="stylesheet" href="/__explore/inter.css">`. Each option is `.opt[data-option="N"]` containing `.opt-content`, and the card is a child of `.opt-content`. The reference page is `design-brain/toolbox/references/pompeia-poster-card/index.html` (not for the explorer; see below).

## Steps

1. **Run the measuring scripts and keep their output as facts.**
   `node scripts/check-explore-tokens.mjs <folder>` and `node scripts/check-explore-layout.mjs <folder>`.
2. **List, per option, what the source shows** (read each `.opt[data-option]` block, its `.opt-content` card, and the page CSS and script): the keys it handles and what each does; the smallest font size inside the card; the colors that are not neutral; any hover, click, drag, scroll, tooltip, dropdown, text input or animation; the states drawn.
3. **Classify the interaction.** Get the catalog with `node scripts/explore-ref.mjs --padroes` and `--teclas`. Name the one catalog pattern each option follows. More than one pattern, or a behavior in no catalog row, is a law break.
4. **TV, not web.** Anything the remote cannot do is a finding: hover, mouse click, drag, swipe, scroll wheel, tooltips, dropdowns, tabs that need a pointer, text fields. Inside the card only ←/→, Enter and Back act; ↑/↓ must pass through (no `preventDefault`).
   Two web looks the designer has named, to look for in every option's CSS and markup:
   - **Disclosure look (Critical):** a chevron, caret or arrow on a row or piece that opens and closes, or a collapsed row that unfolds like a dropdown or accordion. Expanding in place is a catalog pattern, but on TV the cue is the focus ring and the piece growing, not a drawn arrow. Found in the baseline's option 1.
   - **False affordance (Warning):** something that looks interactive (underline, link color, tab bar, button or pill look) that no key reaches. A label that only names a view is not a tab. Found in the baseline's option 4 (an underline under "Falta" and "Horário", with no key tied to the labels).
   For each element that looks interactive, say which key reaches it. If none does, it is a finding.
   Four more, from the designer's round 3 review (each is a Warning unless the designer says otherwise):
   - **Line breaks:** a title that breaks so a short word starts or ends a line badly (a preposition like "de" starting the second line, a "river" of empty space on the right). The break belongs after the function word, with it kept to the word it ties to. Say where the break fell.
   - **Capitalization:** a capital on every word of a title or label that does not need it. Titles and labels follow sentence case unless a name requires the capital.
   - **Loose element:** a piece (a rating badge, a genre) that sits in the layout without belonging to any group of information. Metadata that belong together (rating, genre, duration) should form one group, close to the title, or sit on the image on purpose.
   - **Selector that does not change the content:** a control that switches sections but leaves the other section's information on screen, or shows the wrong info after the switch. Only that section's information should be shown. Information that follows the focus (the user sees the data without pressing Enter) is a strength, not a finding: the designer praised it in round 4. Flag it only if the chosen state and the information shown contradict each other without a visible cue.
   For a card that sits in a grid or row (playbook, "Focus and Enter in grid cards"): name its type (1 to 4), and check that the focus lands on the right target, Enter fires only the focused node, all four directions leave a type 1, 2 or 3 card, type 4 follows the vertical order, nothing depends on a long press, and no row of chips or other horizontal controls sits inside the card. A break is Critical. A Content Card of a contextual interactivity is not judged by this table; it keeps ←/→ inside.
   Look at the picture, not only the source (round 7): run `node scripts/check-explore-layout.mjs <folder> --shots "$TMPDIR/judge-shots" --keys ArrowRight,Enter` when the page is `ok` (or `node scripts/explore-shots.mjs`), and `Read` the PNG of each option. A chart that is broken or hard to read, a place name lost in the layout, a selector whose radius is not concentric with its card, or a group of weather data split from its selector is a **Warning** (a **Critical** when the graphic cannot be read), said from what the picture shows. When an option replaces an older one (the brief or the page says so), compare them: if it is poorer (less composition, a smaller graphic, a plainer chart) while obeying the new item rules, say so as "Reduce items, not richness" (playbook, round 7).
   Five more, from the designer's rounds 6 and 7 (previsao-do-tempo); each is **Critical** except the resting outline, a Warning:
   - **Too many repeated items:** a row of repeatable items (days, hours, steps, chips) with more than **4** items. The default is 4; more is allowed only when the designer decided it (the report of the explorer states the intent and the reason; the page carries `data-items-ok`). Count the items and name them. The fix is to reframe, not to shrink: "the next 3 days" instead of the 7 of the week. Printed by the layout check as `itens`.
   - **Cause before symptom:** before reporting small text (12px labels, a card that feels tight), ask whether the item count is the cause. If so, write one finding, "itens demais", with the reduction as the fix, and do not also report the small text as a separate Critical. Never propose a smaller ring, tighter spacing or smaller type to make room for more items.
   - **Focus ring without room:** the ring is drawn inside the item (`::after`, `inset: 0`, 4 px). It needs the ring width plus 4 px between the item's edge and what is drawn inside, on every side, and, by the `cortado` check, no parent that clips it. Printed as `anel`; report the measured clearance. Items that are too narrow because there are too many are one root cause with "too many repeated items".
   - **Focusable piece with no sign at rest (Warning, round 7):** a button-like piece the remote reaches (a day, a segment, a choice) with no 1px outline in `--gradient-semantic-border-default` while it is not focused or selected (DESIGN §9.5), so it reads as plain text. A filled selected piece is exempt, and so is a toggle or segmented selector. In a chart the cells only map the focus: the designer wants it invisible and the dot or bar that reacts is the focus signal, so a missing ring there is not an escalation trigger as long as the active mark clearly differs from the others (≥ 3:1 or a clear size change).
   - **SVG icon:** explorations do not use SVG for icons (the kit's `src/ui-kit/icons/*.svg` are only the source, converted before use). Any `<svg>` icon (rendered 64 px or less) or `.svg` file referenced by `<img>` or `url()` is a finding; the fix is `node scripts/icon-to-png.mjs`. Printed as `svg`. A larger inline drawing, such as a chart, is not an icon.
   Three more: the first from round 6, the next two from the round 4 review:
   - **Axis mismatch (Critical, round 6; it was a Warning):** the visual arrangement runs on a different axis from the keys. Items stacked vertically while ←/→ move between them conflicts with the control; the designer called it a navigation that "doesn't make sense". Report it as its own finding, apart from any "looks like an accordion" remark. `check-explore-layout.mjs` prints it as `eixo`.
   - **Status louder than the content (Warning):** a status or number (such as the time left) set larger or stronger than the title, so it takes the attention from the content. The content is the protagonist.
   - **Related data split apart (Warning):** data about the same subject (a participant's name, age and estalecas) placed in separate groups with space between them, so they do not read as one. The designer asked for them closer in every BBB option that split them.
5. **Check the laws and principles in playbook section 3 and the visual language in `design-brain/DESIGN.md`**, option by option. Cite a DESIGN rule by section and number (for example "DESIGN §5.1"). A gradient outside DESIGN §5.3, a drop shadow, a second accent hue, extra-bold, or a scrim with no text on the image is a Warning; a drop shadow or an invented gradient is a Critical only when the option chose it while the kit has a compliant surface.
6. **Compare in words** with the reference sets (section 10, "Respiro, density, elements per card"; the good card is also saved as `design-brain/toolbox/references/pompeia-poster-card/`, the designer's pick, read by the judge only; `design-brain/toolbox/references/pompeia-seletor-card/` is a second one, which the designer calls the better of the two): the good card (one interaction, one image as the lure, info on top and actions below, generous respiro) and the bad set (2 or 3 interaction types, several accent colors, no strongest element, crowded). Say which set each option is closer to and why. Do not invent numbers (the numbers the designer has given are laws: 4 repeated items, the ring clearance of step 4). Do not call a card crowded only because its information sits together at one edge of a full-bleed photo: the designer rated that layout among the best (round 5).
7. **Write the report.**

## Severity (playbook section 10)

- **Critical:** a law is broken: ↑/↓ consumed in a card, more than one interaction pattern, a web-only interaction, pure white or black, grey text on black, a decision-carrying text under 14px or any text at 10px or less, safe-area violation, hover or animation needed to work, items stacked vertically under ←/→, more than 4 repeated items without the designer's decision, a focus ring with no room in its item, an SVG icon.
- **Note:** `.text-footnote-*` (12px) on a secondary label that carries no decision; this is allowed by `design-brain/DESIGN.md` §3.3. At 12px on text that carries a decision it is Critical.
- **Warning:** a token or scale value is off, or a principle is weak: hierarchy, proximity, respiro, too many elements, a second accent color.
- **Note:** a preference was bent, or a deviation was justified in the rationale.

Pure white or black: look at the resolved color of every text and surface. A kit token that resolves to `#FFFFFF` or `#000000` counts. A translucent token (an overlay or scrim) is not pure black: compute its composite over what is behind it, or write "not measured" and make it a Note at most. The designer approved a bottom gradient (`gradient-semantic-overlay-bottom`) over a full-bleed photo as "very, very good" in round 5, so a scrim of that kind is not a finding by itself. On a card the scrim is `gradient-complementary-dark` (DESIGN §5.4). Never guess a value.

When the break comes from a kit token or type style (for example `text-inverse` is `#000000`, the type scale has 10 and 12px):
- **Critical** if the option chose it while a compliant kit token exists (text at 14px or more, or `.text-footnote-*` for a secondary label, `background-primary` as inverted text, `gradient-complementary-dark` as a scrim). Name the compliant token.
- **Note, "kit vs playbook"** if the kit offers no compliant token. The designer decides which side changes.

Interaction patterns: Enter that activates or selects the whole card is the default of every card, not a pattern, so it is not counted and not a finding. Count a pattern only when the keys do something more (move focus between parts, switch a view, expand a part). *(My assumption; the designer should confirm.)*

Where the kit differs from the designer's numbers (the size floor of `DESIGN.md` §3.3: 14px, 12px for secondary labels; 40/32 safe area; 1280×720), show the difference as a Note. The designer decides which side changes; the judge never edits the kit.

## Report

`<folder>/playbook-judge.md`, in Portuguese. Leave out: restating the brief, generic praise, the list of rules that passed.

```
# Juiz: <slug>

Fatos medidos: <one line per script: ok or the lines that failed>

## Opção N: <name>
Mais perto de: bom | claustrofóbico (<one sentence why>)
Padrão de interação: <catalog name> | mais de um | fora do catálogo
| Nível | Elemento | Regra ou token | Valor documentado | Encontrado |
| --- | --- | --- | --- | --- |
...

## Resumo
<which options carry a Critical, in one line each; no ranking, no pick>
```

Every row names the element, the rule or token, the level and the documented value. The judge does not pick a winner: the designer decides.
