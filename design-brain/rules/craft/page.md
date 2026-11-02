# Page format

Applies when: the playbook judge opens an exploration, and an explorer builds the page. The HTML skeleton of a part is in the explorer's workflow; this is the contract the checks need.

One self-contained `index.html`. In `<head>`, in this order: `<link rel="stylesheet" href="/__explore/tokens.css">`, `<link rel="stylesheet" href="../../../src/styles/global.css">`, `<link rel="stylesheet" href="/__explore/inter.css">`. Each option is `.opt[data-option="N"]` containing `.opt-content`, and the card is a child of `.opt-content`.

The explorer's rationale is a claim, not evidence. Read it only to see whether a deviation was justified (that makes a finding a Note).

Run `node scripts/check-explore-tokens.mjs <folder>` and `node scripts/check-explore-layout.mjs <folder>`. Keep their output as facts. A check you could not run is "not measured", never a guessed finding.

Look at the picture when the page is `ok`: `node scripts/check-explore-layout.mjs <folder> --shots "$TMPDIR/judge-shots" --keys ArrowRight,Enter` (or `node scripts/explore-shots.mjs`). Read a PNG only when the line is a path. A line `inalterado:` means the pixels did not change: do not read it again.
