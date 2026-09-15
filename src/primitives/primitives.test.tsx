import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { ReactElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import tokens from '../../tokens/tokens.json'
import { frameSpec } from '@/design-system/primitives'
import { CSS_VARS } from '@/styles/global-tokens'
import { Box, Button, GRID_SPACING, Heading, OFF_GRID_SPACING, Stack, Text } from '.'

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

  it('every var() a primitive references is defined by global.css', () => {
    const dir = fileURLToPath(new URL('.', import.meta.url))
    const defined = new Set<string>(CSS_VARS)
    const missing = readdirSync(dir)
      .filter((name) => /\.(tsx?|css)$/.test(name) && !name.includes('.test.'))
      .flatMap((name) =>
        [...readFileSync(join(dir, name), 'utf8').matchAll(/var\((--[\w-]+)\)|'(--[\w-]+)'/g)]
          .map((m) => m[1] ?? m[2])
          .filter((v) => !v.endsWith('-') && !defined.has(v))
          .map((v) => `${name}: ${v}`),
      )
    expect(missing).toEqual([])
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

describe('<Heading>', () => {
  it('pairs level with the matching element and heading style', () => {
    expect(html(<Heading level={4} weight="medium">x</Heading>)).toMatch(/^<h4 class="text-heading-4-medium"/)
  })

  it('keeps the style when the element is overridden', () => {
    expect(html(<Heading as="h1">x</Heading>)).toMatch(/^<h1 class="text-heading-3-bold"/)
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

describe('<Button>', () => {
  it('maps variants to functional surfaces', () => {
    expect(html(<Button>Go</Button>)).toContain('background-color:var(--color-semantic-functional-background-elevated)')
    expect(html(<Button variant="secondary">Go</Button>)).toContain(
      'background-color:var(--color-semantic-functional-background-overlay)',
    )
    expect(html(<Button variant="ghost">Go</Button>)).toContain('color:var(--color-semantic-functional-text-secondary)')
  })

  it('draws the kit focus ring only when focused', () => {
    expect(html(<Button interactionState="focus">Go</Button>)).toContain('var(--gradient-semantic-focus-ring)')
    expect(html(<Button>Go</Button>)).not.toContain('var(--gradient-semantic-focus-ring)')
  })

  it('is a non-submitting button that disables and reports loading', () => {
    expect(html(<Button>Go</Button>)).toContain('type="button"')
    expect(html(<Button interactionState="disabled">Go</Button>)).toContain('disabled=""')
    const loading = html(<Button interactionState="loading">Go</Button>)
    expect(loading).toContain('aria-busy="true"')
    expect(loading).toContain('class="sfs-spin"')
  })
})
