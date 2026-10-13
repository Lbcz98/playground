# Judge skills

Reference files for `proto-judge` (the "Avaliar" button of `/tune`), read with `Read`, never loaded as Claude skills: that is why they live here and not in `.claude/skills/`, where their broad descriptions would trigger in every session.

Copied unmodified from the `jakubkrehel/skills` pack, skills.sh (MIT, licence in `LICENSE`): `better-accessibility`, `better-colors`, `better-layout`, `better-typography`, `better-ui`. Not copied: `better-interface` (its orchestration needs `better-writing` and `interface-review`; its method is in `.claude/agents/proto-judge.md`), `better-writing` (the content is sample data) and the `agents/openai.yaml` files (Codex metadata).

These are web rules. What a TV remote changes (no hover or press, arrows without wrap, kit tokens before any value) is in `proto-judge.md`, and wins over them.
