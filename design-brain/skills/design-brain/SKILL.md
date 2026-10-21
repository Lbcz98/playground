---
name: design-brain
description: Load before designing or writing any UI (component, card, screen, layout, chart, interaction, style), before the first line of JSX or CSS. The design-brain MCP tools hold the reference notes and the design tokens; without them every size, colour and layout is a guess.
---

# Design brain

The references are anatomy notes written in Portuguese: what an element does, how its type, space and colour work, and a recipe. Keep search words in Portuguese. The reference images are never shown; the notes are the source.

## Steps

1. **Find.** `list_references` with one word for what you are building (rota, escala, fileira, foco, anel, barras…). Read the catalog lines and pick one or two whose `resumo` fits the idea. Done when each pick has a name from the catalog.
2. **Read.** `get_reference` for each pick: `cerne` and `receita` by default. Add `tipografia`, `posicao`, `cor`, `hierarquia` or `interacao` only for the part you are about to build. Done when you can say, in one sentence, the idea you are taking and why it fits.
3. **Interact.** If the element takes input, `get_patterns` with a pattern name from the catalog line, and `get_keys` for the keys the card allows. Build the interaction exactly as the row describes.
4. **Tokens.** `get_tokens` with no category lists the categories; ask again for only the one you need (color, dimension, typography…). Write token names in the code. Done when no raw colour, size or font value is left in what you wrote.
5. **Write.** Take structure, hierarchy and logic from the notes. Take values from the tokens. Each note's `Lição` line says what to keep; the original's look stays behind.

## Citing

Name a reference only if `list_references` returned it. Say what you took from it: hierarchy, type, position, colour or interaction. When nothing in the catalog fits, say so and work from the tokens and your own judgement.

## Order

Call the tools before the first line of JSX or CSS. Reading a note after the code is written only confirms the code.
