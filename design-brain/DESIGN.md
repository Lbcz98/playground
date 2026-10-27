# DTV visual language

DRAFT 2. Every agent that draws UI reads this file in full before the first line of JSX or CSS. It holds the cross-cutting visual rules only. Per-element recipes live in `references/`, token values in `web/protos/generated/tokens.md`, process and interaction laws in `toolbox/playbook.md`.

Rules name tokens, never raw px or hex. A name not read in a tool result or in `generated/tokens.md` is a guess. Each rule ends with the reason it exists, so an agent can handle a case the rule does not name. See "Known gaps" for what is still undecided.

## 1. Overview

DTV is a gallery: content on a quiet wall. The posters, key art and numbers are the work on display; the interface is the wall, and it disappears so the content can speak. A screen says a lot with little ("falar muito com pouco"), and what stays is extremely visual. Chrome is neutral and sparse, with generous respiro, and the TV is read from 3 m with a remote.

**Key characteristics**
- Content first. When in doubt, remove.
- One brand accent. Everything else is neutral.
- No drop shadows. Depth comes from neutral steps, surface change and the scrim.
- Gradients only where the kit already has them (section 5). No new gradient.
- Three type weights: regular, medium and bold. Never extra-bold.
- Space does the work of lines and boxes.
- One focus, marked by an outline with a gap, and nothing moves.
- Tone comes before polish: the design matches the product's narrative.

## 2. Hierarchy

1. One anchor datum per card, at least 2x the support text (3x for a short number). *Why: without an anchor the eye does not know where to start; with two they compete.* Detail: `conceitos/ancora-e-apoio`.
2. Hierarchy comes from size and weight, not from colour. *Why: colour is reserved for meaning (section 4).*
3. Label above the value, smaller and softer. Unit and delta share the value's baseline at about half its size. *Why: the number is what the person came for.*
4. A status number is never louder than the title. *Why: the title says what this is; the status only qualifies it.*
5. In a row of equal items, the chosen one stands out by inverted background, not by larger text. *Why: equal labels stay comparable.*
6. Judge intent, not taste: does it serve the brief, fit where it lives, bring something new to the system?

## 3. Type

1. Use the kit's text styles (`.text-*`). No invented sizes, weights or fonts. *Why: type is the main thing inside a design, and the scale is what keeps screens alike.*
2. Three weights: regular, medium and bold. Body is regular, labels and buttons medium, the anchor and titles bold. Never extra-bold. Unselected options stay regular. *Why: a short ladder keeps the wall quiet, and bold marks what matters.*
3. Readable from 3 m. The smallest text an agent may use is `.text-footnote-*` (12px), and only for secondary labels that carry no decision. Everything else is `.text-body-sm-*` (14px) or larger, comfortable at 16 to 18px. `.text-caption-*` (10px) is not used for content. *Why: a TV is read at distance.*
4. Titles use `text-wrap: balance`, sentences `text-wrap: pretty`, changing numbers `font-variant-numeric: tabular-nums`. *Why: no orphan words, no jumping digits.* Detail: `conceitos/tipografia-de-detalhe`.
5. A title breaks after the function word ("de"), never before it, and leaves no river of empty space. Sentence case unless a name needs the capital.
6. Axis and day labels read on their own: three letters for days, same length across the row. *Why: a label that needs a legend has failed.* Detail: `conceitos/rotulo-inequivoco`.

## 4. Colour

1. One brand accent. Everything else is neutral. *Why: on a quiet wall a single hue is the only "click me" signal.*
2. Status colours (live, success, warning, error) are allowed only as state, one hue per meaning, never as decoration or identity. Detail: `conceitos/uma-cor-um-significado`. *Why: when colour appears the person already knows what it says.*
3. Colour that comes from the content (a show, a time of day such as dia, tarde, noite) is identity and counts as part of the artwork, not as a second accent. Its background is the kit's themed gradient as it is (`--gradient-primary-*`, `--gradient-inverse-*`), never a flat themed fill or a custom tint. It never takes the accent's role and never marks focus or selection.
4. Colour is never the only signal: say it also in text or shape.
5. A data series is one colour; a second only for the exceptions, with the legend saying why.
6. No pure white or pure black: white drops to about `#EEEEEE`. No dark grey text on black. Never judge contrast from the monitor render alone. *Why: TVs crush shadows and bloom whites.*
7. Neutrals: `--color-semantic-functional-background-primary`, `-background-elevated`, `-border-subtle`, `-border-default`.

## 5. Elevation and depth

1. No drop shadows, anywhere. *Why: TVs crush shadows, and the wall has no light source.*
2. Depth comes from neutral steps (`-background-primary` under `-background-elevated`) and from a change of surface. *Why: the change of tone is the divider, so no line is needed.*
3. Gradients are allowed only where the kit already uses them, and an agent invents no new one:
   - the scrim (below);
   - the focus ring (`--gradient-semantic-focus-ring`) and the focus light that comes with it (the cyan glow under the card, the "Iluminação" layer; it is light, not a shadow);
   - the default border (`--gradient-semantic-border-default`);
   - the live and replay status pills;
   - the dia, tarde and noite theme gradients, as content identity (section 4.3).
   *Why: the kit's gradients each carry a job; a new one is decoration.*
4. The card scrim is `--gradient-complementary-dark`: charcoal (`--color-core-neutral-charcoal`, #17161B) at the text edge fading to transparent toward the image. At screen level the kit's `Overlay` (`--gradient-semantic-overlay-*`) does the same job. The same gradient also covers the card's text area, so the image blends into the card's own background. It keeps text on art legible. *Why: text on art needs contrast, and a flat fill would hide the art.*
5. The scrim is used at screen level (as `Screen` does today) and on image cards and buttons that carry text over an image. It appears only when text or a label sits on the image, always with the kit's stops and strength; agents do not tune it. It must be strong enough to survive a TV that crushes shadows. The card-level scrim is new work for the kit (Known gaps).

## 6. Imagery

Source: the "Extra Info" card spec in the DTV handoff (Figma, section "Especificações").

1. The image sits at the top of the card and gives way to the text: as content grows, the image shrinks, in three steps. P is 11rem, M 16.5rem and G 20rem. The step follows the text's line count: G for a one-line title and one line of description; M for a two-line title with up to two lines of description or five bullets; P for a two-line title with a long list. *Why: the text is the reason for the card, and it must never cover the subject.*
2. Text is anchored to the bottom of the card with the Content Card's 32px inset (§7.3; Figma's handoff draws 24). Title up to 50 characters (two lines), description up to 200 characters, as a paragraph or bullets. Title is bold at 16px in `--color-semantic-functional-text-primary`. Description is medium at 14px in `--color-semantic-functional-text-muted` (#FFFFFFB3); no gradient fill on text. The card fill is `--color-semantic-functional-background-translucent`. *Why: a fixed anchor keeps every card of a row aligned.*
3. The scrim fades the image into the card background (section 5.4). The image never has its own rounding: the card owns it, and the image follows the card's inner radius.
4. Artwork is shown as delivered: no tint, filter or overlay besides the scrim.
5. Crop so the subject stays visible: the face, the title or the focal point. Crop from the side that has none.
6. Cards without an image (a themed fill, an advertising card with a QR code) keep the same text anchor and margin.
7. An action is a Wide Button in the card's footer, full width, 16px under the text, and it takes the focus; the card is then a container at full strength, not pressable. Figma "Cross Device" (12390:103027).
8. Image, title and description are all required fields. *Why: the card has no layout for a missing one.*

## 7. Space and grouping

1. Groups answer one question each. The gap between groups is one value for the whole card (`--dimension-spacing-core-xs` or `-sm`) and larger than the gap inside a group (`-3xs` or `-2xs`). *Why: distance is what says "group".* Detail: `conceitos/grupo-por-espaco`.
2. One left axis aligns every group. Space does the work of lines and boxes: no dividers, no borders between repeated items. The one exception is a small circle (4px, `--color-semantic-functional-text-muted`) between inline secondary items of one group, such as the age and the estalecas under a name. *Why: a dot separates words on one line without drawing a line.*
3. Respiro is the criterion that most separates good from bad. Padding is equal on all sides, measured to what is visible, not to layout boxes, and height is never reserved with `min-height`. "Claustrofóbico" is a rejection. The inset is 24px on a Card (`--dimension-spacing-core-lg`) and 32px on a Content Card (`--dimension-spacing-core-xl`). *Why: one inset per card type makes respiro measurable.*
4. Whatever qualifies a title (the check, a count, a state) sits beside it, in the same group and on the same baseline.
5. Data about the same subject stay together (name, age and score read as one group).
6. Items that ←/→ move between sit side by side, not stacked.
7. A fixed skeleton across variants: when several items or phases share a card, fix title position, margins, radius and subtitle and change only the data zone, at most three things per item. *Why: what does not change lets the person see what does.* Detail: `conceitos/esqueleto-fixo`.

## 8. Shape

1. A nested rounded shape takes the outer radius minus the gap between the two edges, never below zero, and each level has a larger radius than the one inside. Detail: `conceitos/raios-concentricos`.
2. The same role has the same radius in every option.
3. Panels are a Card or a Content Card. Never invent a panel radius.
4. The pill uses `--dimension-radius-semantic-pill`, up to two control heights.

## 9. Focus, selection, action

1. Exactly one focus at a time, marked by an outline with a gap between outline and piece. Nothing scales or moves, and focus never changes the member's colour. *Why: on a quiet wall the outline is the only signal, and it must not be confused with colour.*
2. The selected item is the only inverted or opaque surface in the set, also marked by a check beside its name. A label change also works.
3. One filled strong action per card; the secondary is neutral and smaller.
4. Nothing relies on hover. States are few: focused, default, disabled, plus selected.
5. **A focusable piece shows that it can be focused, at rest.** Every button-like piece the remote can reach (a day in a rail, a segment, a choice) carries a 1px outline with the diagonal light gradient: `--gradient-semantic-border-default` at `--dimension-border-width-semantic-button`, drawn inside the piece on `::before` with the same mask recipe as the focus ring (the ring stays on `::after`). The selected piece, being filled, may drop it. A toggle or segmented selector (one choice among a few that swaps the card) does not take it, and a chart whose cells only map the focus shows it on the data mark itself (the dot or bar that reacts), with the focus invisible (round 7). Without it a piece at rest reads as plain text and nobody knows the remote reaches it. *Why: a piece with no sign at rest reads as text, and on a TV nothing else tells the viewer that the remote reaches it.*
6. Detail: `conceitos/foco-e-selecao`.

## 10. Motion

Simple dissolve only, to show a transition between screens or states, with `--motion-semantic-duration` and `--motion-semantic-easing`. *Why: the screen must work without it.*

## 11. Frame

1280×720, 32pt safe-area margin applied by the frame, 16pt between top-level modules, 8pt grid. The background fills the full screen. (`generated/rules.md`)

## 12. Don'ts

Fail any of these without being asked:

1. A second accent hue, or status colour used as decoration.
2. A drop shadow.
3. A gradient outside the list in §5.3 (including a gradient fill on text), or a scrim with no text on the image.
4. Extra-bold, caption (10px) for content, or a size or font outside the kit.
5. Focus shown by scale, movement or a colour change.
6. Pure white or black, dark grey on black.
7. Several elements fighting for emphasis, or a claustrophobic card.
8. Everything in one component instead of another step, paging or a rail.
9. Copying a reference 100%. A reference is a starting point, never the arrival.
10. A decorative data display not tied to the intent.
11. Changing what was not asked.

## 13. How this file is used

- Explorers, tuners and writers read it first.
- The judge cites rules here by section and number (for example "DESIGN §5.1") when it flags something.
- A rule that repeats across review rounds is added here.

## Known gaps

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
