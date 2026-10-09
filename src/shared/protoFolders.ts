import { readdirSync, readFileSync } from 'node:fs'
import { basename, dirname } from 'node:path/posix'

/**
 * The prototype folder model, in one place: what a designer folder, a screen, a flow and a local file are,
 * and which screens a changed file puts in question. Paths are `/`-separated strings; the files themselves
 * arrive through a `Tree`, so the rules run on plain strings; `diskTree` is the only touch of the disk.
 * No ScreenFlow imports (SPEC R7: web/ reaches this). Paths are POSIX.
 */

/** The files of a folder, as far as the rules need to see them. A folder in `list` ends with `/`. */
export interface Tree {
  list(dir: string): string[]
  read(file: string): string
}

/** The real folders. A folder that is not there lists as empty. */
export const diskTree: Tree = {
  list: (dir) => {
    try {
      return readdirSync(dir, { withFileTypes: true }).map((e) => (e.isDirectory() ? `${e.name}/` : e.name))
    } catch {
      return []
    }
  },
  read: (file) => readFileSync(file, 'utf8'),
}

export interface DesignerPath {
  designer: string
  /** `…/web/protos/<designer>`: the path as given, up to and including the designer's name. */
  folder: string
  /** The path below the designer folder. */
  rest: string
}

/** The designer folder a path is in: `…/web/protos/<designer>/<rest>`. */
export function inDesigner(path: string): DesignerPath | undefined {
  const m = /^((?:.*\/)?web\/protos\/([^/]+))\/(.+)$/.exec(path)
  return m ? { designer: m[2], folder: m[1], rest: m[3] } : undefined
}

/** The designer folder of a path, or its own folder when it is not under `web/protos/` (corpus, tests). */
export const designerFolder = (path: string): string => inDesigner(path)?.folder ?? dirname(path)

/** What `/deploy` hands to the checker of what changed: a `.tsx` or a `flow.ts` of a designer folder. */
export const isCheckable = (path: string): boolean => /\.tsx$|(^|\/)flow\.ts$/.test(inDesigner(path)?.rest ?? '')

/** What the edit hook reacts to: any `.tsx` or `.ts` of a designer folder (a data file shows on the screens that import it). */
export const isDesignerCode = (path: string): boolean => /\.tsx?$/.test(inDesigner(path)?.rest ?? '')

/** A screen is a `.tsx` that holds a `<Screen>`. Any other file of the folder is a local one (a component, data). */
export const isScreen = (file: string, tree: Tree): boolean => file.endsWith('.tsx') && /<Screen[\s>]/.test(tree.read(file))

const FLOW_FILE = 'flow.ts'

/** A folder is a flow when it holds a `flow.ts`; its states are its top-level `.tsx` files. */
export const isFlowFolder = (dir: string, tree: Tree): boolean => tree.list(dir).includes(FLOW_FILE)

/** The flow folder a path leads to: the folder itself, its `flow.ts`, or a file inside it. */
export function flowFolderOf(path: string, tree: Tree): string | undefined {
  const dir = /\.tsx?$/.test(path) ? dirname(path) : path
  return isFlowFolder(dir, tree) ? dir : undefined
}

/** Every flow folder at or below `dir`, at any depth, `dir` first. */
export const flowFoldersUnder = (dir: string, tree: Tree): string[] => [
  ...(isFlowFolder(dir, tree) ? [dir] : []),
  ...tree
    .list(dir)
    .filter((e) => e.endsWith('/'))
    .sort()
    .flatMap((e) => flowFoldersUnder(`${dir}/${e.slice(0, -1)}`, tree)),
]

const screensUnder =(dir: string, tree: Tree): string[] =>
  tree
    .list(dir)
    .sort()
    .flatMap((e) => (e.endsWith('/') ? screensUnder(`${dir}/${e.slice(0, -1)}`, tree) : isScreen(`${dir}/${e}`, tree) ? [`${dir}/${e}`] : []))

/**
 * The files to check when `paths` changed, and the flow folders among them. A screen is itself; a `.tsx` or `.ts` that
 * is not a screen (a local component, data) is checked through the screens of its folder (its focus and size show on
 * the screens that use it), a `components/` folder outside `web/protos/` standing for the folder above it. A flow
 * (reached from its folder, its `flow.ts` or a file in it) brings every top-level `.tsx` of its folder: its states.
 */
export function checkTargets(paths: string[], tree: Tree): { files: string[]; flows: string[] } {
  const flows = [...new Set(paths.map((p) => flowFolderOf(p, tree)).filter((d): d is string => d !== undefined))]
  const files = paths
    .filter((p) => /\.tsx?$/.test(p) && basename(p) !== FLOW_FILE)
    .flatMap((f) => {
      if (!tree.list(dirname(f)).includes(basename(f))) return f.endsWith('.tsx') ? [f] : []
      if (isScreen(f, tree)) return [f]
      const dir = dirname(f)
      return screensUnder(basename(dir) === 'components' ? dirname(dir) : designerFolder(f), tree)
    })
  return { files: [...new Set([...files, ...flows.flatMap((d) => tsxNames(d, tree).map((n) => `${d}/${n}.tsx`))])], flows }
}

/** The top-level `.tsx` files of a folder, by name: what a designer folder routes as screens (and `<Link>`s reach), and what a flow folder holds as states. */
export const tsxNames = (dir: string, tree: Tree): string[] =>
  tree
    .list(dir)
    .filter((f) => f.endsWith('.tsx'))
    .map((f) => f.slice(0, -4))
    .sort()

export interface Proto {
  designer: string
  screen: string
  kind: 'screen' | 'flow'
}

/** `<root>/<designer>/<screen>.tsx` is a screen; `<root>/<designer>/<flow>/` (a `flow.ts` and one `.tsx` per state) is a flow. */
export function listProtos(root: string, tree: Tree): Proto[] {
  return tree
    .list(root)
    .filter((d) => d.endsWith('/'))
    .flatMap((d) => {
      const designer = d.slice(0, -1)
      return tree.list(`${root}/${designer}`).flatMap((f): Proto[] => {
        if (f.endsWith('.tsx')) return [{ designer, screen: f.slice(0, -4), kind: 'screen' }]
        const flow = f.slice(0, -1)
        return f.endsWith('/') && isFlowFolder(`${root}/${designer}/${flow}`, tree) ? [{ designer, screen: flow, kind: 'flow' }] : []
      })
    })
}

/** A `.tsx` in `components/` of the designer folder: it carries its own `@proposal`. */
export const isLocalComponent = (folder: string, file: string): boolean => file.startsWith(`${folder}/components/`) && file.endsWith('.tsx')
