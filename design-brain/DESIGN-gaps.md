# DESIGN.md: known gaps

What `DESIGN.md` describes that the kit does not do yet, or has not decided. Kept apart so the agents that read `DESIGN.md` in full before drawing do not pay for it; read this when you change the kit or `DESIGN.md` itself.

Checked against `src/styles/global.css`, `src/ui-kit/` and `src/primitives/`.

- **Card-level scrim on buttons.** `CardScrim` now exists and the Content Card image variant uses it. No button has one yet, so §5.5 still describes work for buttons over an image. Figma notes "verify need in code" for the gradient over the text area; the kit draws it over the image only.
- **Image variant, steps.** `ContentCard` now has the image variant (`image`, `imageSize` G, M or P). The step is chosen by the author from §6.1; the kit does not measure the text. The exact cut-offs between the steps are not measured.
- **Button width.** Figma draws the example button 240 wide in a 24px inset; with the 32px inset it spans 224. The Wide Button token (240) is not used inside a card. Figma's example also shows a 1px white border at 80%, radius 36, height 384 and an app icon beside the label; the kit keeps 380, radius 40, no border and the arrow icon.
- **Card insets.** Done in the kit: `--dimension-spacing-semantic-card-inset` is 24px on a Card in every state (the focused, expanded Interactivity Button keeps it), and `-card-inset-expanded` is 32px on the Content Card. The small Interactivity Button card (158×122) is now tight: its content area is 110×74.
- **Content Card rows.** With the 32px inset the tallest card holds 9 team rows, 9 athlete rows and 7 scout rows (it was 10, 10, 7). The Figma standings card shows ten, so the kit's table card no longer matches that frame.
- **Card fill.** Figma shows #191F27 solid. The kit has it only as `--color-semantic-functional-background-translucent` (#191F27 at 30% alpha), which §6.2 uses.
- **Extra-bold and caption.** The kit still defines `.text-*-extra-bold` and `.text-caption-*`, and the resting Interactivity Button still uses `caption-bold` (10px) for its overline and subtitle. DESIGN.md bans them for agents and the judge flags any use. Whether the kit drops them is a kit decision, not made here.
- **Shadow token.** `--opacity-semantic-shadow-subtle` is defined and nothing in `src/` uses it. The rule matches the kit; the token is dead.
- **Playbook size law.** Playbook §3 now follows §3.3.
- **Group gaps.** §7.1 still uses `--dimension-spacing-core-xs` or `-sm` between groups. Whether they scale with the new insets is not decided.
