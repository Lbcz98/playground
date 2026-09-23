/**
 * Screen templates — the reference screens the agent starts a prototype from.
 *
 * A template is a real `BlueprintDocument`: the same thing the Generator emits
 * and the interpreter renders, not a picture and not prose. That is the point —
 * the agent copies a structure it can adapt, instead of re-deriving one from a
 * screenshot. `templates.test.ts` holds every template to the strict validator
 * and the frame rules, so a reference can never teach an invalid screen.
 *
 * The PNG of each template comes from the story in `src/app/templates` through
 * the usual visual run (`npm run test:visual`), so the pictures are a by-product
 * of the same source rather than a folder to maintain by hand.
 */

import type { BlueprintDocument } from '@/shared/blueprint'
import type { ManifestScreenTemplate } from '@/shared/design-system/manifest'

/**
 * A built-in reference screen — `ManifestScreenTemplate` with its `blueprint`
 * typed as the real `BlueprintDocument` this module already has on hand. The id
 * also serves as the story name and the snapshot's filename.
 */
export interface ScreenTemplate extends Omit<ManifestScreenTemplate, 'blueprint'> {
  blueprint: BlueprintDocument
}
