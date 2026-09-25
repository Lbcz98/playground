import { describe, expect, it } from 'vitest'
import { isSpringSpec, springAt, springToCss } from './spring'

const SPEC = { duration: '800ms', stiffness: 56, damping: 15, mass: 1 }

describe('the system spring (800ms, stiffness 56, damping 15)', () => {
  it('is critically damped: it settles without overshooting', () => {
    for (let t = 0; t <= 2; t += 0.01) expect(springAt(t, SPEC)).toBeLessThanOrEqual(1)
    expect(springAt(0.8, SPEC)).toBeGreaterThan(0.97)
  })

  it('becomes a CSS linear() that starts at 0, rises monotonically and ends at 1', () => {
    const css = springToCss(SPEC)
    const points = css.slice('linear('.length, -1).split(', ').map(Number)
    expect(points[0]).toBe(0)
    expect(points.at(-1)).toBe(1)
    for (let i = 1; i < points.length; i++) expect(points[i]).toBeGreaterThanOrEqual(points[i - 1])
    // Fast out of the gate: half-way there in well under a third of the time.
    expect(points[Math.round(points.length * 0.3)]).toBeGreaterThan(0.5)
  })

  it('solves under-damped springs too (they overshoot)', () => {
    const bouncy = { stiffness: 200, damping: 5 }
    expect(Math.max(...Array.from({ length: 200 }, (_, i) => springAt(i / 100, bouncy)))).toBeGreaterThan(1)
  })

  it('knows a spec when it sees one', () => {
    expect(isSpringSpec(SPEC)).toBe(true)
    expect(isSpringSpec({ ...SPEC, duration: 'fast' })).toBe(false)
    expect(isSpringSpec({ duration: '800ms', stiffness: 56 })).toBe(false)
  })
})

describe('the motion tokens', () => {
  it('the transition duration is the spring’s own settle time, and the focus cycle uses the spring', async () => {
    const tokens = (await import('../../../tokens/tokens.json')).default as {
      motion: { semantic: Record<string, { $value: unknown }> }
    }
    const m = tokens.motion.semantic
    expect((m.easing.$value as { duration: string }).duration).toBe(m.duration.$value)
    expect(m['focus-cycle-easing'].$value).toBe('{motion.semantic.easing}')
    expect(m.easing.$value).toEqual({ duration: '800ms', stiffness: 56, damping: 15, mass: 1 })
  })
})
