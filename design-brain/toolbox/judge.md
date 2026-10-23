# Playbook judge

The independent judge of playbook step 4 and section 10 ("the independent judge runs again on what the designer chose"). Run it as a separate agent that reads this file; give it only the exploration slug, never the explorer's account of the work.

It **warns, never intervenes**: it changes nothing in the exploration and blocks nothing. The only file it writes is `docs/explorations/<slug>/playbook-judge.md`.

## Inputs

- `docs/explorations/<slug>/index.html` (the options) and `brief.md` (what was asked).
- `design-brain/toolbox/playbook.md` (sections 3, 4 and 10 are the rules; cite them).
- The kit: `web/protos/generated/explore-tokens.md` for token values.

The page may carry the explorer's own rationale and findings. They are **claims, not evidence**. Read the rationale only to see whether a deviation was justified (that makes a finding a Note, section 10). Never copy the explorer's findings into yours.

## Page format (the explore server and the check scripts need it)

One self-contained `index.html`. In `<head>`, in this order: `<link rel="stylesheet" href="/__explore/tokens.css">` (the kit's tokens, served by the explore server; without it the page renders unstyled while the scripts still pass), `<link rel="stylesheet" href="../../../src/styles/global.css">` and `<link rel="stylesheet" href="/__explore/inter.css">`. Each option is `.opt[data-option="N"]` containing `.opt-content`, and the card is a child of `.opt-content`. The reference page is `design-brain/toolbox/references/pompeia-poster-card/index.html` (not for the explorer; see below).

## Steps

1. **Run the measuring scripts and keep their output as facts.**
   `node scripts/check-explore-tokens.mjs docs/explorations/<slug>` and `node scripts/check-explore-layout.mjs docs/explorations/<slug>`.
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
   - **Selector that does not change the content:** a control that switches sections but leaves the other section's information on screen, or shows the wrong info after the switch. After each switch, only that section's information should be shown.
   For a card that sits in a grid or row (playbook, "Focus and Enter in grid cards"): name its type (1 to 4), and check that the focus lands on the right target, Enter fires only the focused node, all four directions leave a type 1, 2 or 3 card, type 4 follows the vertical order, nothing depends on a long press, and no row of chips or other horizontal controls sits inside the card. A break is Critical. A Content Card of a contextual interactivity is not judged by this table; it keeps ←/→ inside.
5. **Check the laws and principles in playbook section 3**, option by option.
6. **Compare in words** with the reference sets (section 10, "Respiro, density, elements per card"; the good card is also saved as `design-brain/toolbox/references/pompeia-poster-card/`, the designer's pick, read by the judge only): the good card (one interaction, one image as the lure, info on top and actions below, generous respiro) and the bad set (2 or 3 interaction types, several accent colors, no strongest element, crowded). Say which set each option is closer to and why. Do not invent numbers.
7. **Write the report.**

## Severity (playbook section 10)

- **Critical:** a law is broken: ↑/↓ consumed in a card, more than one interaction pattern, a web-only interaction, pure white or black, grey text on black, type under 14px, safe-area violation, hover or animation needed to work.
- **Warning:** a token or scale value is off, or a principle is weak: hierarchy, proximity, respiro, too many elements, a second accent color.
- **Note:** a preference was bent, or a deviation was justified in the rationale.

Pure white or black: look at the resolved color of every text and surface. A kit token that resolves to `#FFFFFF` or `#000000` counts. A translucent token (an overlay or scrim) is not pure black: compute its composite over what is behind it, or write "not measured" and make it a Warning at most. Never guess a value.

When the break comes from a kit token or type style (for example `text-inverse` is `#000000`, the type scale has 10 and 12px):
- **Critical** if the option chose it while a compliant kit token exists (text at 14px or more, `background-primary` as inverted text, `gradient-complementary-dark` as a scrim). Name the compliant token.
- **Note, "kit vs playbook"** if the kit offers no compliant token. The designer decides which side changes.

Interaction patterns: Enter that activates or selects the whole card is the default of every card, not a pattern, so it is not counted and not a finding. Count a pattern only when the keys do something more (move focus between parts, switch a view, expand a part). *(My assumption; the designer should confirm.)*

Where the kit differs from the designer's numbers (14px minimum, 40/32 safe area, 1280×720), show the difference as a Note. The designer decides which side changes; the judge never edits the kit.

## Report

`docs/explorations/<slug>/playbook-judge.md`, in Portuguese. Leave out: restating the brief, generic praise, the list of rules that passed.

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
