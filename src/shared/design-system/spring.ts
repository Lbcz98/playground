/**
 * Spring motion as CSS. CSS has no spring timing function, but `linear()` can
 * trace any curve through points, so a spring is sampled from its physics over
 * its duration and written as `linear(...)`. The token keeps the physics
 * (stiffness, damping, mass) as the source of truth; this is the one place it
 * becomes CSS — shared by the token build and the design-system importer.
 *
 * The motion is a unit mass-spring from 0 to 1, starting at rest. Under-, over-
 * and critically-damped springs are all solved exactly (no step integration).
 */

interface SpringSpec {
  /** Settle time the curve is laid over, e.g. "800ms". */
  duration: string
  stiffness: number
  damping: number
  /** Default 1. */
  mass?: number
}

const SAMPLES = 40

/** Position of the spring at `t` seconds, 0 → 1. */
export function springAt(t: number, { stiffness, damping, mass = 1 }: Omit<SpringSpec, 'duration'>): number {
  const w0 = Math.sqrt(stiffness / mass)
  const zeta = damping / (2 * Math.sqrt(stiffness * mass))
  if (Math.abs(zeta - 1) < 1e-6) return 1 - (1 + w0 * t) * Math.exp(-w0 * t)
  if (zeta < 1) {
    const wd = w0 * Math.sqrt(1 - zeta * zeta)
    return 1 - Math.exp(-zeta * w0 * t) * (Math.cos(wd * t) + ((zeta * w0) / wd) * Math.sin(wd * t))
  }
  const s = w0 * Math.sqrt(zeta * zeta - 1)
  const r1 = -zeta * w0 + s
  const r2 = -zeta * w0 - s
  return 1 - (r2 * Math.exp(r1 * t) - r1 * Math.exp(r2 * t)) / (r2 - r1)
}

/** "800ms" / "0.8s" → seconds; null when it isn't a duration. */
function durationSeconds(value: string): number | null {
  const m = value.trim().match(/^(\d*\.?\d+)(ms|s)$/)
  if (!m) return null
  return m[2] === 'ms' ? Number(m[1]) / 1000 : Number(m[1])
}

/** Whether `value` is a usable spring spec. */
export function isSpringSpec(value: unknown): value is SpringSpec {
  if (typeof value !== 'object' || value === null) return false
  const v = value as Record<string, unknown>
  const positive = (n: unknown) => typeof n === 'number' && Number.isFinite(n) && n > 0
  return (
    typeof v.duration === 'string' &&
    durationSeconds(v.duration) !== null &&
    positive(v.stiffness) &&
    positive(v.damping) &&
    (v.mass === undefined || positive(v.mass))
  )
}

/**
 * The spring as a CSS `linear()` easing over its duration. The curve is
 * rescaled so it ends exactly at 1 — the last few percent a spring spends
 * creeping in are folded into the settle, so nothing jumps at the end.
 */
export function springToCss(spec: SpringSpec): string {
  const points = sampleSpring(spec, SAMPLES)
  return `linear(${points.map((y) => Number(y.toFixed(4)).toString()).join(', ')})`
}

/** The spring's progress at `samples + 1` evenly spaced moments of its duration, rescaled to end at exactly 1. */
function sampleSpring(spec: SpringSpec, samples: number): number[] {
  const total = durationSeconds(spec.duration)
  if (total === null) throw new Error(`spring: duration ${JSON.stringify(spec.duration)} is not like "800ms"`)
  const end = springAt(total, spec)
  return Array.from({ length: samples + 1 }, (_, i) => (i === samples ? 1 : springAt((i / samples) * total, spec) / end))
}

/**
 * The same curve as the closest `cubic-bezier()`, for engines without `linear()` easing (Chrome < 113,
 * Safari < 17.2). Least squares over the sampled curve, by coordinate descent; deterministic, so the token
 * build stays reproducible. The system spring fits within 0.01 of its progress at every moment.
 */
export function springToCubicBezier(spec: SpringSpec): string {
  const n = 100
  const target = sampleSpring(spec, n)
  const bezier = (a: number, b: number, t: number) => 3 * (1 - t) * (1 - t) * t * a + 3 * (1 - t) * t * t * b + t * t * t
  const progressAt = ([x1, y1, x2, y2]: number[], x: number): number => {
    let lo = 0
    let hi = 1
    for (let i = 0; i < 30; i++) {
      const t = (lo + hi) / 2
      if (bezier(x1, x2, t) < x) lo = t
      else hi = t
    }
    return bezier(y1, y2, (lo + hi) / 2)
  }
  const error = (p: number[]) => target.reduce((sum, y, i) => sum + (progressAt(p, i / n) - y) ** 2, 0)
  let best = [0.3, 0.3, 0.3, 1]
  let bestError = error(best)
  // x1 and x2 must stay in [0, 1] for a valid cubic-bezier; y1 and y2 are free.
  const clamp = (v: number, i: number) => (i % 2 === 0 ? Math.min(1, Math.max(0, v)) : v)
  for (let step = 0.1; step > 1e-5; ) {
    let improved = false
    for (let i = 0; i < 4; i++) {
      for (const delta of [step, -step]) {
        const next = best.map((v, j) => (j === i ? clamp(v + delta, j) : v))
        const e = error(next)
        if (e < bestError) {
          best = next
          bestError = e
          improved = true
        }
      }
    }
    if (!improved) step /= 2
  }
  return `cubic-bezier(${best.map((v) => Number(v.toFixed(3))).join(', ')})`
}
