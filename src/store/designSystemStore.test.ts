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
})
