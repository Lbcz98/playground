import { join } from 'node:path'
import { diskTree, listProtos as listFolders, type Proto } from '@/shared/protoFolders'

/**
 * `protos/<designer>/<screen>.tsx` is a screen; `protos/<designer>/<flow>/` (with a `flow.ts` and
 * one `.tsx` per state) is a flow. The whole data model is the folder tree (the rules: src/shared/protoFolders.ts).
 */
const ROOT = join(process.cwd(), 'protos')

export type { Proto }

export const listProtos = (): Proto[] => listFolders(ROOT, diskTree)
