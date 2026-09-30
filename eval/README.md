# Mode evaluation (phase 9G starts here)

`seed-9d.json` holds 10 real requests, what a good run does with each (the rules it
should declare, and where), and what the first run of both modes produced after 9D.
`run.ts` runs them through the real pipeline.

```bash
npm run eval:modes -- --runs 3          # the 9G round: each request 3x, both modes
npm run eval:modes -- --only r03 --modes exploratory
```

It calls a real model (Claude Code CLI or an API key — `AI_PROVIDER`). A generation cost
US$ 0.17 to 0.33 in the first round and US$ 0.65 in a later single run of the same
request (most likely a cold prompt cache), so a full 3x round of 10 requests in both
modes — 60 generations — is somewhere between US$ 10 and 40: run a small `--only` first.
Results go to `eval/results/` (gitignored); an existing result file is skipped, so an
interrupted run resumes.

## Notes for 9G

- **Run each request 3 times.** One run of one request is an anecdote; the first round
  saw a generator retry in 3 of 10 Exploratory runs and the declaration scope changed
  between requests, so 9G measures rates, not single outcomes.
- **r03 expects no genuine break.** Four cards grouped in one row pass the module limit,
  so neither mode should declare anything. Whether the row fits the frame is visible
  only in the canvas's measured Render check, which `run.ts` cannot see: judge that
  part of r03 on the canvas (or add a headless render check to the harness).
- **r10 is a law case:** the raw red must not reach the screen in either mode, and
  nothing is declarable for it.
- **Faithful must never declare.** The summary compares Faithful runs against `[—]`.
- **What each run records:** the declared deviations with their scope (node or screen),
  every failed attempt with its structured issues and the replan trigger
  (`meta.trace`), the interpreter's notices, the QA line, the cost.
- **Keep it apart from the router few-shot** (`electron/ai/router.fewshot.ts`): a test
  fails if a request here appears there.
- **Not yet here:** the level-dependent router signals (a count above `maxModules`, a
  position with no overlay model) and classification with the chat history for
  follow-up requests — both 9G candidates, see the plan.
