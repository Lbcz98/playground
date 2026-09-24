/** Where the focus starts is what tells the pages apart (the user's page rules). */
import { describe, expect, it } from 'vitest'
import { interpretPrototype } from '@/interpreter/interpret'
import type { BlueprintDocument, BlueprintNode } from '@/shared/blueprint'
import { validateBlueprintAgainstManifest } from '@/shared/design-system/manifest-zod'
import { SCREENFLOW_MANIFEST as S } from '@/shared/design-system/screenflow-manifest'
import { screenTemplate } from '@/shared/templates'

const doc = (id: string) => structuredClone(screenTemplate(id)!.blueprint) as BlueprintDocument
const find = (n: BlueprintNode, type: string): BlueprintNode | undefined =>
  n.type === type ? n : (n.children ?? []).map((c) => find(c, type)).find(Boolean)
const errors = (d: BlueprintDocument) => {
  const r = validateBlueprintAgainstManifest(d, S)
  return r.ok ? [] : r.errors
}

describe('page 1 · Home — focus starts on the channel rounded button', () => {
  it('the templates do', () => {
    expect(find(doc('home').root, 'MainMenu')!.props!.focusedItem).toBe('channel-bug')
    expect(errors(doc('home'))).toEqual([])
    expect(errors(doc('home-notification'))).toEqual([])
  })

  it('rejects the menu focused anywhere else', () => {
    const d = doc('home')
    find(d.root, 'MainMenu')!.props!.focusedItem = 'program'
    expect(errors(d).join()).toMatch(/Level 1 \(Home\).*channel rounded button/)
  })

  it('rejects a focus on an interactivity button — that is already the second level', () => {
    const d = doc('home')
    find(d.root, 'MainMenu')!.props!.focusedItem = 'none'
    find(d.root, 'InteractivityCard')!.props!.interactionState = 'focus'
    expect(errors(d).join()).toMatch(/Level 1 \(Home\).*InteractivityCard.*second level/)
  })

  it('repairs it: the channel button takes focus, the card rests', () => {
    const d = doc('home')
    find(d.root, 'MainMenu')!.props!.focusedItem = 'none'
    find(d.root, 'InteractivityCard')!.props!.interactionState = 'focus'
    const r = interpretPrototype(d, S)
    if (!r.ok) throw new Error(r.error)
    const tree = JSON.stringify(r.screens[0].tree)
    expect(tree).toContain('"focusedItem":"channel-bug"')
    expect(tree).not.toContain('"interactionState":"focus"')
  })
})

describe('page 2 · focus on the interactivity buttons', () => {
  it('the rail template focuses a card', () => {
    expect(errors(doc('interactivity-buttons-right'))).toEqual([])
  })

  it('rejects a second-level screen with nothing focused', () => {
    const d = doc('interactivity-buttons-right')
    const rest = (n: BlueprintNode): void => {
      if (n.type === 'InteractivityCard') n.props = { ...n.props, interactionState: 'selected' }
      n.children?.forEach(rest)
    }
    rest(d.root)
    expect(errors(d).join()).toMatch(/Level 2 \(Trilho focado\): nothing is focused/)
  })
})

describe('page 3 · focus starts on the rounded button', () => {
  it('the template does, and nothing else is focused', () => {
    expect(errors(doc('interactivity-cards-right'))).toEqual([])
  })

  it('rejects focus on the card instead', () => {
    const d = doc('interactivity-cards-right')
    find(d.root, 'CloseButton')!.props!.interactionState = 'default'
    find(d.root, 'ContentCard')!.props!.interactionState = 'focus'
    expect(errors(d).join()).toMatch(/Level 3.*ContentCard.*rounded button/)
  })
})

describe('the pages that are told by their focus must have it', () => {
  it('a third-level screen with no rounded button is rejected', () => {
    const d = doc('interactivity-cards-right')
    d.root.children = d.root.children!.filter((c) => c.type !== 'CloseButton')
    expect(errors(d).join()).toMatch(/Level 3.*no <CloseButton> or <RoundedButton>.*add one and focus it/)
  })

  it('a second-level screen with no interactivity button is rejected', () => {
    const d = doc('interactivity-buttons-right')
    d.root = { type: 'Stack', props: d.root.props, children: [{ type: 'Text', props: { content: 'x' } }] }
    expect(errors(d).join()).toMatch(/Level 2.*no <InteractivityCard>/)
  })

  it('Home without a main menu is still fine', () => {
    const d = doc('home')
    d.root = { type: 'Stack', props: d.root.props, children: [{ type: 'Text', props: { content: 'x' } }] }
    expect(errors(d)).toEqual([])
  })
})
