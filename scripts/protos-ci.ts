/**
 * `npm run ci:protos -- outside <designer> | screens | flows`: what .github/workflows/protos.yml asks of the paths a
 * pull request changed (`git diff -z --name-only`, NUL-separated on stdin: git prints accents and quotes
 * in a name escaped otherwise, and a space splits it), answered by the folder model (src/shared/protoFolders.ts)
 * instead of shell patterns. `outside` prints one path per line, to be read; `screens` and `flows` print each path
 * NUL-terminated, for `xargs -0` and `read -d ''`.
 *
 *   outside <designer>  the paths that are not under web/protos/<designer>/ (the folder lock)
 *   screens             surviving affected screens and flow.ts files (what the laws run on)
 *   flows               affected flow folders (what is played)
 *
 * Run from the root of the checkout.
 */
import { readFileSync } from 'node:fs'
import { diskTree, inDesigner, prototypeTargets, type Tree } from '../src/shared/protoFolders'

const PROTOS = 'web/protos'

export const outsideOf = (designer: string, paths: string[]): string[] => paths.filter((p) => inDesigner(p)?.folder !== `${PROTOS}/${designer}`)

export const screensOf = (paths: string[], tree: Tree = diskTree): string[] => {
  const { files, flows } = prototypeTargets(paths, tree)
  return [...files, ...flows.map((f) => `${f}/flow.ts`)]
}

export const flowsOf = (paths: string[], tree: Tree): string[] =>
  prototypeTargets(paths, tree).flows

function main(): void {
  const [mode, designer] = process.argv.slice(2).filter((a) => a !== '--')
  const paths = readFileSync(0, 'utf8').split('\0').filter(Boolean)
  const out = mode === 'outside' && designer !== undefined ? outsideOf(designer, paths) : mode === 'screens' ? screensOf(paths) : mode === 'flows' ? flowsOf(paths, diskTree) : undefined
  if (!out) {
    console.error('usage: npm run ci:protos -- outside <designer> | screens | flows   (changed paths on stdin)')
    process.exit(2)
  }
  if (out.length > 0) process.stdout.write(mode === 'outside' ? out.join('\n') + '\n' : out.map((p) => p + '\0').join(''))
}

if (!process.env.VITEST) main()
