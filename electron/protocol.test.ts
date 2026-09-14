import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { DesignSystemManifest } from '@/shared/design-system/manifest'

let userData: string

vi.mock('electron', () => {
  const handlers = new Map<string, (req: Request) => Promise<Response> | Response>()
  return {
    app: { getPath: (name: string) => (name === 'userData' ? userData : tmpdir()) },
    protocol: {
      registerSchemesAsPrivileged: vi.fn(),
      handle: vi.fn((scheme: string, fn: (req: Request) => Promise<Response> | Response) => {
        handlers.set(scheme, fn)
      }),
    },
    net: {
      fetch: vi.fn(async (url: string) => new Response(`served:${url}`, { status: 200 })),
    },
    __handlers: handlers,
  }
})

const { installDesignSystemProtocolHandler, registerDesignSystemProtocolSchemes, DESIGN_SYSTEM_SCHEME } =
  await import('./protocol')
const { saveDesignSystem, saveBundle } = await import('./storage')
const electronMock = (await import('electron')) as unknown as {
  __handlers: Map<string, (req: Request) => Promise<Response> | Response>
  protocol: { registerSchemesAsPrivileged: ReturnType<typeof vi.fn> }
  net: { fetch: ReturnType<typeof vi.fn> }
}

function manifest(id: string): DesignSystemManifest {
  return {
    id,
    name: id,
    version: '1.0.0',
    tokens: { colors: {}, spacing: {}, typography: {} },
    components: { Box: { id: 'Box', name: 'Box', description: '', acceptsChildren: true, props: {} } },
  }
}

function handle(url: string): Promise<Response> | Response {
  const fn = electronMock.__handlers.get(DESIGN_SYSTEM_SCHEME)!
  return fn(new Request(url))
}

beforeEach(() => {
  userData = mkdtempSync(join(tmpdir(), 'sfs-protocol-'))
  electronMock.net.fetch.mockClear()
  registerDesignSystemProtocolSchemes()
  installDesignSystemProtocolHandler()
})

afterEach(() => {
  rmSync(userData, { recursive: true, force: true })
})

describe('design-system:// protocol (Phase 8A)', () => {
  it('registers the scheme as privileged before installing the handler', () => {
    expect(electronMock.protocol.registerSchemesAsPrivileged).toHaveBeenCalledWith([
      expect.objectContaining({ scheme: DESIGN_SYSTEM_SCHEME }),
    ])
  })

  it('404s any path other than /bundle.js', async () => {
    const res = await handle(`${DESIGN_SYSTEM_SCHEME}://acme/other.js`)
    expect(res.status).toBe(404)
    expect(electronMock.net.fetch).not.toHaveBeenCalled()
  })

  it('404s when there is no manifest for that id', async () => {
    const res = await handle(`${DESIGN_SYSTEM_SCHEME}://ghost/bundle.js`)
    expect(res.status).toBe(404)
  })

  it('404s when the manifest exists but no bundle was ever saved', async () => {
    await saveDesignSystem(manifest('acme'))
    const res = await handle(`${DESIGN_SYSTEM_SCHEME}://acme/bundle.js`)
    expect(res.status).toBe(404)
  })

  it('serves the bundle file when both the manifest and the bundle exist', async () => {
    await saveDesignSystem(manifest('acme'))
    await saveBundle('acme', 'window.Acme = {}')

    const res = await handle(`${DESIGN_SYSTEM_SCHEME}://acme/bundle.js`)
    expect(res.status).toBe(200)
    expect(electronMock.net.fetch).toHaveBeenCalledTimes(1)
    const fetchedUrl = electronMock.net.fetch.mock.calls[0][0] as string
    expect(fetchedUrl).toMatch(/^file:.*acme\.bundle\.js$/)
  })

  it('sanitises a traversal-shaped hostname instead of escaping the storage directory', async () => {
    const res = await handle(`${DESIGN_SYSTEM_SCHEME}://../bundle.js`)
    expect(res.status).toBe(404) // safeId('..') collapses to '_' — no manifest by that name
    expect(electronMock.net.fetch).not.toHaveBeenCalled()
  })
})
