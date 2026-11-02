# Focus, selection, action

Applies when: the option is interactive, or the brief asks a focus or selected state to be drawn. Detail of the three signals: `conceitos/foco-e-selecao`.

1. Exactly one focus at a time, marked by an outline with a gap between outline and piece. Nothing scales or moves, and focus never changes the member's colour. *Why: on a quiet wall the outline is the only signal, and it must not be confused with colour.* Where an older grid note says "border or scale", the scale does not apply: this rule wins on what may be drawn.
2. The selected item is the only inverted or opaque surface in the set, also marked by a check beside its name. A label change also works. The check is one way, not the only way.
3. One filled strong action per card; the secondary is neutral and smaller.
4. Nothing relies on hover. States are few: focused, default, disabled, plus selected. Every button can be focused, selected or not.
5. **A focusable piece shows that it can be focused, at rest.** Every button-like piece the remote can reach (a day in a rail, a segment, a choice) carries a 1px outline with the diagonal light gradient: `--gradient-semantic-border-default` at `--dimension-border-width-semantic-button`, drawn inside the piece on `::before` with the same mask recipe as the focus ring (the ring stays on `::after`). The selected piece, being filled, may drop it. A toggle or segmented selector (one choice among a few that swaps the card) does not take it. A chart whose cells only map the focus shows it on the data mark itself (the dot or bar that reacts), with the focus invisible. *Why: a piece with no sign at rest reads as text, and on a TV nothing else tells the viewer that the remote reaches it.*
6. **A card keeps one height in every state.** Focus, selection, a key press and an opened detail never make the card grow or shrink: the detail replaces content in a slot that already exists, or the card reserves it from the start. Nothing hangs below the card like a dropdown. *Why: a card that changes height moves what is under it, and a list that opens on Enter reads as a form.*
7. **Every piece the remote can reach looks like a button at rest** (rule 5), including each segment of a selector. A label alone, with no outline, is not a button.
8. **The ring fits its item.** The kit ring is an inside gradient band, width `--dimension-border-width-semantic-focus-ring`, on a `position: relative` element:

```css
::after { content: ''; position: absolute; inset: 0; border-radius: inherit; padding: var(--dimension-border-width-semantic-focus-ring); background: var(--gradient-semantic-focus-ring); mask: linear-gradient(var(--color-semantic-focus-outline) 0 0) content-box exclude, linear-gradient(var(--color-semantic-focus-outline) 0 0); pointer-events: none }
```

The resting outline, on the same piece, is the same mask on `::before` with `padding: var(--dimension-border-width-semantic-button)` and `background: var(--gradient-semantic-border-default)`. From the box edge to what is drawn inside there are at least the ring width plus 4px on every side, and the parent never clips it (the `cortado` check). A ring that touches the content or is cut means the item is too small; remove items or content, never thin the ring.

Also used: `--color-semantic-focus-*`, `--dimension-spacing-semantic-focus-offset`. A mask colour is a token too. Never `outline` on the `<article>`, never `tabindex` inside it. Text that changes on a key gets `aria-live="polite"`.

Don't: focus shown by scale, movement or a colour change; hover; a focusable piece with no sign at rest; a ring with no room.
