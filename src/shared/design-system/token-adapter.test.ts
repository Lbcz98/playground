import { describe, expect, it } from 'vitest'
import { parseDesignTokens, parseDesignTokensWithReport } from './token-adapter'

describe('parseDesignTokens — W3C Design Tokens (DTCG)', () => {
  const tokens = parseDesignTokens({
    color: {
      $type: 'color',
      brand: { $value: '#2f6bff' },
      'brand-hover': { $value: '{color.brand}' },
      ink: { $value: '#111111' },
    },
    space: {
      $type: 'dimension',
      md: { $value: '16px' },
      lg: { $value: { value: 24, unit: 'px' } },
    },
    radius: {
      sm: { $value: '4px', $type: 'dimension' },
    },
    shadow: {
      card: {
        $type: 'shadow',
        $value: { offsetX: '0px', offsetY: '1px', blur: '2px', spread: '0px', color: 'rgba(0,0,0,0.1)' },
      },
    },
  })

  it('categorises by $type, inheriting from the group', () => {
    expect(tokens.colors).toEqual({ brand: '#2f6bff', 'brand-hover': '#2f6bff', ink: '#111111' })
    expect(tokens.spacing).toEqual({ md: '16px', lg: '24px' })
    expect(tokens.radius).toEqual({ sm: '4px' })
  })

  it('resolves {dot.path} aliases', () => {
    expect(tokens.colors?.['brand-hover']).toBe('#2f6bff')
  })

  it('composes a shadow object into a CSS string', () => {
    expect(tokens.shadow?.card).toBe('0px 1px 2px 0px rgba(0,0,0,0.1)')
  })
})

describe('parseDesignTokens — Style Dictionary (pre-DTCG)', () => {
  it('reads `value` / `type`', () => {
    const t = parseDesignTokens({
      color: {
        primary: { value: '#ff0000', type: 'color' },
        secondary: { value: '{color.primary}', type: 'color' },
      },
      size: {
        font: { small: { value: '12px', type: 'dimension' } },
      },
    })
    expect(t.colors).toEqual({ primary: '#ff0000', secondary: '#ff0000' })
    // "font" in the path routes a dimension to typography
    expect(t.typography).toEqual({ 'font-small': '12px' })
  })
})

describe('parseDesignTokens — other shapes', () => {
  it('passes an already-grouped ManifestTokens object through', () => {
    const t = parseDesignTokens({
      colors: { brand: '#123456' },
      spacing: { md: '16px' },
    })
    expect(t).toEqual({ colors: { brand: '#123456' }, spacing: { md: '16px' } })
  })

  it('handles a flat "group-name": value map', () => {
    const t = parseDesignTokens({
      'color-brand': '#0a0a0a',
      'space-md': '16px',
      'radius-lg': '12px',
    })
    expect(t.colors).toEqual({ brand: '#0a0a0a' })
    expect(t.spacing).toEqual({ md: '16px' })
    expect(t.radius).toEqual({ lg: '12px' })
  })

  it('falls back to value-shape when type and name are ambiguous', () => {
    const t = parseDesignTokens({ misc: { a: { $value: '#abcdef' }, b: { $value: '8px' } } })
    expect(t.colors).toEqual({ 'misc-a': '#abcdef' })
    expect(t.spacing).toEqual({ 'misc-b': '8px' })
  })

  it('returns {} for non-token input', () => {
    expect(parseDesignTokens(null)).toEqual({})
    expect(parseDesignTokens('nope')).toEqual({})
    expect(parseDesignTokens({})).toEqual({})
  })
})

describe('parseDesignTokensWithReport — what the parse leaves out', () => {
  it('reports an alias that points at no token, and a value that is not CSS', () => {
    const { tokens, warnings } = parseDesignTokensWithReport({
      color: {
        $type: 'color',
        brand: { $value: '#0055ff' },
        accent: { $value: '{color.missing}' },
        chain: { $value: '{color.accent}' },
      },
      space: { $type: 'dimension', md: { $value: '16px' }, odd: { $value: { weird: true } } },
    })
    expect(tokens.colors).toEqual({ brand: '#0055ff' })
    expect(tokens.spacing).toEqual({ md: '16px' })
    expect(warnings).toEqual(
      expect.arrayContaining([
        { token: 'color.accent', message: expect.stringMatching(/\{color\.missing\} points at no token/) },
        { token: 'color.chain', message: expect.stringMatching(/\{color\.accent\} leads to a token that does not resolve/) },
        { token: 'space.odd', message: expect.stringMatching(/not a CSS value/) },
      ]),
    )
    expect(warnings).toHaveLength(3)
  })

  it('reports nothing for a clean file', () => {
    expect(parseDesignTokensWithReport({ color: { $type: 'color', brand: { $value: '#0055ff' } } }).warnings).toEqual([])
  })
})
