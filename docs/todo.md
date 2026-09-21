# To-do

Things worth doing that are deliberately not being done yet. Newest first.

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

## The focused pill's interior is bluer than Figma's (2026-09-18)

About 50 units at the top of a focused Notificação, because `<FocusRing>`'s inner
fill is translucent and the ring's own gradient shows through it. Figma's ring is
a separate stroke outside a solid Area, so nothing bleeds in. Kit-wide — it is
the shared focus recipe, not one component — and it would move every focused
control's baseline, so it belongs with the motion pass above.
