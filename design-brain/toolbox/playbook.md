# AI design playbook for the DTV kit

Draft written from `interview-notes.md`. Everything here is the designer's own words or a direct inference, marked *(inferred)* where I filled a gap. Numbers not given by the designer are left open on purpose: "I prefer comparing examples and adjusting the playbook as we find things."

## 1. Goal

Agents produce TV UI the designer would approve: on brand, built from kit tokens, readable from 3 m, operable with a remote, and clear about its intent. The agent is "a work partner at the same level as me": fast at exploring, never trusted to be consistent on its own, so rules and a judge carry consistency.

**First principle:** the content is the protagonist, not the component. When in doubt, remove ("falar muito com pouco"). What stays must be "extremamente visual".

## 2. Steps, in order

1. **Ask (questioner, "PO hat").** Read the brief and any PRD. Ask about the goal, the screen's role in the flow, the audience and the tone of the product until the objective is clear. Ask what the component is *for* before how it looks. Stop and ask again whenever a rule is missing.
2. **Collect references (designer hat).** The designer brings references and says what they like in each. The agent extracts the parts that build the component (layout, hierarchy, colour logic, behaviour), never the whole. A reference is "um ponto de partida, nunca a chegada".
3. **Explore, 4 to 6 options.** Different concepts, not variations of one. Before showing, the explorer runs the judge's token check on its own work and fixes what is clear. For each option, write the rationale: what each choice is for and how it ties to the objective or brief. Options sit side by side; clicking one opens its rationale. Above 6 options in a round, warn the designer that quality may drop.
4. **Judge (warns, never intervenes).** The judge lists, with precision, which elements break which token or rule, with a severity level, citing the documented rule. It never repaints, retunes or blocks. The designer can explore as far as they want, always with visibility.
5. **Designer decides.** Compare options: what draws attention in each (layout and hierarchy, or colour)? If two are close, build a **hybrid** of their strengths. The designer, not the agent, decides what is done.
6. **Fix (surgical).** The designer's feedback has four parts: what went wrong, which principle was misused, how it felt to see it, and the change history. The fixer changes *only* the aspect pointed at; the rest of the component stays as it is.
7. **Repeat 5 and 6 until the designer says done.** If the designer keeps asking for more options, the agent says when it starts to recycle ideas, and asks what exactly is being looked for.
8. **Hand-off.** The agent interviews the designer through a questionnaire and fills an md, topic by topic, with consistent data (see section 5).

## 3. Rules

### Laws (must never fail)
- Inside a card with internal navigation, only ←/→. ↑/↓ belong to navigation between page elements. "É inaceitável que um comando conflite com o outro."
- One interaction pattern per card. Cards with 2 or 3 different patterns "não pode acontecer". Do not invent a pattern; if one is needed, justify it.
- States are few: focused, default, disabled, plus selected. No hover. Every button can be focused, selected or not.
- Colour: no pure white or pure black (white drops to about `#EEEEEE`). No dark grey text on black, no subtle gradients that vanish on TVs that crush shadows. Never judge contrast only from the monitor render.
- Type: readable from 3 m. Minimum 14px (the minimum of the minimum), comfortable 16 to 18px. Use the kit's type scale; do not invent sizes, weights or fonts. Typography is "o principal dentro de um design".
- Motion: simple dissolve only, used to show a transition between screens or states. The screen must work without it.
- Safe area: 40 on the sides, 32 on the top and bottom; assets thought for 1280×720. The background fills the full screen.
- Hierarchy, spacing, type scale, colour and accessibility are the floor: never deliver options with these wrong.

### Principles (judge with them)
- **Contrast** (softer colour for description against title, size differences), **proximity** (groups of one kind, actions next to actions, label next to its title, 4-point spacing), **hierarchy** (size, colour, type), **progressive disclosure** (segment; use paging or a rail of cards instead of one overloaded component).
- **Respiro (white space)** is the criterion that most separates good from bad. "Claustrofóbico" is a rejection.
- Dieter Rams, in the designer's order: useful, aesthetic, unobtrusive. Honest weighs least.
- Judge intent, not personal taste: does this serve the brief, does it fit the scenario where it lives, does it bring something new to the system?
- A tone check comes before polish: does the design match the product's tone and narrative? (The BBB heat map: a cold data map did not fit a light show.)

### Preferences (apply, may bend)
- A chosen item is marked by a check beside its name, but the check is only one way; a label change also works.
- Gap 12 to 16 between groups, equal padding on all sides measured to what is visible, sentences in a softer white at reading size, regular weight on unselected options. These come from the repo's earlier rules; they follow from the principles above.
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
| Explorer | answers, extracted references, kit tokens, judge's checks | 4 to 6 options with rationale |
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
| [`interview-notes.md`](interview-notes.md) | doc | anyone adjusting the playbook: the designer's own words, vocabulary and rejected things behind each rule |
| [`README.md`](README.md) | index | humans: the same list, with what is approved |

No scripts or templates exist yet.

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
- Still to ask the devs: should this md follow the same four-file layout as `figma-handoff`?
