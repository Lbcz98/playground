# To-do

Things worth doing that are deliberately not being done yet. Newest first.

## Button Tall in Figma is behind the Content Card (2026-09-21)

Code ported Figma's "Button Tall" (2472:120292) as `<ContentCard>` with its zones
as their own components — `ContentCardHeader`, `ContentCardBody`,
`ContentCardFooter`, in that order, each optional. It keeps Figma's 40 radius
(`radius/content-card`), but takes the Content Card spec's `lg` inset (24) where
Figma draws 36×32, and a height that is any 8pt step up to 456.

Figma still has the older inset, and the zones exist there only as the
Overline / Subtitle / Footer booleans on one component. Closing it means rebuilding
the set as a frame plus three zone components, so a designer composes it the way
the code does. `size/content-card-width` and `radius/content-card` are already in
the file.

## Figma does not carry the focus motion (2026-09-18)

The kit animates the focused state now — `<FocusRing>` walks noite → dia → tarde
→ dia over 12s — but Figma has no equivalent. `_Foco-Notificação` is a static
gradient stroke there, and the `Iluminação` sits at opacity 0 in both `Foco=Off`
variants precisely because the light was meant to rise as focus lands. The kit
is ahead of the file, which is the right way round; a note on the `Notificação`
component now points at the tokens (`motion.semantic.focus-cycle-*`,
`opacity.semantic.focus-glow`, `dimension.size.semantic.focus-glow`) so anyone
opening the file knows the static art is intentional, not stale.

Building it as a Smart Animate variant set is still open — not urgent now that
the file explains itself.

## The alert bug's `Motion` variant is unimplemented (2026-09-18)

Its pulse is a different motion from the focus cycle above, not the same one —
so it doesn't belong in that pass. Left for its own pass later.

## The focused pill's interior is bluer than Figma's (2026-09-18)

About 50 units at the top of a focused Notificação, because `<FocusRing>`'s inner
fill is translucent and the ring's own gradient shows through it. Figma's ring is
a separate stroke outside a solid Area, so nothing bleeds in. Kit-wide — it is
the shared focus recipe, not one component — and it would move every focused
control's baseline, so it belongs with the motion pass above.
