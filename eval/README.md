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
- **The cache writes were the CLI's, not our prompts' — fixed by isolating the CLI (Oct 2).** `claude -p` loaded the user's
  settings, hooks, plugins, skills and MCP definitions into every call: ~19.4k tokens written whatever the prompt, and
  the user's own hook text reached the model's context (a probe asked what it could see and listed it). `--tools ""
  --disable-slash-commands --strict-mcp-config` alone still left ~4.2k of that, hook text included. What removes it is
  `--setting-sources ""` (no user/project/local settings, so no hooks or plugins) and `--safe-mode` (also CLAUDE.md and
  memory): a tiny prompt writes ~600 tokens, US$ 0.0024. `--bare` would also skip them but only authenticates with an
  API key, so it cannot use the subscription. `--exclude-dynamic-system-prompt-sections` changed nothing (and does not
  apply with `--system-prompt`). Our `--system-prompt` is a **full replacement** (not `--append-system-prompt`).
  `claudeCli.ts` now passes `--tools "" --disable-slash-commands --strict-mcp-config --setting-sources "" --safe-mode
  --no-session-persistence` and runs in an empty temp directory (`$TMPDIR/sfs-cli-clean`); It is the **default** (Oct 3); `SFS_CLI_ISOLATE=0` turns
  it off. The API provider is unchanged.
- **Cost per call, isolated (measured; `eval/cli-cost.ts`, prices fitted from 25 calls: write US$ 4, read US$ 0.2,
  output US$ 10 per MTok).** Warm planner: ~0.6k written, ~10.1k read, ~1.2k out, **US$ 0.016**. Warm generator: ~2.2k
  written (the plan and request, new every call), ~11.7k read, ~1.0k out, **US$ 0.021**. A cold call (the first of a mode,
  or a prompt not seen in the last 5 minutes) writes ~11–12k: US$ 0.04–0.06. Before isolation a warm call was ~US$ 0.096.
  A whole generation (planner + generator, plus retries) is ~US$ 0.04 warm and ~US$ 0.06 on a mix of cold and warm calls,
  against US$ 0.22 before.
- **Reordering the prompt would save ~15% of a full run, and only in bursts (not applied).** The cache reads a prefix only
  up to a breakpoint, and the CLI puts one at the end of the system prompt: probed with two calls whose system prompts
  differed only in a last paragraph, both wrote 11.0k and read 0, so moving request-specific text to the *end of the
  system prompt* saves nothing. Moving it into the *user message* does: the second call wrote 0.7k and read 10.3k (US$
  0.044 → 0.005). The request-specific text in the planner prompt is one section of 226–658 chars (~80–230 tokens) that
  names the rules of the components the request mentions; 18 of 34 requests carry one, 7 distinct planner prompts per
  mode. On the 63 stage-1 jobs, 18 planner calls are the first sight of a mode+prompt and 15 of them avoidable
  (~US$ 0.04 each, ~US$ 0.6) of a run of about US$ 4. In use with gaps over 5 minutes between requests, every call is
  cold either way and a reorder saves nothing. The generator prompt is request-independent already.
- **Scoring with isolation on (Oct 2, `eval/results/9g-iso`).** Exploratório b01, p05, n01, p02, v03 and Fidedigno b01,
  p05, n01, c01 plus c01 Exploratório, one run each: 9 of 10 pass; the one miss is p05 Exploratório (it merged the two
  anchored groups into one and said so in a note, instead of declaring `layout.anchor`; two more runs both declared it,
  so 2 of 3, against 7 of 7 earlier). No new or lost declarations elsewhere, no false positives, v03 three Proposals
  (as in all 10 earlier runs). The language of the p05 and c01 notes is Portuguese, as in most earlier runs (c01 notes
  in English appeared in some earlier runs, in neither isolated run). Verdict: not on by default. Run the full set with
  `SFS_CLI_ISOLATE=1` only when the p05 difference is judged to be noise.
- **What the non-isolated CLI carried (probe, Oct 3, US$ 0.19, run from the repo directory exactly as the app and the eval
  do, asked to list what it could see; the counts are the model's own rough estimates, only the CLAUDE.md size was exact).**
  The repo's `CLAUDE.md` (82 bytes: "Active plan: docs/plan-AI-Orchestration.md…"); two SessionStart hook outputs of the
  developer (the ponytail mode, ~4k characters, and the context-mode instructions, ~3.8k); ~61 skills and slash commands
  (~20k characters of descriptions); ~89 deferred tool names (19 built-in, 70 MCP: Figma, Claude Docs, Google Drive,
  context-mode) plus 11 loaded tools; MCP server instructions (Claude Docs, Figma); the environment block (cwd, platform,
  date, a scratchpad path, the model name), the commit/PR attribution reminder, the user's email, 8 agent types and a token
  budget. No memory index was seen. The call wrote **38.9k tokens** (against ~19.4k measured earlier from a plain shell):
  the child `claude` inherits the `CLAUDE_CODE_*` environment of the Claude desktop session that launched it (SDK version,
  entrypoint, desktop app, MCP/terminal switches), so runs started from inside a Code tab carry even more than a developer's
  own setup. The stage 1 / D runs without isolation are therefore *this developer's* context, not a neutral baseline: the
  eval of record is the isolated one.
- **Router: an explicit request for a new component is a signal (Oct 3).** v04 ("Proponha um componente novo…") routed to
  faithful with no conflict named. `request-signals.ts` now reads "novo componente", "componente novo", "proponha/propor …
  componente", "new component", "propose a component" (and the obvious variants) as an exploration signal, so a signal with
  no named conflict asks, like n02. No other golden request trips it (checked in `golden.test.ts`). v03 (a poll with bars) has
  no signal words and the classifier names no conflict: `routerKnownMiss`, Faithful is the safe direction. n02 got "exploratory"
  where "ask" was expected in D, but was right in earlier samples: flaky, not marked.
- **Os dois collapses when Exploratório declares nothing (Oct 3).** The Exploratório branch is dropped, with the existing
  notice, when its tree is identical to Fidedigno's *or* it contains no deviation (node or screen), no composed-overlay
  `shades`, no Proposal and no primitive. The scorer's outcome `identical` is now `collapsed` (o03's expectation).
- **o05 in D (four-screen flow) — root cause (Oct 3), from `eval/results/9h/o05-four-screens.both.1.json`.** The planner wrote
  a plan whose "Screen <id>:" headings counted 3 (the first screen of a four-screen flow had no heading), so the >3 check
  (`plannedScreens`, counted from the plan text) did not fire; both branches then built 4 screens each, each valid on its first
  attempt (no retry, nothing truncated: 3.2–3.4k output tokens), and the merge produced 8 screens, over MAX_SCREENS (6):
  `blueprint.dsl` "at most 6 screens (got 8)" plus dangling `goTo`s in the cut-off screens. In stage 1 the plan had 4 headings.
  A bug in the check, not generator variance: `runBoth` now also counts the screens the branches produced and keeps only
  Fidedigno when either exceeds 3 (test: 3 headings, 4 screens built).
