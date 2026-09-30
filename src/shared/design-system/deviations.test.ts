/** Phase 9D: the per-screen policy — declared deviations, the audit, and the laws that never bend. */
import { describe, expect, it } from 'vitest'
import { compileManifestSchemas, validateBlueprintAgainstManifest, type ValidationIssue } from './manifest-zod'
import { SCREENFLOW_MANIFEST } from './screenflow-manifest'
import { DTV_SCREEN_LAYERS } from './screen-layers'
import { RULE_SCOPE, declarableRules, ruleScope } from './deviations'
import { homeTemplate } from '@/shared/templates/home'

type Doc = Record<string, any>
const M = SCREENFLOW_MANIFEST
const home = (): Doc => structuredClone(homeTemplate.blueprint) as unknown as Doc
const dev = (ruleId: string, why = 'the request asks for it') => ({ ruleId, why })

/** Home with its root pushed off `align: stretch` — one pattern broken (`layout.root-align`). */
const breaksRootAlign = (): Doc => {
  const doc = home()
  doc.root.props = { ...doc.root.props, align: 'start' }
  return doc
}

const issuesOf = (doc: unknown, policy: 'faithful' | 'exploratory' = 'exploratory'): ValidationIssue[] => {
  const v = validateBlueprintAgainstManifest(doc, M, policy)
  return v.ok ? [] : v.issues
}
const rules = (issues: ValidationIssue[]) => issues.map((i) => i.ruleId)

describe('the fixtures behave', () => {
  it('a valid Home is valid in both modes, and one pattern broken is exactly one issue', () => {
    expect(validateBlueprintAgainstManifest(home(), M, 'faithful')).toEqual({ ok: true })
    expect(validateBlueprintAgainstManifest(home(), M, 'exploratory')).toEqual({ ok: true })
    expect(rules(issuesOf(breaksRootAlign(), 'faithful'))).toEqual(['layout.root-align'])
  })
})

describe('Faithful: no deviation, ever', () => {
  it('rejects a node deviation and a screen deviation, naming the reason', () => {
    const doc = breaksRootAlign()
    doc.root.deviation = dev('layout.root-align')
    doc.screen.deviation = [dev('layout.root-align')]
    const found = issuesOf(doc, 'faithful')
    expect(found.some((i) => /unknown node key "deviation" — a Faithful screen keeps every pattern/.test(i.message))).toBe(true)
    expect(found.some((i) => /"screen" declares no "deviation"/.test(i.message))).toBe(true)
    expect(rules(found)).toContain('layout.root-align') // and the break itself still counts
  })

  it('a stamped Faithful mode holds even when the caller asked for Exploratory', () => {
    const doc = breaksRootAlign()
    doc.mode = 'faithful'
    doc.root.deviation = dev('layout.root-align')
    expect(issuesOf(doc, 'exploratory').some((i) => /unknown node key "deviation"/.test(i.message))).toBe(true)
  })
})

describe('Exploratory: a pattern may break, declared', () => {
  it('passes when the node declares the rule it breaks', () => {
    const doc = breaksRootAlign()
    doc.root.deviation = dev('layout.root-align')
    expect(validateBlueprintAgainstManifest(doc, M, 'exploratory')).toEqual({ ok: true })
  })

  it('passes when the screen declares it', () => {
    const doc = breaksRootAlign()
    doc.screen.deviation = [dev('layout.root-align')]
    expect(validateBlueprintAgainstManifest(doc, M, 'exploratory')).toEqual({ ok: true })
  })

  it('fails an undeclared break as a composition choice, telling the model how to declare it', () => {
    const [issue, ...rest] = issuesOf(breaksRootAlign())
    expect(rest).toEqual([])
    expect(issue).toMatchObject({ ruleId: 'layout.root-align', kind: 'undeclared-deviation', path: ['root', 'props', 'align'] })
    expect(issue.message).toMatch(/"deviation": \{ "ruleId": "layout\.root-align", "why": "…" \}/)
  })

  it('fails a declaration nothing breaks (the declared set must equal the broken set)', () => {
    const doc = home()
    doc.root.deviation = dev('layout.root-align')
    const [issue, ...rest] = issuesOf(doc)
    expect(rest).toEqual([])
    expect(issue).toMatchObject({ kind: 'unused-deviation', path: ['root', 'deviation'] })
    expect(issue.message).toMatch(/nothing under it breaks that rule/)
  })

  it('declaring a different pattern covers nothing: the break is undeclared and the declaration unused', () => {
    const doc = breaksRootAlign()
    doc.root.deviation = dev('layout.no-static-center')
    expect(issuesOf(doc).map((i) => i.kind).sort()).toEqual(['undeclared-deviation', 'unused-deviation'])
    const screenLevel = breaksRootAlign()
    screenLevel.screen.deviation = [dev('level.module-limit')]
    expect(issuesOf(screenLevel).map((i) => i.kind).sort()).toEqual(['undeclared-deviation', 'unused-deviation'])
  })

  it('a declaration on a child does not cover the root’s break, and an ancestor’s covers below it', () => {
    const childOnly = breaksRootAlign()
    childOnly.root.children[0].deviation = dev('layout.root-align')
    expect(issuesOf(childOnly).map((i) => i.kind).sort()).toEqual(['undeclared-deviation', 'unused-deviation'])

    const doc = home()
    doc.root.deviation = dev('layout.slots')
    doc.root.children[0].children.push({ type: 'ContentCardHeader' }) // a card zone outside a card, two levels down
    expect(rules(issuesOf(doc))).not.toContain('layout.slots')
    expect(issuesOf(doc)).toEqual([])
  })

  it('uses each declaration for every break it covers', () => {
    const doc = home()
    doc.root.deviation = dev('layout.slots')
    doc.root.children[0].children.push({ type: 'ContentCardHeader' }, { type: 'ContentCardFooter' })
    expect(issuesOf(doc)).toEqual([])
  })
})

describe('Exploratory: laws are never declarable, never waived', () => {
  it('rejects declaring a law, a convention, an unknown rule and a bad shape', () => {
    const cases: [unknown, RegExp][] = [
      [dev('tokens.only'), /"tokens\.only" \(Tokens only\) is a law — it holds in every mode/],
      [dev('focus.single'), /is a law/],
      [dev('component.api'), /is a law/],
      [dev('copy.button-label'), /is a convention — breaking it only produces a note/],
      [dev('layout.invented'), /"layout\.invented" is not a rule of ScreenFlow\. Declare one of: .*layout\.root-align/],
      [{ ruleId: 'layout.root-align' }, /must be exactly \{ "ruleId"/],
      [{ ruleId: 'layout.root-align', why: '  ' }, /must say in one short sentence/],
      [{ ruleId: 'layout.root-align', why: 'x', reuse: 1 }, /remove "reuse"/],
      ['layout.root-align', /must be \{ "ruleId"/],
    ]
    for (const [declared, message] of cases) {
      const doc = breaksRootAlign()
      doc.root.deviation = declared
      const found = issuesOf(doc)
      expect(found.some((i) => message.test(i.message)), JSON.stringify(declared)).toBe(true)
      // …and the invalid declaration doesn't waive the break it was aimed at.
      expect(found.some((i) => i.kind === 'undeclared-deviation'), JSON.stringify(declared)).toBe(true)
    }
  })

  it('a law still breaks with a pattern declared beside it, on the node or the screen', () => {
    const doc = home()
    doc.root.props = { ...doc.root.props, padding: '10px', align: 'start' }
    doc.root.deviation = dev('layout.root-align')
    doc.screen.deviation = [dev('layout.root-align')]
    const found = issuesOf(doc)
    expect(rules(found)).toContain('tokens.only')
    expect(found.filter((i) => i.ruleId === 'tokens.only').every((i) => i.kind === undefined)).toBe(true)
  })

  it('declaring the very law that is broken waives nothing', () => {
    const doc = home()
    doc.root.props = { ...doc.root.props, padding: '10px' }
    doc.root.deviation = dev('tokens.only')
    const found = issuesOf(doc)
    expect(found.some((i) => /"tokens\.only" \(Tokens only\) is a law/.test(i.message))).toBe(true)
    expect(found.some((i) => i.ruleId === 'tokens.only' && /raw value/.test(i.message))).toBe(true)
  })

  it('an unknown layer model stays an error even with the overlay rule declared (9E: compose with "composed")', () => {
    const doc = home()
    doc.screen = { model: 'nope', level: 1, deviation: [dev('layers.overlay-model')] }
    const found = issuesOf(doc)
    expect(found.some((i) => i.ruleId === 'blueprint.dsl' && /"model": "composed" with its "shades"/.test(i.message))).toBe(true)
  })
})

describe('the screen’s own deviation list', () => {
  it('must be a list, and every entry a valid declaration', () => {
    const doc = home()
    doc.screen.deviation = dev('layout.root-align')
    expect(issuesOf(doc).some((i) => /must be a list/.test(i.message))).toBe(true)
  })

  it('an unused screen-level declaration is reported at its own index', () => {
    const doc = home()
    doc.screen.deviation = [dev('layout.root-align')]
    const [issue] = issuesOf(doc)
    expect(issue).toMatchObject({ kind: 'unused-deviation', path: ['screen', 'deviation', 0] })
  })
})

describe('per-screen policy', () => {
  const second = (mode: 'faithful' | 'exploratory', declare: boolean): Doc => {
    const other = breaksRootAlign()
    if (declare) other.root.deviation = dev('layout.root-align')
    return { version: 1, id: 'a', mode: 'faithful', screen: home().screen, root: home().root, screens: [{ id: 'b', mode, screen: other.screen, root: other.root }] }
  }

  it('holds each screen to its own mode: the same declaration is fine on one, an error on the other', () => {
    expect(validateBlueprintAgainstManifest(second('exploratory', true), M)).toEqual({ ok: true })
    const found = issuesOf(second('faithful', true), 'faithful')
    expect(found.some((i) => /unknown node key "deviation"/.test(i.message))).toBe(true)
    expect(found.every((i) => i.path[0] === 'screens' && i.path[1] === 0)).toBe(true)
  })

  it('reports the screen’s path for an undeclared break on the second screen', () => {
    const [issue] = issuesOf(second('exploratory', false), 'faithful')
    expect(issue).toMatchObject({ ruleId: 'layout.root-align', kind: 'undeclared-deviation', path: ['screens', 0, 'root', 'props', 'align'] })
    expect(issue.message).toMatch(/^Screen "b": /)
  })

  it('rejects a mode that is neither', () => {
    const doc = home()
    doc.mode = 'wild'
    expect(issuesOf(doc).some((i) => /"mode" must be "faithful" or "exploratory"/.test(i.message))).toBe(true)
  })
})

describe('links leaving an Exploratory screen', () => {
  const deep = DTV_SCREEN_LAYERS.models.find((m) => m.level === 3)!.id
  const flow = (declared: boolean): Doc => {
    const doc = home()
    const menu = doc.root.children[0].children[0] // the rail: level 1 → level 3 skips a level
    const button = menu.children[0]
    button.goTo = 'deep'
    if (declared) button.deviation = dev('flow.next-level')
    return {
      ...doc,
      id: 'home',
      screens: [{ id: 'deep', screen: { model: deep, level: 3 }, root: { type: 'Stack', props: { justify: 'end' }, children: [{ type: 'CloseButton', props: { interactionState: 'focus' } }] } }],
    }
  }

  it('a skipped level is an error until the link declares flow.next-level', () => {
    expect(issuesOf(flow(false)).find((i) => i.ruleId === 'flow.next-level')).toMatchObject({ kind: 'undeclared-deviation' })
    expect(issuesOf(flow(true)).filter((i) => i.ruleId === 'flow.next-level' || i.kind === 'unused-deviation')).toEqual([])
  })
})

describe('the schema cache stays immutable across policies', () => {
  it('the faithful policy still rejects `deviation` after an exploratory compile and an exploratory validation', () => {
    const m = structuredClone(M)
    const doc = breaksRootAlign()
    doc.root.deviation = dev('layout.root-align')

    compileManifestSchemas(m, 'exploratory')
    expect(validateBlueprintAgainstManifest(doc, m, 'exploratory')).toEqual({ ok: true })

    const v = validateBlueprintAgainstManifest(doc, m, 'faithful')
    expect(v.ok).toBe(false)
    if (!v.ok) expect(v.issues.some((i) => /unknown node key "deviation"/.test(i.message))).toBe(true)
    expect(compileManifestSchemas(m, 'faithful')).not.toBe(compileManifestSchemas(m, 'exploratory'))
  })

  it('and the other way round: a faithful run first does not stop Exploratory from accepting', () => {
    const m = structuredClone(M)
    const doc = breaksRootAlign()
    doc.root.deviation = dev('layout.root-align')
    expect(validateBlueprintAgainstManifest(doc, m, 'faithful').ok).toBe(false)
    expect(validateBlueprintAgainstManifest(doc, m, 'exploratory')).toEqual({ ok: true })
  })
})

describe('declaration scope (from the first real Exploratory runs)', () => {
  it('a node-only rule declared on the screen is refused, and the break stays undeclared', () => {
    const doc = home()
    doc.root.children[0].children.push({ type: 'ContentCardHeader' })
    doc.screen.deviation = [dev('layout.slots')]
    const found = issuesOf(doc)
    expect(found.some((i) => /"layout\.slots" \(Slots, order and parents\) breaks at one node, so it is declared on that node/.test(i.message))).toBe(true)
    expect(found.some((i) => i.ruleId === 'layout.slots' && i.kind === 'undeclared-deviation')).toBe(true)
  })

  it('the same rule on the node is fine', () => {
    const doc = home()
    doc.root.children[0].deviation = dev('layout.slots')
    doc.root.children[0].children.push({ type: 'ContentCardHeader' })
    expect(issuesOf(doc)).toEqual([])
  })

  it('a screen-wide rule may still be declared on the screen', () => {
    const doc = breaksRootAlign()
    doc.screen.deviation = [dev('layout.root-align')]
    expect(issuesOf(doc)).toEqual([])
  })
})

// ── Scope: where a rule's violations are reported decides where it may be declared ──────────────

const model = (level: number) => DTV_SCREEN_LAYERS.models.find((m) => m.level === level)!.id
const lvl = (n: number) => ({ model: model(n), level: n })

interface ScopeCase {
  /** A document that breaks the rule, nothing else. */
  doc: () => Doc
  /** The node a node-scoped declaration belongs on. */
  node: (doc: Doc) => Doc
  /** The screen object a screen-level declaration belongs in (where the break is reported). */
  screen: (doc: Doc) => Doc
}
const SCOPE_CASES: Record<string, ScopeCase> = {
  'layout.slots': {
    doc: () => { const d = home(); d.root.children[0].children.push({ type: 'ContentCardHeader' }); return d },
    node: (d) => d.root.children[0],
    screen: (d) => d.screen,
  },
  'flow.next-level': {
    doc: () => {
      const d = home()
      d.root.children[0].children[0].children[0].goTo = 'other'
      return { ...d, id: 'home', screens: [{ id: 'other', screen: lvl(3), root: { type: 'Stack', children: [] } }] }
    },
    node: (d) => d.root.children[0].children[0].children[0],
    screen: (d) => d.screen,
  },
  'flow.link-roles': {
    doc: () => {
      const d = home()
      d.root.children[0].children[1].goTo = 'other' // the main menu carries no link
      return { ...d, id: 'home', screens: [{ id: 'other', screen: lvl(2), root: { type: 'Stack', children: [] } }] }
    },
    node: (d) => d.root.children[0].children[1],
    screen: (d) => d.screen,
  },
  'flow.rail-consistency': {
    // A level-2 page that shows fewer cards than the Home rail it is entered from: reported on that page's root.
    doc: () => ({ ...home(), id: 'home', screens: [{ id: 'rail', screen: lvl(2), root: { type: 'Stack', children: [] } }] }),
    node: (d) => d.screens[0].root,
    screen: (d) => d.screens[0].screen,
  },
  'level.module-limit': {
    doc: () => ({ version: 1, screen: lvl(3), root: { type: 'Stack', props: { direction: 'vertical', justify: 'end' }, children: [{ type: 'Stack' }, { type: 'Stack' }] } }),
    node: (d) => d.root,
    screen: (d) => d.screen,
  },
  'level.root-direction': {
    doc: () => { const d = home(); d.root.props = { ...d.root.props, direction: 'horizontal' }; return d },
    node: (d) => d.root,
    screen: (d) => d.screen,
  },
  'level.initial-focus': {
    doc: () => { const d = home(); d.root.children[0].children[0].children[0].props = { title: 'Um', interactionState: 'focus' }; return d },
    node: (d) => d.root,
    screen: (d) => d.screen,
  },
  'layout.root-align': { doc: breaksRootAlign, node: (d) => d.root, screen: (d) => d.screen },
  'layout.no-static-center': {
    doc: () => { const d = home(); d.root.props = { ...d.root.props, justify: 'center' }; return d },
    node: (d) => d.root,
    screen: (d) => d.screen,
  },
  'layout.anchor': {
    doc: () => { const d = home(); d.root.children.push({ type: 'Button', props: { label: 'A' }, anchor: true }, { type: 'Button', props: { label: 'B' }, anchor: true }); return d },
    node: (d) => d.root,
    screen: (d) => d.screen,
  },
  'registry.new-component': {
    doc: () => {
      const d = home()
      d.root.children[0].children.push({ type: 'Proposal', props: { description: 'Placar ao vivo', proposedApi: { homeScore: 'number' } } })
      return d
    },
    node: (d) => d.root.children[0].children[2],
    screen: (d) => d.screen,
  },
  'layers.overlay-model': {
    doc: () => { const d = home(); d.screen = { model: 'composed', level: 1, shades: ['scrim', 'bottom'] }; return d },
    node: (d) => d.root,
    screen: (d) => d.screen,
  },
}

describe('rule scope: the table agrees with where the validator reports each rule', () => {
  it('has an entry for every declarable pattern, and a fixture for every entry', () => {
    for (const rule of declarableRules(M)) expect(rule.id in RULE_SCOPE, `${rule.id} has no scope`).toBe(true)
    expect(Object.keys(SCOPE_CASES).sort()).toEqual(Object.keys(RULE_SCOPE).sort())
  })

  it.each(Object.keys(RULE_SCOPE))('%s is reported %s', (rule) => {
    const found = issuesOf(SCOPE_CASES[rule].doc()).filter((i) => i.ruleId === rule)
    expect(found.length, `${rule}: the fixture breaks nothing`).toBeGreaterThan(0)
    // Node-scoped: reported at a node below the root. Screen-scoped: at the root or the screen, never deeper.
    for (const issue of found) expect(issue.path.includes('children'), `${rule} @ ${issue.path.join('.')}`).toBe(ruleScope(rule) === 'node')
  })
})

describe.each(Object.keys(RULE_SCOPE))('declaring %s', (rule) => {
  const c = SCOPE_CASES[rule]
  const covered = (doc: Doc) => issuesOf(doc).filter((i) => i.ruleId === rule || i.kind === 'unused-deviation')

  if (rule === 'layers.overlay-model') {
    it('on the root does not cover it: the overlay is reported on the screen, and only the screen declares it', () => {
      const doc = c.doc()
      c.node(doc).deviation = dev(rule)
      expect(issuesOf(doc).some((i) => i.ruleId === rule && i.kind === 'undeclared-deviation')).toBe(true)
    })
  } else {
    it('on its node covers the break', () => {
      const doc = c.doc()
      c.node(doc).deviation = dev(rule)
      expect(covered(doc)).toEqual([])
    })
  }

  if (ruleScope(rule) === 'node') {
    it('on the screen is refused: an error naming the node, and the break stays undeclared', () => {
      const doc = c.doc()
      const screen = c.screen(doc)
      screen.deviation = [dev(rule)]
      const found = issuesOf(doc)
      expect(found.some((i) => i.ruleId === 'blueprint.dsl' && /breaks at one node, so it is declared on that node/.test(i.message))).toBe(true)
      expect(found.some((i) => i.ruleId === rule && i.kind === 'undeclared-deviation')).toBe(true)
    })
  } else {
    it('on the screen covers the break, with no scope error', () => {
      const doc = c.doc()
      c.screen(doc).deviation = [dev(rule)]
      expect(covered(doc)).toEqual([])
      expect(issuesOf(doc).some((i) => /breaks at one node/.test(i.message))).toBe(false)
    })
  }
})

