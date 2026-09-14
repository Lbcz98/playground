import { describe, expect, it } from 'vitest'
import { LIVE_BUNDLE_GLOBAL, validateLiveBundleGlobal } from './liveBundle'

function Button(): null {
  return null
}
function Card(): null {
  return null
}

describe('validateLiveBundleGlobal (Phase 8B bundle contract)', () => {
  it('accepts an object of components', () => {
    const result = validateLiveBundleGlobal({ Button, Card })
    expect(result).toEqual({ ok: true, components: { Button, Card } })
  })

  it('rejects a missing / non-object global', () => {
    expect(validateLiveBundleGlobal(undefined).ok).toBe(false)
    expect(validateLiveBundleGlobal(null).ok).toBe(false)
    expect(validateLiveBundleGlobal('nope').ok).toBe(false)
    expect(validateLiveBundleGlobal([Button]).ok).toBe(false)
  })

  it('rejects an empty object — nothing exported', () => {
    const result = validateLiveBundleGlobal({})
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toMatch(/empty/)
  })

  it('rejects non-function values, naming which keys are bad', () => {
    const result = validateLiveBundleGlobal({ Button, BadOne: 'not a component', BadTwo: 42 })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toContain('BadOne')
      expect(result.error).toContain('BadTwo')
      expect(result.error).not.toContain('Button')
    }
  })

  it('names the well-known global in every error message', () => {
    const result = validateLiveBundleGlobal(null)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toContain(LIVE_BUNDLE_GLOBAL)
  })
})
