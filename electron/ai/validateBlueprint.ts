/**
 * Step 3 of the pipeline — the strict Zod validator, in the Electron main process.
 *
 * Unlike the renderer's `interpretBlueprint` (which *repairs* a payload so it can
 * always render), this *rejects*: any unknown component, unknown prop, or
 * non-token value is an error. The orchestrator feeds these error strings back to
 * the Generator agent for a retry.
 *
 * The schema is compiled at runtime from the *active* `DesignSystemManifest`
 * (spec §7 Step 3), so validation always tracks the live design system. When no
 * manifest is passed we fall back to the built-in ScreenFlow manifest.
 */

import type { DesignSystemManifest } from '@/shared/design-system/manifest'
import {
  validateBlueprintAgainstManifest,
  type BlueprintValidation,
} from '@/shared/design-system/manifest-zod'
import { SCREENFLOW_MANIFEST } from '@/shared/design-system/screenflow-manifest'

export type { BlueprintValidation }

export function validateBlueprint(
  input: unknown,
  manifest: DesignSystemManifest = SCREENFLOW_MANIFEST,
): BlueprintValidation {
  return validateBlueprintAgainstManifest(input, manifest)
}
