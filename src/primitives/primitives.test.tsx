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


describe('what a primitive hands to its element', () => {
  // A spread is not held to the prop types, so the runtime has to refuse these too.
  const smuggled = {
    dangerouslySetInnerHTML: { __html: '<b style="color:red">raw</b>' },
    onClick: () => undefined,
    style: { color: 'red' },
    className: 'raw',
    hidden: true,
  } as object

  it.each([
    ['Box', (p: object) => <Box {...p} />],
    ['Stack', (p: object) => <Stack {...p} />],
    ['Text', (p: object) => <Text {...p} />],
  ])('%s drops markup, handlers, style and class that arrive through a spread', (_name, render) => {
    const out = html(render(smuggled))
    expect(out).not.toContain('raw')
    expect(out).not.toContain('color:red')
    expect(out).not.toContain('hidden')
  })

  it('keeps identity and accessibility: id, role, aria-*, data-*', () => {
    const attrs = { id: 'a', role: 'list', 'aria-label': 'b', 'data-x': 'c' }
    for (const out of [html(<Box {...attrs} />), html(<Stack {...attrs} />), html(<Text {...attrs}>t</Text>)]) {
      for (const attr of ['id="a"', 'role="list"', 'aria-label="b"', 'data-x="c"']) expect(out).toContain(attr)
    }
  })

  it('refuses them at the type level', () => {
    // @ts-expect-error raw markup is not a primitive's to render
    void (<Box dangerouslySetInnerHTML={{ __html: '' }} />)
    // @ts-expect-error a screen has no handlers: navigation lives in flow.ts
    void (<Text onClick={() => undefined}>t</Text>)
    // @ts-expect-error
    void (<Stack hidden />)
  })

  it('Text still labels a control', () => {
    expect(html(<Text as="label" htmlFor="field">t</Text>)).toContain('for="field"')
  })
})
