# To-do

Things worth doing that are deliberately not being done yet. Newest first.

## Focus motion is unimplemented, kit-wide (2026-09-18)

Nothing in the kit animates. Focus is the whole of it: every focusable control
shares one motion when focus lands on it, so this is one decision and one
implementation, not a per-component job. Two things in Figma are waiting on it
and neither is a missing layer:

- **Notificação's `Iluminação`** sits at opacity 0 in both `Foco=Off` variants
  because the light animates up as the ring takes focus. Static, the kit already
  draws that glow inside `<FocusRing>` — measured against Figma's own export it
  lands on the same colour through the middle of the pill and about 80% of its
  strength along the bottom band. What is missing is the rise, not the glow.
- **The alert bug's `Motion` variant** — its pulse — is the same story.

So the pass is: decide where motion lives (tokens for duration and easing, and
whether a primitive owns it the way `<FocusRing>` owns the ring), then apply it
once. Until then both read as unimplemented states, which they are not.

## The focused pill's interior is bluer than Figma's (2026-09-18)

About 50 units at the top of a focused Notificação, because `<FocusRing>`'s inner
fill is translucent and the ring's own gradient shows through it. Figma's ring is
a separate stroke outside a solid Area, so nothing bleeds in. Kit-wide — it is
the shared focus recipe, not one component — and it would move every focused
control's baseline, so it belongs with the motion pass above or one of its own.

## Notification — the last difference is the font (2026-09-18)

The grid pass and the Figma sync are done. What remains is not fixable in either
place: the kit renders Inter Variable at weight 700 where Figma has Inter Bold,
and Figma applies `cv01`/`cv03`–`cv06`/`cv11`, so its longest line measures 168px
against our 163px inside the same 168px column. The rendered title now lands on
the same rows in both. A font-stack decision if it is ever worth one.
