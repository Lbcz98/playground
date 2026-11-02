Background, not a plan to follow: docs/plan-AI-Orchestration.md records how the rules and contracts came about.

Economia de tokens vem primeiro, em todo agente e modelo (Claude, Codex, Grok): leia só o necessário e uma vez, prefira o pacote ao documento inteiro, use o modelo mais barato que mantém a qualidade e não repita ciclos sem motivo.

Para escrever telas em web/protos/: siga web/protos/AGENTS.md.

## Agent skills

### Issue tracker

Issues live in GitHub Issues (`Lbcz98/playground`, via `gh`). See `docs/agents/issue-tracker.md`.

### Triage labels

Default vocabulary: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `CONTEXT.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`. Neither file exists yet; they are created when the first term or decision is recorded.
