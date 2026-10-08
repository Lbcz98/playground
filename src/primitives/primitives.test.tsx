import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { ReactElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import tokens from '../../tokens/tokens.json'
import { frameSpec } from '@/design-system/primitives'
import { CSS_VARS } from '@/styles/global-tokens'
import { Box, GRID_SPACING, OFF_GRID_SPACING, Stack, Text } from '.'

const html = (node: ReactElement): string => renderToStaticMarkup(node)

describe('token vocabulary', () => {
  it('OFF_GRID_SPACING is exactly the spacing steps the frame grid rule rejects', () => {
    const allowed = frameSpec.offGridAllowed as readonly number[]
    const offGrid = Object.entries(tokens.dimension.spacing.core)
      .filter(([, token]) => {
        const px = parseFloat(token.$value)
        return px % frameSpec.grid !== 0 && !allowed.includes(px)
      })
      .map(([name]) => name)
    expect([...OFF_GRID_SPACING]).toEqual(offGrid)
    expect(GRID_SPACING).not.toContain('md')
    expect(GRID_SPACING[0]).toBe('none')
  })

  it('the focus cycle is exactly four steps of the ramp', () => {
    const ms = (value: string) => Number(value.replace('ms', ''))
    const motion = tokens.motion.semantic
    // The loop is noite → dia → tarde → dia; nothing derives one from the other,
    // so a duration edited without its step would silently shift every leg.
    expect(ms(motion['focus-cycle-duration'].$value)).toBe(ms(motion['focus-cycle-step'].$value) * 4)
  })

  // The kit's own sources: primitives, and the UI kit's stylesheet (its .tsx
  // files name tokens through the typed helpers; CSS has no types to lean on).
  const kitSources = (): { name: string; text: string }[] =>
    ['.', '../ui-kit'].flatMap((rel) => {
      const dir = fileURLToPath(new URL(rel, import.meta.url))
      return readdirSync(dir)
        .filter((name) => /\.(tsx?|css)$/.test(name) && !/\.(test|stories)\./.test(name))
        .map((name) => ({ name, text: readFileSync(join(dir, name), 'utf8') }))
    })

  it('every var() the kit references is defined by global.css', () => {
    const defined = new Set<string>(CSS_VARS)
    const missing = kitSources().flatMap(({ name, text }) =>
      [...text.matchAll(/var\((--[\w-]+)\)|'(--[\w-]+)'/g)]
        .map((m) => m[1] ?? m[2])
        // `--_name` is a component-local value, set inline by the component (below).
        .filter((v) => !v.endsWith('-') && !v.startsWith('--_') && !defined.has(v))
        .map((v) => `${name}: ${v}`),
    )
    expect(missing).toEqual([])
  })

  it('every sfs- class a kit component names has a rule, and every --_ value a rule reads is set by a component', () => {
    const sources = kitSources()
    const css = sources
      .filter(({ name }) => name.endsWith('.css'))
      .map(({ text }) => text.replace(/\/\*[\s\S]*?\*\//g, ''))
      .join('\n')
    const code = sources.filter(({ name }) => !name.endsWith('.css'))
    const ruled = new Set([...css.matchAll(/\.(sfs-[a-z-]*[a-z])/g)].map((m) => m[1]))
    const unruled = code.flatMap(({ name, text }) =>
      [...text.matchAll(/(?<![\w-])sfs-[a-z-]*[a-z]/g)].filter((m) => !ruled.has(m[0])).map((m) => `${name}: ${m[0]}`),
    )
    expect(unruled).toEqual([])

    const set = new Set(code.flatMap(({ text }) => [...text.matchAll(/'(--_[\w-]+)'/g)].map((m) => m[1])))
    const unset = [...css.matchAll(/var\((--_[\w-]+)\)/g)].map((m) => m[1]).filter((v) => !set.has(v))
    expect(unset).toEqual([])
  })

  it('refuses off-grid spacing at the type level', () => {
    // @ts-expect-error — `md` (20px) is off the layout grid.
    const offGrid = <Stack gap="md" />
    expect(offGrid).toBeTruthy()
  })
})

describe('<Text>', () => {
  it('renders one generated text class and a functional colour', () => {
    const out = html(
      <Text variant="body-sm-bold" color="secondary">
        Hi
      </Text>,
    )
    expect(out).toContain('<span class="text-body-sm-bold"')
    expect(out).toContain('color:var(--color-semantic-functional-text-secondary)')
  })

  it('maps status-* colours to the functional status tokens', () => {
    expect(html(<Text color="status-error">x</Text>)).toContain('var(--color-semantic-functional-status-error)')
  })

  it('renders the requested element', () => {
    expect(html(<Text as="p">x</Text>)).toMatch(/^<p class="text-body-md-regular"/)
  })
})

describe('<Box> and <Stack>', () => {
  it('Box resolves every surface prop to a token', () => {
    const out = html(
      <Box padding="xs" paddingX="lg" background="elevated" border="subtle" radius="lg">
        x
      </Box>,
    )
    expect(out).toContain('padding-inline:var(--dimension-spacing-core-lg)')
    expect(out).toContain('padding-block:var(--dimension-spacing-core-xs)')
    expect(out).toContain('background-color:var(--color-semantic-functional-background-elevated)')
    expect(out).toContain(
      'border:var(--dimension-border-width-semantic-card) solid var(--color-semantic-functional-border-subtle)',
    )
    expect(out).toContain('border-radius:var(--dimension-radius-core-lg)')
  })

  it('Stack lays children out with a token gap', () => {
    const out = html(
      <Stack as="ul" direction="row" gap="sm" justify="between" align="center">
        <li>a</li>
      </Stack>,
    )
    expect(out).toMatch(/^<ul style="/)
    expect(out).toContain('list-style:none')
    expect(out).toContain('display:flex')
    expect(out).toContain('flex-direction:row')
    expect(out).toContain('gap:var(--dimension-spacing-core-sm)')
    expect(out).toContain('justify-content:space-between')
    expect(out).toContain('align-items:center')
  })
})

