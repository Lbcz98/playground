# Colour

Applies when: every card. Citation `DESIGN §4.6` means this file.

1. One brand accent. Everything else is neutral. *Why: on a quiet wall a single hue is the only "click me" signal.*
2. Status colours (live, success, warning, error) are allowed only as state, one hue per meaning, never as decoration or identity. Detail: `conceitos/uma-cor-um-significado`. *Why: when colour appears the person already knows what it says.*
3. Colour that comes from the content (a show, a time of day such as dia, tarde, noite) is identity and counts as part of the artwork, not as a second accent. Its background is the kit's themed gradient as it is (`--gradient-primary-*`, `--gradient-inverse-*`), never a flat themed fill or a custom tint. It never takes the accent's role and never marks focus or selection.
4. Colour is never the only signal: say it also in text or shape.
5. A data series is one colour; a second only for the exceptions, with the legend saying why.
6. No pure white or pure black: white drops to about `#EEEEEE`. No dark grey text on black. Never judge contrast from the monitor render alone. *Why: TVs crush shadows and bloom whites.* Dark text on a light fill is `--color-semantic-functional-background-primary`, never pure black.
7. Neutrals: `--color-semantic-functional-background-primary`, `-background-elevated`, `-border-subtle`, `-border-default`.
8. Small text on `background-elevated` uses `text-primary` or `text-muted`. The kit's `text-secondary` and `text-subtle` fall below 4.5:1 there.

Don't: a second accent hue, status colour used as decoration, pure white or black, dark grey on black.
