# To-do

Things worth doing that are deliberately not being done yet. Newest first.

## Done since

- **The focused interior's tone (2026-09-25).** It was bluer than Figma because
  `<FocusRing>`'s translucent fill sat on top of the ring's gradient. The ring is now
  drawn as a band (Figma's inside stroke) over a fill that covers the whole shape,
  and the glow uses Figma's own values (opacity/60, reaching 70%). Measured on the
  focused Wide Button: mean distance to Figma 30.0 → 2.7 (0–255).
- **The miscellaneous button's cycle (2026-09-25).** `MainMenu` `miscellaneousItems`
  cycles every `motion.semantic.carousel-step` (3s): the icon shrinks out and the
  next grows in, the lines dissolve, on the system spring (Figma: Dinamic Carousel).

## Figma does not carry the focus motion (2026-09-18)

The kit animates the focused state now — `<FocusRing>` walks noite → dia → tarde
→ dia over 12s — but Figma has no equivalent. `_Foco-Notificação` is a static
gradient stroke there, and the `Iluminação` sits at opacity 0 in both `Foco=Off`
variants precisely because the light was meant to rise as focus lands. The kit
is ahead of the file, which is the right way round; a note on the `Notificação`
component now points at the tokens (`motion.semantic.focus-cycle-*`,
`opacity.semantic.focus-glow`, `dimension.size.semantic.focus-glow`) so anyone
opening the file knows the static art is intentional, not stale.

**Smart Animate demo added (2026-09-21).** A "Kit de Movimento" page now carries
the motion itself, not just a pointer to it: four frames (0% Noite, 25% Dia, 50%
Tarde, 75% Dia retorno) looping on a 3s-a-leg Smart Animate cycle, plus a text
block naming all five tokens with their values. `Notificação`'s own art is
still static — this documents the motion generically rather than closing the
gap on that component.

## The alert bug's `Motion` variant is unimplemented (2026-09-18)

Its pulse is a different motion from the focus cycle above, not the same one —
so it doesn't belong in that pass. Left for its own pass later.
