# Playbook process

Applies when: a person is changing how the studio works. Drawing agents do not read this file. The drawing rules live in the other files of `design-brain/rules/`. The archive under `design-brain/toolbox/archive/` is not read by any agent.

## Steps, in order

1. **Ask.** Read the brief. Ask about the goal, the screen's role, the audience and the tone until the objective is clear. Ask what the component is for before how it looks. Stop and ask again whenever a rule is missing.
2. **Collect references.** The designer brings references and says what they like. Extract the parts that build the component, never the whole.
3. **Explore, 4 to 6 options.** Different concepts, not variations of one. Study the gold set (learn, do not copy). Before showing, the explorer runs the token check and fixes what is clear. Each option has a rationale tied to the objective. Above 6 options in a round, warn that quality may drop.
4. **Judge (warns, never intervenes).** Lists which elements break which rule, with a severity, citing the rule. Never repaints or blocks. `/explore` then applies one adjustment, once, on the one or two options the art director picked.
5. **Designer decides.** If two options are close, a hybrid of their strengths is the designer's call.
6. **Fix (surgical).** Feedback has four parts: what went wrong, which principle was misused, how it felt, and the change history. Change only the aspect pointed at.
7. **Repeat until the designer says done.** If the designer keeps asking for more options, say when ideas start to recycle, and ask what is being looked for.
8. **Hand-off.** Interview the designer and fill an md, topic by topic.

## Hand-off md

A questionnaire, one topic at a time. The designer lists: component mapping, interactions, usage scenarios and error cases, behaviours, states, the flow up to the component, tested in a prototype, tokens attached correctly, technically viable. Devs' complaints come from missing data or scenarios in Figma, so the questionnaire must not skip scenarios. Never estimate a value; mark what is unknown; cite the source of each datum.

Shape: two files per feature, `componentes.md` (components, states, tokens) and `fluxo.md` (states, transitions, focus order, interactions). Usage scenarios, error cases, the prototype check and technical viability are sections of those files. Not borrowed unless the devs ask: `contrato-dados.md` and `cards-propostos.md`.

## Definition of done

- The designer says so. The agent never closes the work.
- The judge's report is visible and the designer has seen every severity.
- No token, safe-area, type, colour or interaction law is broken without a justified, accepted deviation.
- Each option has a rationale tied to the brief.
- The hand-off md is complete.
- In the built result, the interaction is checked first, then fidelity to the design.

## Roles

| Role | Reads | Produces |
|---|---|---|
| Questioner | brief, PRD | clear objective, open questions |
| Reference collector | references and the designer's notes | extracted parts, not copies |
| Explorer | the option's pack (topics, gold notes, concepts) | options with rationale |
| Writer | chosen option, `web/protos/CLAUDE.md` | the screen in the kit |
| Judge | the craft pack for the topics in play | findings with severity; never changes anything |
| Fixer | the designer's four-part feedback | only the aspect pointed at |
| Hand-off | the designer's answers | the md |

## How to test

Run several independent rounds on the same brief. Success is consistency: on brand, tokens used correctly. Compare examples, adjust the rules from what is found. Old rounds are in the archive; no agent is told to read them.

## Correction rounds and reports

- Before the designer sees a set, `/explore` applies one automatic pass, and only on the 1 or 2 options the art director lists under `Aplicar:`. A later pass happens only when the designer asks.
- `none: ready` counts only when the brief has a Direção visual block and the judge marked neither Critical nor Warning on that option (a Note may stay).
- After 3 rounds with no clear gain, or when the designer asks for more options again, say that ideas are starting to recycle, then ask what is being looked for. The 3 is a first guess.
- Reports leave out: restating the brief, generic praise, the list of rules that passed.
- Reports include: the rationale per option, how it ties to the objective, and the findings with severity.
- The explorer runs the checks on its own options and fixes only what is unambiguous. Anything that needs a design decision goes to the designer as a warning.
- The independent judge runs on the options the art director picked. The final report never depends on the explorer checking itself.
- No fixed number for respiro yet, beyond the laws that already have one (4 repeated items, the ring clearance, the insets). The judge compares in words with the gold set. When a pattern repeats across rounds, it becomes a number.

## Severity

The ladder the judge uses is `craft/severity.md`. It is not repeated here.
