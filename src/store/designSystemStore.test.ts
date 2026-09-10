import { beforeEach, describe, expect, it } from 'vitest'
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
  it('starts with only the built-in system active', () => {
    expect(store().library).toHaveLength(1)
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
      await store().importTokens({ colors: { brand: '#111111' } })
      await store().importTokens({ colors: { accent: '#222222' }, radius: { md: '8px' } })
      expect(store().active.tokens.colors).toEqual({ brand: '#111111', accent: '#222222' })
      expect(store().active.tokens.radius).toEqual({ md: '8px' })
    })

    it('rejects when nothing parses as a token', async () => {
      expect((await store().importTokens({ not: 'tokens', deeply: { nested: true } })).ok).toBe(false)
    })

    it('refuses to re-theme the built-in ScreenFlow system', async () => {
      await store().setActive(SCREENFLOW_MANIFEST_ID)
      const result = await store().importTokens({ colors: { brand: '#000000' } })
      expect(result.ok).toBe(false)
    })
  })
})
