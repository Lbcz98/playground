---
name: design-brain
description: Load before designing or writing any UI (component, card, screen, layout, chart, interaction, style), before the first line of JSX or CSS. The design-brain MCP tools hold the reference notes, the design rules and the design tokens; without them every size, colour and layout is a guess.
---

# Design brain

Two kinds of notes, both in Portuguese (keep search words in Portuguese). **References** are anatomy notes of one element: how its type, space and colour work, and a recipe. **Concepts** are rules that cut across elements, each with the kit tokens that apply it. The reference images are never shown; the notes are the source.

## Steps

0. **Visual language.** Read `design-brain/DESIGN.md` in full. It sets the rules every other step follows (one accent, no shadows, the allowed gradients, the type weights and floor, imagery, insets). Where a reference note or concept differs, `DESIGN.md` wins. Done when you can name the gradients and weights you may use.

1. **Find.** `list_references` with one word for what you are building (rota, escala, fileira, foco, anel, barras…). Read the catalog lines and pick one or two whose `resumo` fits the idea. Done when each pick has a name from the catalog.
2. **Read.** `get_reference` for each pick: `cerne` and `receita` by default. Add `tipografia`, `posicao`, `cor`, `hierarquia` or `interacao` only for the part you are about to build. Done when you can say, in one sentence, the idea you are taking and why it fits.
3. **Rules.** `list_concepts`, then `get_concept` for each rule the element touches (size hierarchy, colour roles, grouping, nested radii, focus, fixed skeleton, unambiguous labels, type details). Each catalog line says `vale para:`; apply a rule only where that fits (a choice row is not a data card). Read `uso` for the tokens that apply it and `ajuste` before you bend it. Done when every card you draw has its anchor, its colour roles and its groups decided.
4. **Interact.** If the element takes input, `get_patterns` with a pattern name from the catalog line, and `get_keys` for the keys the card allows. Build the interaction exactly as the row describes.
5. **Tokens.** Take names from the `uso` sections first. For anything else, `get_tokens` with no category lists the categories; ask again for only the one you need. A token's CSS name is its path joined with hyphens, camelCase in kebab-case (`color.semantic.functional.text-muted` is `--color-semantic-functional-text-muted`); a text style is a `.text-*` class. Write the name exactly, and a name you did not read in a tool result is a guess. Done when no raw colour, size or font value is left in what you wrote.
6. **Write.** Take structure, hierarchy and logic from the notes. Take values from the tokens. Each reference's `Lição` line says what to keep; the original's look stays behind.

## Citing

Name a reference or concept only if the catalog returned it. Say what you took from it: hierarchy, type, position, colour, interaction or a rule. When nothing fits, say so and work from the tokens and your own judgement.

## Order

Call the tools before the first line of JSX or CSS. Reading a note after the code is written only confirms the code.
