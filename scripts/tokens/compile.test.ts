import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { compileTokens, TOKEN_OUTPUTS, TOKENS_SOURCE } from './compile'

const ROOT = fileURLToPath(new URL('../..', import.meta.url))

const color = (value: string) => ({ $value: value, $type: 'color' })

describe('compileTokens', () => {
  it('names a variable by its path, kebab-casing camelCase segments', () => {
    const { css } = compileTokens({
      typography: { fontWeight: { 'extra-bold': { $value: 800, $type: 'fontWeight' } } },
    })
    expect(css).toContain('--typography-font-weight-extra-bold: 800;')
  })

  it('keeps aliases live as var()', () => {
    const { css } = compileTokens({
      color: { core: { white: color('#EEEEEE') }, semantic: { text: color('{color.core.white}') } },
    })
    expect(css).toContain('--color-semantic-text: var(--color-core-white);')
  })

  it('inherits $type from the nearest group', () => {
    const { css } = compileTokens({ size: { $type: 'dimension', sm: { $value: '8px' } } })
    expect(css).toContain('--size-sm: 8px;')
  })

  it('draws gradients at 180deg unless the CSS extension sets an angle', () => {
    const stops = [
      { color: '{c.a}', position: 0.3 },
      { color: '{c.b}', position: 1 },
    ]
    const { css } = compileTokens({
      c: { a: color('#000000'), b: color('#FFFFFF') },
      g: {
        down: { $type: 'gradient', $value: stops },
        diagonal: {
          $type: 'gradient',
          $value: stops,
          $extensions: { 'com.screenflow.css': { angle: '135deg' } },
        },
      },
    })
    expect(css).toContain('--g-down: linear-gradient(180deg, var(--c-a) 30%, var(--c-b) 100%);')
    expect(css).toContain('--g-diagonal: linear-gradient(135deg, var(--c-a) 30%, var(--c-b) 100%);')
  })

  it('compiles typography composites to .text-* classes, not variables', () => {
    const { css, ts } = compileTokens({
      typography: {
        fontSize: { sm: { $value: '12px', $type: 'dimension' } },
        'body-sm': { bold: { $type: 'typography', $value: { fontSize: '{typography.fontSize.sm}' } } },
      },
    })
    expect(css).toContain('.text-body-sm-bold {\n  font-size: var(--typography-font-size-sm);\n}')
    expect(css).not.toContain('--typography-body-sm-bold')
    expect(ts).toContain("'body-sm-bold',")
    expect(ts).toContain("'--typography-font-size-sm',")
  })

  describe('rejects a broken contract', () => {
    it.each([
      ['an alias that points at no token', { a: { b: color('{a.missing}') } }, /points at no token/],
      [
        'an alias of the wrong type',
        { a: { size: { $value: '8px', $type: 'dimension' }, c: color('{a.size}') } },
        /is a dimension, expected color/,
      ],
      ['a malformed color', { a: color('red') }, /expected a hex color/],
      ['a malformed dimension', { a: { $value: '8', $type: 'dimension' } }, /expected a dimension/],
      ['a token with no $type', { a: { $value: '#FFFFFF' } }, /no \$type/],
      ['an unsupported $type', { a: { $value: '200ms', $type: 'duration' } }, /unsupported \$type/],
      [
        'two tokens that flatten to one name',
        { a: { 'b-c': color('#FFFFFF') }, 'a-b': { c: color('#000000') } },
        /already used by a\.b-c/,
      ],
    ])('%s', (_, tokens, error) => {
      expect(() => compileTokens(tokens)).toThrow(error)
    })
  })
})

describe(TOKENS_SOURCE, () => {
  const compiled = compileTokens(JSON.parse(readFileSync(join(ROOT, TOKENS_SOURCE), 'utf8')))

  it.each(['css', 'ts'] as const)('the checked-in %s output is its current build', (key) => {
    const current = readFileSync(join(ROOT, TOKEN_OUTPUTS[key]), 'utf8')
    expect(current === compiled[key], `${TOKEN_OUTPUTS[key]} is stale — run \`npm run tokens:build\``).toBe(true)
  })
})
