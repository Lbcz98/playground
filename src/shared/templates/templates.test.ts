import { describe, expect, it } from 'vitest'
import { SCREEN_TEMPLATES, TEMPLATE_IDS } from './index'
import { validateBlueprintAgainstManifest } from '@/shared/design-system/manifest-zod'
import { SCREENFLOW_MANIFEST } from '@/shared/design-system/screenflow-manifest'
import { frameLayoutErrors } from '@/shared/layout/frame'
import { screenModel, screenLayersOf } from '@/shared/design-system/screen-layers'

describe('screen templates', () => {
  it('have unique ids', () => {
    expect(new Set(TEMPLATE_IDS).size).toBe(TEMPLATE_IDS.length)
  })

  for (const template of SCREEN_TEMPLATES) {
    describe(template.id, () => {
      it('passes the strict validator', () => {
        const result = validateBlueprintAgainstManifest(template.blueprint, SCREENFLOW_MANIFEST)
        expect(result.ok ? [] : result.errors).toEqual([])
      })

      it('passes the frame rules', () => {
        expect(frameLayoutErrors(template.blueprint, SCREENFLOW_MANIFEST)).toEqual([])
      })

      it('names a layer model the design system knows', () => {
        const model = screenModel(screenLayersOf(SCREENFLOW_MANIFEST), template.blueprint.screen?.model)
        expect(model).toBeDefined()
        expect(template.blueprint.screen?.level).toBe(model!.level)
      })
    })
  }
})
