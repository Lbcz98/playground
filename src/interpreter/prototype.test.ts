import { describe, expect, it } from 'vitest'
import { interpretPrototype } from './interpret'
import { validateBlueprintAgainstManifest } from '@/shared/design-system/manifest-zod'
import { SCREENFLOW_MANIFEST as S } from '@/shared/design-system/screenflow-manifest'
import { screenTemplate } from '@/shared/templates'
import type { BlueprintDocument, BlueprintNode } from '@/shared/blueprint'

const home = () => structuredClone(screenTemplate('home')!.blueprint)
const rail = () => structuredClone(screenTemplate('interactivity-buttons-right')!.blueprint)
const stats = () => structuredClone(screenTemplate('interactivity-cards-right')!.blueprint)

/** First InteractivityButton / MainMenu-free clickable in a template tree. */
function firstOfType(node: BlueprintNode, type: string): BlueprintNode {
  if (node.type === type) return node
  for (const child of node.children ?? []) {
    const hit = firstOfTypeOrNull(child, type)
    if (hit) return hit
  }
  throw new Error(`no ${type}`)
}
function firstOfTypeOrNull(node: BlueprintNode, type: string): BlueprintNode | null {
  try {
    return firstOfType(node, type)
  } catch {
    return null
  }
}

function flow(): BlueprintDocument {
  const doc = home()
  doc.id = 'home'
  doc.name = 'Home'
  firstOfType(doc.root, 'InteractivityButton').goTo = 'rail'
  const r = rail()
  firstOfType(r.root, 'InteractivityButton').goTo = 'stats'
  const s = stats()
  return {
    ...doc,
    screens: [
      { id: 'rail', name: 'Rail', screen: r.screen, root: r.root },
      { id: 'stats', name: 'Stats', screen: s.screen, root: s.root },
    ],
  }
}

describe('a document with several screens', () => {
  it('validates as a flow, and as three options with no links', () => {
    expect(validateBlueprintAgainstManifest(flow(), S)).toEqual({ ok: true })
    const options: BlueprintDocument = {
      ...home(),
      name: 'Option A',
      screens: ['b', 'c'].map((id) => ({ id, name: `Option ${id.toUpperCase()}`, screen: home().screen, root: home().root })),
    }
    expect(validateBlueprintAgainstManifest(options, S)).toEqual({ ok: true })
  })

  it('rejects a broken link and names the screen it sits on', () => {
    const doc = flow()
    doc.screens![0].root.children![0].children![0].goTo = 'ghost'
    const result = validateBlueprintAgainstManifest(doc, S)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.issues.map((i) => i.message).join('\n')).toMatch(/screen "rail".*goTo "ghost" is not a screen/)
  })

  it('rejects more screens than a document carries, and a screen with no id', () => {
    const doc = flow()
    doc.screens = Array.from({ length: 6 }, (_, i) => ({ id: `s${i}`, screen: doc.screen, root: doc.root }))
    const tooMany = validateBlueprintAgainstManifest(doc, S)
    expect(!tooMany.ok && tooMany.issues.map((i) => i.message).join()).toMatch(/at most 6 screens/)
    const noId = { ...flow(), screens: [{ root: home().root }] }
    const result = validateBlueprintAgainstManifest(noId, S)
    expect(!result.ok && result.issues.map((i) => i.message).join()).toMatch(/needs a string "id"/)
  })

  it('validates each screen against the frame rules, prefixed with its id', () => {
    const doc = flow()
    doc.screens![0].root.props = { ...doc.screens![0].root.props, align: 'end' }
    const result = validateBlueprintAgainstManifest(doc, S)
    expect(!result.ok && result.issues.map((i) => i.message).join()).toMatch(/Screen "rail": root <Stack>: align "end"/)
  })
})

describe('interpretPrototype', () => {
  it('makes one screen per frame, in order, with names and links kept', () => {
    const result = interpretPrototype(flow(), S)
    if (!result.ok) throw new Error(result.error)
    expect(result.screens.map((s) => [s.id, s.name])).toEqual([
      ['home', 'Home'],
      ['rail', 'Rail'],
      ['stats', 'Stats'],
    ])
    expect(result.linkCount).toBe(2)
    expect(result.screens.map((s) => s.tree.screen?.level)).toEqual([1, 2, 3])
    const linked: string[] = []
    const visit = (n: { goTo?: string; children: unknown[] }) => {
      if (n.goTo) linked.push(n.goTo)
      ;(n.children as (typeof n)[]).forEach(visit)
    }
    visit(result.screens[0].tree)
    expect(linked).toEqual(['rail'])
  })

  it('keeps a lone screen a lone screen', () => {
    const result = interpretPrototype(home(), S)
    if (!result.ok) throw new Error(result.error)
    expect(result.screens).toHaveLength(1)
    expect(result.screens[0].id).toBe('screen-1')
  })

  it('drops a link to nowhere, to itself, or skipping a level — and says so', () => {
    const doc = flow()
    const card = firstOfType(doc.root, 'InteractivityButton')
    card.goTo = 'stats' // level 1 → 3
    const result = interpretPrototype(doc, S)
    if (!result.ok) throw new Error(result.error)
    expect(result.linkCount).toBe(1) // only rail → stats survives
    expect(result.issues.some((i) => /Dropped the link.*jumps from level 1 to level 3/.test(i.message))).toBe(true)

    const ghost = flow()
    firstOfType(ghost.root, 'InteractivityButton').goTo = 'ghost'
    const r2 = interpretPrototype(ghost, S)
    if (!r2.ok) throw new Error(r2.error)
    expect(r2.issues.some((i) => /"ghost" is not a screen/.test(i.message))).toBe(true)
  })

  it('drops a broken further screen but keeps the rest, renames duplicate ids, caps the count', () => {
    const doc = flow()
    doc.screens!.push({ id: 'rail', name: 'Dup', screen: doc.screen, root: doc.root })
    doc.screens!.push('nope' as never)
    const result = interpretPrototype(doc, S)
    if (!result.ok) throw new Error(result.error)
    expect(new Set(result.screens.map((s) => s.id)).size).toBe(result.screens.length)
    expect(result.issues.some((i) => /Renamed the screen "rail"/.test(i.message))).toBe(true)
    expect(result.issues.some((i) => /not an object/.test(i.message))).toBe(true)

    const many = { ...home(), screens: Array.from({ length: 8 }, (_, i) => ({ id: `s${i}`, screen: home().screen, root: home().root })) }
    const capped = interpretPrototype(many, S)
    if (!capped.ok) throw new Error(capped.error)
    expect(capped.screens).toHaveLength(6)
  })

  it('stretches every root', () => {
    const doc = flow()
    doc.screens![0].root.props = { ...doc.screens![0].root.props, align: 'end' }
    const result = interpretPrototype(doc, S)
    if (!result.ok) throw new Error(result.error)
    expect(result.screens.every((s) => s.tree.props.align === 'stretch')).toBe(true)
  })
})

describe('notes — what the user should know', () => {
  it('are validated, kept (trimmed, capped) and reach the run report', () => {
    const doc: BlueprintDocument = { ...home(), notes: ['  O mapa é aproximado por um cartão.  '] }
    expect(validateBlueprintAgainstManifest(doc, S)).toEqual({ ok: true })
    const result = interpretPrototype(doc, S)
    if (!result.ok) throw new Error(result.error)
    expect(result.notes).toEqual(['O mapa é aproximado por um cartão.'])
  })

  it('are rejected when not a short list of strings', () => {
    for (const notes of ['nope', [1], ['x'.repeat(301)], ['a', 'b', 'c', 'd', 'e']]) {
      const r = validateBlueprintAgainstManifest({ ...home(), notes } as never, S)
      expect(!r.ok && r.issues.map((i) => i.message).join()).toMatch(/"notes" must be a list/)
    }
  })

  it('the interpreter drops junk instead of failing', () => {
    const result = interpretPrototype({ ...home(), notes: ['ok', 3, '  ', null] } as never, S)
    if (!result.ok) throw new Error(result.error)
    expect(result.notes).toEqual(['ok'])
  })
})
