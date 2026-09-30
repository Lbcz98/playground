/**
 * The planner prompt's bytes, pinned before phase 9C added the `appliesTo` rules
 * section. A request that names no component must keep getting exactly this prompt.
 */
import { describe, expect, it } from 'vitest'
import { buildPlannerPrompt } from './promptSpec'
import { SCREENFLOW_MANIFEST } from '@/shared/design-system/screenflow-manifest'
import { W3C_MANIFEST } from '@/shared/fixtures/w3cManifest'

describe('planner prompt (byte snapshot)', () => {
  it('is unchanged for the built-in system', () => {
    expect(buildPlannerPrompt(SCREENFLOW_MANIFEST)).toMatchSnapshot()
  })

  it('is unchanged for an imported system', () => {
    expect(buildPlannerPrompt(W3C_MANIFEST)).toMatchSnapshot()
  })
})
