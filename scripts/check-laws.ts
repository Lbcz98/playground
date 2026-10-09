/**
 * `npm run check:laws -- <file.tsx> [...]` — the laws, checked on a screen written as TSX.
 *
 * The code-side counterpart of the blueprint validator, for screens that did not come
 * through it (an Exploratório screen written by Claude Code). It reports the laws of the
 * rules book it can read from source, and says which law each message is about:
 *
 *   component.api / tokens.semantic-tier   tsc against the real props of the kit
 *   tokens.only                            no hex, px, rem, rgb, `style`, `className`
 *   component.api                          no host elements (<div>), imports only the kit
 *   layers.stack                           each screen is one <Screen> naming a layer model
 *   focus.single                           exactly one focused component per screen
 *   everything else in the book            the screen read back as a blueprint (src/shared/export/fromTsx.ts)
 *                                          and held to the validator in Exploratory, with the DTV manifest:
 *                                          patterns broken undeclared, deviations declared for nothing, flow
 *                                          and layout rules
 *
 * Then the screen is rendered in a headless Chromium (scripts/render-audit.ts) and the pure
 * `auditRender` runs on it: content cut off or past the frame, text on text, and a container that
 * covers the frame with a background (`layers.stack`). `--no-render` skips it.
 *
 * A pattern broken without a `@deviation <ruleId>: <why>` is reported, and so is a deviation
 * declared for a rule nothing breaks. What the JSX has that a blueprint cannot carry (a computed
 * prop, a `.map`, text) is listed as "not read": there the check is blind.
 * Text on text and squeezed text are advisories (`render.legibility`): printed, exit 0. `--require-render`
 * makes a render audit that cannot run (no Playwright or Chromium, harness error) exit 1.
 *
 * A folder with a `flow.ts` (or its `flow.ts`, or any screen inside it) is also checked as a flow: every
 * state file as above, then the transitions between them (a state that does not exist, a key bound twice,
 * a state nothing leads to, a jump past the next level, the rail rule across states).
 * Exit code 1 when a law is broken.
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'
import { validateBlueprintAgainstManifest } from '../src/shared/design-system/manifest-zod'
import type { BlueprintDocument, BlueprintNode } from '../src/shared/blueprint'
import { budgetProblems } from '../src/shared/design-system/primitives'
import { ruleScope } from '../src/shared/design-system/deviations'
import { ruleById } from '../src/shared/design-system/rules'
import { DTV_SCREEN_LAYERS, screenModel } from '../src/shared/design-system/screen-layers'
import { parseProposal, type ParsedProposal } from '../src/shared/export/commentGrammar'
import { MAX_SCREENS } from '../src/shared/blueprint'
import { parseTsx, type NotRead, type ParsedScreen } from '../src/shared/export/fromTsx'
import { flowFileIssues, parseFlowFile, type FlowStateScreen } from '../src/shared/export/flowFile'
import { loadDtvManifest } from './dtv-manifest'
import { renderAuditFiles, RenderAuditUnavailable, type RenderResult } from './render-audit'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
/** Types `next/link` for the root tsc, which has no `next` (the render harness and web/ resolve their own). */
const NEXT_SHIM = resolve(ROOT, 'scripts/render-harness/next-shim.d.ts')

/** The shape of `--json`: `{ schemaVersion, reports: LawReport[], flows: FlowReport[] }`. Bump on a breaking change (scripts/pr-report.ts reads it). */
export const SCHEMA_VERSION = 1

export interface LawProblem {
  /** The rule id the message is about (a law, or a pattern broken without being declared). */
  law: string
  /** 'static' = read off the source here; 'validator' = the blueprint validator, run on the screen read back from the JSX. */
  source?: 'static' | 'validator' | 'render'
  message: string
  line?: number
  /** The file the message is about, when it is not the screen itself (a local component). */
  file?: string
}
export interface LawReport {
  file: string
  /** Blocking: any of these makes the run exit 1. */
  problems: LawProblem[]
  /** Advisory (render.legibility): printed, never fails the run. */
  advisories: LawProblem[]
  deviations: { ruleId: string; why: string }[]
  /** What the JSX has that the blueprint cannot carry: a computed prop, a `.map`, text — where the validator is blind. */
  warnings: string[]
  /** `warnings`, structured (line, kind, message). */
  notRead: NotRead[]
  /** `read`: JSX elements turned into blueprint nodes. `notRead`: constructs skipped. */
  coverage: { read: number; notRead: number }
  /** Every `@reuse` on a primitive. */
  reuses: { line: number; primitive: string; considered: string; why: string }[]
  /** Local components the screen uses, with the proposal each declares. */
  proposals: { file: string; name: string; why: string; api: Record<string, string>; description: string; figma?: string }[]
  /** The links leaving this screen (`<Link href>` around a kit element) that point at a screen of the folder. */
  flow: { edges: { from: string; to: string; line: number }[] }
}

/** Components that hold the focus, and whether leaving `interactionState` out means focused. */
const FOCUS_HOLDERS: Record<string, { defaultFocused: boolean }> = {
  InteractivityButton: { defaultFocused: true },
  CloseButton: { defaultFocused: true },
  RoundedButton: { defaultFocused: true },
  WideButton: { defaultFocused: true },
  AlertBug: { defaultFocused: false },
  Notification: { defaultFocused: false },
  ContentCard: { defaultFocused: false },
}
/** Kit components whose `"focus"` value is a look, not the TV focus (a label drawn inside a focused button). */
export const FOCUS_LOOK_ONLY = ['LabelVideo']
export const FOCUS_HOLDER_IDS = [...Object.keys(FOCUS_HOLDERS), 'MainMenu']
/** The main menu holds one focus (`focusedItem`, default `program`) unless `focusedItem={null}`. */
const MENU = 'MainMenu'

const RAW: [string, RegExp][] = [
  ['raw hex color', /#[0-9a-fA-F]{3,8}\b/],
  ['raw px length', /\b\d+(\.\d+)?px\b/],
  ['raw rem/em length', /\b\d+(\.\d+)?r?em\b/],
  ['raw rgb/hsl color', /\b(rgb|rgba|hsl|hsla)\(/],
  ['inline style', /\bstyle\s*=/],
  ['class name', /\bclassName\s*=/],
]

const LINE = (sf: ts.SourceFile, node: ts.Node): number => sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1

function literalProp(el: ts.JsxOpeningLikeElement, name: string): string | undefined | null {
  // string → its value; undefined → prop absent; null → present but not a plain literal
  for (const attr of el.attributes.properties) {
    if (!ts.isJsxAttribute(attr) || attr.name.getText() !== name) continue
    const init = attr.initializer
    if (!init) return 'true'
    if (ts.isStringLiteral(init)) return init.text
    if (ts.isJsxExpression(init) && init.expression && (ts.isStringLiteral(init.expression) || ts.isNumericLiteral(init.expression)))
      return init.expression.text
    return null
  }
  return undefined
}

/** `web/protos/<name>/` when the file is inside one; otherwise the file's own directory (corpus, tests). */
export function designerFolder(path: string): string {
  const m = path.split(sep).join('/').match(/^(.*\/web\/protos\/[^/]+)\//)
  return m ? m[1].split('/').join(sep) : dirname(path)
}

const LOCAL_EXT = ['', '.ts', '.tsx', '.json', '/index.ts', '/index.tsx']
const NOT_CODE = /\.(svg|png|jpe?g|gif|webp|avif|ico|css|scss)$/i
const hasJsx = (sf: ts.SourceFile): boolean => {
  let found = false
  const look = (n: ts.Node): void => {
    if (ts.isJsxElement(n) || ts.isJsxSelfClosingElement(n) || ts.isJsxFragment(n)) found = true
    else if (!found) n.forEachChild(look)
  }
  look(sf)
  return found
}

/** The source line of the deepest node an issue path passes through. */
function lineAt(parsed: ParsedScreen, path: readonly (string | number)[]): number | undefined {
  let cur: unknown = parsed.doc
  let line: number | undefined
  for (const k of path) {
    cur = (cur as Record<string, unknown> | undefined)?.[k]
    const l = typeof cur === 'object' && cur ? parsed.lines.get(cur) : undefined
    if (l) line = l
  }
  return line
}

const resolveLocal = (from: string, spec: string): string | undefined => {
  const target = resolve(dirname(from), spec)
  return LOCAL_EXT.map((e) => target + e).find((f) => existsSync(f) && statSync(f).isFile())
}

/** The components a file exports (function declarations and arrow/function consts), with the JSDoc above each. */
function componentExports(sf: ts.SourceFile): Map<string, { line: number; comment: string }> {
  const out = new Map<string, { line: number; comment: string }>()
  const text = sf.getFullText()
  const isExport = (n: ts.Node): boolean => (ts.getCombinedModifierFlags(n as ts.Declaration) & ts.ModifierFlags.Export) !== 0
  for (const stmt of sf.statements) {
    const names: string[] = []
    if (ts.isFunctionDeclaration(stmt) && isExport(stmt)) {
      if (stmt.name) names.push(stmt.name.text)
      if (ts.getCombinedModifierFlags(stmt) & ts.ModifierFlags.Default) names.push('default')
    } else if (ts.isVariableStatement(stmt) && isExport(stmt)) {
      for (const d of stmt.declarationList.declarations)
        if (ts.isIdentifier(d.name) && /^[A-Z]/.test(d.name.text) && d.initializer && (ts.isArrowFunction(d.initializer) || ts.isFunctionExpression(d.initializer))) names.push(d.name.text)
    }
    const comments = (ts.getLeadingCommentRanges(text, stmt.getFullStart()) ?? []).map((r) => text.slice(r.pos, r.end)).filter((c) => c.startsWith('/**'))
    for (const name of names) out.set(name, { line: LINE(sf, stmt), comment: comments[comments.length - 1] ?? '' })
  }
  return out
}

export function checkLaws(file: string, options: { skipValidator?: boolean } = {}): LawReport {
  const path = resolve(file)
  const text = readFileSync(path, 'utf8')
  const problems: LawProblem[] = []
  const add = (law: string, message: string, line?: number, file?: string): void => void problems.push({ law, message, line, ...(file ? { file } : {}) })

  const sf = ts.createSourceFile(path, text, ts.ScriptTarget.ES2022, true, ts.ScriptKind.TSX)
  const folder = designerFolder(path)
  const rel = (f: string): string => f.replace(ROOT, '')
  const FORMS = `allowed: react, @/primitives, @/ui-kit/*, next/link (only to link to a screen of this folder), or a relative import inside this designer's folder (${rel(folder)}/) — data .ts/.json and helpers; no images or .svg, no other designer's folder, no other @/ path, no npm package`

  // ── imports: the kit, React, and this designer's own folder ─────────────────
  // The closure of local files is read too: data modules are exempt from the raw-value scan, files with JSX are not.
  const locals = new Map<string, { text: string; sf: ts.SourceFile }>()
  const importsOf = (file: string, fsf: ts.SourceFile): void => {
    const prefix = file === path ? '' : `${rel(file)}: `
    const specs: { m: string; node: ts.Node }[] = []
    fsf.forEachChild((node) => {
      if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier))
        specs.push({ m: node.moduleSpecifier.text, node })
    })
    for (const { m, node } of specs) {
      const bad = (why: string): void => add('component.api', `${prefix}imports "${m}" (${why}) — ${FORMS}`, LINE(fsf, node))
      if (m === 'react' || m === 'next/link' || m === '@/primitives' || m.startsWith('@/ui-kit/')) continue
      if (!m.startsWith('.')) {
        bad(isAbsolute(m) ? 'absolute path' : m.startsWith('@/') ? 'not part of the kit' : 'npm package')
        continue
      }
      const target = resolve(dirname(file), m)
      const inside = relative(folder, target)
      if (inside.startsWith('..') || isAbsolute(inside)) bad('outside this designer folder')
      else if (NOT_CODE.test(m)) bad('image or style file')
      else {
        const hit = resolveLocal(file, m)
        if (hit && !locals.has(hit) && hit !== path && /\.(tsx?|json)$/.test(hit)) {
          const t = readFileSync(hit, 'utf8')
          const lsf = ts.createSourceFile(hit, t, ts.ScriptTarget.ES2022, true, hit.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS)
          locals.set(hit, { text: t, sf: lsf })
          if (!hit.endsWith('.json')) importsOf(hit, lsf)
        }
      }
    }
  }
  importsOf(path, sf)

  // ── tsc against the real kit (the screen and its local files) ───────────────
  const configPath = ts.findConfigFile(ROOT, ts.sys.fileExists, 'tsconfig.json')!
  const config = ts.parseJsonConfigFileContent(ts.readConfigFile(configPath, ts.sys.readFile).config, ts.sys, ROOT)
  const program = ts.createProgram([path, NEXT_SHIM], { ...config.options, noEmit: true })
  for (const d of ts.getPreEmitDiagnostics(program)) {
    if (!d.file) continue
    const f = resolve(d.file.fileName)
    if (f !== path && !locals.has(f)) continue
    const line = d.start !== undefined ? d.file.getLineAndCharacterOfPosition(d.start).line + 1 : undefined
    add('component.api', `${f === path ? '' : `${rel(f)}: `}TS${d.code}: ${ts.flattenDiagnosticMessageText(d.messageText, ' ')}`, line)
  }

  // ── tokens.only: the screen, and local files that have JSX (a file with none is data) ───────────
  const scan = (src: string, prefix: string, file?: string): void =>
    src.split('\n').forEach((raw, i) => {
      if (/^\s*(\/\*\*|\*)/.test(raw)) return // a doc-comment line (the @proposal block) is words, not a value
      const code = raw.replace(/\/\/.*$/, '').replace(/\/\*.*?\*\//g, '')
      for (const [label, re] of RAW) if (re.test(code)) add('tokens.only', `${prefix}${label} — a design value is a token name`, i + 1, file)
    })
  scan(text, '')
  for (const [f, l] of locals) if (f.endsWith('.tsx') && hasJsx(l.sf)) scan(l.text, `${rel(f)}: `, f)

  // ── per screen: layers.stack and focus.single ───────────────────────────────
  /** The local component a tag of `file` names (imported from this designer's folder), as the function that renders it. */
  const localComponent = (file: string, fsf: ts.SourceFile, tag: string): { file: string; sf: ts.SourceFile; node: ts.Node } | undefined => {
    for (const stmt of fsf.statements) {
      if (!ts.isImportDeclaration(stmt) || !ts.isStringLiteral(stmt.moduleSpecifier) || !stmt.moduleSpecifier.text.startsWith('.')) continue
      const clause = stmt.importClause
      const named = clause?.namedBindings && ts.isNamedImports(clause.namedBindings) ? clause.namedBindings.elements.find((e) => e.name.text === tag) : undefined
      const name = clause?.name?.text === tag ? 'default' : named ? (named.propertyName ?? named.name).text : undefined
      if (!name) continue
      const hit = resolveLocal(file, stmt.moduleSpecifier.text)
      const lsf = hit && hit.endsWith('.tsx') ? locals.get(hit)?.sf : undefined
      if (!hit || !lsf) return undefined
      const isDefault = (s: ts.FunctionDeclaration): boolean => (ts.getCombinedModifierFlags(s) & ts.ModifierFlags.Default) !== 0
      const node = lsf.statements.find(
        (s) =>
          (ts.isFunctionDeclaration(s) && (name === 'default' ? isDefault(s) : s.name?.text === name)) ||
          (ts.isVariableStatement(s) && s.declarationList.declarations.some((d) => ts.isIdentifier(d.name) && d.name.text === name)),
      )
      return { file: hit, sf: lsf, node: node ?? lsf }
    }
    return undefined
  }
  const visit = (node: ts.Node, visitor: (n: ts.Node) => void): void => {
    visitor(node)
    node.forEachChild((c) => visit(c, visitor))
  }
  const screens: { el: ts.JsxOpeningLikeElement; scope: ts.Node }[] = []
  for (const [f, l] of locals) {
    if (!f.endsWith('.tsx')) continue
    visit(l.sf, (n) => {
      if ((ts.isJsxOpeningElement(n) || ts.isJsxSelfClosingElement(n)) && /^[a-z]/.test(n.tagName.getText()))
        add('component.api', `${rel(f)}: <${n.tagName.getText()}> is a host element — use a kit component (Stack, Box, Text, …)`, LINE(l.sf, n), f)
    })
  }
  visit(sf, (n) => {
    if ((ts.isJsxOpeningElement(n) || ts.isJsxSelfClosingElement(n)) && n.tagName.getText() === 'Screen') {
      // the component that returns it: the nearest enclosing function
      let scope: ts.Node = sf
      for (let p: ts.Node | undefined = n.parent; p; p = p.parent) {
        if (ts.isFunctionDeclaration(p) || ts.isArrowFunction(p) || ts.isFunctionExpression(p)) {
          scope = p
          break
        }
      }
      screens.push({ el: n, scope })
    }
    if ((ts.isJsxOpeningElement(n) || ts.isJsxSelfClosingElement(n)) && /^[a-z]/.test(n.tagName.getText())) {
      add('component.api', `<${n.tagName.getText()}> is a host element — use a kit component (Stack, Box, Text, …)`, LINE(sf, n))
    }
  })

  if (screens.length === 0) add('layers.stack', 'no <Screen> — every screen is the three layers, video, overlay, content (use <Screen model level>)')

  /** Kit components drawn focused inside a local component: the validator reads that component as a Proposal and cannot see them. */
  const focusedInLocal: string[] = []
  for (const { el, scope } of screens) {
    const model = literalProp(el, 'model')
    const line = LINE(sf, el)
    if (model === undefined || model === null) {
      add('layers.stack', '<Screen> needs `model` as a plain string naming a layer model', line)
    } else if (!screenModel(DTV_SCREEN_LAYERS, model)) {
      add('layers.stack', `"${model}" is not a layer model (${DTV_SCREEN_LAYERS.models.map((m) => m.id).join(', ')})`, line)
    }

    let focused = 0
    const holders: string[] = []
    // A local component is part of the screen: the focus it draws inside counts too.
    const count = (root: ts.Node, fsf: ts.SourceFile, file: string, via: string, seen: Set<ts.Node>): void => visit(root, (n) => {
      if (!ts.isJsxOpeningElement(n) && !ts.isJsxSelfClosingElement(n)) return
      const tag = n.tagName.getText()
      const at = file === path ? `line ${LINE(fsf, n)}` : `${rel(file)} line ${LINE(fsf, n)}, inside ${via}`
      const local = localComponent(file, fsf, tag)
      if (local && !seen.has(local.node)) {
        seen.add(local.node)
        count(local.node, local.sf, local.file, file === path ? `<${tag}>` : via, seen)
        return
      }
      if (tag === MENU) {
        // `focusedItem={null}` hands the focus to something else (a rail card): the menu then holds none.
        const none = n.attributes.properties.some(
          (a) => ts.isJsxAttribute(a) && a.name.getText() === 'focusedItem' && a.initializer && /^\{\s*null\s*\}$/.test(a.initializer.getText()),
        )
        if (none) return
        focused++
        holders.push(`${MENU} (${at})`)
        return
      }
      const holder = FOCUS_HOLDERS[tag]
      if (!holder) return
      const state = literalProp(n, 'interactionState')
      const isFocused = state === 'focus' || (state === undefined && holder.defaultFocused)
      if (isFocused) {
        focused++
        holders.push(`${tag} (${at})`)
        if (file !== path) focusedInLocal.push(tag)
      }
    })
    count(scope, sf, path, '', new Set())
    // Level 0 is the clean broadcast: the viewer is on nothing, so no focus is allowed (one at most).
    const level0 = typeof model === 'string' && screenModel(DTV_SCREEN_LAYERS, model)?.level === 0
    if (level0 ? focused > 1 : focused !== 1) {
      add(
        'focus.single',
        focused === 0
          ? 'no focused element — a TV screen has exactly one'
          : `${focused} focused elements: ${holders.join(', ')} — exactly one. Note: InteractivityButton, CloseButton, RoundedButton and WideButton are focused unless interactionState says otherwise`,
        line,
      )
    }
  }

  // ── the rules book itself: the screen read back as a blueprint, held to the validator in Exploratory ──────
  const warnings: string[] = []
  const notRead: NotRead[] = []
  const coverage = { read: 0, notRead: 0 }
  const reuses: LawReport['reuses'] = []
  const proposals: LawReport['proposals'] = []

  // Local components (components/ of this folder) a file imports: each needs its @proposal block.
  // `report`: the entry's own problems and proposals; other screens of the flow only need the map.
  const componentsFor = (file: string, fsf: ts.SourceFile, report: boolean): Map<string, ParsedProposal | null> => {
    const components = new Map<string, ParsedProposal | null>()
    fsf.forEachChild((node) => {
      if (!ts.isImportDeclaration(node) || !ts.isStringLiteral(node.moduleSpecifier) || !node.moduleSpecifier.text.startsWith('.')) return
      const hit = resolveLocal(file, node.moduleSpecifier.text)
      if (!hit || !hit.endsWith('.tsx') || relative(folder, hit).split(sep)[0] !== 'components') return
      const exported = componentExports(locals.get(hit)?.sf ?? ts.createSourceFile(hit, report ? '' : readFileSync(hit, 'utf8'), ts.ScriptTarget.ES2022, true, ts.ScriptKind.TSX))
      const clause = node.importClause
      const wanted: { local: string; name: string }[] = []
      if (clause?.name) wanted.push({ local: clause.name.text, name: 'default' })
      if (clause?.namedBindings && ts.isNamedImports(clause.namedBindings))
        for (const e of clause.namedBindings.elements) wanted.push({ local: e.name.text, name: (e.propertyName ?? e.name).text })
      for (const { local, name } of wanted) {
        const ex = exported.get(name)
        if (!ex) continue
        const parsed = parseProposal(ex.comment)
        const where = `${rel(hit)}:${ex.line}`
        const shape = '/** @proposal / why: <why the kit lacks it> / description: <what it is> / figma: <link, optional> / proposedApi: / <prop>: "<type>" */ (one field per line)'
        if (!parsed) {
          if (report) add('registry.new-component', `${where} <${local}> is a component the kit lacks and has no @proposal — add a JSDoc block above its export: ${shape}`, LINE(fsf, node), hit)
          components.set(local, null)
        } else if (!parsed.proposal) {
          if (report) add('registry.new-component', `${where} <${local}> has an incomplete @proposal — add: ${parsed.missing.join('; ')}`, ex.line, hit)
          components.set(local, null)
        } else {
          components.set(local, parsed.proposal)
          if (report) proposals.push({ file: rel(hit), name: local, why: parsed.proposal.why, description: parsed.proposal.description, ...(parsed.proposal.figma ? { figma: parsed.proposal.figma } : {}), api: parsed.proposal.api })
        }
      }
    })
    return components
  }
  const components = componentsFor(path, sf, true)

  // ── flow: the screens this one links to, with `<Link href="/<designer>/<screen>">` ─────────────────
  const designer = basename(folder)
  const idOf = (file: string): string => `${designer}/${basename(file, '.tsx')}`
  const folderScreens = (): string[] => readdirSync(folder).filter((f) => f.endsWith('.tsx')).map((f) => basename(f, '.tsx')).sort()
  const read = new Map<string, ParsedScreen | undefined>()
  const screenOf = (file: string): ParsedScreen | undefined => {
    if (!read.has(file)) {
      const t = file === path ? text : readFileSync(file, 'utf8')
      const fsf = file === path ? sf : ts.createSourceFile(file, t, ts.ScriptTarget.ES2022, true, ts.ScriptKind.TSX)
      read.set(file, parseTsx(t, file, file === path ? components : componentsFor(file, fsf, false))[0])
    }
    return read.get(file)
  }
  /** The file a link of `file` opens, or why it cannot: a problem for the link's own screen only. */
  const targetOf = (href: string, line: number, own: boolean): string | undefined => {
    const m = /^\/([^/]+)\/([^/]+)$/.exec(href)
    const names = folderScreens()
    const fail = (message: string): undefined => (own ? void add('blueprint.dsl', `line ${line}: <Link href="${href}"> ${message}`, line) : undefined)
    if (!m) return fail(`must be "/${designer}/<screen>" — a screen of this folder: ${names.join(', ')}`)
    if (m[1] !== designer) return fail(`points into another designer's folder ("${m[1]}") — links stay inside "${designer}". Screens here: ${names.join(', ')}`)
    const file = join(folder, `${m[2]}.tsx`)
    if (!existsSync(file)) return fail(`points to a screen that does not exist ("${m[2]}") — screens in ${designer}/: ${names.join(', ')}. Fix the href or create ${designer}/${m[2]}.tsx`)
    return file
  }
  const edges: LawReport['flow']['edges'] = []
  /** The screens connected to this one through links, either way (the whole folder is read, read-only). */
  const componentOf = (): string[] => {
    const adj = new Map<string, Set<string>>()
    const link = (a: string, b: string): void => void (adj.get(a) ?? adj.set(a, new Set()).get(a)!).add(b)
    for (const name of folderScreens()) {
      const file = join(folder, `${name}.tsx`)
      for (const l of screenOf(file)?.links ?? []) {
        const to = targetOf(l.href, l.line, false)
        if (to) (link(file, to), link(to, file))
      }
    }
    const seen = new Set([path])
    for (const f of seen) for (const n of adj.get(f) ?? []) seen.add(n)
    return [...seen].filter((f) => screenOf(f))
  }

  if (!options.skipValidator) {
    const manifest = loadDtvManifest()
    const all = parseTsx(text, path, components)
    for (const parsed of all) {
      // Links: read on this screen alone first; the flow rules need the connected screens (below).
      for (const l of parsed.links) delete l.node.goTo
      let doc: BlueprintDocument = parsed.doc
      let multi = false
      if (all.length === 1 && parsed.links.length > 0) {
        const resolved = parsed.links.flatMap((l) => {
          const to = targetOf(l.href, l.line, true)
          if (to) edges.push({ from: idOf(path), to: idOf(to), line: l.line })
          return to ? [{ l, to }] : []
        })
        const files = resolved.length > 0 ? componentOf() : [path]
        if (files.length > MAX_SCREENS) {
          const message = `the flow rules (flow.next-level, flow.link-roles, flow.rail-consistency) were not checked: the screens linked to this one number ${files.length}, more than the ${MAX_SCREENS} a flow holds`
          notRead.push({ line: parsed.links[0].line, kind: 'other', message })
          warnings.push(`${parsed.component}: line ${parsed.links[0].line}: ${message}`)
        } else if (files.length > 1) {
          multi = true
          for (const { l, to } of resolved) l.node.goTo = idOf(to)
          doc = {
            ...parsed.doc,
            id: idOf(path),
            screens: files.filter((f) => f !== path).map((f) => {
              const p = screenOf(f)!
              return { id: idOf(f), name: p.component, screen: p.doc.screen, mode: 'exploratory' as const, root: p.doc.root }
            }),
          }
        }
      }
      reuses.push(...parsed.reuses)
      warnings.push(...parsed.warnings.map((w) => `${parsed.component}: ${w}`))
      notRead.push(...parsed.notRead)
      coverage.read += parsed.read
      // The budget is not part of the validator (the interpreter runs it); the same function, on the screen read back.
      type Budget = { type: string; children: Budget[] }
      const toBudget = (n: BlueprintNode): Budget => ({ type: n.type, children: (n.children ?? []).map(toBudget) })
      for (const over of budgetProblems(toBudget(parsed.doc.root))) {
        const line = lineAt(parsed, over.path)
        problems.push({
          law: over.ruleId,
          source: 'validator',
          message: `${line ? `line ${line}: ` : ''}${over.message} In TSX: move the structure into a component in components/ with a @proposal block, or use kit components.`,
          line,
        })
      }
      const result = validateBlueprintAgainstManifest(doc, manifest, 'exploratory')
      if (result.ok) continue
      for (const issue of result.issues) {
        // Another screen's own findings appear when that file is checked (flow issues are reported on the screen the link leaves).
        if (multi && issue.path[0] === 'screens') continue
        // The static pass already says these in terms of the source.
        if (issue.ruleId === 'focus.single' || issue.ruleId === 'layers.stack') continue
        // "Nothing is focused" is the validator not seeing into a local component: the focus is there, on a component the level takes it on.
        if (issue.ruleId === 'level.initial-focus' && /nothing is focused/.test(issue.message)) {
          const start = DTV_SCREEN_LAYERS.levels.find((l) => l.level === screenModel(DTV_SCREEN_LAYERS, parsed.doc.screen?.model ?? '')?.level)?.initialFocus
          if (focusedInLocal.length > 0 && focusedInLocal.every((t) => start?.on.includes(t) || start?.accepts?.includes(t))) continue
        }
        if (issue.ruleId === 'primitives.reuse') {
          const line = lineAt(parsed, issue.path)
          const fix = /has no "reuse"|"reuse" must be|is not an object/.test(issue.message)
            ? ' In TSX: write {/* @reuse <KitComponent>: <why no kit component would do> */} right before the primitive.'
            : ' In TSX: fix the component name in {/* @reuse <KitComponent>: <why> */} right before the primitive.'
          problems.push({ law: issue.ruleId, source: 'validator', message: `${line ? `line ${line}: ` : ''}${issue.message}${fix}`, line })
          continue
        }
        const flexibility = ruleById(manifest, issue.ruleId)?.flexibility ?? 'law'
        const where =
          issue.kind === 'unused-deviation' && ruleScope(issue.ruleId) === 'screen' && !/on the screen/.test(issue.message)
            ? " — this rule is about the whole screen: declare it once, in the component's JSDoc (or on the root element), not on the node that shows it"
            : ''
        const onLink = /^flow\.(next-level|link-roles)$/.test(issue.ruleId) && issue.kind !== 'unused-deviation' ? ' In TSX: write {/* @deviation <ruleId>: <why> */} right before the <Link> (not in the JSDoc).' : ''
        const tail = onLink + (issue.kind === 'unused-deviation' ? ` (declared for nothing${where})` : flexibility === 'pattern' ? ' (a pattern: fix it, or declare it with @deviation)' : '')
        // A flow issue sits on a link: say which `<Link>` line it is.
        const at = issue.path.at(-1) === 'goTo' ? lineAt(parsed, issue.path.slice(0, -1)) : undefined
        const linkLine = parsed.links.find((l) => parsed.lines.get(l.node) === at)?.line ?? at
        problems.push({ law: issue.ruleId, source: 'validator', message: `${linkLine ? `line ${linkLine}: ` : ''}${issue.message}${tail}`, line: linkLine })
      }
    }
  }

  // ── declared deviations (patterns), as the exporter writes them ─────────────
  const deviations = [...text.matchAll(/@deviation\s+([\w.-]+)\s*:\s*([^\n*]*)/g)].map((m) => ({ ruleId: m[1], why: m[2].trim() }))

  coverage.notRead = notRead.length
  return { file: path, problems, advisories: [], deviations, warnings, notRead, coverage, reuses, proposals, flow: { edges } }
}

/** Folds one render result into a report: blocking findings are problems, legibility findings advisories. */
export function addRenderResult(report: LawReport, r: Pick<RenderResult, 'issues' | 'error'>): void {
  if (r.error) report.warnings.push(`render check did not run: ${r.error}`)
  for (const i of r.issues) {
    if (i.severity === 'warn') report.advisories.push({ law: i.ruleId, source: 'render', message: i.message })
    else report.problems.push({ law: 'render', source: 'render', message: i.message })
  }
}

export interface FlowReport {
  dir: string
  /** The states found (file names without .tsx). */
  states: string[]
  problems: LawProblem[]
}

/** The transitions of a flow folder, read from its `flow.ts` and held against the states in it. The state files themselves are `checkLaws`'s. */
export function checkFlow(dir: string): FlowReport {
  const folder = resolve(dir)
  const problems: LawProblem[] = []
  const add = (law: string, message: string): void => void problems.push({ law, message })
  const states = readdirSync(folder)
    .filter((f) => f.endsWith('.tsx'))
    .map((f) => f.replace(/\.tsx$/, ''))
    .sort()
  const parsed = parseFlowFile(readFileSync(join(folder, 'flow.ts'), 'utf8'))
  for (const message of parsed.problems) add('blueprint.dsl', message)
  if (!parsed.flow) return { dir: folder, states, problems }

  const screens: FlowStateScreen[] = []
  for (const id of states) {
    const found = parseTsx(readFileSync(join(folder, `${id}.tsx`), 'utf8'), `${id}.tsx`)
    if (found.length !== 1) {
      add('layers.stack', `${id}.tsx holds ${found.length} screens — a state is one file with one <Screen>.`)
      continue
    }
    screens.push({ id, screen: found[0].doc.screen, root: found[0].doc.root })
  }
  if (states.length === 0) add('blueprint.dsl', 'this flow folder has no state (.tsx) files.')
  for (const issue of flowFileIssues(parsed.flow, screens, loadDtvManifest())) add(issue.ruleId, issue.message)
  return { dir: folder, states, problems }
}

/** A flow folder, from a path to it, to its flow.ts, or to a state file inside it. */
function flowFolderOf(arg: string): string | undefined {
  const path = resolve(arg)
  const dir = existsSync(path) && statSync(path).isDirectory() ? path : dirname(path)
  return existsSync(join(dir, 'flow.ts')) ? dir : undefined
}

async function main(): Promise<void> {
  const args = process.argv.slice(2).filter((a) => a !== '--' && !a.startsWith('--'))
  const json = process.argv.includes('--json')
  if (args.length === 0) {
    console.error('usage: npm run check:laws -- <file.tsx | flow-folder> [...] [--json]')
    process.exit(2)
  }
  const flowDirs = [...new Set(args.map(flowFolderOf).filter((d): d is string => d !== undefined))]
  const files = [
    ...new Set([
      ...args.filter((a) => a.endsWith('.tsx')).map((a) => resolve(a)),
      ...flowDirs.flatMap((d) => readdirSync(d).filter((f) => f.endsWith('.tsx')).map((f) => join(d, f))),
    ]),
  ]
  const flows = flowDirs.map(checkFlow)
  const reports = files.map((f) => checkLaws(f))
  const requireRender = process.argv.includes('--require-render')
  let renderFailed = false
  if (!process.argv.includes('--no-render')) {
    const didNotRun = (cause: string): void => {
      for (const r of reports) r.warnings.push(`render check did not run: ${cause}`)
      if (requireRender) renderFailed = true
      console.error(`${cause}${requireRender ? ' — --require-render: failing' : ''}`)
    }
    try {
      const rendered = await renderAuditFiles(files)
      for (const r of rendered) {
        addRenderResult(reports.find((x) => x.file === resolve(r.file))!, r)
        if (r.error && requireRender) {
          renderFailed = true
          console.error(`${r.file}: render check did not run (${r.error}) — --require-render: failing`)
        }
      }
    } catch (e) {
      if (!(e instanceof RenderAuditUnavailable)) throw e
      didNotRun(e.message)
    }
  }
  if (json) console.log(JSON.stringify({ schemaVersion: SCHEMA_VERSION, reports, flows }, null, 1))
  else {
    for (const f of flows) {
      const name = `${f.dir.replace(ROOT, '')}/flow.ts`
      for (const p of f.problems) console.log(`${name}  [${p.law}] ${p.message}`)
      if (f.problems.length === 0) console.log(`${name}  flow holds (${f.states.length} states, keys bound once, every state reached, no level skipped)`)
    }
    for (const r of reports) {
      for (const p of r.problems) console.log(`${r.file.replace(ROOT, '')}${p.line ? `:${p.line}` : ''}  [${p.law}] ${p.message}`)
      for (const a of r.advisories) console.log(`${r.file.replace(ROOT, '')}  advisory [${a.law}] ${a.message}`)
      for (const w of r.warnings) console.log(`${r.file.replace(ROOT, '')}  not read: ${w}`)
      for (const d of r.deviations) console.log(`${r.file.replace(ROOT, '')}  declared ${d.ruleId}: ${d.why}`)
      if (r.problems.length === 0) console.log(`${r.file.replace(ROOT, '')}  laws hold, no pattern broken undeclared (tsc, tokens, layers, focus, rules book)`)
    }
  }
  process.exit(renderFailed || reports.some((r) => r.problems.length > 0) || flows.some((f) => f.problems.length > 0) ? 1 : 0)
}

if (!process.env.VITEST) void main()
