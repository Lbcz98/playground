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

export interface ScreenTemplate {
  /** Stable id — also the story name and the snapshot's filename. */
  id: string
  name: string
  /** One line the planner reads to choose between templates. */
  when: string
  blueprint: BlueprintDocument
}
