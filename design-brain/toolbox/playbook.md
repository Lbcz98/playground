# AI design playbook for the DTV kit

Draft written from `interview-notes.md`. Everything here is the designer's own words or a direct inference, marked *(inferred)* where I filled a gap. Numbers not given by the designer are left open on purpose: "I prefer comparing examples and adjusting the playbook as we find things."

## 1. Goal

Agents produce TV UI the designer would approve: on brand, built from kit tokens, readable from 3 m, operable with a remote, and clear about its intent. The agent is "a work partner at the same level as me": fast at exploring, never trusted to be consistent on its own, so rules and a judge carry consistency.

**First principle:** the content is the protagonist, not the component. When in doubt, remove ("falar muito com pouco"). What stays must be "extremamente visual".

## 2. Steps, in order

1. **Ask (questioner, "PO hat").** Read the brief and any PRD. Ask about the goal, the screen's role in the flow, the audience and the tone of the product until the objective is clear. Ask what the component is *for* before how it looks. Stop and ask again whenever a rule is missing.
2. **Collect references (designer hat).** The designer brings references and says what they like in each. The agent extracts the parts that build the component (layout, hierarchy, colour logic, behaviour), never the whole. A reference is "um ponto de partida, nunca a chegada".
3. **Explore, 4 to 6 options.** Different concepts, not variations of one. Before drawing, read the repo's design concepts that apply to the element: `node scripts/explore-ref.mjs --conceitos` lists them (type details such as balanced line breaks, grouping by proximity, one colour one meaning, focus and selection). Before showing, the explorer runs the judge's token check on its own work and fixes what is clear. For each option, write the rationale: what each choice is for and how it ties to the objective or brief. Options sit side by side; clicking one opens its rationale. Above 6 options in a round, warn the designer that quality may drop.
4. **Judge (warns, never intervenes).** The judge lists, with precision, which elements break which token or rule, with a severity level, citing the documented rule. It never repaints, retunes or blocks. The designer can explore as far as they want, always with visibility.
5. **Designer decides.** Compare options: what draws attention in each (layout and hierarchy, or colour)? If two are close, build a **hybrid** of their strengths. The designer, not the agent, decides what is done.
6. **Fix (surgical).** The designer's feedback has four parts: what went wrong, which principle was misused, how it felt to see it, and the change history. The fixer changes *only* the aspect pointed at; the rest of the component stays as it is.
7. **Repeat 5 and 6 until the designer says done.** If the designer keeps asking for more options, the agent says when it starts to recycle ideas, and asks what exactly is being looked for.
8. **Hand-off.** The agent interviews the designer through a questionnaire and fills an md, topic by topic, with consistent data (see section 5).

## 3. Rules

### Laws (must never fail)
- Inside a Content Card with internal navigation (a contextual interactivity), only ←/→. (Cards in a grid or row follow "Focus and Enter in grid cards" below.) ↑/↓ belong to navigation between page elements. "É inaceitável que um comando conflite com o outro."
- One interaction pattern per card. Cards with 2 or 3 different patterns "não pode acontecer". Do not invent a pattern; if one is needed, justify it.
- States are few: focused, default, disabled, plus selected. No hover. Every button can be focused, selected or not.
- Colour: no pure white or pure black (white drops to about `#EEEEEE`). No dark grey text on black, no subtle gradients that vanish on TVs that crush shadows. Never judge contrast only from the monitor render.
- Type: readable from 3 m. Minimum 14px (the minimum of the minimum), comfortable 16 to 18px. Use the kit's type scale; do not invent sizes, weights or fonts. Typography is "o principal dentro de um design".
- Motion: simple dissolve only, used to show a transition between screens or states. The screen must work without it.
- Safe area: 40 on the sides, 32 on the top and bottom; assets thought for 1280×720. The background fills the full screen.
- Hierarchy, spacing, type scale, colour and accessibility are the floor: never deliver options with these wrong.

### Focus and Enter in grid cards (decided by the designer)

Scope: cards that sit in a row or grid of the TV (poster, toggle, banner, double action). A Content Card of a contextual interactivity keeps its internal ←/→ navigation (the law above). The Enter and focus rule in 1 holds for every card.

**1. Focus and trigger.**
- **Direct focus:** the focus ring lands at once on the functionally primary element when the card is reached. The container never takes an intermediate focus that has no direct function.
- **Enter** triggers only the node that holds the focus at the moment of the press.

**2. Behaviour by card type.**

| Card type | Focus target | Visual feedback | Enter | D-pad Up / Down |
|---|---|---|---|---|
| 1. Direct action (poster, a single detail) | the card container | border or scale on the whole container | runs the main navigation (Play, See more) | leaves the card toward the nearest element in that direction (see "Up and Down leave the card") |
| 2. Selection / toggle (mark watched, favourite) | the card container | border or scale on the container; the icon or checkbox only changes its visual state | flips the active / inactive state | leaves the card toward the nearest element in that direction |
| 3. Single action with an inner button (a subscription banner) | the primary inner button | focus border on the button only | runs the button's action | leaves the card toward the nearest element in that direction |
| 4. Double vertical action (primary "Watch" plus secondary "Trailer") | the primary button (top) | focus border on the active button | runs the focused button's action | **Down** moves focus to the secondary button; Down again leaves the card toward the nearest element below |

**3. D-pad resolution.**
- Types 1, 2 and 3: all four directions leave the card at once, to the neighbouring card in the grid.
- Type 4: Left and Right leave the card at once toward the side card (if any), keeping the horizontal line. Vertically: focus lands first on the top button; Down moves to the bottom button (if any); Down from the bottom button releases focus to the nearest element below; Up from the bottom button returns to the primary one; Up from the primary button releases focus to the nearest element above, if there is one.

**Up and Down leave the card.** In a prototype the nearest element below the last row is the Back button, so Down from a card with nothing under it focuses Back, and Up with nothing above does nothing. This is the repo's key table (`node scripts/explore-ref.mjs --teclas`) and it is correct. The vertical order of type 4 is the one case where Down and Up act inside the card first; it is a rare scenario (two buttons inside one card) but possible.

**4. Reserved states.**
- **No long press:** nothing is tied to holding Enter; a short and a long press are the same single activation.
- **No nested horizontal controls:** the inside of a grid card has no parallel interactive elements on the horizontal axis (such as a row of chips), which would trap focus against the reading direction of the carousels.

### Principles (judge with them)
- **Contrast** (softer colour for description against title, size differences), **proximity** (groups of one kind, actions next to actions, label next to its title, 4-point spacing), **hierarchy** (size, colour, type), **progressive disclosure** (segment; use paging or a rail of cards instead of one overloaded component).
- **Respiro (white space)** is the criterion that most separates good from bad. "Claustrofóbico" is a rejection.
- Dieter Rams, in the designer's order: useful, aesthetic, unobtrusive. Honest weighs least.
- Judge intent, not personal taste: does this serve the brief, does it fit the scenario where it lives, does it bring something new to the system?
- A tone check comes before polish: does the design match the product's tone and narrative? (The BBB heat map: a cold data map did not fit a light show.)

### Preferences (apply, may bend)
- A chosen item is marked by a check beside its name, but the check is only one way; a label change also works.
- Gap 12 to 16 between groups, equal padding on all sides measured to what is visible, sentences in a softer white at reading size, regular weight on unselected options. These come from the repo's earlier rules; they follow from the principles above.
- Type and grouping details (from the designer's round 3 review): a title breaks after the function word ("de"), not before it, and leaves no river of empty space; titles and labels use sentence case unless a name needs the capital; every piece belongs to a group (rating, genre and duration form one metadata group close to the title, or the rating sits on the image on purpose); a selector shows only the information of the chosen section.
- Arrangement follows the keys: items that ←/→ move between sit side by side, not stacked; a status number is never louder than the title; the status line, the time left and the title belong to one group (round 4 review).
- An invented function is allowed when it is justified in the rationale and fits the interaction (the reminder toggle on the rerun was praised). It is judged on that, not penalised for being new.
- Order of sacrifice on a video card (home, "sell" fast): image, title, social proof (rating), genre. Description and action go to the detail page; the card is the button. The order depends on the screen's goal.

### Escalation
- The agent decides alone what has a well-defined rule.
- The agent asks when the request goes against a fundamental element of the design system, when a sharp change to how the system behaves seems needed, or when a rule is missing ("até chegar em uma definição").
- Deviating from the kit is the designer's decision (cost of development and fit with the product's language).

## 4. Anti-patterns (approved by the designer)

1. More than one interaction pattern per card.
2. Several elements fighting for emphasis: many accent colours, no clear strongest element, no hierarchy.
3. A claustrophobic screen: elements stuck together, no respiro.
4. Everything in one component (description, action, metadata) instead of another step, paging or a rail.
5. Copying a reference 100%.
6. Pure white or black; dark grey on black; subtle gradients.
7. Type below 14px or outside the scale.
8. ↑/↓ consumed inside a card, or any command conflict.
9. Changing what was not asked (asked for one spacing, the agent redoes the whole component).
10. Depending on hover or animation to work.
11. Inventing a pattern or deviating from the kit without justifying it or telling the designer.
12. A decorative data display not tied to the intent.

## 5. Hand-off md

A questionnaire the agent runs with the designer, filling one topic at a time. Contents the designer lists: component mapping, interactions, usage scenarios and error cases, behaviours, states, the flow up to the component, tested in a prototype, tokens attached correctly, technically viable. Devs' complaints come from "dado ou cenário faltando no Figma", so the questionnaire must not skip scenarios. Borrow from the devs' `figma-handoff` skill *(inferred)*: never estimate a value; mark what is unknown instead of guessing; cite the source of each datum.

## 6. Definition of done

- The designer says so. The agent never closes the work.
- The judge's report is visible and the designer has seen every severity.
- No token, safe-area, type, colour or interaction law is broken without a justified, accepted deviation.
- Each option has a rationale tied to the brief.
- The hand-off md is complete: scenarios, errors, states, flow, tokens.
- In the built result, the **interaction** is checked first, then fidelity to the design.

## 7. Roles

| Role | Reads | Produces |
|---|---|---|
| Questioner (PO hat) | brief, PRD | clear objective, open questions |
| Reference collector (designer hat) | references and the designer's notes on them | extracted parts, not copies |
| Explorer | answers, extracted references, kit tokens, design concepts (`--conceitos`), judge's checks and page format (`judge.md`) | 4 to 6 options with rationale |
| Writer | chosen option, `web/protos/CLAUDE.md` | the screen in the kit |
| Judge | tokens, rules, option | findings with severity; never changes anything |
| Fixer | the designer's four-part feedback | only the aspect pointed at |
| Hand-off | the designer's answers, approved design | the md |

## 8. How to test the playbook

Run several independent rounds on the same brief. Success is **consistency**: the results are not "all over the place", they are on brand and use the tokens correctly. Compare examples side by side, adjust the playbook from what is found, and add to "what I do not want to read in a report" as it appears.

## 9. Toolbox

Everything this playbook produces or uses lives in `design-brain/toolbox/`.

1. **Rule:** every file, approved script, template or doc made for this playbook is saved in `design-brain/toolbox/` and listed in the table below and in [`README.md`](README.md). A file that is not listed here is not part of the playbook. Scripts and templates go in only after the designer approves them.
2. **Rule:** a role that needs a file reads it from here, by the path in this table.

| File | Type | Used by |
|---|---|---|
| [`playbook.md`](playbook.md) | doc | every role: the rules, the steps, the anti-patterns |
| [`judge.md`](judge.md) | doc | the independent judge (step 4): read by the agent that judges an exploration |
| [`test-log.md`](test-log.md) | doc | anyone adjusting the playbook: what each test round fixed, found and left open |
| [`references/pompeia-poster-card/`](references/pompeia-poster-card/index.html) | example | the judge: the saved "good" card to compare against (not for the explorer, to avoid copying) |
| [`tests/`](tests/) | test rounds | anyone adjusting the playbook: the explorations of each round, with their briefs and judge reports (`test-log.md` says what each found) |
| [`interview-notes.md`](interview-notes.md) | doc | anyone adjusting the playbook: the designer's own words, vocabulary and rejected things behind each rule |
| [`README.md`](README.md) | index | humans: the same list, with what is approved |

No scripts or templates exist yet. The judge is a doc run by a separate agent; it uses the repo's existing `check-explore-*` scripts.

## 10. Decided

### Severity levels (the judge never blocks)
- **Critical:** a law is broken (↑/↓ consumed in a card, more than one interaction pattern, pure white or black, grey on black, type under 14px, safe-area violation). Shown first; the option is marked "breaks a law". The designer still decides.
- **Warning:** a token or scale value is off, or a principle is weak (hierarchy, proximity, respiro, too many elements). Cites the token or rule.
- **Note:** a preference was bent (the check, a gap value) or a deviation was justified in the rationale.
- Every finding names the element, the rule or token, the level and the documented value.

### Correction rounds
- No cap; the designer ends the work.
- After 3 rounds with no clear gain, or when the designer asks for more options again, the agent says "I'm starting to recycle ideas", then asks what exactly is being looked for or proposes a new direction. The 3 is a first guess to adjust after testing.

### Reports
- Leave out: restating the brief, generic praise, the list of rules that passed.
- Always include: the rationale per option, how it ties to the objective, and the findings with severity.
- The designer adds to "what I do not want to read" as testing shows it.

### Explorer and judge
- The explorer runs the judge's checks on its own options before showing them and fixes only what is unambiguous (a wrong token). Anything that needs a design decision goes to the designer as a warning.
- The independent judge runs again on what the designer chose; the final report never depends on the explorer checking itself.

### Kit tokens against the designer's numbers
- A check, not a design decision: compare the kit with 14px minimum, 16 to 18px comfortable, 40/32 safe area and 1280×720.
- Where they differ, show the difference; the designer decides which side changes. The agent does not edit the kit.

### Respiro, density, elements per card
- No numbers for now. Keep a small set of "good" and "bad" cards (the Pompeia card; the six claustrophobic options).
- The judge compares new options against them in words ("closer to the claustrophobic set").
- When a pattern repeats across rounds, turn it into a number.

### Hand-off md
- Start from the designer's topic list (section 5) and the devs' markers for unknown values (never estimate, mark what is missing, cite the source).
- Shape, borrowed from the devs' `figma-handoff` skill: two files per feature, `componentes.md` (components, states, tokens) and `fluxo.md` (states, transitions, focus order, interactions). Usage scenarios, error cases, the prototype check and technical viability go in as sections of those files.
- Not borrowed: `contrato-dados.md` (only if the devs ask the designer for it) and `cards-propostos.md` (the devs' own refinement step).
