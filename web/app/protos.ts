import { readdirSync } from 'node:fs'
import { join } from 'node:path'

/** `protos/<designer>/<screen>.tsx` — the whole data model is the folder tree. */
const ROOT = join(process.cwd(), 'protos')

export interface Proto {
  designer: string
  screen: string
}

export function listProtos(): Proto[] {
  return readdirSync(ROOT, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .flatMap((d) =>
      readdirSync(join(ROOT, d.name))
        .filter((f) => f.endsWith('.tsx'))
        .map((f) => ({ designer: d.name, screen: f.replace(/\.tsx$/, '') })),
    )
}
