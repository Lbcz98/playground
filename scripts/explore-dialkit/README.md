# Built-in DialKit

The playground serves these checked-in vanilla assets directly, without a DialKit
package install, framework runtime, CDN, or request-time build. Source is the
owner's fork: https://github.com/Lbcz98/dialkit.git. `source.json` records the exact
revision, compiler, version and artifact hashes; `LICENSE.txt` retains its MIT notice.

Run `node scripts/sync-dialkit.mjs` to rebuild from the pinned source, or append
`--check` to verify reproducibility. Both require network access, Git and the root
development dependencies. No fork lifecycle scripts are executed. To update,
review the fork, change `revision` in that script, rebuild and run the exploration
tests and a real panel smoke test. Do not edit generated assets by hand.

This replaces npm DialKit 2.0.0 with fork version 2.1.0. It removes the package
dependency for stage controls, not the agent preparation required by legacy
options without a tune spec. Prepared options already open without that agent.
No first-tune speedup is claimed from this source change.
The fork includes upstream 2.1 controls, theme and version-gallery changes; the
stage still uses its existing control contract, not a version gallery. Remote font
imports are stripped as in upstream's vanilla build, so Geist Mono falls back to
the local monospace stack unless already available.

For performance comparisons, measure cold setup separately from navigation.
Record action-to-first-successful-control-edit, agent preparation duration and
retries, panel mount and asset resource timings, using matched options and cold
and warm browser caches. Report total exploration-generation-plus-first-tune
time too if controls are generated earlier; moving work is not eliminating it.
