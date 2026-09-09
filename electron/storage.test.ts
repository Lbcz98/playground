import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { DesignSystemManifest } from '@/shared/design-system/manifest'

let userData: string

vi.mock('electron', () => ({
  app: { getPath: (name: string) => (name === 'userData' ? userData : tmpdir()) },
}))

const {
  listDesignSystems,
  saveDesignSystem,
  deleteDesignSystem,
  getActiveDesignSystemId,
  setActiveDesignSystemId,
} = await import('./storage')

function manifest(id: string): DesignSystemManifest {
  return {
    id,
    name: id,
    version: '1.0.0',
    tokens: { colors: {}, spacing: {}, typography: {} },
    components: {
      Box: { id: 'Box', name: 'Box', description: '', acceptsChildren: true, props: {} },
    },
  }
}

beforeEach(() => {
  userData = mkdtempSync(join(tmpdir(), 'sfs-storage-'))
})

afterEach(() => {
  rmSync(userData, { recursive: true, force: true })
})

describe('design-system storage (spec §9)', () => {
  it('saves and lists manifests', async () => {
    expect(await listDesignSystems()).toEqual([])
    await saveDesignSystem(manifest('acme'))
    await saveDesignSystem(manifest('globex'))
    const ids = (await listDesignSystems()).map((m) => m.id).sort()
    expect(ids).toEqual(['acme', 'globex'])
  })

  it('overwrites a manifest with the same id', async () => {
    await saveDesignSystem(manifest('acme'))
    await saveDesignSystem({ ...manifest('acme'), version: '2.0.0' })
    const list = await listDesignSystems()
    expect(list).toHaveLength(1)
    expect(list[0].version).toBe('2.0.0')
  })

  it('rejects an invalid manifest', async () => {
    await expect(saveDesignSystem({ id: 'x' })).rejects.toThrow()
  })

  it('deletes a manifest', async () => {
    await saveDesignSystem(manifest('acme'))
    await deleteDesignSystem('acme')
    expect(await listDesignSystems()).toEqual([])
  })

  it('skips corrupt files without throwing', async () => {
    const { writeFile } = await import('node:fs/promises')
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    await saveDesignSystem(manifest('acme'))
    await writeFile(join(userData, 'design-systems', 'broken.json'), '{ not json')
    const ids = (await listDesignSystems()).map((m) => m.id)
    expect(ids).toEqual(['acme'])
    warn.mockRestore()
  })

  it('remembers the active id across reads', async () => {
    expect(await getActiveDesignSystemId()).toBeNull()
    await setActiveDesignSystemId('acme')
    expect(await getActiveDesignSystemId()).toBe('acme')
  })

  it('does not leak path traversal into the id', async () => {
    await saveDesignSystem(manifest('../evil'))
    const list = await listDesignSystems()
    expect(list).toHaveLength(1)
    // file lands inside the storage dir, id preserved in content
    expect(list[0].id).toBe('../evil')
  })
})
