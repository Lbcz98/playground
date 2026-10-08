/**
 * TSX → Blueprint: the way back from a screen written (or exported) as code to the
 * document the validator reads.
 *
 * It exists so that a screen that never went through the blueprint — Claude Code
 * writing JSX straight against the kit — can still be held to the rules book: the
 * same laws, the same patterns, the same `@deviation` contract and the same
 * "declared for nothing" audit, with no second copy of any rule.
 *
 * It reads only what is plain in the source: `<Screen model level anchored>`, kit
 * elements, props that are literals (strings, numbers, booleans, `null`, arrays and
 * objects of those) and `@deviation <ruleId>: <why>` comments. Anything it cannot read
 * (a computed prop, a `.map`, a spread, text between tags) comes back as a warning
 * and is left out, never guessed. One document per component that returns a `<Screen>`.
 *
 * Where a deviation is written decides what it covers, as in the exporter:
 *   - `{/* @deviation … *​/}` right before an element → that node;
 *   - a comment on the component (JSDoc or line comments above it) → the screen.
 */
import ts from 'typescript'
import type { BlueprintDocument, BlueprintNode } from '../blueprint'
import type { RuleDeviation, ScreenSpec } from '../design-system/manifest'
import { DEVIATION, REUSE, type ParsedProposal } from './commentGrammar'

export interface ParsedScreen {
  /** The component that returns the `<Screen>`. */
  component: string
  doc: BlueprintDocument
  /** What the source says that the blueprint cannot carry — each one is a place a check is blind. */
  warnings: string[]
  /** The same findings, structured: what kind of construct was skipped and where. */
  notRead: NotRead[]
  /** JSX elements converted into blueprint nodes. */
  read: number
  /** Every `@reuse` read on a primitive. */
  reuses: { line: number; primitive: string; considered: string; why: string }[]
  /** The source line of each blueprint node, for messages about the validator's issues. */
  lines: WeakMap<object, number>
}

/**
 * Local components (name as used in the JSX) the screen imports from `components/`: a proposal
 * becomes a `Proposal` node; `null` (no valid proposal) leaves the element out, the caller reports it.
 */
export type LocalComponents = ReadonlyMap<string, ParsedProposal | null>

export type NotReadKind = 'computed-prop' | 'iteration' | 'spread' | 'text' | 'conditional' | 'other'
export interface NotRead {
  line: number
  kind: NotReadKind
  message: string
}

type JsxElementLike = ts.JsxElement | ts.JsxSelfClosingElement


/** The kit's own layout primitives are the Exploratório vocabulary, `primitive:*`, in a blueprint. */
const PRIMITIVE_TAGS = new Set(['Box', 'Text'])

const isElement = (n: ts.Node): n is JsxElementLike => ts.isJsxElement(n) || ts.isJsxSelfClosingElement(n)
const openingOf = (el: JsxElementLike): ts.JsxOpeningLikeElement => (ts.isJsxElement(el) ? el.openingElement : el)
const tagOf = (el: JsxElementLike): string => openingOf(el).tagName.getText()

function deviationsIn(text: string): RuleDeviation[] {
  return [...text.matchAll(DEVIATION)].map((m) => ({ ruleId: m[1], why: m[2].replace(/\s+/g, ' ').trim() }))
}

/** A literal expression's value, or `undefined` when it is anything else. `null` is a value. */
export function literal(node: ts.Expression): { value: unknown } | undefined {
  if (ts.isParenthesizedExpression(node)) return literal(node.expression)
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return { value: node.text }
  if (ts.isNumericLiteral(node)) return { value: Number(node.text) }
  if (node.kind === ts.SyntaxKind.TrueKeyword) return { value: true }
  if (node.kind === ts.SyntaxKind.FalseKeyword) return { value: false }
  if (node.kind === ts.SyntaxKind.NullKeyword) return { value: null }
  if (ts.isPrefixUnaryExpression(node) && node.operator === ts.SyntaxKind.MinusToken && ts.isNumericLiteral(node.operand)) {
    return { value: -Number(node.operand.text) }
  }
  if (ts.isArrayLiteralExpression(node)) {
    const items = node.elements.map((e) => literal(e))
    return items.every((i) => i !== undefined) ? { value: items.map((i) => i!.value) } : undefined
  }
  if (ts.isObjectLiteralExpression(node)) {
    const out: Record<string, unknown> = {}
    for (const prop of node.properties) {
      if (!ts.isPropertyAssignment(prop)) return undefined
      const key = ts.isIdentifier(prop.name) || ts.isStringLiteral(prop.name) ? prop.name.text : undefined
      const value = literal(prop.initializer)
      if (key === undefined || value === undefined) return undefined
      out[key] = value.value
    }
    return { value: out }
  }
  return undefined
}

export function parseTsx(source: string, fileName = 'screen.tsx', components: LocalComponents = new Map()): ParsedScreen[] {
  const sf = ts.createSourceFile(fileName, source, ts.ScriptTarget.ES2022, true, ts.ScriptKind.TSX)
  const results: ParsedScreen[] = []

  /** Every `<Screen>` in the file, with the function that returns it. */
  const found: { el: JsxElementLike; fn: ts.Node; name: string }[] = []
  const walk = (node: ts.Node): void => {
    if (isElement(node) && tagOf(node) === 'Screen') {
      let fn: ts.Node = sf
      for (let p: ts.Node | undefined = node.parent; p; p = p.parent) {
        if (ts.isFunctionDeclaration(p) || ts.isArrowFunction(p) || ts.isFunctionExpression(p)) {
          fn = p
          break
        }
      }
      found.push({ el: node, fn, name: nameOf(fn) })
    }
    node.forEachChild(walk)
  }
  const nameOf = (fn: ts.Node): string => {
    if (ts.isFunctionDeclaration(fn) && fn.name) return fn.name.text
    const decl = fn.parent
    return decl && ts.isVariableDeclaration(decl) && ts.isIdentifier(decl.name) ? decl.name.text : 'Screen'
  }
  walk(sf)

  for (const { el, fn, name } of found) {
    const warnings: string[] = []
    const notRead: NotRead[] = []
    let read = 0
    const reuses: ParsedScreen['reuses'] = []
    const lines = new WeakMap<object, number>()
    const warn = (node: ts.Node, message: string, kind: NotReadKind = 'other'): void => {
      const line = sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1
      warnings.push(`line ${line}: ${message}`)
      notRead.push({ line, kind, message })
    }
    /** A computed child: a `.map`/`.flatMap` anywhere in it is iteration, a ternary or `&&`/`||`/`??` is a conditional. */
    const kindOfChild = (e: ts.Expression): NotReadKind => {
      let iter = false
      let cond = false
      const look = (n: ts.Node): void => {
        if (ts.isCallExpression(n) && ts.isPropertyAccessExpression(n.expression) && /^(map|flatMap|forEach)$/.test(n.expression.name.text)) iter = true
        if (ts.isConditionalExpression(n)) cond = true
        if (ts.isBinaryExpression(n) && [ts.SyntaxKind.AmpersandAmpersandToken, ts.SyntaxKind.BarBarToken, ts.SyntaxKind.QuestionQuestionToken].includes(n.operatorToken.kind)) cond = true
        n.forEachChild(look)
      }
      look(e)
      return iter ? 'iteration' : cond ? 'conditional' : 'other'
    }

    // ── the node builder ──────────────────────────────────────────────────────
    const propsOf = (opening: ts.JsxOpeningLikeElement): Record<string, unknown> => {
      const props: Record<string, unknown> = {}
      for (const attr of opening.attributes.properties) {
        if (ts.isJsxSpreadAttribute(attr)) {
          warn(attr, `spread on <${opening.tagName.getText()}> is not read`, 'spread')
          continue
        }
        const key = attr.name.getText()
        if (key === 'key') continue
        const init = attr.initializer
        if (!init) props[key] = true
        else if (ts.isStringLiteral(init)) props[key] = init.text
        else if (ts.isJsxExpression(init) && init.expression) {
          const value = literal(init.expression)
          if (value) props[key] = value.value
          else warn(attr, `<${opening.tagName.getText()} ${key}={…}> is not a literal — left out`, 'computed-prop')
        }
      }
      return props
    }

    /** The nodes among a list of JSX children, each with the deviation written right before it. */
    const nodesOf = (children: readonly ts.Node[]): BlueprintNode[] => {
      const out: BlueprintNode[] = []
      let pending: RuleDeviation[] = []
      let pendingReuse: { considered: string; why: string } | undefined
      for (const child of children) {
        if (ts.isJsxText(child)) {
          if (child.text.trim()) warn(child, `text "${child.text.trim().slice(0, 30)}" between tags is not read`, 'text')
        } else if (ts.isJsxExpression(child)) {
          if (!child.expression) {
            const text = child.getText(sf)
            pending.push(...deviationsIn(text))
            const m = [...text.matchAll(REUSE)][0]
            if (m) pendingReuse = { considered: m[1].trim(), why: m[2].replace(/\s+/g, ' ').trim() }
          } else {
            warn(child, 'a computed child ({…}) is not read', kindOfChild(child.expression))
          }
        } else if (ts.isJsxFragment(child)) {
          out.push(...nodesOf(child.children))
        } else if (isElement(child)) {
          const tag = tagOf(child)
          if (components.has(tag) && components.get(tag) === null) {
            pending = []
            pendingReuse = undefined
            continue
          }
          const node = nodeOf(child)
          if (pendingReuse) {
            if (PRIMITIVE_TAGS.has(tag)) {
              node.reuse = pendingReuse
              reuses.push({ line: lines.get(node)!, primitive: tag, ...pendingReuse })
            } else warn(child, `@reuse before <${tag}>, which is not a primitive (Box, Text) — remove it`)
            pendingReuse = undefined
          }
          if (pending.length > 0) {
            node.deviation = pending[0]
            if (pending.length > 1) warn(child, `only one @deviation per node — kept ${pending[0].ruleId}`)
            pending = []
          }
          out.push(node)
        }
      }
      return out
    }

    function nodeOf(element: JsxElementLike): BlueprintNode {
      read++
      const tag = tagOf(element)
      const proposal = components.get(tag)
      const node: BlueprintNode = proposal
        ? { type: 'Proposal', props: { description: proposal.description, proposedApi: proposal.api }, deviation: { ruleId: 'registry.new-component', why: proposal.why } }
        : { type: PRIMITIVE_TAGS.has(tag) ? `primitive:${tag}` : tag }
      lines.set(node, sf.getLineAndCharacterOfPosition(element.getStart(sf)).line + 1)
      if (proposal) return node
      const props = propsOf(openingOf(element))
      // A primitive Text carries its words as `text`: plain words between the tags are read, not skipped.
      if (tag === 'Text' && ts.isJsxElement(element)) {
        const words = element.children.filter(ts.isJsxText).map((t) => t.text.trim()).filter(Boolean).join(' ')
        if (words && element.children.every((c) => ts.isJsxText(c))) {
          props.text = words
          return Object.assign(node, { props })
        }
      }
      if (Object.keys(props).length > 0) node.props = props
      if (ts.isJsxElement(element)) {
        const children = nodesOf(element.children)
        if (children.length > 0) node.children = children
      }
      return node
    }

    // ── the screen ────────────────────────────────────────────────────────────
    const opening = openingOf(el)
    const spec: ScreenSpec = { model: '', level: 0 }
    let anchored: BlueprintNode[] = []
    for (const attr of opening.attributes.properties) {
      if (!ts.isJsxAttribute(attr)) continue
      const key = attr.name.getText()
      const init = attr.initializer
      if (key === 'model' || key === 'level') {
        const value = init && ts.isStringLiteral(init) ? init.text : init && ts.isJsxExpression(init) && init.expression ? literal(init.expression)?.value : undefined
        if (value === undefined) warn(attr, `<Screen ${key}> is not a literal`, 'computed-prop')
        else (spec as unknown as Record<string, unknown>)[key] = value
      } else if (key === 'anchored' && init && ts.isJsxExpression(init) && init.expression) {
        const expr = init.expression
        if (isElement(expr)) anchored = nodesOf([expr])
        else if (ts.isJsxFragment(expr)) anchored = nodesOf(expr.children)
        else warn(attr, '<Screen anchored> is not an element — left out')
      }
    }

    const content = ts.isJsxElement(el) ? nodesOf(el.children) : []
    let root: BlueprintNode
    if (content.length === 1) root = content[0]
    else {
      if (content.length > 1) warn(el, `<Screen> holds ${content.length} elements — wrapped in a Stack to read them as one root`)
      root = { type: 'Stack', children: content }
    }
    for (const node of anchored) (root.children ??= []).push({ ...node, anchor: true })

    // Declarations written on the component: the screen's own list.
    const stmt = fn.parent && ts.isVariableDeclaration(fn.parent) ? fn.parent.parent.parent : fn
    const leading = ts.getLeadingCommentRanges(source, stmt.getFullStart()) ?? []
    const screenDeclared = leading.flatMap((r) => deviationsIn(source.slice(r.pos, r.end)))
    // …and any comment inside the component that is not a JSX comment (a `//` above a prop, a block in the body).
    const body = fn.getText(sf)
    const loose = [...body.matchAll(/(?<!\{)\/\/\s*@deviation[^\n]*/g)].flatMap((m) => deviationsIn(m[0]))
    const deviation = dedupe([...screenDeclared, ...loose])
    if (deviation.length > 0) spec.deviation = deviation

    const doc: BlueprintDocument = {
      version: 1,
      name: name,
      screen: spec,
      mode: 'exploratory',
      root,
    }
    results.push({ component: name, doc, warnings, notRead, read, reuses, lines })
  }
  return results
}

function dedupe(list: RuleDeviation[]): RuleDeviation[] {
  const seen = new Set<string>()
  return list.filter((d) => (seen.has(d.ruleId) ? false : (seen.add(d.ruleId), true)))
}
