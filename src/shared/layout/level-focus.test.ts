/** Where the focus starts is what tells the pages apart (the user's page rules). */
import { describe, expect, it } from 'vitest'
import { interpretPrototype, treeToBlueprint as toDoc } from '@/interpreter/interpret'
import { buildSystemPrompt } from '@/design-system/promptSpec'
import type { BlueprintDocument, BlueprintNode } from '@/shared/blueprint'
import { validateBlueprintAgainstManifest } from '@/shared/design-system/manifest-zod'
import { SCREENFLOW_MANIFEST as S } from '@/shared/design-system/screenflow-manifest'
import { screenTemplate } from '@/shared/templates'

const doc = (id: string) => structuredClone(screenTemplate(id)!.blueprint) as BlueprintDocument
const find = (n: BlueprintNode, type: string): BlueprintNode | undefined =>
  n.type === type ? n : (n.children ?? []).map((c) => find(c, type)).find(Boolean)
const errors = (d: BlueprintDocument) => {
  const r = validateBlueprintAgainstManifest(d, S)
  return r.ok ? [] : r.issues.map((i) => i.message)
}

describe('page 1 · Home — focus starts on the program button', () => {
  it('the templates do', () => {
    expect(find(doc('home').root, 'MainMenu')!.props!.focusedItem).toBe('program')
    expect(errors(doc('home'))).toEqual([])
    expect(errors(doc('home-notification'))).toEqual([])
  })

  it('rejects the menu focused on another button while the rail is on the right', () => {
    const d = doc('home')
    find(d.root, 'MainMenu')!.props!.focusedItem = 'login'
    expect(errors(d).join()).toMatch(/focusedItem "login" — the focus starts on the program button.*use "program"/)
  })

  it('rejects a focus on an interactivity button — that is already the second level', () => {
    const d = doc('home')
    find(d.root, 'MainMenu')!.props!.focusedItem = 'none'
    find(d.root, 'InteractivityButton')!.props!.interactionState = 'focus'
    expect(errors(d).join()).toMatch(/Level 1 \(Home\).*InteractivityButton.*second level/)
  })

  it('repairs it: the program button takes focus, the card rests', () => {
    const d = doc('home')
    find(d.root, 'MainMenu')!.props!.focusedItem = 'none'
    find(d.root, 'InteractivityButton')!.props!.interactionState = 'focus'
    const r = interpretPrototype(d, S)
    if (!r.ok) throw new Error(r.error)
    const tree = JSON.stringify(r.screens[0].tree)
    expect(tree).toContain('"focusedItem":"program"')
    expect(tree).not.toContain('"interactionState":"focus"')
  })
})

describe('menu roles — each button owns a rail on its side', () => {
  const leftRail = (item: string) => {
    const d = doc('home')
    d.screen = { model: 'home-buttons-left', level: 1 }
    find(d.root, 'InteractivityMenu')!.props = { align: 'start' }
    find(d.root, 'MainMenu')!.props!.focusedItem = item
    return d
  }

  it('a left rail is owned by a left button: miscellaneous, schedule or login', () => {
    for (const item of ['miscellaneous', 'schedule', 'login']) expect(errors(leftRail(item)).join()).not.toMatch(/focusedItem/)
    expect(errors(leftRail('program')).join()).toMatch(/Home rail is on the left.*"miscellaneous" or "schedule" or "login"/)
  })

  it('the prompt names every role and its side', () => {
    const prompt = buildSystemPrompt('json')
    expect(prompt).toMatch(/Program \(focusedItem "program"\) — its interactivity buttons sit on the right/)
    expect(prompt).toMatch(/Schedule \(focusedItem "schedule"\) — its interactivity buttons sit on the left and hold the schedule: .*time.*live.*name/)
    expect(prompt).toMatch(/Login \(focusedItem "login"\) — .*left and hold account settings/)
  })
})

describe('page 2 · focus on the interactivity buttons', () => {
  it('the rail template focuses a card', () => {
    expect(errors(doc('interactivity-buttons-right'))).toEqual([])
  })

  it('rejects a second-level screen with nothing focused', () => {
    const d = doc('interactivity-buttons-right')
    const rest = (n: BlueprintNode): void => {
      if (n.type === 'InteractivityButton') n.props = { ...n.props, interactionState: 'selected' }
      n.children?.forEach(rest)
    }
    rest(d.root)
    expect(errors(d).join()).toMatch(/Level 2 \(Trilho focado\): nothing is focused/)
    // As data too: check:laws reads this one apart from a focus in the wrong place.
    const r = validateBlueprintAgainstManifest(d, S)
    expect(!r.ok && r.issues.map((i) => [i.ruleId, i.code])).toEqual([['level.initial-focus', 'nothing-focused']])
  })
})

describe('page 3 · focus starts on the rounded button, or on the content card when the screen has one', () => {
  it('the template does, and nothing else is focused', () => {
    expect(errors(doc('interactivity-cards-right'))).toEqual([])
  })

  it('accepts focus on the content card instead: the card is focusable content', () => {
    const d = doc('interactivity-cards-right')
    find(d.root, 'RoundedButton')!.props!.interactionState = 'default'
    find(d.root, 'ContentCard')!.props!.interactionState = 'focus'
    expect(errors(d)).toEqual([])
  })

  it('rejects the card and the button focused together', () => {
    const d = doc('interactivity-cards-right')
    find(d.root, 'ContentCard')!.props!.interactionState = 'focus'
    expect(errors(d).join()).toMatch(/focus\.single|elements are focused/)
  })
})

describe('the pages that are told by their focus must have it', () => {
  it('a third-level screen with no rounded button is rejected', () => {
    const d = doc('interactivity-cards-right')
    d.root.children = d.root.children!.filter((c) => c.type !== 'RoundedButton')
    expect(errors(d).join()).toMatch(/Level 3.*no <CloseButton> or <RoundedButton>.*add one and focus it/)
  })

  it('a second-level screen with no interactivity button is rejected', () => {
    const d = doc('interactivity-buttons-right')
    d.root = { type: 'Stack', props: d.root.props, children: [{ type: 'Text', props: { content: 'x' } }] }
    expect(errors(d).join()).toMatch(/Level 2.*no <InteractivityButton>/)
  })

  it('Home without a main menu is still fine', () => {
    const d = doc('home')
    d.root = { type: 'Stack', props: d.root.props, children: [{ type: 'Text', props: { content: 'x' } }] }
    expect(errors(d)).toEqual([])
  })
})

describe('levels 2 and 3 — the stack always sits at the end of the frame', () => {
  it('the templates do, left models included (they stay on the left through their module)', () => {
    for (const id of ['interactivity-buttons-right', 'interactivity-cards-right', 'interactivity-cards-left']) {
      expect(doc(id).root.props!.justify).toBe('end')
      expect(errors(doc(id))).toEqual([])
    }
  })

  it('rejects a root that sits anywhere else, and the interpreter sets it', () => {
    for (const id of ['interactivity-buttons-right', 'interactivity-cards-left']) {
      const d = doc(id)
      d.root.props = { ...d.root.props, justify: 'start' }
      expect(errors(d).join()).toMatch(/the stack sits at the end of the frame.*use "end"/)
      const r = interpretPrototype(d, S)
      if (!r.ok) throw new Error(r.error)
      expect(r.screens[0].tree.props.justify).toBe('end')
      expect(r.issues.some((i) => /sits at the end of the frame/.test(i.message))).toBe(true)
    }
  })

  it('leaves Home and the clean broadcast alone', () => {
    const d = doc('home')
    d.root.props = { ...d.root.props, justify: 'start' }
    expect(errors(d).join()).not.toMatch(/end of the frame/)
  })
})

describe('the main menu is never anchored', () => {
  const anchoredMenu = () => {
    const d = doc('home')
    const inner = d.root.children![0]
    const menu = inner.children!.find((c) => c.type === 'MainMenu')!
    inner.children = inner.children!.filter((c) => c !== menu)
    d.root.children!.push({ ...menu, anchor: true })
    return d
  }

  it('rejects it, and the interpreter un-anchors it', () => {
    expect(errors(anchoredMenu()).join()).toMatch(/<MainMenu> is anchored/)
    const r = interpretPrototype(anchoredMenu(), S)
    if (!r.ok) throw new Error(r.error)
    expect(r.screens[0].tree.children.some((c) => c.anchor)).toBe(false)
    expect(r.issues.some((i) => /Un-anchored <MainMenu>/.test(i.message))).toBe(true)
  })

  it('still lets the third level anchor its rounded button', () => {
    expect(errors(doc('interactivity-cards-right'))).toEqual([])
  })
})

describe('levels 2 and 3 — the outermost stack is a column', () => {
  const rowRoot = () => {
    const d = doc('interactivity-cards-left')
    d.root.props = { ...d.root.props, direction: 'horizontal', justify: 'start' }
    return d
  }

  it('rejects a row root, which would turn justify into the side and fight the model', () => {
    expect(errors(rowRoot()).join()).toMatch(/outermost <Stack> is a column/)
  })

  it('the interpreter makes it a column and keeps the content on its side', () => {
    const r = interpretPrototype(rowRoot(), S)
    if (!r.ok) throw new Error(r.error)
    const root = r.screens[0].tree
    expect([root.props.direction, root.props.justify]).toEqual(['vertical', 'end'])
    expect(errors({ ...toDoc(root) })).toEqual([])
  })
})

describe('level 1 (Home) — the outermost stack must be a column, but not pinned to the end', () => {
  const rowRoot = () => {
    const d = doc('home')
    d.root.props = { ...d.root.props, direction: 'horizontal' }
    return d
  }

  it('rejects a row root — Home has no module limit, so nothing wraps children in a row', () => {
    const message = errors(rowRoot()).join()
    expect(message).toMatch(/outermost <Stack> is a column/)
    expect(message).not.toMatch(/put the module on its side/)
  })

  it('the interpreter makes it a column, keeping its children stacked as they were', () => {
    const before = doc('home').root.children
    const r = interpretPrototype(rowRoot(), S)
    if (!r.ok) throw new Error(r.error)
    const root = r.screens[0].tree
    expect(root.props.direction).toBe('vertical')
    expect(root.children).toHaveLength(before!.length)
    expect(errors({ ...toDoc(root), screen: { model: 'home', level: 1 } })).toEqual([])
  })

  it('does not require justify "end" — a notification can sit at the top, the rail at the bottom', () => {
    expect(errors(doc('home-notification'))).toEqual([])
    expect(find(doc('home-notification').root, 'Stack')!.props!.justify).toBe('between')
  })
})

describe('level 0 (clean broadcast) — the outermost stack is a column at the end of the frame', () => {
  it('the template does', () => {
    expect(errors(doc('alert'))).toEqual([])
  })

  it('rejects a row root and the interpreter repairs it', () => {
    const d = doc('alert')
    d.root.props = { ...d.root.props, direction: 'horizontal', justify: 'start' }
    expect(errors(d).join()).toMatch(/outermost <Stack> is a column/)
    const r = interpretPrototype(d, S)
    if (!r.ok) throw new Error(r.error)
    const root = r.screens[0].tree
    expect([root.props.direction, root.props.justify]).toEqual(['vertical', 'end'])
  })
})
