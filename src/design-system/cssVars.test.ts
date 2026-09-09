import { describe, expect, it } from 'vitest'
import { applyTokens, manifestTokensToCssVars, purgeTokens } from './cssVars'
import type { ManifestTokens } from '@/shared/design-system/manifest'

const TOKENS: ManifestTokens = {
  colors: { brand: '#3355ff', ink: '#111111' },
  spacing: { sm: '8px', md: '16px' },
  typography: { 'size-body': '16px' },
  radius: { md: '10px' },
}

describe('manifestTokensToCssVars', () => {
  it('prefixes and namespaces every token group', () => {
    expect(manifestTokensToCssVars(TOKENS)).toEqual({
      '--sfs-color-brand': '#3355ff',
      '--sfs-color-ink': '#111111',
      '--sfs-space-sm': '8px',
      '--sfs-space-md': '16px',
      '--sfs-type-size-body': '16px',
      '--sfs-radius-md': '10px',
    })
  })

  it('tolerates missing optional groups', () => {
    const vars = manifestTokensToCssVars({ colors: {}, spacing: {}, typography: {} })
    expect(vars).toEqual({})
  })
})

/** Minimal stand-in for an element's CSSStyleDeclaration. */
function fakeEl() {
  const map = new Map<string, string>()
  const style = {
    setProperty: (k: string, v: string) => map.set(k, v),
    removeProperty: (k: string) => map.delete(k),
    [Symbol.iterator]: () => map.keys(),
  }
  return { style } as unknown as HTMLElement & { style: { setProperty: unknown } }
}

describe('applyTokens / purgeTokens', () => {
  it('injects, then purges only the --sfs-* properties', () => {
    const el = fakeEl()
    ;(el.style as unknown as { setProperty: (k: string, v: string) => void }).setProperty(
      '--unrelated',
      'keep',
    )

    applyTokens(el, manifestTokensToCssVars(TOKENS))
    const keys = [...(el.style as unknown as Iterable<string>)]
    expect(keys).toContain('--sfs-color-brand')
    expect(keys).toContain('--unrelated')

    purgeTokens(el)
    const after = [...(el.style as unknown as Iterable<string>)]
    expect(after).toEqual(['--unrelated'])
  })

  it('applyTokens clears stale tokens from a previous system', () => {
    const el = fakeEl()
    applyTokens(el, { '--sfs-color-brand': 'a', '--sfs-color-old': 'b' })
    applyTokens(el, { '--sfs-color-brand': 'c' })
    const keys = [...(el.style as unknown as Iterable<string>)]
    expect(keys).toEqual(['--sfs-color-brand'])
  })
})
