# Type

Applies when: every card. Citations `DESIGN §3.2` and `§3.3` mean this file.

1. Use the kit's text styles (`.text-*`). No invented sizes, weights or fonts. A focal numeral may use `.text-display-lg-*` (up to 3 characters) or `.text-display-md-*` (up to 5 characters), regular, medium or bold: numerals only, one display text per card, never a title or a sentence, and never a `calc()` on a font size. Everything else tops out at `.text-heading-3-*`. *Why: type is the main thing inside a design, and the scale is what keeps screens alike.*
2. Three weights: regular, medium and bold. Body is regular, labels and buttons medium, the anchor and titles bold. Never extra-bold (weight 800). Unselected options stay regular. *Why: a short ladder keeps the wall quiet, and bold marks what matters.*
3. Readable from 3 m. The smallest text an agent may use is `.text-footnote-*`, and only for a secondary label that carries no decision. Everything else is `.text-body-sm-*` or larger, comfortable at body-md or body-lg. The kit's 10px caption style is not used for content. *Why: a TV is read at distance.*
4. Titles use `text-wrap: balance`, sentences `text-wrap: pretty`, changing numbers `font-variant-numeric: tabular-nums`. A title breaks after the function word ("de"), never before it, and leaves no river of empty space. Sentence case unless a name needs the capital. Detail: `conceitos/tipografia-de-detalhe`.
5. Axis and day labels read on their own: three letters for days, same length across the row. Detail: `conceitos/rotulo-inequivoco`. *Why: a label that needs a legend has failed.*
6. In a support strip, the value is read, so it is `.text-body-md-*` or `.text-body-lg-*` with its label smaller above (`.text-footnote-*`). Never value and label at the same small size.

Don't: extra-bold, the 10px caption style for content, or a size or font outside the kit. Type below the floor is a failed law.
