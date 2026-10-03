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

## Known limitations (do not re-investigate blindly)

- **An English request in Faithful still gets Portuguese notes (c01).** Tried, in order: one sentence at the end of the
  planner and generator prompts (language of the request); showing the generator the original request verbatim, after
  the plan (fixed p05 in Exploratório: 3 of 3 Portuguese, was 1 of 3); removing the one Portuguese example from the
  Faithful notes instruction. c01 Faithful stayed Portuguese (0 of 3 each time); the plan itself came back in English.
  Probable cause, untested: the reference template JSON in the generator's first message carries Portuguese card titles
  and menu texts. Testing it means changing Faithful prompt text again, so it is parked: the golden file marks c01 with
  `languageKnownMiss`, and the stage summary reports it under "language: … known miss", not as a regression.
- **The model reads some missing parts as covered** (a carousel as the Home rail, a scoreboard as the match header).
  That is legitimate, so v02 accepts a Proposal but does not require it; v03 (poll bars) and v04 (an explicit "propose a
  new component") are the requests that must produce one — 5 of 5 each on the current prompts, and v03 also 5 of 5 on
  the pre-C2 prompts (C2's Exploratory wording is harmless, but was not what made the difference).
- **Router misses on p08 (and, as a family, on parts the catalog lacks):** the classifier sees no conflict. `routerKnownMiss`.
- **The cache writes are the CLI's, not our prompts' (Oct 2).** A warm call writes ~19.4k tokens at every percentile,
  whatever the request; a call with a *tiny* system prompt writes the same ~19.4k and reads ~19.3k. Our 29k-character
  generator prompt (~10k tokens) is read from cache on the second call and adds no writes. The fixed overhead is the
  `claude -p` session itself (the user's tools, skills, hooks, MCP definitions). Measured with a tiny prompt called
  twice: default 19.4k written + 19.3k read, US$ 0.082; `--exclude-dynamic-system-prompt-sections` no change;
  `--tools "" --disable-slash-commands --strict-mcp-config` 4.4k written, US$ 0.018. Request-specific text sits at 79%
  (Faithful) / 66% (Exploratory) of the planner prompt and nowhere in the generator's, so reordering moves at most
  ~1.8k / ~3.5k tokens, and only when a request names different components. Not applied: the flags are a provider change
  and need a scoring check first.
