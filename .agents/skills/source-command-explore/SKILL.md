---
name: "source-command-explore"
description: "Explora opções para uma pergunta de design (componente novo ou existente) em docs/explorations/<nome>/, para comparar lado a lado, comentar e pedir variações direto na página. Fluxo do playbook."
---

# source-command-explore

Use this skill when the user asks to run `/explore`.

Follow `.claude/commands/explore.md` from start to finish. It is the playbook flow:

- Every explorer pack includes 2 or 3 gold cards (contact sheet plus notes) from `design-brain/toolbox/references/`. The explorer studies them and does not copy them.
- Each `proto-explorer` reads `design-brain/toolbox/playbook.md` and `design-brain/toolbox/judge.md`.
- After the options are stitched and the layout check is `ok`, the art-director critique and the playbook judge run. Each option's single adjustment goes back to its explorer, for at most 2 rounds or until the critique says `none: ready`. Only then show the set.

`/explore-playbook` is the same command. The previous flow, where the critique only advises, is `.claude/commands/explore-legacy.md` (`/explore-legacy`).

Talk about options and screens, never about Git.
