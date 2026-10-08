<!-- protos-report -->
## Protos laws

7 screens checked · 0 blocking problems · 1 advisories · 1 deviations · 1 reuses · 1 proposals · 1 constructs not read (48 read, 98% coverage)

### Blocking problems (0)

None.

### Legibility warnings (1)

- `.checks-corpus-pr/legibility.tsx` [render.legibility] "11111111" overlaps "55555555" — two pieces of text land on top of each other.

### Declared deviations (1)

- `layout.root-align` — the card sits at the end (`.checks-corpus-pr/deviation.tsx`)

### Primitives and proposals (2)

- proposal `.checks-corpus-pr/components/Stepper.tsx` — `Stepper`: The kit stepper is horizontal and static. (API: activeStep, onStepChange)
- reuse `.checks-corpus-pr/prim.tsx:10` — `Box` considered `WideButton`: it is a surface, not a button

### Not read (1)

- `.checks-corpus-pr/logic.tsx:27` [iteration] a computed child ({…}) is not read

### Flow edges (1)

- `.checks-corpus-pr/home` → `.checks-corpus-pr/rail` (line 19)

