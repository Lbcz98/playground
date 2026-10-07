# Rules and checks: how to run this

An orchestrator agent builds the work in `SPEC.md` task by task. For each task, an implementer writes it test-first and commits; a separate verifier that never sees the implementer's report re-runs everything, reviews the diff, and tries to break the new checks. You see a ledger, not a transcript.

## Files

| Path | What it is |
| --- | --- |
| `SPEC.md` | Requirements, global definition of done, evaluation method, assumptions to confirm |
| `tasks/T00…T08-*.md` | One file per task: touches, requirements, acceptance criteria with commands, mutation probes |
| `PROGRESS.md` | The ledger the orchestrator maintains |
| `verdicts/` | One verdict per verified task (created as work proceeds) |
| `REPORT.md` | Written in T08: evidence per requirement and measured numbers |
| `bootstrap.sh` | Creates the work branch and worktree, installs the agents into `.claude/`, installs dependencies |
| `agents/rules-*.md` | Orchestrator, implementer, verifier (sources; `bootstrap.sh` copies them to `.claude/agents/`) |
| `commands/rules-checks.md` | The `/rules-checks` entry point (copied to `.claude/commands/`) |

## Start

```bash
cd ~/playground-dtv
bash docs/rules-checks/bootstrap.sh     # branch feat/rules-and-checks from spike/tsx-exporter, in ../playground-dtv-rules
cd ../playground-dtv-rules
claude
```

Then, inside Claude Code:

```
/rules-checks status        # the ledger
/rules-checks T00           # one task
/rules-checks next          # everything that is ready
/rules-checks all           # until T08 or a stop
```

Run T00 first and look at `BASELINE.md` and the corpus before letting it continue. Wave 1 (T01, T05, T06) can then run in parallel.

## What stops the orchestrator and asks you

- A spec assumption the code contradicts (for example, what `Stack` is). It shows the finding and options.
- A third failed verification of the same task.
- Anything that needs your approval: changing a rule's flexibility, a layer model, a token value, deleting code, a runtime dependency.
- A merge conflict between parallel tasks.

## Limits to know about

- Nothing is pushed and no PR is opened. You review with `git log --oneline spike/tsx-exporter..HEAD`.
- The CI workflow changes (T07) are tested with a fake `gh` and YAML checks only. The first real PR is the real test.
- Tasks with render criteria (T01, T04, T07, T08) end `BLOCKED` if Chromium is not installed, never "passed".
- `/rules-checks` is the entry point. If your Claude Code version also lets you start a session as a named agent (`claude --agent rules-orchestrator`), that works too, but the kit does not depend on it. The agent files list both `Agent` and `Task` as the delegation tool because the name has differed between versions.
- To use a stronger model for the verifier, add `model:` to the frontmatter of `.claude/agents/rules-verifier.md`.
