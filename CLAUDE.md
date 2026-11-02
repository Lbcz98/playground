Background, not a plan to follow: docs/plan-AI-Orchestration.md records how the rules and contracts came about.

A linguagem visual (cor, gradientes, sombras, tipografia, imagens, respiro) está em `design-brain/rules/`, um tópico por arquivo. `design-brain/DESIGN.md` é o índice: quem desenha lê o índice e só os tópicos daquela tela, não a pasta inteira.

Para escrever telas em web/protos/: siga web/protos/CLAUDE.md.

Para explorações (`/explore`): o roteiro é `.claude/commands/explore.md`. O pacote de cada opção (`scripts/explore-pack.mjs`) cola só os tópicos que ela precisa; `/explore-playbook` faz o mesmo. Sem pacote, `docs/explorations/_template/explorer-on-demand.md`. O uso de tokens por papel fica em `usage.jsonl` (`scripts/explore-usage.mjs`).

## Agent skills

### Issue tracker

Issues live in GitHub Issues (`Lbcz98/playground`, via `gh`). See `docs/agents/issue-tracker.md`.

### Triage labels

Default vocabulary: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `CONTEXT.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`. They now exist; extend them as terms and decisions are resolved.

## Fluid Functionalism

- Fluid hover and pointer states: not applicable. TV has no pointer; the only states are default, selected (focus) and disabled.
- Motion: one system spring (motion.semantic.easing, 800ms) for every transition, including width/height/padding on focus expansion. Deliberate, not an off-token duration.
