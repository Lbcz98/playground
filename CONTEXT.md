# Design exploration studio

The vocabulary used by designers and by the agents that explore, direct and critique UI options for a TV product. Where a word below was used with two meanings before, one meaning won and the other is listed under _Avoid_.

## Language

### The work

**Exploration**:
One question answered by several options, built as a throwaway page for a designer to compare.
_Avoid_: study, prototype (a prototype is a screen, built with `/proto`)

**Option**:
One numbered answer inside an exploration, with its own thesis, interaction pattern and pieces.
_Avoid_: variant, version, "direction" (see below)

**Brief**:
The agreed contract of an exploration: purpose, focal group, visual direction, control, states, content and one thesis per option.
_Avoid_: spec, prompt

**Thesis**:
The one-sentence idea an option makes visible; every piece in the option serves it.
_Avoid_: concept, theme

### Focus and hierarchy

**Focal group**:
The set of information that fulfils the component's goal, named by the designer. It is the first thing read and wins on several visual levers at once.
_Avoid_: main info, highlight, hero

**Focus** (brief field):
The brief field that names the goal and the one focal group, and what stays secondary.
_Avoid_: priority

**Anchor**:
The one datum inside the focal group that carries the size contrast, at a clear multiple of the support text.
_Avoid_: primary value, headline number

**Display numeral**:
A focal number set in a display-size text style; only numerals, one per card.
_Avoid_: big number, hero number

### Taste and direction

**Visual direction**:
The block of the brief that records the designer's taste as precise mechanisms: tone, thread, what to take, what to avoid, their own words, the dealbreaker and the fidelity test.
_Avoid_: "direction" alone, style guide, mood

**Thread**:
The one sentence that all options of an exploration share (what the visual direction's tone and focal group add up to). Options vary thesis and interaction, never the thread.
_Avoid_: theme, concept, common idea

**Mechanism**:
An observable, reproducible choice in a reference (a ratio of empty space, a placement, a weight), as opposed to a mood word.
_Avoid_: vibe, feeling, trait

**Distance**:
How far an option stands from the reference: faithful, reinterpreted or counterpoint. A set has at least one faithful and at most one counterpoint.
_Avoid_: boldness, fidelity level

**Fidelity test**:
The single yes/no question a critic asks of an option's picture to check it follows the visual direction.
_Avoid_: checklist, acceptance test

### The loop

**Interview round**:
One batch of questions to the designer. Round 1 is about the component; round 2 is about taste, prepared by the art director.
_Avoid_: "round" alone

**Critique round**:
One pass of a direction critique over all options, followed by one adjustment per option. The loop ends after the agreed number of critique rounds or when the hardest option is judged ready.
_Avoid_: iteration, "round" alone

**Direction critique**:
The art director's verdict on each option against the visual direction and the references, from the picture and measures: on-direction, almost, or generic. It never edits an option.
_Avoid_: review (a review checks rules, not taste), audit

**Art director**:
The agent that reads references, prepares the taste interview, writes the visual direction and gives the direction critique. It never builds options and cannot talk to the designer.
_Avoid_: creative director agent, judge (the judge measures accessibility and layout)

**Part**:
One option written on its own, stitched into the exploration page with the others.
_Avoid_: fragment, slide

**Snapshot**:
The pictures of every option at the end of a critique round, sent to the designer so they can steer.
_Avoid_: screenshot dump, export

## Relationships

- An **exploration** has one **brief** and several **options**; the brief holds one **focal group**, one **visual direction** and one **thesis** per option.
- The **visual direction** sets the **thread**; each **option** stands at a **distance** from the reference and answers to the **fidelity test**.
- The **art director** runs the second **interview round**, writes the **visual direction**, and gives the **direction critique** in every **critique round**.
- A **focal group** contains one **anchor**; a **display numeral** may be that anchor.
