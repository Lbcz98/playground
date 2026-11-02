# Surfaces, space, shape

Applies when: every card.

1. Groups answer one question each. The gap between groups is one value for the whole card (`--dimension-spacing-core-xs` or `-sm`, 12 to 16) and larger than the gap inside a group (`-3xs` or `-2xs`). *Why: distance is what says "group".* Detail: `conceitos/grupo-por-espaco`.
2. One left axis aligns every group. Space does the work of lines and boxes: no dividers, no borders between repeated items. The one exception is a small circle (4px, `--color-semantic-functional-text-muted`) between inline secondary items of one group, such as the age and the estalecas under a name. *Why: a dot separates words on one line without drawing a line.*
3. Respiro is the criterion that most separates good from bad. Padding is equal on all sides, measured to what is visible, not to layout boxes, and height is never reserved with `min-height`. "Claustrofóbico" is a rejection. The card padding is 32px: `--dimension-spacing-semantic-card-inset-expanded` on a Content Card. The radius is 40px (`--dimension-radius-semantic-card`, `--dimension-radius-semantic-card-expanded`, `--dimension-radius-semantic-content-card`). 40 is never the padding. *Why: one inset per card type makes respiro measurable.*
4. Whatever qualifies a title (the check, a count, a state) sits beside it, in the same group and on the same baseline.
5. Data about the same subject stay together (name, age and score read as one group). Every piece belongs to a group.
6. A nested rounded shape takes the outer radius minus the gap between the two edges, never below zero, and each level has a larger radius than the one inside. Detail: `conceitos/raios-concentricos`.
7. The same role has the same radius in every option. Panels are a Card or a Content Card. Never invent a panel radius. Every kit card radius is 40px. Content Card: `--dimension-radius-semantic-content-card` with the 32px inset `--dimension-spacing-semantic-card-inset-expanded`. The small Card pairs the same 40px radius (`--dimension-radius-semantic-card`) with `--dimension-spacing-semantic-card-inset`, which the kit still sets to 24px. Do not rewrite that token, and do not use 40 as its padding. The pill uses `--dimension-radius-semantic-pill`, up to two control heights. Rows and chips inside a card take a smaller `--dimension-radius-core-*` step.
8. The dark area behind a panel is `--color-semantic-functional-background-primary`, with no card radius. A shape whose idea is not a card is marked `data-surface="own"`, and the report says why.
9. Width is the kit width of the surface (Content Card: `--dimension-size-semantic-content-card-width`). Height hugs the content. Never `max-width`, `width: 100%`, `flex: 1` or `align-self: stretch` on the card. A stage of absolutely placed layers has nothing to hug: give that inner element its height and `data-stack`.

Don't: a claustrophobic card, dividers between repeated items, a panel radius that is not the kit's.
