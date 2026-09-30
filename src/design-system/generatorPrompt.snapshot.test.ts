/**
 * The generator prompts' bytes, pinned before phase 9D added the deviation
 * contract. A Faithful request must keep getting exactly these.
 */
import { describe, expect, it } from 'vitest'
import { buildSystemPrompt } from './promptSpec'
import { SCREENFLOW_MANIFEST } from '@/shared/design-system/screenflow-manifest'
import { W3C_MANIFEST } from '@/shared/fixtures/w3cManifest'

describe('generator prompt (byte snapshot)', () => {
  for (const mode of ['tool', 'json'] as const) {
    it(`is unchanged for the built-in system (${mode})`, () => {
      expect(buildSystemPrompt(mode, SCREENFLOW_MANIFEST)).toMatchSnapshot()
    })
    it(`is unchanged for an imported system (${mode})`, () => {
      expect(buildSystemPrompt(mode, W3C_MANIFEST)).toMatchSnapshot()
    })
  }
})
