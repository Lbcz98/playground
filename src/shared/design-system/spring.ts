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

export interface SpringSpec {
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
export function durationSeconds(value: string): number | null {
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
  const total = durationSeconds(spec.duration)
  if (total === null) throw new Error(`spring: duration ${JSON.stringify(spec.duration)} is not like "800ms"`)
  const end = springAt(total, spec)
  const points: string[] = []
  for (let i = 0; i <= SAMPLES; i++) {
    const p = i / SAMPLES
    const y = i === SAMPLES ? 1 : springAt(p * total, spec) / end
    points.push(Number(y.toFixed(4)).toString())
  }
  return `linear(${points.join(', ')})`
}
