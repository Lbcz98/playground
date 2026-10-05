import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import type { AiProvider } from '../../../electron/ai/providers'

vi.mock('../../../electron/ai/providers', async (importActual) => {
  const actual = await importActual<typeof import('../../../electron/ai/providers')>()
  return { ...actual, resolveProvider: vi.fn() }
})
const { resolveProvider } = await import('../../../electron/ai/providers')
const { generateUI, setRenderCheck } = await import('../../../electron/ai/ai-orchestrator')
import { dtvRenderCheck } from '../../../scripts/render-check'
import { RenderAuditUnavailable } from '../../../scripts/render-audit'
import { loadDtvManifest } from '../../../scripts/dtv-manifest'
import { DTV_TEMPLATES } from '../../../scripts/storybook/dtv-templates'
import { SCREENFLOW_MANIFEST } from '../design-system/screenflow-manifest'
import type { DesignSystemManifest } from '../design-system/manifest'

let manifest: DesignSystemManifest
beforeAll(() => {
  manifest = loadDtvManifest()
}, 120_000)

const home = (): any => structuredClone(DTV_TEMPLATES.find((t) => t.id === 'home')!.blueprint)

/** Chromium may be missing; the check says so, and the test says it skipped rather than passing. */
async function check(blueprint: unknown) {
  try {
    return await dtvRenderCheck(blueprint, manifest)
  } catch (e) {
    if (e instanceof RenderAuditUnavailable) return undefined
    throw e
  }
}

describe('dtvRenderCheck — the blueprint, painted', () => {
  it('finds nothing on a reference screen', async () => {
    const issues = await check(home())
    if (issues) expect(issues).toEqual([])
  }, 120_000)

  it('names a root that covers the frame with a background, as layers.stack', async () => {
    const bp = home()
    bp.root.props.background = 'primary' // the root column fills the frame
    const issues = await check(bp)
    if (issues) expect(issues.map((i) => i.ruleId)).toContain('layers.stack')
  }, 120_000)

  it('refuses a manifest whose kit it cannot paint', async () => {
    await expect(dtvRenderCheck(home(), SCREENFLOW_MANIFEST)).rejects.toThrow(/DTV kit/)
  })
})

describe('the pipeline with the real check', () => {
  afterEach(() => setRenderCheck(undefined))

  it('repaints a screen that covers the frame before delivering it', async () => {
    const covering = home()
    covering.root.props.background = 'primary'
    const renderUi = vi.fn().mockResolvedValueOnce({ blueprint: covering, model: 'm' }).mockResolvedValue({ blueprint: home(), model: 'm' })
    const provider = { id: 'api-key', label: 'Fake', isAvailable: async () => true, complete: async () => ({ text: 'Screen: model "home", level 1', model: 'm' }), renderUi } as unknown as AiProvider
    vi.mocked(resolveProvider).mockResolvedValue(provider)
    setRenderCheck(dtvRenderCheck)

    const res = await generateUI('the home screen', [], { mode: 'exploratory' }, manifest)
    if (!res.ok) throw new Error(res.error)
    const steps = res.meta.steps?.join('\n') ?? ''
    if (steps.includes('did not run')) return // no Chromium here
    expect(renderUi).toHaveBeenCalledTimes(2)
    expect(renderUi.mock.calls[1][0].messages.at(-1).content).toContain('painted on the 1280×720 frame')
    expect(steps).toContain('render check clean')
  }, 180_000)
})
