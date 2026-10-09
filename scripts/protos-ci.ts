/**
 * `npm run ci:protos -- outside <designer> | screens | flows`: what .github/workflows/protos.yml asks of the paths a
 * pull request changed (`git diff --name-only`, one per line on stdin), answered by the folder model
 * (src/shared/protoFolders.ts) instead of shell patterns. One path per line out.
 *
 *   outside <designer>  the paths that are not under web/protos/<designer>/ (the folder lock)
 *   screens             the .tsx and flow.ts of a designer folder (what the laws run on)
 *   flows               every flow folder of every designer folder touched (what is played)
 *
 * Run from the root of the checkout.
 */
import { readFileSync } from 'node:fs'
import { diskTree, flowFoldersUnder, inDesigner, isCheckable, type Tree } from '../src/shared/protoFolders'

const PROTOS = 'web/protos'
const designerOf = (path: string): string | undefined => (path.startsWith(`${PROTOS}/`) ? inDesigner(path)?.designer : undefined)

export const outsideOf = (designer: string, paths: string[]): string[] => paths.filter((p) => inDesigner(p)?.folder !== `${PROTOS}/${designer}`)

export const screensOf = (paths: string[]): string[] => paths.filter((p) => designerOf(p) !== undefined && isCheckable(p))

export const flowsOf = (paths: string[], tree: Tree): string[] =>
  [...new Set(paths.map(designerOf).filter((d): d is string => d !== undefined))].sort().flatMap((d) => flowFoldersUnder(`${PROTOS}/${d}`, tree))

function main(): void {
  const [mode, designer] = process.argv.slice(2).filter((a) => a !== '--')
  const paths = readFileSync(0, 'utf8').split('\n').filter(Boolean)
  const out = mode === 'outside' && designer !== undefined ? outsideOf(designer, paths) : mode === 'screens' ? screensOf(paths) : mode === 'flows' ? flowsOf(paths, diskTree) : undefined
  if (!out) {
    console.error('usage: npm run ci:protos -- outside <designer> | screens | flows   (changed paths on stdin)')
    process.exit(2)
  }
  if (out.length > 0) console.log(out.join('\n'))
}

if (!process.env.VITEST) main()
