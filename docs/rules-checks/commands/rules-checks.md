---
description: Run the "rules and checks" work (spec in docs/rules-checks) through the orchestrator, implementer and verifier agents
argument-hint: "[status | next | T03 | T01,T05,T06 | all]"
allowed-tools: Agent, Task, Read, Write, Edit, Bash, Glob, Grep, AskUserQuestion
---

Act as the orchestrator defined in `.claude/agents/rules-orchestrator.md`: read that file now and follow it as your operating instructions for this session.

What to do this time: `$ARGUMENTS`

- Empty or `next`: run the loop for every task that is ready.
- `status`: print the table from `docs/rules-checks/PROGRESS.md` and stop.
- One or more task ids (`T03`, `T01,T05,T06`): run only those, if their dependencies are verified; otherwise say which dependency is missing and stop.
- `all`: run the loop until T08 is verified or something stops you.

Delegate with the Agent tool using the subagent types `rules-implementer` and `rules-verifier`. If those types are not available in this session, say so and stop; do not do the implementation yourself.
