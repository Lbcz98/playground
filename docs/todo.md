# To-do

Things worth doing that are deliberately not being done yet. Newest first.

## Close Button is not ported (2026-09-18)

A nível 3 screen closes its interactivity from an anchored control, and the kit
draws a Close Button for it in Figma. Only `RoundedButton` (the back arrow)
exists in code, so `interactivity-cards-*` anchors that instead and labels it
"Voltar". Port the Close Button and switch those templates over.

## Notification — what the second pass left (2026-09-18)

The second pass against Figma `3288:11323` is done: the message pill, the logo
inset and the title's line box now measure what Figma draws, and the focused
pill had lost its logo under the focus ring's fill, which is fixed. What is left
is not Notification's to fix.

- **The `Iluminação` is the focus ring's glow, not a missing layer.** Figma keeps
  it at opacity 0 in both `Foco=Off` variants and only lights it on focus — which
  is exactly when `<FocusRing>` draws its own. Rendered on Figma's own canvas
  grey and sampled against its export, ours lands on Figma's colour through the
  middle of the pill and reaches about 80% of its strength along the bottom
  band. Drawing Figma's ellipse as well would overshoot it, so the honest knob is
  `opacity.semantic.focus-glow` (60) and the ring's `transparent 70%` stop —
  a kit-wide change that would move every focused control's baseline, and worth
  doing as its own pass rather than inside one component.
- **The focused pill's interior is bluer than Figma's** — about 50 units at the
  top — because `<FocusRing>`'s inner fill is translucent and the ring's own
  gradient shows through it. Figma's ring is a separate stroke outside a solid
  Area, so nothing bleeds in. Same pass as above.
- **The title sits ~2px higher than Figma's**, with the line spacing matching.
  The boxes agree; the glyphs sit differently inside them because the kit renders
  Inter Variable at weight 700 where Figma has Inter Bold, and Figma applies
  `cv01`/`cv03`–`cv06`/`cv11` — which is also why its longest line measures 168px
  against our 163px. A font-stack decision, not a Notification one.
- **Figma's `Rounded` circle is 66px at rest and 71.5px focused**; the kit keeps
  both at `round-button-circle` (72px), which is what `_Foco-Notificação` itself
  measures. Following the file here would make the pill change size on focus, so
  this reads as an authoring slip in Figma — worth confirming with Design.
- The `Motion` variant of the alert bug (its pulse) is still unimplemented; it is
  a motion spec rather than a state, so it needs a decision about where motion
  lives before it is worth building.
