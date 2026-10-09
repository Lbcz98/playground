import { describe, expect, it } from 'vitest'
import { designerFolder, inDesigner, isCheckable, checkTargets, flowFolderOf, isLocalComponent, isScreen, listProtos, tsxNames, type Tree } from './protoFolders'

/** A folder of strings: the rules run on these, with no disk. */
const treeOf = (files: Record<string, string>): Tree => ({
  list: (dir) => [...new Set(Object.keys(files).filter((f) => f.startsWith(`${dir}/`)).map((f) => f.slice(dir.length + 1)).map((r) => (r.includes('/') ? `${r.split('/')[0]}/` : r)))],
  read: (file) => files[file],
})
const SCREEN = 'export default () => <Screen name="x" />'


describe('the designer folder', () => {
  it('is web/protos/<name>, whatever is under it and whatever is above it', () => {
    expect(inDesigner('/repo/web/protos/ana/home.tsx')).toEqual({ designer: 'ana', folder: '/repo/web/protos/ana', rest: 'home.tsx' })
    expect(inDesigner('web/protos/ana/components/Card.tsx')).toEqual({ designer: 'ana', folder: 'web/protos/ana', rest: 'components/Card.tsx' })
    expect(inDesigner('/repo/web/protos/ana')).toBeUndefined()
    expect(inDesigner('/repo/src/ui-kit/Screen.tsx')).toBeUndefined()
  })
  it('is the file’s own folder when it is not under web/protos (corpus, tests)', () => {
    expect(designerFolder('/repo/web/protos/ana/flow/a.tsx')).toBe('/repo/web/protos/ana')
    expect(designerFolder('/repo/.checks-corpus/w1/s.tsx')).toBe('/repo/.checks-corpus/w1')
  })
})

describe('what a changed file hands to the checker', () => {
  it('is a .tsx or a flow.ts of a designer folder; nothing else is a trigger', () => {
    expect(isCheckable('web/protos/ana/home.tsx')).toBe(true)
    expect(isCheckable('web/protos/ana/components/Card.tsx')).toBe(true)
    expect(isCheckable('web/protos/ana/checkout/flow.ts')).toBe(true)
    expect(isCheckable('web/protos/ana/data.ts')).toBe(false)
    expect(isCheckable('web/protos/ana/notes.md')).toBe(false)
    expect(isCheckable('src/ui-kit/Screen.tsx')).toBe(false)
  })
})

describe('a screen', () => {
  const tree = treeOf({ 'p/a.tsx': SCREEN, 'p/b.tsx': 'export const B = () => <Box />', 'p/c.tsx': '<Screen\n  name="c">', 'p/d.tsx': '<ScreenBar />', 'p/n.md': '<Screen>' })
  it('is a .tsx that holds a <Screen>, wherever it is; a file without one is a local file', () => {
    expect(['a', 'b', 'c', 'd'].map((n) => isScreen(`p/${n}.tsx`, tree))).toEqual([true, false, true, false])
    expect(isScreen('p/n.md', tree)).toBe(false)
  })
})

describe('a flow folder', () => {
  const tree = treeOf({ 'p/home.tsx': SCREEN, 'p/buy/flow.ts': 'export default {}', 'p/buy/cart.tsx': SCREEN, 'p/buy/pay.tsx': SCREEN, 'p/misc/x.tsx': SCREEN })
  it('is the folder that holds a flow.ts; it is reached from the folder, the flow.ts or a state in it', () => {
    expect(['p/buy', 'p/buy/flow.ts', 'p/buy/cart.tsx'].map((a) => flowFolderOf(a, tree))).toEqual(['p/buy', 'p/buy', 'p/buy'])
    expect(['p/misc', 'p/misc/x.tsx', 'p/home.tsx', 'p/nowhere'].map((a) => flowFolderOf(a, tree))).toEqual([undefined, undefined, undefined, undefined])
  })
})

describe('which screens a changed file puts in question', () => {
  const tree = treeOf({
    'w/web/protos/ana/home.tsx': SCREEN,
    'w/web/protos/ana/about.tsx': SCREEN,
    'w/web/protos/ana/components/Card.tsx': 'export const Card = () => <Box />',
    'w/web/protos/ana/data.ts': 'export default []',
    'w/web/protos/ana/buy/flow.ts': 'export default {}',
    'w/web/protos/ana/buy/cart.tsx': SCREEN,
    'w/web/protos/ana/buy/pay.tsx': 'not a screen yet',
    'w/web/protos/bia/home.tsx': SCREEN,
    'w/c/s.tsx': SCREEN,
    'w/c/components/Stepper.tsx': 'export const Stepper = () => <Box />',
  })
  const P = 'w/web/protos/ana'
  it('a screen is itself', () => {
    expect(checkTargets([`${P}/home.tsx`], tree)).toEqual({ files: [`${P}/home.tsx`], flows: [] })
  })
  it('a file that is not a screen is its folder’s screens, flow states included, other designers’ not', () => {
    expect(checkTargets([`${P}/components/Card.tsx`], tree)).toEqual({ files: [`${P}/about.tsx`, `${P}/buy/cart.tsx`, `${P}/home.tsx`], flows: [] })
  })
  it('a components/ folder outside web/protos belongs to the folder above it', () => {
    expect(checkTargets(['w/c/components/Stepper.tsx'], tree).files).toEqual(['w/c/s.tsx'])
  })
  it('a flow is reached from its folder, its flow.ts or a screen in it, and brings every state, screen or not', () => {
    const flow = { files: [`${P}/buy/cart.tsx`, `${P}/buy/pay.tsx`], flows: [`${P}/buy`] }
    expect(checkTargets([`${P}/buy`], tree)).toEqual(flow)
    expect(checkTargets([`${P}/buy/flow.ts`, `${P}/buy/cart.tsx`], tree)).toEqual(flow)
  })
  it('a .ts local file (data, a helper) is its folder’s screens too', () => {
    expect(checkTargets([`${P}/data.ts`], tree)).toEqual({ files: [`${P}/about.tsx`, `${P}/buy/cart.tsx`, `${P}/home.tsx`], flows: [] })
  })
  it('a .tsx that does not exist is kept for the checker to report; other designers are not touched', () => {
    expect(checkTargets([`${P}/gone.tsx`, `${P}/gone.ts`], tree)).toEqual({ files: [`${P}/gone.tsx`], flows: [] })
  })
})

describe('what a folder routes', () => {
  const tree = treeOf({ 'p/home.tsx': SCREEN, 'p/helper.tsx': 'export const H = () => <Box />', 'p/notes.md': '', 'p/components/Card.tsx': SCREEN, 'p/buy/flow.ts': '', 'p/buy/cart.tsx': SCREEN, 'p/misc/x.tsx': SCREEN })
  // The decision: "screen" answers two questions. Checked: a <Screen> anywhere in the tree (isScreen). Routed: a
  // top-level .tsx is a page and a link target in a designer folder, a state in a flow folder (tsxNames).
  // A top-level helper is routed but not checked as a screen; a screen in components/ is checked but not routed.
  it('is its top-level .tsx files, whether or not they hold a <Screen>', () => {
    expect(tsxNames('p', tree)).toEqual(['helper', 'home'])
    expect(isScreen('p/helper.tsx', tree)).toBe(false)
    expect(isScreen('p/components/Card.tsx', tree)).toBe(true)
  })
  it('lists a designer’s top-level .tsx as screens and its folders with a flow.ts as flows: the folder tree is the data', () => {
    const all = treeOf({ 'protos/ana/home.tsx': SCREEN, 'protos/ana/buy/flow.ts': '', 'protos/ana/buy/cart.tsx': SCREEN, 'protos/ana/components/Card.tsx': SCREEN, 'protos/bia/about.tsx': SCREEN, 'protos/README.md': '' })
    expect(listProtos('protos', all)).toEqual([
      { designer: 'ana', screen: 'home', kind: 'screen' },
      { designer: 'ana', screen: 'buy', kind: 'flow' },
      { designer: 'bia', screen: 'about', kind: 'screen' },
    ])
  })
})

describe('a local component', () => {
  it('is a .tsx in the components/ folder of the designer folder; the @proposal rule is about these', () => {
    expect(isLocalComponent('w/web/protos/ana', 'w/web/protos/ana/components/Card.tsx')).toBe(true)
    expect(isLocalComponent('w/web/protos/ana', 'w/web/protos/ana/components/deep/Card.tsx')).toBe(true)
    expect(isLocalComponent('w/web/protos/ana', 'w/web/protos/ana/Card.tsx')).toBe(false)
    expect(isLocalComponent('w/web/protos/ana', 'w/web/protos/ana/buy/components/Card.tsx')).toBe(false)
    expect(isLocalComponent('w/web/protos/ana', 'w/web/protos/ana/components/data.ts')).toBe(false)
  })
})
