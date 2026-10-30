# Visual direction (the creative director's handbook)

Vocabulary (visual direction, thread, mechanism, distance, critique round, interview round…): `CONTEXT.md` at the repo root.

Read by `proto-art-director` and by anyone who writes the "Direção visual" of a brief. `DESIGN.md` is the system's visual language (what the kit allows); this file is the **eye**: how to read a reference, how to interview a designer about taste, how to tell a card that was directed from one that was merely assembled. Where this file and `DESIGN.md` differ on what may be drawn, `DESIGN.md` wins; this file decides what is worth drawing.

A directed exploration has one idea of taste behind four different answers. An undirected one is four unrelated cards that each pass the checks. The director's job is the first.

## 1. Stance

- **Specific or silent.** Never write "clean", "modern", "premium", "elegant", "minimal", "nice", "balanced". Each of them hides a measurable choice. Say the choice (section 3).
- **Hypothesis before question.** The director studies the reference first and arrives with a theory of why the designer is drawn to it. The designer confirms, corrects or sharpens it. Never ask "what do you like about it?" cold.
- **Mechanism, not adjective.** A like or a dislike is a mechanism of the picture ("the title sits small in the corner and the rest is empty"), never a mood word ("it is calm"). The mood is the effect; the mechanism is what can be reproduced.
- **A reference is taken apart, not copied.** Take the idea (a proportion, a placement, a restraint), never the look (its colours, its sizes, its cut). The kit owns the look.
- **Absences count.** What the reference leaves out (no icon, no divider, no second colour, no label on the number) is often what the designer is reacting to. Always list them.
- **The designer's own words stay.** Quote them in the direction. Translate into mechanisms next to them, never instead of them.

## 2. Reading a reference: ten lenses

Look at the image small first (squint), then large. Write one line per lens, with a number or a named choice. A lens with nothing to say is written "none" (that is an absence, and it counts).

1. **Void and mass.** What share of the surface is empty? Is the empty area one block or scattered? Where does the mass sit (a corner, a band, the centre)? Write it as a ratio ("about 9 parts empty to 1 part text").
2. **Anchor and axis.** What is read first, and why (size, contrast, isolation, position)? Is there one left axis or several? Where does the eye enter and where does it leave?
3. **Type.** Size contrast between the biggest and the smallest text (as a multiple); weights used; case (sentence, caps, small caps); tracking (tight, normal, open); line length and leading; where the baseline of the small text sits against the big one; whether the text is optically placed (pulled in from the corner by a margin that is a share of the width).
4. **Colour.** How many hues; which one carries meaning; saturation and value range (a single dark with one light, or a ramp); what colour does that neutral could not.
5. **Light and depth.** Is there a light source? A gradient, and which way it falls; glow, grain, blur, scrim; whether depth comes from a surface change or from effects.
6. **Image.** Subject, crop, scale, how much of the card it takes; where the calm area of the image is and what sits on it.
7. **Rhythm and spacing.** The base module; margins as a share of the width; whether gaps between groups are one value or many; how breathing changes between groups.
8. **Shape.** Radii (one family or several); cuts, notches, perforations, outlines (the "picote" of a ticket is a shape idea, separate from its colour); icons as drawn shapes or as glyphs.
9. **Behaviour implied.** What the picture suggests it does (opens, slides, replays); which part looks selectable; whether the focus would be a ring, a fill or a lift.
10. **Temperature and tension.** In one phrase, what the picture feels like and what keeps it from being flat (one off-axis element, one sudden scale jump, one warm accent in a cold field). If the answer is "nothing", the picture is only quiet, and the designer is probably drawn by something else.

The output of a reading is a short table (lens, finding) and then **the theory**: two or three sentences naming the mechanisms most likely to be what the designer is drawn to, ordered by confidence, plus one thing that could be misread (a colour or a cut the designer may in fact dislike).

## 3. Vocabulary: from vague to precise

| Said | Ask which one | Mechanisms |
|---|---|---|
| "clean" | what is missing | few pieces; one axis; no dividers; one colour; large empty field |
| "airy" / "breathing" | where the air is | air around the focal group; wide margins; loose leading; low density per area |
| "minimal type" | which part | small size; light weight; open tracking; one weight only; text pulled to a corner |
| "premium" | what signals it | restraint of colour; large image with calm area; fine contrast steps; slow motion |
| "modern" | against what | geometric sans; tabular numerals; asymmetric layout; flat surfaces |
| "visual, not informative" | what carries the idea | an illustration or photo as the largest mass; number as graphic; data as shape |
| "cold" | what makes it cold | blue-grey ramp; grid and rules; many equal cells; no warmth in the accent |
| "heavy" / "dense" | what loads it | many pieces; equal weights; tight gaps; every edge used |
| "cinematic" | what borrows from film | wide crop; dark field with one light source; text on the calm band; slow fades |
| "editorial" | what borrows from print | a big type moment; captions; hairlines; asymmetric columns; pull-quote scale jump |
| "playful" | what is the play | scale jump; rounded shapes; one saturated accent; motion that overshoots |
| "generic" | which part is stock | centred icon + number + label stack; equal rows; decorative gradient with no role |

When the designer says a word from the first column, the director asks which mechanism, with these as the options.

## 4. Repertoire: visual languages a TV card can borrow from

Each entry: what it is, its signature, what it does for a card, the trap, and how the kit can carry it (`DESIGN.md` limits apply: one accent, three weights, no drop shadows, no new gradients). Reference works are named only as a place to look; the idea is taken, not the look.

1. **Quiet corner (the "label in the corner" card).** One small title pulled into a corner, a single large empty field, an accent used once. Signature: void-to-text of roughly 8:1 or more; the type is the only structure. For: states that should feel calm. Trap: empty without a reason looks unfinished; the void needs one thing that anchors it (an off-axis element). Kit: `grupo-por-espaco`, `ancora-e-apoio`, one `text-muted` caption.
2. **Key-art with a calm band** (cinema posters, streaming hero cards). A large image or illustration, text only on its calm area, a scrim where needed. For: content where mood sells. Trap: text over the busy part; two focal points (image and text). Kit: the card scrim, the image variant of the Content Card.
3. **Swiss / grid typographic.** Type as the image: scale jumps, strict left axis, numerals as graphic. For: data that deserves to be looked at. Trap: coldness; fix with one warm accent and generous leading. Kit: `.text-*` steps, `tipografia-de-detalhe` (tabular numerals).
4. **Poster type** (concert and film posters). One huge word or number cropped by the edge or stacked, the rest tiny. For: a single message. Trap: legibility when cropped; keep the cropped part decorative. Kit: a large literal size is allowed only if said in the report.
5. **Data as landscape** (weather and sky apps, sunrise charts). The data's own shape (a curve, a band, a horizon) is the picture; numbers sit on it as labels. For: continuous data. Trap: the chart becomes the loudest thing and the number loses its place. Kit: charts are not icons; the focal group keeps its weight (`ponto-focal`).
6. **Ma (negative space), the Japanese retail and stationery tradition.** Space is the material; an object sits off-centre with a lot of room on one side. For: calm, ritual, slow reading. Trap: confusing space with absence of content; the object must be perfect. Kit: the largest spacing steps, one piece per area.
7. **Instrument / product design** (calculators and radios from Braun and Teenage Engineering, analog dials). A few clear controls, one numeral display, a tactile label system. For: controls on a TV. Trap: skeuomorphism; take the layout logic, not the knobs. Kit: segmented controls, the kit ring.
8. **Mood gradient** (colour as emotion; see `cartoes-de-humor-gradiente`). A single field of graded colour that stands for a state. For: states with a feeling (hot, rainy, night). Trap: gradient as decoration; it must map to the data. Kit: only the gradients already in the kit.
9. **Departure board / flip numerals.** Mechanical numerals, fixed slots, one change at a time. For: values that change on a key. Trap: nostalgia without function. Kit: fixed-width numerals, a short transition that respects reduced motion.
10. **Album cover minimalism** (record labels with a strict cover system). A fixed template; the variable is one image or one word. For: sets of similar cards. Trap: monotony; vary one thing only. Kit: `esqueleto-fixo`.
11. **Magazine spread.** A big type moment, a caption, a hairline, an image. For: editorial cards. Trap: too many typographic voices. Kit: two weights, one scale jump.
12. **Dark-room reading** (a TV at 3 m, in the evening). Dark field, one light source, glows kept low, text brighter than its field by a clear margin. For: everything on this platform. Trap: pure black plus pure white (harsh); use the kit neutrals. Kit: neutral steps, `DESIGN.md` section 5.

The director may name a language that is not in the list when the designer's reference demands it; it then adds the entry here (same five parts) after the designer confirms.

## 4b. Boldness scale (how far from the reference an option goes)

Every option states where it stands, so four options are four distances from the same taste, not four tastes:

- **Faithful**: the reference's mechanisms, translated to the kit, nothing added.
- **Reinterpreted**: the same mechanisms on a different structure (another layout or interaction).
- **Counterpoint**: keeps the thread but inverts one liked mechanism on purpose (more mass where the reference has void) to test the thread's limits.

A set of four has at least one faithful and no more than one counterpoint.

## 5. Interviewing for taste (round 2)

The director prepares the questions; the command asks them (a sub-agent cannot talk to the designer). Up to four questions, one batch, in this order and never merged:

1. **Confirm the theory.** "I read your reference as: <mechanism 1>, <mechanism 2>. Which of these is what draws you?" Options are the mechanisms, `multiSelect`, plus "none of these" (the designer then writes). Never more than four options; each option is a mechanism written in plain words with its measure ("a título pequeno no canto, com cerca de 1/9 da área ocupada por texto").
2. **The dislike, as precise as the like.** A separate question: "What in this reference would you *not* want in your component?" Options are the elements that could be misread (its colour, its cut, its glow, its density, its typeface weight). Always include the one the director suspects, and "nothing, I would take it all".
3. **The contrast pair.** Two opposite crops of the same mechanism, said in words ("a mais vazio: o número sozinho com 80% de ar" vs "a mais presente: o número com uma ilustração grande atrás"). The designer picks a side or "in between". This reveals the dial, not the adjective.
4. **The thread and the dealbreaker.** "If all four options share one thing, which is it?" (options come from questions 1 to 3 and the round-1 Foco) and, in the same question's note, "what would make you discard an option at first sight?" Recorded as the thread and the dealbreaker.

Rules:
- Every question names a concrete element of the reference; if the reference is missing, it names an element of the closest repertoire entry and says so.
- No question asks for a mood word. No question has the options "clean", "modern" or "elegant".
- If the designer gives no reference, the director proposes **two repertoire entries** that fit the round-1 intent and asks which is nearer; the explorations then say they started from the repertoire.
- The director never explains the handbook to the designer. It asks like someone who has seen a thousand cards.

## 6. The "Direção visual" block (written into the brief)

After the answers the director returns this block, which replaces the brief's Referências and Fio condutor fields:

```
**Direção visual**
- Tom: <3 words> · temperatura: <cold/neutral/warm and why, one phrase>
- Fio condutor: <one sentence; the thing all options share>
- Referência principal: <name or "repertório: <entry>"> · teoria confirmada: <the mechanisms the designer confirmed, each with its measure>
- Levar: <mechanism: how it shows up in a card with the kit> (one line each, 2 to 4)
- Evitar: <mechanism: what it would look like if it crept in> (one line each, 1 to 3)
- Palavras do designer: "<quote>", "<quote>"
- Inegociável: <the dealbreaker>
- Teste de fidelidade: <one yes/no question a judge asks of a PNG, e.g. "o título é o único texto no canto e há pelo menos metade da área livre?">
- Distância por opção: 1 fiel · 2 reinterpretada · 3 reinterpretada · 4 contraponto (ajuste conforme as teses)
```

The "Levar" and "Evitar" lines are the contract: a writer reads them like a rule, a critic checks them like a rule.

## 7. Direction critique (after the options exist)

Input: the brief's Direção visual and the PNG of each option (plus the keys' PNGs). Output: one verdict per option, in this form, written to `docs/explorations/<slug>/direcao.md`:

`Opção N: <Tem a cara | Quase | Genérica>. Levar: <ok or what is missing, with the measure>. Evitar: <ok or what crept in>. Teste de fidelidade: <sim/não>. Genérico a olho: <the stock moves found, from the list below>. Um ajuste: <one move>.`

**Stock moves (the "generic" tells).** Name any that appear: centred stack of icon, number and label; rows of equal weight; every piece the same size within 1.5×; an accent colour used for decoration; a gradient with no data behind it; an illustration that could belong to any app; chrome that outweighs content; text pairs with no scale jump; empty space that is leftover rather than placed; a control that is louder than the thing it controls; four options that differ only in layout.

Rules: a verdict is evidence from the PNG, never taste. "Quase" always says the one move that would make it "Tem a cara". The critic never edits and never says an option is "good": it says whether it is *this* direction. The critique goes to the designer, who decides what is passed to the writers.

## 8. Learnings from past explorations

`aprendizados-continuos.md` (same folder) is the living log of what design work got right and wrong, and what to do differently, in solution-neutral terms. Its top table says which section to read for each moment (interview, direction, critique); read only that. Add to it when a loop teaches something new, in the same neutral form.
