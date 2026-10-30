# Continuous learnings

A living, neutral log of what design work taught: each entry is a pattern or a measure, never a solution, so it applies to any component. It grows with every exploration, loop or review; nothing here is tied to one project. `DESIGN.md` and `DIRECAO.md` win where they differ.

**Adding an entry.** Put it in the section of the moment it helps (A to G). One line: tag, the failure or the win, the action. State patterns and measures, never names of components or values from one project. If it repeats an entry, sharpen that entry instead. If it fits no section, add a section and a row in the table.

**Read only the section for your moment.** Tags: **✔** worked · **✘** failed · **→** do this next time.

| Your moment | Read |
|---|---|
| `entrevista` (before asking) | A, B |
| `direção` (writing the brief) | C |
| Running rounds, briefing writers | D |
| `crítica` (judging options) | E |
| A tool or agent misbehaves | F |
| Need a quick rule of thumb | G |

## A. Before the interview: feasibility

- ✘ Demands the system could not meet (a size, a weight, a state colour) surfaced only after a full round.
- → List every numeric demand of the direction against the system's tokens and the content's real length. Mark each "available" or "needs a decision". Take the gaps to the designer first.
- ✘ A missing system step was bypassed with calculated values that differed per option.
- → Name the gap and propose the smallest addition. It beats per-option workarounds.

## B. Reading references

- ✘ A confident synthesis ("N times", "most do X") was wrong when measured by a second reader.
- → Measure each trait (size ratios, share of empty area, text position) and count how many references show it. A trait in 3 of 12 is taste, not thread. Keep the table.
- ✔ A hypothesis-led interview got one-click answers and exposed a conflict between two of the designer's own answers.
- → Ask "which of these mechanisms draws you?", never "what do you like?". When two answers conflict, resolve it openly and say how.
- ✔ Naming the focal group first made every option judgeable. → The designer names it; agents never infer it.

## C. Writing the brief

- ✘ The brief contradicted itself (one rule stated twice with two numbers), and direction and system disagreed with no owner.
- → One section per rule, one number per rule. Add a "conflicts and who decided" list and a "pending in the system" list. Writers read the brief as rules, critics check it as rules.
- → Record each decision (what, who, why) in the brief, not only in the conversation.

## D. Running rounds

- ✔ One adjustment per option per round kept rounds fast and regressions findable.
- ✔ A snapshot sent to the designer every round let them steer. → Send it, with one honest sentence on what improved and what did not.
- ✔ A stop rule agreed up front ("max rounds; if the hardest option is not ready, stop") ended the loop cleanly. → Agree it at the start.
- ✘ Composition defects found at polish stage cost two to three rounds each. → Round 1 judges composition (placement and measured ratios); polish comes after.
- ✘ The same defect survived two redraws because the cause was upstream (the layout). → A defect that survives two attempts goes up to the designer; change the composition, not the drawing.
- ✘ Rewrites from scratch or a stale backup dropped earlier fixes. → Give the writer the current file and say "change only X".
- ✘ A vague ask ("more volumetric") produced a different style. → Ask in measurable terms (light direction, image pixels per screen pixel, no flat base).
- ✔ Pointing writers at one finished image ("match this one") aligned drawn objects better than a written style. → One reference sheet per object type, plus light direction, palette and resolution as numbers.
- ✔ Resuming the same writer for the same option kept its context.
- ✔ The last rounds were one-line fixes once composition was settled: a critic's "none: ready" on every option is the end condition. → Define "ready" this way at the start.

## E. Judging options

- ✘ "Layout ok" and "tokens ok" stayed green in rounds where the picture got worse. → They are a floor. The critique against the direction decides.
- ✔ Critiques with numbers moved options; "feels heavy" did not. → Measure: empty share, focal glyph height over container, contrast on the real pixels behind text, gaps in px, object size as a multiple of the focal glyph.
- ✘ A critic forced to find something finds something. → Allow "none: ready". Treat it as a result and stop touching that option.
- → Judge the set as well: one direction, one drawing hand, varied structure and interaction (not four equal cards).
- → Forward only the one adjustment to the writer, not the whole critique.

## F. Tools and agents

- Stitching removes `parts/`: restore the other options' parts from the stitched page before rewriting one, and keep a backup per round.
- Relative image paths resolve in the stitched page, not in a loose part. Inline images above about 100 KB per page hang the token checker: use files for big images.
- A newly written agent type registers only in a later session; meanwhile a general agent following the agent file works.
- A generated guide showed a token as raw data (JSON) while the generated CSS carried a usable value (an easing function); agents declared it unusable for several rounds. → Check the generated CSS before declaring a token unusable.
- A subagent can end without its report: ask for it.
- A spawn denied without a reason is reported to the designer, not retried by another route.
- Reading every image into context is costly: use a contact sheet or a measured table.

## G. Rules of thumb (pattern-level)

- The focal glyph's height as a share of its container is a steadier measure of "this is the point" than its ratio to nearby text.
- A drawn object reads as specific when it is large, volumetric and lit from one consistent direction; as stock when it is small, flat or a centred standalone icon.
- Light text needs a dark field, and a light object cannot be that field: separate text from object, or accept a dark object and design around it.
- A selection mark is a weight: if it is a bigger mass of the strongest colour than the focal item, it competes. Make it small and low, not absent.
- Air around an object smaller than the gap inside its group reads as crowding.
- Consistency across options comes from one reference and numbers, not adjectives.
