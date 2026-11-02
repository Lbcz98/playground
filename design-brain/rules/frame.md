# Frame

Applies when: every card.

The screen is 1280×720. The background fills the full screen. 16pt between top-level modules, 8pt grid (`web/protos/generated/rules.md`).

**Screen safe area** (TV overscan) is the frame's own margin, not the card's padding. The frame applies 32pt on every side (`frame.layout`; `frameSpec.margin` is 32). The root adds no margin of its own. Assets are thought for 1280×720.

**Card padding and radius are a different pair.** The padding (inset) is 32px. The radius is 40px (`--dimension-radius-semantic-card`, `--dimension-radius-semantic-card-expanded`, `--dimension-radius-semantic-content-card`). 40 is the radius. It is not a padding, an inset, or a safe area.

A card that leaves the 1280×720 frame or the 32pt screen margin is a law break.
