---
description: O mesmo que /explore. O fluxo do playbook é o padrão; o fluxo antigo é /explore-legacy.
argument-hint: "<a pergunta de design, ex.: 3 opções para o ícone de alerta> | <docs/explorations/nome, para reabrir>"
allowed-tools: Bash(ls:*), Bash(mkdir:*), Bash(cp:*), Bash(node scripts/explore-ref.mjs:*), Bash(node scripts/explore-pack.mjs:*), Bash(node scripts/explore-stitch.mjs:*), Bash(node scripts/check-explore-layout.mjs:*), Bash(node scripts/check-explore-tokens.mjs:*), EnterPlanMode, ExitPlanMode, Bash(npm run explore:serve:*), Bash(npm run explore:status:*), Monitor, TaskStop, Read, Write, Glob, Agent, SendMessage, AskUserQuestion, mcp__Claude_Browser__navigate
---

`/explore-playbook` é o `/explore`. Siga `.claude/commands/explore.md` do começo ao fim: playbook, exemplos bons, juiz e loop de crítica de no máximo 2 rodadas. O fluxo anterior, sem playbook e sem loop de crítica, é `/explore-legacy` (`.claude/commands/explore-legacy.md`).

Fale em opções e telas, nunca em Git.
