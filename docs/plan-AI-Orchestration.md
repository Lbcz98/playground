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

Every rule has an id and a level; without that, neither the router nor the validator knows what was broken. The format is `PatternRule { id, title, statement, flexibility, category, source, appliesTo? }`, where `flexibility` is `law`, `pattern` or `convention`.

Levels confirmed in the Sept 29 review:

| Level | Rules |
| --- | --- |
| Law (holds in both modes) | Tokens only, no hex or px; semantic tier, never core; 8pt grid; frame 1280×720, margin 32, gutter 16; video, overlay, content stack; one focus per screen; component API (props and enums) |
| Pattern (broken only in Exploratory, declared) | The 12 overlay models (exploring composes new ones from the 7 pieces); module limit per level; links from N to N+1; slots, order and parents; root with `align: stretch` |
| Convention (breaking it produces only a note) | Reference screens; a button label that says what it does |

**Source of the rules.** For the MVP, the rules are written in `rules.ts` (built-in system) and in `manifest.rules` or `rules.json` (imported systems). The planner reads only `manifest.rules`; that is the boundary, with no extra interface. The goal is for component rules to be born as JSDoc tags (`@law`, `@pattern`, `@part`) and for a compiler to convert them (phase 9B), if the spike confirms the tags reach Storybook's `jsDocTags`. The current fixture shows `jsDocTags: {}`. Whatever comes out of the JSDoc goes into a generated file, merged into `rules.ts`, which is never overwritten. Global rules (8pt, frame, tokens, layers) do not live on a component and stay in `rules.ts` for good.

**On-demand injection.** The planner prompt does not carry the whole book. Rules with an empty `appliesTo` (grid, frame, tokens, layers) are global and always enter; component rules enter only for the components the request mentions. The router receives the full index.

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
- `reuse` is injected by Zod only on `exploratoryOnly` components and only in Exploratory mode. Faithful mode never evaluates this field.
- `Proposal` is a manifest component with `exploratoryOnly`, `description` and `proposedApi`. It always declares the `registry.new-component` deviation.
- Primitives use the `primitive:` namespace (`primitive:Box`, `primitive:Stack`, `primitive:Text`), accepted only in Exploratory, so they do not collide with the Canvas Kit `Stack`.

**Primitive budget.** Two constants in one place, starting values: at most 3 primitives in a chain (a primitive inside a primitive, not the depth of the whole tree) and 12 primitives per screen. When exceeded, the error says to group into a `Proposal` and goes back to the planner. The first round of 9G calibrates the values and decides whether `primitive:Text` counts toward the cap.

## Interpreter and canvas

The interpreter must respect the declared deviation; without that, Exploratory does not make it to the screen. Today it forcibly repairs four rules that the book marks as patterns:

| Rule (pattern) | Where the interpreter enforces it today |
| --- | --- |
| Module limit per level | `repairLevelRoot` |
| Links from N to N+1 | `interpretPrototype` |
| Slots, order and parents | `placeChildren` ("Dropped a child") |
| Root with `align: stretch` | `repairFrameLayout` |

The final `frameLayoutErrors` also warns "Still breaks a layout rule". Each repair now skips the rule when the node or the screen declares that `ruleId`, only if the rule is pattern-level and the screen is exploratory. A law declared as a deviation is still repaired. A skipped repair emits an info-level notice.

Other interpreter rules:

- A node with an invalid `reuse` is not dropped: it stays, marked "reported, not repaired", with a warning.
- `deviation` on a faithful screen is removed, with a warning.
- The audit that feeds the panel runs on the already-interpreted tree, because repairs may have resolved violations.

**Cost of `deviation` on `CanvasNode`** (I read `nodeTree.ts`). It needs no code: `cloneTree` is a `structuredClone`, the undo and redo snapshots hold the whole tree, `updateProps` only replaces `props` and `placeChildren` reorders the same objects. The document is not persisted, so there is no migration. It needs a little code: the field on the type, the read in `interpretNode` (and in `BLUEPRINT_NODE_KEYS`), one line in `treeToBlueprint`, `mode` on `ScreenEntry` and in `BLUEPRINT_SCREEN_KEYS`, the outline in `NodeRenderer` and the badge in `LayersPanel`. The real cost is in the audit (depends on 9A) and the "Deviations" panel (9F).

**Deviation outline.** A dashed `outline` in the Tailwind theme's `brand` color, applied in `NodeRenderer` only while editing, in place of the `outline-none` that goes on every node today. No new token, and outside the exported bundle. The dashed shape sets the deviation apart from the solid selection ring without relying on color alone.

## Validator and orchestrator

**Schema cache.** A `WeakMap<Manifest, Map<policy, schemas>>`, compiling once per manifest and policy. The manifest key is object identity; the policy is a string (`'faithful'` or `'exploratory'`), never an object, or the `Map` never hits. The manifest arrives over IPC as a new object on every request, so the gain is within a request (screens × attempts). Schemas are not mutated after compilation, so "Both" does not contaminate the cache. Test: the same manifest compiled in both modes keeps the faithful schema rejecting `reuse`.

**Structured errors.** The validator now emits `{ ruleId, message, path }`, with today's text as the `message`. In nested props the path comes from Zod's `issues[].path` (`[2].label`), and `sanitizeProps` repairs only the bad field. The descent into the tree continues through nodes of unknown type, so the children's errors show up in the same attempt.

**Policy and audit per screen.** The validator receives the screen's policy. A law violation is always an error. A pattern violation is an error in Faithful; in Exploratory it passes if the node or the screen declares the `ruleId`. The audit requires the violated `ruleId`s to equal the declared ones.

**Plan retry.** Today the retry only feeds back to the generator. Errors that originate in the plan (`reuse` without a justification, a primitive that repeats a component, an exceeded budget, an undeclared deviation) and serious structural errors go back to the planner, which redoes planner and generator. Local errors (an enum value, an unknown key) keep going only to the generator. The limit is `AI_MAX_REPLANS`, starting at 1: it goes to 2 only if the replan rate measured in the first round shows that the second one solves what the first did not.

**Manual edit (9F).** If the person breaks a pattern in the Inspector, the system runs the same validation on the altered state and stamps the node with the real violated `ruleId` and origin "user". There is no generic stamp (`manual-override`): the audit compares violated ruleIds with declared ones, and an invented id would never match.

## Phases

The MVP closes at 9D: both modes working only with components that already exist, recomposed and with declared deviations. 9B and 9G run in parallel. The numbering follows the README, which stops at Phase 8.

| Phase | What it delivers | Depends on |
| --- | --- | --- |
| 9A · Validator and book | `rules.ts` and `manifest.rules?`; `{ ruleId, message, path }` errors; cache by manifest and policy; full descent; `InterpretIssue.ruleId?`. Does not change what the validator accepts | — |
| 9B · JSDoc rules (optional) | Spike of the `@law`, `@pattern`, `@part` tags in `jsDocTags`; compiler into `manifest.rules`, merged into `rules.ts` | 9A; does not block the MVP |
| 9C · Router | `router.ts` as step 0; `appliesTo` filter in `promptSpec.ts`; Auto, Faithful, Exploratory selector and the three buttons in the AgentPanel | 9A |
| 9D · Deviations, policy and retry | Per-screen `mode`, `deviation` on the node, policy in `manifest-zod.ts`, audit, plan retry, deviation-aware interpreter, outline and badge. Closes the MVP | 9A, 9C |
| 9E · Exploratory vocabulary | `primitive:` primitives, `reuse`, budget, `Proposal`, overlay composition declared in `ScreenSpec.deviation` | 9D |
| 9F · Canvas and Deviations panel | "Declared" vs "undeclared" panel, "Both" output, template lock, manual-edit stamp | 9D |
| 9G · Evaluation | `tests/eval/modes.golden.json` with about 30 requests, separate from the few-shot; the deterministic part goes into `npm test`, the live part is optional | Starts together with 9C |

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
