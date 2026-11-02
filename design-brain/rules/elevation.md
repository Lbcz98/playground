# Elevation and depth

Applies when: every card.

1. No drop shadows, anywhere. *Why: TVs crush shadows, and the wall has no light source.*
2. Depth comes from neutral steps (`-background-primary` under `-background-elevated`) and from a change of surface. *Why: the change of tone is the divider, so no line is needed.*
3. Gradients are allowed only where the kit already uses them, and an agent invents no new one:
   - the scrim (below);
   - the focus ring (`--gradient-semantic-focus-ring`) and the focus light that comes with it (the cyan glow under the card, the "Iluminação" layer; it is light, not a shadow);
   - the default border (`--gradient-semantic-border-default`);
   - the live and replay status pills;
   - the dia, tarde and noite theme gradients, as content identity (`color.md`).
   *Why: the kit's gradients each carry a job; a new one is decoration.*
4. The card scrim is `--gradient-complementary-dark`: charcoal (`--color-core-neutral-charcoal`) at the text edge fading to transparent toward the image. At screen level the kit's `Overlay` (`--gradient-semantic-overlay-*`) does the same job. The same gradient also covers the card's text area, so the image blends into the card's own background. *Why: text on art needs contrast, and a flat fill would hide the art.*
5. The scrim is used at screen level and on image cards and buttons that carry text over an image. It appears only when text or a label sits on the image, always with the kit's stops and strength; agents do not tune it. It must be strong enough to survive a TV that crushes shadows. The card-level scrim is new work for the kit (`DESIGN-gaps.md`).
6. A bottom gradient over a full-bleed photo, with the text on it, is welcome. The designer approved `gradient-semantic-overlay-bottom` on a full-bleed photo. A scrim of that kind is not a finding by itself. A translucent scrim is not pure black: composite it over what is behind it, or write "not measured".

Don't: a drop shadow, a gradient outside the list above (including a gradient fill on text), a scrim with no text on the image, a subtle gradient that vanishes on a TV.
