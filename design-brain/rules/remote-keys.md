# Remote keys

Applies when: the option is interactive.

Inside a Content Card with internal navigation, only ←/→. ↑/↓ belong to navigation between page elements. One command must not conflict with another. Full key table: the pack's "Teclas", from `node scripts/explore-ref.mjs --teclas`.

One interaction pattern per card. Do not invent a pattern; if one is needed, justify it. Enter that activates or selects the whole card is the default of every card, not a pattern, so it is not counted. Count a pattern only when the keys do something more (move focus between parts, switch a view, expand a part).

Inside the card only ←/→, Enter and Back act. ↑/↓ must pass through (no `preventDefault`). No hover, pointer, drag, swipe, pull, scroll, tooltip, dropdown or text field as the way to use the option. Tab moves between cards.

Interactive brief: the `<article>` gets `tabindex="0"` and a `keydown` handler for the keys the brief names (ArrowLeft, ArrowRight, Enter, Escape or Backspace as Back), acting only on the card with the DOM focus. Static brief: draw the states, no script.

## Focus and Enter in grid cards

Scope: cards that sit in a row or grid of the TV (poster, toggle, banner, double action). A Content Card of a contextual interactivity keeps its internal ←/→ navigation. The Enter and focus rule in 1 holds for every card.

**1. Focus and trigger.**
- **Direct focus:** the focus ring lands at once on the functionally primary element when the card is reached. The container never takes an intermediate focus that has no direct function.
- **Enter** triggers only the node that holds the focus at the moment of the press.

**2. Behaviour by card type.**

| Card type | Focus target | Visual feedback | Enter | D-pad Up / Down |
|---|---|---|---|---|
| 1. Direct action (poster, a single detail) | the card container | border on the whole container (no scale: `focus.md`) | runs the main navigation (Play, See more) | leaves the card toward the nearest element in that direction |
| 2. Selection / toggle (mark watched, favourite) | the card container | border on the container (no scale); the icon or checkbox only changes its visual state | flips the active / inactive state | leaves the card |
| 3. Single action with an inner button (a subscription banner) | the primary inner button | focus border on the button only | runs the button's action | leaves the card |
| 4. Double vertical action (primary "Watch" plus secondary "Trailer") | the primary button (top) | focus border on the active button | runs the focused button's action | **Down** moves focus to the secondary button; Down again leaves the card |

**3. D-pad resolution.**
- Types 1, 2 and 3: all four directions leave the card at once, to the neighbouring card in the grid.
- Type 4: Left and Right leave the card at once toward the side card (if any), keeping the horizontal line. Vertically: focus lands first on the top button; Down moves to the bottom button; Down from the bottom releases focus; Up from the bottom returns to the primary; Up from the primary releases focus above, if there is one.

**Up and Down leave the card.** In a prototype the nearest element below the last row is the Back button, so Down from a card with nothing under it focuses Back, and Up with nothing above does nothing. The vertical order of type 4 is the one case where Down and Up act inside the card first.

**4. Reserved states.**
- **No long press:** a short and a long press are the same single activation.
- **No nested horizontal controls:** the inside of a grid card has no parallel interactive elements on the horizontal axis (such as a row of chips), which would trap focus against the reading direction of the carousels.

Two web looks that fail on TV:
- **Disclosure look (Critical):** a chevron, caret or arrow on a row that opens and closes, or a collapsed row that unfolds like a dropdown or accordion. On TV the cue is the focus ring and the piece, not a drawn arrow.
- **False affordance (Warning):** something that looks interactive (underline, link colour, tab bar, button or pill look) that no key reaches. A label that only names a view is not a tab. For each element that looks interactive, say which key reaches it.

Don't: more than one interaction pattern; ↑/↓ consumed inside a card; hover, drag or swipe; a command conflict.
