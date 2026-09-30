# Consolidated Plan v2 — Faithful and Exploratory Modes

Sep 29, 2026 · @Lucas

The current Playground pipeline (planner, generator, strict validator) is already the Faithful mode. The Exploratory mode is added without loosening the validator: breaking a pattern is allowed only when declared on the node itself, and a law is never broken.

## Summary

This document gathers the consolidated architecture of Sept 29, the reviews that followed and the reading of `nodeTree.ts`. The MVP is phases 9A, 9C and 9D. One evaluation round of 30 requests costs US$ 4 to 10 (midpoint: about US$ 7).

What changed since version 1:

- The rules leave the MDX prose and become a book with an id and a level (law, pattern or convention), written in `rules.ts` for the MVP.
- A router decides the mode before the planner, and the mode comes from code, not from a confidence score the model reports.
- The deviation is declared on the node (`deviation`), and the interpreter stops undoing declared deviations.
- The mode is per screen, not per document, because "Os dois" mixes modes.
- An error that originates in the plan goes back to the planner (once), not only to the generator.

Updated Sep 30 after phases 9A, 9C and 9D were implemented and checked against the code: the rules book now covers every check the code runs (22 rules, not 12), the interpreter table below matches what each repair actually does, and 9D picks up the work 9A deferred.

## Mode contract

Both modes use the same pipeline and the same validator; what changes is the vocabulary allowed and the policy applied to pattern-level rules.

|  | Fidedigno | Exploratório |
| --- | --- | --- |
| Vocabulary | Catalog components only | Components, component parts, primitives and `Proposal` |
| Laws | Hold | Hold |
| Patterns | Hold | May be broken, if declared on the node or the screen |
| Conventions | Breaking one produces a note | Breaking one produces a note |
| Deviations | Zero; `deviation` is an error | Every broken pattern has a `ruleId` and a reason |
| Planner starting point | Reference screens, as today | The faithful alternative returned by the router |

"Os dois" delivers the faithful screen and the exploratory ones side by side, in `screens[]` (up to 6 screens). It only runs from a button, never by default: it costs US$ 0.26 to 0.65 per request and doubles latency.

The mode is per screen (`BlueprintScreen.mode`, `ScreenEntry.mode`), because `interpretPrototype` interprets each screen separately and "Os dois" mixes modes. `BlueprintDocument.mode` applies only to the first screen.

## Rules book

Every rule has an id and a level; without that, neither the router nor the validator knows what was broken. The format is `PatternRule { id, title, statement, flexibility, category, source, appliesTo? }`, where `flexibility` is `law`, `pattern` or `convention`. The type lives in `manifest.ts` (the manifest schema validates it) and `rules.ts` re-exports it.

Levels confirmed in the Sept 29 review, with the ids and the checks the Sept 30 review added (every check the validator or the interpreter runs has one):

| Level | Rules |
| --- | --- |
| Law (holds in both modes) | `tokens.only` (no hex or px); `tokens.semantic-tier` (never core); `grid.8pt`; `frame.layout` (1280×720, margin 32, gutter 16, the root is the layout container); `layers.stack` (video, overlay, content; the content layer is transparent); `focus.single`; `component.api` (components, props and enums); `blueprint.dsl` (DSL keys, version, notes, screens and their ids, `goTo` names a screen); `layout.anchor-structure` (anchor only on a direct child of the root, never on the component that holds a level's focus) |
| Pattern (broken only in Exploratory, declared) | `layers.overlay-model` (the 12 overlay models; exploring composes new ones from the 7 pieces); `level.module-limit`; `level.root-direction` (column root, justified to the end where the level says); `level.initial-focus` (where focus starts on each level, including the Home menu); `flow.next-level` (links from N to N+1); `flow.link-roles` (back and close controls); `flow.rail-consistency`; `layout.slots` (slots, order and parents); `layout.root-align` (root with `align: stretch`); `layout.no-static-center`; `layout.anchor` (at most one anchored group, only on levels that allow it) |
| Convention (breaking it produces only a note) | `templates.reference` (reference screens); `copy.button-label` (a button label that says what it does; Button, WideButton, InteractivityButton) |

`registry.new-component` is not in the 9A book. It arrives in 9E together with `Proposal`, scoped with `appliesTo` to the primitives and `Proposal`, so it is never injected globally.

**Source of the rules.** For the MVP, the rules are written in `rules.ts` (built-in system) and in `manifest.rules` or `rules.json` (imported systems). The planner reads only `manifest.rules`; that is the boundary, with no extra interface. The goal is for component rules to be born as JSDoc tags (`@law`, `@pattern`, `@part`) and for a compiler to convert them (phase 9B), if the spike confirms the tags reach Storybook's `jsDocTags`. The current fixture shows `jsDocTags: {}`. Whatever comes out of the JSDoc goes into a generated file, merged into `rules.ts`, which is never overwritten. Global rules (8pt, frame, tokens, layers) do not live on a component and stay in `rules.ts` for good.

**On-demand injection.** The planner prompt does not carry the whole book. Rules with an empty `appliesTo` (grid, frame, tokens, layers) are global and always enter; component rules enter only for the components the request mentions. The router receives the full index. Being global is declared, not implied: `GLOBAL_RULE_IDS` in `rules.ts` lists the global rules, and a test fails if any other rule lacks `appliesTo`, so no rule becomes global by omission.

## Router

The router is step 0 of `ai-orchestrator.ts` and decides the mode before the planner. It has three layers, in this order:

1. **Explicit choice.** An Auto, Fidedigno or Exploratório selector in the AgentPanel. Outside Auto, the router only lists the rules in conflict.
2. **Deterministic signals, at no cost.** Exploration words ("explore", "e se", "fora do padrão"); names that do not exist in the manifest; numbers above the limits ("quatro cards" on a level with `maxModules: 1`); a position with no overlay model.
3. **LLM classifier with few-shot.** A low-effort call that writes the `reasoning` before deciding and returns `{ reasoning, mode, conflicts[], faithfulAlternative }`. There is no `confidence` and no numeric threshold.

**The mode comes from code.** The classifier only proposes `ruleId`s. The code checks that each one exists in the book, reads the level from there and compares it with the deterministic signals. Agreement decides the mode; disagreement, or a `ruleId` that does not exist, becomes a question to the user.

| Situation | Result |
| --- | --- |
| No conflict | Fidedigno |
| Only conventions in conflict | Fidedigno, with a note |
| Pattern in conflict, signals agree | Exploratório |
| Pattern in conflict, signals disagree or unknown rule | Question in the chat |
| Law in conflict | The law holds in both modes; the reply says which one and offers the alternative |

**Auto-mode question:** "Esse pedido foge dos padrões do design system, você deseja prosseguir", with the conflict's `why` line when there is one. Buttons: Seguir padrões(Fidedigno), Explore além do padrão (Exploratório) and Gere duas opções para comparação (Os dois).

The `faithfulAlternative` is filled in when there is a conflict. In Exploratory mode the planner starts from that text and edits it instead of generating from scratch, which curbs excessive use of primitives. The few-shot examples stay separate from the phase 9G evaluation set; otherwise the accuracy metric measures memorization.

**As built in 9C (Sep 30).**

- *Signals.* `readRequest` (`request-signals.ts`) reads the request with no model: which components it names (whole-word aliases on normalized text, longest first, Portuguese aliases for the built-in components only), which UI parts it names that the system lacks, and exploration words ("e se" only where a sentence starts). A fixture of 22 real Portuguese requests pins it, traps included. The level-dependent signals (a count above `maxModules`, a position with no overlay model) were dropped: the level is only known after the planner. They are a 9G candidate.
- *Modes.* No mode means Faithful with no router call, so the existing flow is unchanged. An explicit mode makes no model call and only lists the UI parts the system lacks (under the `component.api` law). Auto calls the classifier. The selector defaults to Fidedigno, because Auto costs a call per request.
- *Classifier failure.* An unreadable answer is retried once; after that, the request is asked about if its words already flagged a conflict, and otherwise it goes Faithful with a visible note.
- *Law in conflict.* The reply is a question that names the law, shows the faithful alternative and offers only "Seguir padrões"; nothing is generated until the user picks it.
- *Wire.* The question travels as `{ ok: false, stage: 'router', question }`, so a client that can't ask shows it as a message. Every generated result carries `meta.mode` (the mode it actually ran in) and `meta.notices`.
- *Until 9D (superseded).* Exploratório and "Os dois" ran one Faithful generation and said so. Since 9D, Exploratório runs its own pipeline (see "As built in 9D"); "Os dois" alone keeps the one-Faithful-generation fallback, with the notice "Os dois arrives in 9F", until 9F. `VITE_EXPLORATORY_PREVIEW` is gone: Exploratório is always selectable, "Os dois" is hidden, and the router's question shows two buttons (Seguir padrões, Explore além do padrão).
- *Planner prompt.* The `appliesTo` rules of the components the request names are added under their own heading; a request that names none gets the exact bytes of the pre-9C prompt (a snapshot test).

&#91;embedded content: pipeline with router · two paths · shared rules book\]

The router chooses the path; both paths use the same rules book, and an error that originates in the plan goes back to the planner before the generator rebuilds the JSON.

## Deviation contract and primitives

The deviation lives on the node itself, outside `props`, and travels with it if the interpreter reorders.

```ts
interface BlueprintNode {
  deviation?: { ruleId: string; why: string }
  reuse?: { considered: string; why: string } // primitives only, exploratory only
}
interface ScreenSpec { deviation?: { ruleId: string; why: string }[] }
interface BlueprintScreen { mode?: 'faithful' | 'exploratory' }
interface BlueprintDocument { mode?: 'faithful' | 'exploratory' } // first screen
interface CanvasNode { deviation?: NodeDeviation }  // nodeTree.ts
interface ScreenEntry { mode?: ScreenMode }         // nodeTree.ts
```

- `ScreenSpec.deviation[]` covers screen-level rules with no node (an overlay model composed from the pieces).
- `reuse` is accepted only on `exploratoryOnly` components and only in Exploratory mode. Faithful mode never evaluates this field. Node keys are checked against `BLUEPRINT_NODE_KEYS`, not by the compiled Zod schemas (those cover props only), so accepting `reuse` is a node-key policy per mode.
- `Proposal` is a manifest component with `exploratoryOnly`, `description` and `proposedApi`. It always declares the `registry.new-component` deviation, a pattern added to the book in 9E.
- The name "primitives" is already taken in the code: `src/design-system/primitives.ts` holds the raw token values. The `primitive:` vocabulary should not reuse that module.
- Primitives use the `primitive:` namespace (`primitive:Box`, `primitive:Stack`, `primitive:Text`), accepted only in Exploratory, so they do not collide with the Canvas Kit `Stack`.

**Primitive budget.** Two constants in one place, starting values: at most 3 primitives in a chain (a primitive inside a primitive, not the depth of the whole tree) and 12 primitives per screen. When exceeded, the error says to group into a `Proposal` and goes back to the planner. The first round of 9G calibrates the values and decides whether `primitive:Text` counts toward the cap.

## Interpreter and canvas

The interpreter must respect the declared deviation; without that, Exploratory does not make it to the screen. Today it forcibly repairs these rules that the book marks as patterns, and the orchestrator repairs two of them before validation:

| Rule (pattern) | Where it is enforced today |
| --- | --- |
| `level.module-limit` | Not repaired: only reported, by `auditScreenLayers` and the final "Still breaks a layout rule" |
| `level.root-direction` | `repairLevelRoot` (column root; end justification; wraps the children in one row when the level shows one module) |
| `flow.next-level`, `flow.link-roles` | `interpretPrototype` (drops the link) |
| `layout.slots` | `placeChildren` (drops a misplaced child, drops a second slot child, restores slot order) |
| `layout.root-align` | `repairFrameLayout`, and `stretchRoots` in the orchestrator before validation |
| `layout.no-static-center`, `layout.anchor` | `repairFrameLayout` |
| `layers.overlay-model` | `repairScreen` (an unknown model falls back to Home) |
| `level.initial-focus` | `repairLevelFocus`, `repairMenuFocus`, and `restStrayFocus` in the orchestrator before validation |

The final `frameLayoutErrors` also warns "Still breaks a layout rule". Since 9A, every repair and warning names its rule in `InterpretIssue.ruleId`. The two orchestrator repairs run before the validator sees the screen, so 9D must make them deviation-aware too, or a declared deviation is rewritten before it is checked. Each repair now skips the rule when the node or the screen declares that `ruleId`, only if the rule is pattern-level and the screen is exploratory. A law declared as a deviation is still repaired. A skipped repair emits an info-level notice.

Other interpreter rules:

- A node with an invalid `reuse` is not dropped: it stays, marked "reported, not repaired", with a warning.
- `deviation` on a faithful screen is removed, with a warning.
- The audit that feeds the panel runs on the already-interpreted tree, because repairs may have resolved violations.

**Cost of `deviation` on `CanvasNode`** (I read `nodeTree.ts`). It needs no code: `cloneTree` is a `structuredClone`, the undo and redo snapshots hold the whole tree, `updateProps` only replaces `props` and `placeChildren` reorders the same objects. The document is not persisted, so there is no migration. It needs a little code: the field on the type, the read in `interpretNode` (and in `BLUEPRINT_NODE_KEYS`), one line in `treeToBlueprint`, `mode` on `ScreenEntry` and in `BLUEPRINT_SCREEN_KEYS`, the outline in `NodeRenderer` and the badge in `LayersPanel`. The real cost is in the audit (depends on 9A) and the "Deviations" panel (9F).

**Deviation outline.** A dashed `outline` in the Tailwind theme's `brand` color, applied in `NodeRenderer` only while editing, in place of the `outline-none` that goes on every node today. No new token, and outside the exported bundle. The dashed shape sets the deviation apart from the solid selection ring without relying on color alone.

## Validator and orchestrator

**Schema cache.** A `WeakMap<Manifest, Map<policy, schemas>>`, compiling once per manifest and policy. The manifest key is object identity; the policy is a string (`'faithful'` or `'exploratory'`), never an object, or the `Map` never hits. The manifest arrives over IPC as a new object on every request (the handler parses it with the strict manifest schema), so the gain is within a request (screens × attempts); the interpreter and the registry share the same cache. Schemas are not mutated after compilation, and no code mutates a manifest in place, so "Both" does not contaminate the cache. Test: the same manifest compiled in both modes keeps the faithful schema rejecting `reuse`. Until 9E both policies compile the same props, so that test guards against a regression.

**Structured errors.** The validator now emits `ValidationIssue { ruleId, message, path }`, with today's text as the `message`. `path` is absolute from the document, as keys and indexes (`['screens', 0, 'root', 'children', 1, 'props', 'items', 2, 'label']`); in nested props its tail comes from Zod's `issues[].path`. The frame, layer and flow audits carry ruleIds too, and their string functions stay as wrappers, so the canvas QA badge is unchanged. `errors: string[]` was kept next to `issues` in 9A and removed in 9D: the orchestrator and the Storybook importer read `issues`. The descent into the tree continues through nodes of unknown or missing type, so the children's errors show up in the same attempt; under an unknown parent no placement rule applies.

**`sanitizeProps`** (in the interpreter) now repairs a list prop item by item (done in 9D; see below). The 9A characterization test that pinned the old whole-list reset was updated deliberately.

**Policy and audit per screen.** The validator receives the screen's policy. A law violation is always an error. A pattern violation is an error in Faithful; in Exploratory it passes if the node or the screen declares the `ruleId`. The audit requires the violated `ruleId`s to equal the declared ones.

**Plan retry.** Today the retry only feeds back to the generator. Errors that originate in the plan (`reuse` without a justification, a primitive that repeats a component, an exceeded budget, an undeclared deviation) and serious structural errors go back to the planner, which redoes planner and generator. Local errors (an enum value, an unknown key) keep going only to the generator. The limit is `AI_MAX_REPLANS`, starting at 1: it goes to 2 only if the replan rate measured in the first round shows that the second one solves what the first did not.

**Manual edit (9F).** If the person breaks a pattern in the Inspector, the system runs the same validation on the altered state and stamps the node with the real violated `ruleId` and origin "user". There is no generic stamp (`manual-override`): the audit compares violated ruleIds with declared ones, and an invented id would never match.

**As built in 9D (Sep 30).**

*Contract.* `RuleDeviation { ruleId, why }` lives in `manifest.ts`. `BlueprintNode.deviation` and `CanvasNode.deviation` sit outside `props`; `ScreenSpec.deviation[]` covers the whole screen; `mode` is on `BlueprintDocument` (the first screen), `BlueprintScreen` and `ScreenEntry`. `nodeKeysFor(mode)` makes `deviation` an Exploratory-only node key, so the Faithful key set is unchanged. `treeToBlueprint` carries `deviation` and `flowStore.replaceDocument` copies the root's. No `reuse` (9E).

*The mode is the pipeline's, never the model's.* The orchestrator strips any `mode` the model wrote (with a notice when it differed) and stamps the mode the router decided on the document and every screen. A Faithful result carries no `mode` key at all, exactly as before; the interpreter treats an absent mode as Faithful and records the mode each `ScreenEntry` ran in.

*Validator.* `validateBlueprintAgainstManifest(input, manifest, policy)`; a screen's stamped `mode` overrides the policy, so each screen is held to the mode it ran in. Faithful rejects `deviation`. Exploratory accepts one only for a pattern of the book: a law, a convention, an unknown id, a bad shape and `layers.overlay-model` (composing an overlay is 9E) are errors. The audit requires the broken patterns to equal the declared ones: a node's declaration covers its subtree, the screen's covers the screen, the deepest declaring node wins, and a different rule covers nothing. An undeclared break (`kind: 'undeclared-deviation'`) and a declaration nothing breaks (`kind: 'unused-deviation'`) are both errors. A law breaks in every mode. The compiled schemas cover props only, so the policy changes the node-key check and the audit; the cache is still keyed by policy, and after an exploratory compile the Faithful policy still rejects `deviation` (tested).

*Interpreter.* A repair is skipped only when the node, an ancestor or the screen declares that exact rule, the rule is a pattern, and the screen is Exploratory: `layout.root-align`, `layout.no-static-center`, `layout.anchor`, `level.root-direction`, `level.initial-focus`, `layout.slots` (placement, duplicates, order), `flow.next-level` and `flow.link-roles` (a link is kept), and the `level.module-limit` report. A skip emits an info notice naming the rule and the reason; laws are always repaired. A `deviation` on a Faithful screen is removed with a warning; one that is a law, a convention, unknown, malformed or the overlay rule is refused with a warning. The final "Still breaks a layout rule" report runs on the interpreted tree and is held to the declarations. The two orchestrator repairs (`stretchRoots`, `restStrayFocus`) leave a declared rule alone too.

*Orchestrator.* An Exploratory generation validates under its mode and feeds structured issues back (`[ruleId] at path: message`); Faithful keeps its plain list. A composition choice goes back to the planner (`AI_MAX_REPLANS`, default 1, at most 2): an undeclared break or a declaration nothing breaks immediately, and `level.module-limit` or `layout.slots` breaks only if they persist after the generator's retries. Expression errors (props, DSL, an unknown or law ruleId) and anything unlisted stay with the generator. The trigger is logged in the steps. Faithful never replans. The router's `faithfulAlternative` seeds the Exploratory planner.

*Prompts.* Exploratory adds the deviation contract to the planner (a "Deviation:" line per planned break), to the generator (the field, its scope, the two ways to fail the audit, the laws never declarable, the declarable patterns) and to the `render_ui` tool. Measured on the built-in system: the planner prompt grows by 2,571 characters (+10.4%, about 640 tokens), the generator prompt by 2,805 (+9.8%, about 700 tokens) and the tool by 784 (+33%, about 200 tokens). Faithful prompts and the Faithful tool are byte-identical (snapshots).

*`sanitizeProps`.* A list prop with fields is repaired item by item: an item that is not an object, or whose bad field is required with no default, is dropped; an item whose bad field is optional or defaulted keeps the rest; unsupported fields are removed; each change is a warning naming the node and the field. A list over its own limit still falls back whole. This is the one deliberate change to Faithful behaviour in 9D.

*Canvas.* A node that declares a deviation draws a dashed `brand` outline while editing (replacing `outline-none`); the Layers panel shows a dashed "deviation" badge and, on the root, a "screen deviation" badge. The canvas has no document export, so the outline is edit-only by construction.

*Left for 9F.* The canvas "Layout QA" badge still counts a declared break as a failure, because `auditFrameLayout` does not know about declarations; the "declared vs undeclared" view belongs to the 9F panel.

## Phases

The MVP closes at 9D: both modes working only with components that already exist, recomposed and with declared deviations. 9B and 9G run in parallel. The numbering follows the README, which stops at Phase 8.

| Phase | What it delivers | Depends on |
| --- | --- | --- |
| 9A · Validator and book (done Sep 30) | `rules.ts` and `manifest.rules?`; `{ ruleId, message, path }` errors; cache by manifest and policy; full descent; `InterpretIssue.ruleId?`. Does not change what the validator accepts | — |
| 9B · JSDoc rules (optional) | Spike of the `@law`, `@pattern`, `@part` tags in `jsDocTags`; compiler into `manifest.rules`, merged into `rules.ts` | 9A; does not block the MVP |
| 9C · Router (done Sep 30) | `router.ts` as step 0; `appliesTo` filter in `promptSpec.ts`; Auto, Faithful, Exploratory selector and the three buttons in the AgentPanel | 9A |
| 9D · Deviations, policy and retry (done Sep 30) | Per-screen `mode`, `deviation` on the node, policy in `manifest-zod.ts`, audit, plan retry, deviation-aware interpreter (and the orchestrator's `stretchRoots` and `restStrayFocus`), outline and badge; `sanitizeProps` repairs only the bad field; the orchestrator reads `issues` and `errors` is removed. Closes the MVP | 9A, 9C |
| 9E · Exploratory vocabulary | `primitive:` primitives, `reuse`, budget, `Proposal` and the `registry.new-component` rule (scoped to them), overlay composition declared in `ScreenSpec.deviation` | 9D |
| 9F · Canvas and Deviations panel | "Declared" vs "undeclared" panel, "Both" output, template lock, manual-edit stamp | 9D |
| 9G · Evaluation | `tests/eval/modes.golden.json` with about 30 requests, separate from the few-shot (`router.fewshot.ts`; a test fails if a golden request appears there); the deterministic part goes into `npm test`, the live part is optional. Candidates: the level-dependent router signals dropped from 9C; classifying with the chat history for follow-up requests | Starts together with 9C |

## Measuring and cost

One round of 30 requests (15 faithful and 15 exploratory) costs US$ 4 to 10, about US$ 7 at the midpoint, versus US$ 4.7 in the previous estimate (about 45% more). Only the US$ 0.10 to 0.21 per generation is measured, in the September rounds; the rest is assumption.

| Step | Cost per request | Basis |
| --- | --- | --- |
| Today's generation (planner + generator, 1 to 2 attempts) | US$ 0.10 to 0.21 | Measured |
| Router (one low-effort call, few-shot, without the catalog) | US$ 0.01 to 0.03 | Assumption |
| Larger exploratory prompt | +15% to +30% on the generation | Assumption |
| Replan (planner and generator again) | One extra generation in 20% to 40% of exploratory requests | Assumption |

| Group | Per request | Total |
| --- | --- | --- |
| 15 faithful | US$ 0.11 to 0.24 | US$ 1.7 to 3.6 |
| 15 exploratory | US$ 0.15 to 0.41 | US$ 2.2 to 6.2 |
| Round of 30 |  | US$ 4 to 10 |

The first round records the `usage` of each step (router, planner, generator, replan) to replace the assumptions with measurements.

**Set metrics**, with suggested targets to calibrate:

| Metric | How it is measured | Target |
| --- | --- | --- |
| Mode accuracy | Router mode × expected | 90% or more |
| False exploratory | Faithful requests that became exploratory | 5% or less |
| Recall of rules in conflict | ruleIds detected × expected | 80% or more |
| Clean Faithful | Faithful screens with zero deviations and complete Layout QA | 100% |
| Laws intact | Audit of the exploratory screens | 100% |
| Honest deviations | Real violations = declared | 100% |
| Primitive without valid `reuse` | Missing, empty or with a nonexistent `considered`, after the retries | 0 |
| Replans | Share of generations that triggered the plan retry | Track |
