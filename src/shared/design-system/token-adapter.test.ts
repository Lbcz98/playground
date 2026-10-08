import { describe, expect, it } from 'vitest'
import { parseDesignTokens, parseDesignTokensWithReport } from './token-adapter'
import REPO_TOKENS from '../../../tokens/tokens.json'

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

describe('parseDesignTokens — other shapes', () => {
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

describe('parseDesignTokens — alpha variants', () => {
  const alpha = (value: string, a: number) => ({ $value: value, $extensions: { 'com.screenflow.css': { alpha: a } } })
  const file = {
    color: {
      $type: 'color',
      core: { black: { $value: '#000000' }, slate: { $value: '#2b313a' }, 'black-alpha-0': alpha('{color.core.black}', 0) },
      opacity: {
        dark: { 30: alpha('{color.core.black}', 0.3), 50: alpha('{color.core.black}', 0.5), 60: alpha('{color.core.black}', 0.6) },
        rounded: alpha('{color.core.slate}', 0.2),
        faint: alpha('{color.opacity.dark.50}', 0.5),
      },
      semantic: { scrim: { $value: '{color.opacity.dark.60}' } },
    },
    gradient: {
      $type: 'gradient',
      fade: { $value: [{ color: '{color.core.black-alpha-0}', position: 0 }, { color: '{color.opacity.dark.60}', position: 1 }] },
    },
  }

  it('become the literal #RRGGBBAA of their base, which is what a manifest holds', () => {
    const { tokens, warnings } = parseDesignTokensWithReport(file)
    expect(warnings).toEqual([])
    expect(tokens.colors).toMatchObject({
      'core-black-alpha-0': '#00000000',
      'opacity-dark-30': '#0000004D',
      'opacity-dark-50': '#00000080',
      'opacity-dark-60': '#00000099',
      'opacity-rounded': '#2B313A33',
      // An alpha variant of an alpha variant multiplies.
      'opacity-faint': '#00000040',
      // A plain alias to a variant keeps the variant's alpha.
      'semantic-scrim': '#00000099',
    })
    expect(tokens.gradients).toEqual({ fade: 'linear-gradient(180deg, #00000000 0%, #00000099 100%)' })
  })

  it('follow the base: changing it once moves every variant', () => {
    const moved = structuredClone(file)
    moved.color.core.black.$value = '#112233'
    expect(parseDesignTokens(moved).colors).toMatchObject({ 'opacity-dark-30': '#1122334D', 'semantic-scrim': '#11223399' })
  })

  it('a variant whose base does not resolve is left out, with a reason', () => {
    const { tokens, warnings } = parseDesignTokensWithReport({ color: { $type: 'color', a: alpha('{color.nope}', 0.5) } })
    expect(tokens.colors).toBeUndefined()
    expect(warnings).toEqual([{ token: 'color.a', message: expect.stringMatching(/\{color\.nope\} points at no token/) }])
  })

  it('the repo’s own tokens.json still yields the hex its alpha tokens used to state', () => {
    expect(parseDesignTokens(REPO_TOKENS).colors).toMatchObject({
      'core-neutral-white-alpha-0': '#EEEEEE00',
      'opacity-base-rounded': '#2B313A33',
      'opacity-dark-10': '#0000001A',
      'opacity-dark-70': '#000000B3',
      'opacity-dark-90': '#000000E6',
    })
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

describe('gradient tokens', () => {
  const file = {
    color: { core: { a: { $type: 'color', $value: '#414FFD' }, b: { $type: 'color', $value: '#35C7F3' } } },
    gradient: {
      core: {
        noite: {
          $type: 'gradient',
          $value: [
            { color: '{color.core.a}', position: 0.3 },
            { color: '{color.core.b}', position: 1 },
          ],
        },
        diagonal: {
          $type: 'gradient',
          $extensions: { 'com.screenflow.css': { angle: '135deg' } },
          $value: [
            { color: '#FFFFFFB3', position: 0 },
            { color: '#6464644D', position: 0.6 },
          ],
        },
      },
      semantic: { focus: { $type: 'gradient', $value: '{gradient.core.noite}' } },
    },
  }

  it('become CSS linear-gradients, stops resolved, angle kept, aliases followed', () => {
    const { tokens, warnings } = parseDesignTokensWithReport(file)
    expect(warnings).toEqual([])
    expect(tokens.gradients).toEqual({
      'core-noite': 'linear-gradient(180deg, #414FFD 30%, #35C7F3 100%)',
      'core-diagonal': 'linear-gradient(135deg, #FFFFFFB3 0%, #6464644D 60%)',
      'semantic-focus': 'linear-gradient(180deg, #414FFD 30%, #35C7F3 100%)',
    })
  })

  it('a stop that points at no colour leaves the gradient out, with a reason', () => {
    const broken = structuredClone(file)
    broken.gradient.core.noite.$value[0].color = '{color.core.nope}'
    const { tokens, warnings } = parseDesignTokensWithReport(broken)
    expect(tokens.gradients?.['core-noite']).toBeUndefined()
    expect(warnings.some((w) => w.token === 'gradient.core.noite')).toBe(true)
  })

  it('the repo’s own tokens.json now imports every gradient', () => {
    const { tokens, warnings } = parseDesignTokensWithReport(REPO_TOKENS)
    expect(Object.keys(tokens.gradients ?? {}).length).toBeGreaterThanOrEqual(28)
    expect(warnings.filter((w) => w.token.startsWith('gradient.'))).toEqual([])
  })
})
