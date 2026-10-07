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
 * Exit code 1 when a law is broken.
 */
import { existsSync, readFileSync, statSync } from 'node:fs'
import { dirname, isAbsolute, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'
import { validateBlueprintAgainstManifest } from '../src/shared/design-system/manifest-zod'
import { ruleScope } from '../src/shared/design-system/deviations'
import { ruleById } from '../src/shared/design-system/rules'
import { DTV_SCREEN_LAYERS, screenModel } from '../src/shared/design-system/screen-layers'
import { parseTsx, type NotRead } from '../src/shared/export/fromTsx'
import { loadDtvManifest } from './dtv-manifest'
import { renderAuditFiles, RenderAuditUnavailable, type RenderResult } from './render-audit'

const ROOT = fileURLToPath(new URL('..', import.meta.url))

export interface LawProblem {
  /** The rule id the message is about (a law, or a pattern broken without being declared). */
  law: string
  /** 'static' = read off the source here; 'validator' = the blueprint validator, run on the screen read back from the JSX. */
  source?: 'static' | 'validator' | 'render'
  message: string
  line?: number
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
}

/** Components that hold the focus, and whether leaving `interactionState` out means focused. */
const FOCUS_HOLDERS: Record<string, { defaultFocused: boolean }> = {
  InteractivityButton: { defaultFocused: true },
  CloseButton: { defaultFocused: true },
  RoundedButton: { defaultFocused: true },
  WideButton: { defaultFocused: true },
  AlertBug: { defaultFocused: false },
  Notification: { defaultFocused: false },
}
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

export function checkLaws(file: string, options: { skipValidator?: boolean } = {}): LawReport {
  const path = resolve(file)
  const text = readFileSync(path, 'utf8')
  const problems: LawProblem[] = []
  const add = (law: string, message: string, line?: number): void => void problems.push({ law, message, line })

  const sf = ts.createSourceFile(path, text, ts.ScriptTarget.ES2022, true, ts.ScriptKind.TSX)
  const folder = designerFolder(path)
  const rel = (f: string): string => f.replace(ROOT, '')
  const FORMS = `allowed: react, @/primitives, @/ui-kit/*, or a relative import inside this designer's folder (${rel(folder)}/) — data .ts/.json and helpers; no images or .svg, no other designer's folder, no other @/ path, no npm package`

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
      if (m === 'react' || m === '@/primitives' || m.startsWith('@/ui-kit/')) continue
      if (!m.startsWith('.')) {
        bad(isAbsolute(m) ? 'absolute path' : m.startsWith('@/') ? 'not part of the kit' : 'npm package')
        continue
      }
      const target = resolve(dirname(file), m)
      const inside = relative(folder, target)
      if (inside.startsWith('..') || isAbsolute(inside)) bad('outside this designer folder')
      else if (NOT_CODE.test(m)) bad('image or style file')
      else {
        const hit = LOCAL_EXT.map((e) => target + e).find((f) => existsSync(f) && statSync(f).isFile())
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
  const program = ts.createProgram([path], { ...config.options, noEmit: true })
  for (const d of ts.getPreEmitDiagnostics(program)) {
    if (!d.file) continue
    const f = resolve(d.file.fileName)
    if (f !== path && !locals.has(f)) continue
    const line = d.start !== undefined ? d.file.getLineAndCharacterOfPosition(d.start).line + 1 : undefined
    add('component.api', `${f === path ? '' : `${rel(f)}: `}TS${d.code}: ${ts.flattenDiagnosticMessageText(d.messageText, ' ')}`, line)
  }

  // ── tokens.only: the screen, and local files that have JSX (a file with none is data) ───────────
  const scan = (src: string, prefix: string): void =>
    src.split('\n').forEach((raw, i) => {
      const code = raw.replace(/\/\/.*$/, '').replace(/\/\*.*?\*\//g, '')
      for (const [label, re] of RAW) if (re.test(code)) add('tokens.only', `${prefix}${label} — a design value is a token name`, i + 1)
    })
  scan(text, '')
  for (const [f, l] of locals) if (f.endsWith('.tsx') && hasJsx(l.sf)) scan(l.text, `${rel(f)}: `)

  // ── per screen: layers.stack and focus.single ───────────────────────────────
  const visit = (node: ts.Node, visitor: (n: ts.Node) => void): void => {
    visitor(node)
    node.forEachChild((c) => visit(c, visitor))
  }
  const screens: { el: ts.JsxOpeningLikeElement; scope: ts.Node }[] = []
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
    visit(scope, (n) => {
      if (!ts.isJsxOpeningElement(n) && !ts.isJsxSelfClosingElement(n)) return
      const tag = n.tagName.getText()
      if (tag === MENU) {
        // `focusedItem={null}` hands the focus to something else (a rail card): the menu then holds none.
        const none = n.attributes.properties.some(
          (a) => ts.isJsxAttribute(a) && a.name.getText() === 'focusedItem' && a.initializer && /^\{\s*null\s*\}$/.test(a.initializer.getText()),
        )
        if (none) return
        focused++
        holders.push(`${MENU} (line ${LINE(sf, n)})`)
        return
      }
      const holder = FOCUS_HOLDERS[tag]
      if (!holder) return
      const state = literalProp(n, 'interactionState')
      const isFocused = state === 'focus' || (state === undefined && holder.defaultFocused)
      if (isFocused) {
        focused++
        holders.push(`${tag} (line ${LINE(sf, n)})`)
      }
    })
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
  if (!options.skipValidator) {
    const manifest = loadDtvManifest()
    for (const parsed of parseTsx(text, path)) {
      warnings.push(...parsed.warnings.map((w) => `${parsed.component}: ${w}`))
      notRead.push(...parsed.notRead)
      coverage.read += parsed.read
      const result = validateBlueprintAgainstManifest(parsed.doc, manifest, 'exploratory')
      if (result.ok) continue
      for (const issue of result.issues) {
        // The static pass already says these in terms of the source.
        if (issue.ruleId === 'focus.single' || issue.ruleId === 'layers.stack') continue
        const flexibility = ruleById(manifest, issue.ruleId)?.flexibility ?? 'law'
        const where =
          issue.kind === 'unused-deviation' && ruleScope(issue.ruleId) === 'screen' && !/on the screen/.test(issue.message)
            ? " — this rule is about the whole screen: declare it once, in the component's JSDoc (or on the root element), not on the node that shows it"
            : ''
        const tail = issue.kind === 'unused-deviation' ? ` (declared for nothing${where})` : flexibility === 'pattern' ? ' (a pattern: fix it, or declare it with @deviation)' : ''
        problems.push({ law: issue.ruleId, source: 'validator', message: `${issue.message}${tail}` })
      }
    }
  }

  // ── declared deviations (patterns), as the exporter writes them ─────────────
  const deviations = [...text.matchAll(/@deviation\s+([\w.-]+)\s*:\s*([^\n*]*)/g)].map((m) => ({ ruleId: m[1], why: m[2].trim() }))

  coverage.notRead = notRead.length
  return { file: path, problems, advisories: [], deviations, warnings, notRead, coverage }
}

/** Folds one render result into a report: blocking findings are problems, legibility findings advisories. */
export function addRenderResult(report: LawReport, r: Pick<RenderResult, 'issues' | 'error'>): void {
  if (r.error) report.warnings.push(`render check did not run: ${r.error}`)
  for (const i of r.issues) {
    if (i.severity === 'warn') report.advisories.push({ law: i.ruleId, source: 'render', message: i.message })
    else report.problems.push({ law: 'render', source: 'render', message: i.message })
  }
}

async function main(): Promise<void> {
  const files = process.argv.slice(2).filter((a) => a !== '--' && !a.startsWith('--'))
  const json = process.argv.includes('--json')
  if (files.length === 0) {
    console.error('usage: npm run check:laws -- <file.tsx> [...] [--json]')
    process.exit(2)
  }
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
  if (json) console.log(JSON.stringify(reports, null, 1))
  else {
    for (const r of reports) {
      for (const p of r.problems) console.log(`${r.file.replace(ROOT, '')}${p.line ? `:${p.line}` : ''}  [${p.law}] ${p.message}`)
      for (const a of r.advisories) console.log(`${r.file.replace(ROOT, '')}  advisory [${a.law}] ${a.message}`)
      for (const w of r.warnings) console.log(`${r.file.replace(ROOT, '')}  not read: ${w}`)
      for (const d of r.deviations) console.log(`${r.file.replace(ROOT, '')}  declared ${d.ruleId}: ${d.why}`)
      if (r.problems.length === 0) console.log(`${r.file.replace(ROOT, '')}  laws hold, no pattern broken undeclared (tsc, tokens, layers, focus, rules book)`)
    }
  }
  process.exit(renderFailed || reports.some((r) => r.problems.length > 0) ? 1 : 0)
}

if (!process.env.VITEST) void main()
