# Imagery

Applies when: the card carries an image, a photo, a poster, a portrait, key art or a scrim.

Source: the "Extra Info" card spec in the DTV handoff (Figma, section "Especificações").

1. The image sits at the top of the card and gives way to the text: as content grows, the image shrinks, in three steps. P, M and G are the kit's content-card image sizes (`--dimension-size-semantic-content-card-image-*`). The step follows the text's line count: G for a one-line title and one line of description; M for a two-line title with up to two lines of description or five bullets; P for a two-line title with a long list. *Why: the text is the reason for the card, and it must never cover the subject.*
2. Text is anchored to the bottom of the card with the Content Card's inset (`surfaces.md`; Figma's handoff draws a smaller inset). Title up to 50 characters (two lines), description up to 200 characters, as a paragraph or bullets. Title is bold, body size, in `--color-semantic-functional-text-primary`. Description is medium, body-sm, in `--color-semantic-functional-text-muted`; no gradient fill on text. The card fill is `--color-semantic-functional-background-translucent`. *Why: a fixed anchor keeps every card of a row aligned.*
3. The scrim fades the image into the card background (`elevation.md`). The image never has its own rounding: the card owns it, and the image follows the card's inner radius.
4. Artwork is shown as delivered: no tint, filter or overlay besides the scrim.
5. Crop so the subject stays visible: the face, the title or the focal point. Crop from the side that has none.
6. Cards without an image (a themed fill, an advertising card with a QR code) keep the same text anchor and margin.
7. An action is a Wide Button in the card's footer, full width, one spacing step under the text, and it takes the focus; the card is then a container at full strength, not pressable.
8. Image, title and description are all required fields of that spec. *Why: the card has no layout for a missing one.*

Don't: text over the busy part of the art; a tint besides the scrim; an image with its own radius.
