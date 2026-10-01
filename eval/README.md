# Mode evaluation (phase 9G)

The golden set is `tests/eval/modes.golden.json`: 31 real requests (baselines, one per declarable pattern, a
variant, no-break cases, law traps, a convention written in English, and the Os dois cases), each with what a
good run does. It grew from `seed-9d.json` (kept as history; the ids r01–r10 keep their prompts).

## Deterministic — in `npm test`, no model

`tests/eval/golden.test.ts`: the set is well-formed and covers every declarable pattern; each pattern request's
expectation is still reachable (a reference screen from `src/shared/design-system/__fixtures__/patternBreaks.ts`
validates in Exploratory with exactly the expected declaration, and is a real break in Faithful); each law trap's
law-break fixture is rejected in both modes; the router's model-free signals read each request as expected; and no
request appears in the router few-shot. `eval/score.test.ts` pins the scorer, the cost analysis, the job plan, the
estimate and the cap.

## Live — `npm run eval:modes`, costs money

```bash
npm run eval:modes -- --stage 1 --dry-run     # the plan and its estimate; nothing runs
npm run eval:modes -- --stage 1 --confirm     # one run of everything, capped at US$ 40
npm run eval:modes -- --stage 2 --confirm     # runs 2 and 3, capped at US$ 70
npm run eval:modes -- --router --confirm      # the Auto router alone, once per request
```

The estimate comes from the measured cost per generation of every past result under `eval/results/`. A live run
whose estimate tops US$ 10 needs `--confirm`. Jobs run mode by mode (the prompt cache stays warm) with 2 at a
time; a job starts only while spent + running + its own estimate stays within the cap, and the jobs left out are
listed. Results go to `eval/results/9g/` (gitignored), stamped with the git sha and the prompts' hashes; an
existing result is skipped, so an interrupted stage resumes. Each record carries its score; the stage summary
(`summary.stage<N>.json`) adds the cost per generation by mode, cold vs warm calls, and the share of each call's
cost that is the cached prefix (from `meta.calls`).

Not yet here: the measured Render check (overflow, overlap) — `eval:render` will load each result into the canvas
through the `SFS_EVAL_FILE` dev hook.
