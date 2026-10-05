import { existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

/**
 * `protos/<designer>/<screen>.tsx` is a screen; `protos/<designer>/<flow>/` (with a `flow.ts` and
 * one `.tsx` per state) is a flow. The whole data model is the folder tree.
 */
const ROOT = join(process.cwd(), 'protos')

export interface Proto {
  designer: string
  screen: string
  kind: 'screen' | 'flow'
}

export function listProtos(): Proto[] {
  return readdirSync(ROOT, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .flatMap((d) =>
      readdirSync(join(ROOT, d.name), { withFileTypes: true }).flatMap((f): Proto[] => {
        if (f.isFile() && f.name.endsWith('.tsx')) return [{ designer: d.name, screen: f.name.replace(/\.tsx$/, ''), kind: 'screen' }]
        if (f.isDirectory() && existsSync(join(ROOT, d.name, f.name, 'flow.ts'))) return [{ designer: d.name, screen: f.name, kind: 'flow' }]
        return []
      }),
    )
}
