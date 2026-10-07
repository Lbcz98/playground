# T03 — Primitives and local components

**Goal.** Keep the Exploratório contract in code: a primitive says why no kit component would do, and a new component is a declared proposal.
**Requirement.** R4 (Q12). **Depends on.** T02, T05. **Wave.** 2.

## Touches
`src/shared/export/fromTsx.ts`, `src/shared/export/commentGrammar.ts` (created in T05; extend it), `scripts/check-laws.ts`, `tests/checks/corpus/cases.ts`, tests. `rules.ts` **only after the user approves** (see gate 1).

## Read first
`rules.ts` (`primitives.reuse`, `primitives.budget`, `registry.new-component`), `src/shared/design-system/primitives.ts` (the budget: `PRIMITIVE_MAX_CHAIN`, `PRIMITIVE_MAX_PER_SCREEN`, and the budget check itself around line 185), `src/shared/design-system/manifest-zod.ts` (how `primitive:*`, `reuse` and `Proposal` are validated; see the Proposal block around lines 192 and 528–539), `fromTsx.ts` (`PRIMITIVE_TAGS`), `toTsx.ts` (it refuses primitives and Proposals).

## Gates (stop and report `spec_conflict`, no code, if any is true)
1. **Stack.** `fromTsx` maps only `Box` and `Text` to `primitive:*`, and the existing tests use `Stack` from `@/primitives` as a container, but `rules.ts` lists `primitive:Stack` under `appliesTo`. Report what the DTV manifest says `Stack` is. Do not edit `rules.ts`; the maintainer decides.
2. **Proposal grammar.** The validator requires every `Proposal` node to declare `registry.new-component` **with a `why`** and to carry a description and a `proposedApi` map (prop name → type or description). Q12 only specified `@proposal: <proposed API>`, which has no place for the why. Propose the grammar before coding. Default: `@proposal <why the kit lacks it>` in the component's JSDoc, plus one `@api <prop>: <type or description>` line per prop. Report it as a `spec_conflict` with that default as the recommended option, and wait for the answer.
3. If a local component cannot be represented as a blueprint `Proposal` node even with that grammar, without validator changes beyond this task, report how far it is from working.
4. The budget constants (`PRIMITIVE_MAX_CHAIN`, `PRIMITIVE_MAX_PER_SCREEN`) must stay imported from `src/shared/design-system/primitives.ts`; if the TSX path would need a copy, report it.

## Requirements
1. **`@reuse <KitComponent>: <why>`** in a JSX comment immediately before a primitive element. The grammar lives in `commentGrammar.ts` (one exported pattern, used by the parser and by T05's generator). Missing → `primitives.reuse` problem. `<KitComponent>` that is not a real component of the DTV manifest → problem. Both fixes are named in the message.
2. **Budget.** Enforce `primitives.budget` on the TSX using the existing constants, not copies: chain of primitives (a primitive inside a primitive) and per-screen count.
3. **Local components.** A `.tsx` file in `web/protos/<designer>/components/` (relative import from a screen, allowed by T02's folder rule). Each exported component needs the proposal comment from gate 2 (default: JSDoc `@proposal <why>` and `@api <prop>: <type>` lines). A screen using one without it → `registry.new-component` problem. With it → passes, and the proposal is reported. The component file itself is held to the same laws (tokens only, no host elements, kit-only and own-folder imports), and problems are attributed to that file.
4. **JSON.** `LawReport` gets `reuses: { line, primitive, considered, why }[]` and `proposals: { file, name, why, api }[]`.
5. Fidedigno validation is untouched. The `manifest-zod` policy cache stays as is.

## Acceptance criteria (corpus)
- **AC1** `primitive-box-with-reuse` → exit 0 and one entry in `reuses`.
- **AC2** `primitive-box-without-reuse` → `primitives.reuse`. `reuse-unknown-component` → problem naming the unknown component.
- **AC3** `primitive-budget-count` (one more primitive than `PRIMITIVE_MAX_PER_SCREEN`, which is 6 at the time of writing; read the constant, never hard-code the number) and `primitive-budget-chain` (one more nested than `PRIMITIVE_MAX_CHAIN`, 3 at the time of writing) → `primitives.budget`. A screen exactly at both limits → exit 0.
- **AC4** `local-component-with-proposal` → exit 0 and one entry in `proposals`. `local-component-without-proposal` → `registry.new-component`. `local-component-hex` → a law problem attributed to the component file.
- **AC5** A `Stack` case matching the finding from gate 1, with the finding written in the case's `note`.
- **AC6** The existing Fidedigno tests, the round-trip test (`fromTsx.test.ts`), and `toTsx.test.tsx` are green and unmodified.
- **AC7** Gates green, test count not lower.

## Mutation probes
Drop the reuse requirement → AC2's case fails. Set the budget constants to 99 in a scratch copy → AC3 cases fail.

## Out of scope
Exporter support for primitives and proposals. Changing `rules.ts` levels. `<Link>` (T04).

## Report back
Status, commit sha, the answers to gates 1–4, the grammar as implemented, one example of each message.
