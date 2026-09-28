import { beforeEach, describe, expect, it } from 'vitest'
import COMPONENTS_MANIFEST from '@/shared/design-system/__fixtures__/components-manifest.json'
import { useDesignSystemStore } from './designSystemStore'
import { SCREENFLOW_MANIFEST_ID } from '@/shared/design-system/screenflow-manifest'

const store = () => useDesignSystemStore.getState()

const STORYBOOK_JSON = {
  components: {
    Button: {
      displayName: 'Button',
      props: {
        variant: { type: { name: 'enum', value: [{ value: "'a'" }, { value: "'b'" }] }, required: false },
      },
    },
  },
}

beforeEach(async () => {
  // No window.flow bridge in the node test env -> everything is in-memory.
  useDesignSystemStore.setState({
    ...store(),
    library: [store().library[0]],
  })
  await store().setActive(SCREENFLOW_MANIFEST_ID)
})

describe('designSystemStore', () => {
  it('starts with only the built-in systems active', () => {
    expect(store().library).toHaveLength(1)
    expect(store().library.map((m) => m.id)).toEqual([SCREENFLOW_MANIFEST_ID])
    expect(store().activeId).toBe(SCREENFLOW_MANIFEST_ID)
    expect(store().active.id).toBe(SCREENFLOW_MANIFEST_ID)
    expect(store().registry.manifestId).toBe(SCREENFLOW_MANIFEST_ID)
  })

  it('hydrate is a safe no-op without the Electron bridge', async () => {
    await store().hydrate()
    expect(store().hydrated).toBe(true)
    expect(store().library).toHaveLength(1)
  })

  it('imports a Storybook JSON, adds it to the library and activates it', async () => {
    const result = await store().importStorybook(STORYBOOK_JSON, { id: 'acme', name: 'Acme', version: '1.0.0' })
    expect(result).toEqual({ ok: true, id: 'acme' })
    expect(store().library.map((m) => m.id)).toEqual([SCREENFLOW_MANIFEST_ID, 'acme'])
    expect(store().activeId).toBe('acme')
    expect(store().registry.manifestId).toBe('acme')
    expect(store().registry.get('Button')!.generic).toBe(true)
  })

  it('imports a Storybook components manifest and hands back what it could not take', async () => {
    const result = await store().importStorybook(COMPONENTS_MANIFEST, { id: 'kit', name: 'Kit' })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.warnings?.map((w) => w.component)).toEqual(expect.arrayContaining(['Template', 'TableCell']))
    expect(store().registry.get('ContentCardHeader')).toBeDefined()
  })

  it('rejects an unparseable Storybook payload', async () => {
    const result = await store().importStorybook({ nothing: true })
    expect(result.ok).toBe(false)
  })

  it('switching back to the built-in system re-hydrates its registry', async () => {
    await store().importStorybook(STORYBOOK_JSON, { id: 'acme', name: 'Acme', version: '1.0.0' })
    await store().setActive(SCREENFLOW_MANIFEST_ID)
    expect(store().active.id).toBe(SCREENFLOW_MANIFEST_ID)
    expect(store().registry.get('Stack')!.generic).toBe(false)
  })

  it('removing the active imported system falls back to the built-in', async () => {
    await store().importStorybook(STORYBOOK_JSON, { id: 'acme', name: 'Acme', version: '1.0.0' })
    await store().remove('acme')
    expect(store().library.map((m) => m.id)).toEqual([SCREENFLOW_MANIFEST_ID])
    expect(store().activeId).toBe(SCREENFLOW_MANIFEST_ID)
  })

  describe('importTokens', () => {
    beforeEach(async () => {
      await store().importStorybook(STORYBOOK_JSON, { id: 'acme', name: 'Acme', version: '1.0.0' })
    })

    it('merges DTCG tokens into the active imported manifest and keeps it active', async () => {
      const result = await store().importTokens({
        color: { $type: 'color', brand: { $value: '#0055ff' } },
        space: { $type: 'dimension', md: { $value: '16px' } },
      })
      expect(result).toEqual({ ok: true, id: 'acme' })
      expect(store().active.tokens.colors).toEqual({ brand: '#0055ff' })
      expect(store().active.tokens.spacing).toEqual({ md: '16px' })
      expect(store().activeId).toBe('acme')
      expect(store().library).toHaveLength(2)
    })

    it('merges additively across successive imports', async () => {
      await store().importTokens({ color: { $type: 'color', brand: { $value: '#111111' } } })
      await store().importTokens({
        color: { $type: 'color', accent: { $value: '#222222' } },
        radius: { $type: 'dimension', md: { $value: '8px' } },
      })
      expect(store().active.tokens.colors).toEqual({ brand: '#111111', accent: '#222222' })
      expect(store().active.tokens.radius).toEqual({ md: '8px' })
    })

    it('hands back the tokens it had to leave out', async () => {
      const result = await store().importTokens({
        color: { $type: 'color', brand: { $value: '#0055ff' }, accent: { $value: '{color.gone}' } },
      })
      expect(result).toEqual({
        ok: true,
        id: 'acme',
        warnings: [{ component: 'tokens', prop: 'color.accent', message: expect.stringMatching(/points at no token/) }],
      })
      expect(store().active.tokens.colors).toEqual({ brand: '#0055ff' })
    })

    it('rejects when nothing parses as a token', async () => {
      expect((await store().importTokens({ not: 'tokens', deeply: { nested: true } })).ok).toBe(false)
    })

    it('refuses to re-theme the built-in ScreenFlow system', async () => {
      await store().setActive(SCREENFLOW_MANIFEST_ID)
      const result = await store().importTokens({ color: { $type: 'color', brand: { $value: '#000000' } } })
      expect(result.ok).toBe(false)
    })

  })

  describe('importBundle (Phase 8B)', () => {
    beforeEach(async () => {
      await store().importStorybook(STORYBOOK_JSON, { id: 'acme', name: 'Acme', version: '1.0.0' })
    })

    it('refuses the built-in ScreenFlow system', async () => {
      await store().setActive(SCREENFLOW_MANIFEST_ID)
      const result = await store().importBundle('window.__sfsDesignSystem = {}')
      expect(result.ok).toBe(false)
    })


    it('rejects empty source', async () => {
      expect((await store().importBundle('   ')).ok).toBe(false)
    })

    it('accepts non-empty source for the active imported system (no bridge -> in-memory no-op save)', async () => {
      const result = await store().importBundle('window.__sfsDesignSystem = { Button: () => null }')
      expect(result).toEqual({ ok: true, id: 'acme' })
    })

    it('clears any cached bundle result so a re-import gets a fresh load attempt', async () => {
      useDesignSystemStore.setState({ liveComponents: { acme: 'error' } })
      await store().importBundle('window.__sfsDesignSystem = { Button: () => null }')
      // No bridge in tests -> maybeLoadLiveComponents no-ops, but the stale
      // 'error' entry must not survive the import untouched.
      expect(store().liveComponents.acme).toBeUndefined()
    })
  })
})
