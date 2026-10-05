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
 *
 * Patterns are not judged here. A broken pattern is a composition choice, so the file
 * declares it (`@deviation <ruleId>: <why>`); this script lists what was declared.
 * Exit code 1 when a law is broken.
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'
import { DTV_SCREEN_LAYERS, screenModel } from '../src/shared/design-system/screen-layers'

const ROOT = fileURLToPath(new URL('..', import.meta.url))

export interface LawProblem {
  law: string
  message: string
  line?: number
}
export interface LawReport {
  file: string
  problems: LawProblem[]
  deviations: { ruleId: string; why: string }[]
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

export function checkLaws(file: string): LawReport {
  const path = resolve(file)
  const text = readFileSync(path, 'utf8')
  const problems: LawProblem[] = []
  const add = (law: string, message: string, line?: number): void => void problems.push({ law, message, line })

  // ── tsc against the real kit ────────────────────────────────────────────────
  const configPath = ts.findConfigFile(ROOT, ts.sys.fileExists, 'tsconfig.json')!
  const config = ts.parseJsonConfigFileContent(ts.readConfigFile(configPath, ts.sys.readFile).config, ts.sys, ROOT)
  const program = ts.createProgram([path], { ...config.options, noEmit: true })
  for (const d of ts.getPreEmitDiagnostics(program)) {
    if (!d.file || resolve(d.file.fileName) !== path) continue
    const line = d.start !== undefined ? d.file.getLineAndCharacterOfPosition(d.start).line + 1 : undefined
    add('component.api', `TS${d.code}: ${ts.flattenDiagnosticMessageText(d.messageText, ' ')}`, line)
  }

  // ── tokens.only ─────────────────────────────────────────────────────────────
  text.split('\n').forEach((raw, i) => {
    const code = raw.replace(/\/\/.*$/, '').replace(/\/\*.*?\*\//g, '')
    for (const [label, re] of RAW) if (re.test(code)) add('tokens.only', `${label} — a design value is a token name`, i + 1)
  })

  const sf = ts.createSourceFile(path, text, ts.ScriptTarget.ES2022, true, ts.ScriptKind.TSX)

  // ── imports: only the kit and React ─────────────────────────────────────────
  sf.forEachChild((node) => {
    if (!ts.isImportDeclaration(node) || !ts.isStringLiteral(node.moduleSpecifier)) return
    const m = node.moduleSpecifier.text
    if (!(m === 'react' || m === '@/primitives' || m.startsWith('@/ui-kit/'))) {
      add('component.api', `imports "${m}" — a screen is built from the kit (@/primitives, @/ui-kit/*) only`, LINE(sf, node))
    }
  })

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

  // ── declared deviations (patterns), as the exporter writes them ─────────────
  const deviations = [...text.matchAll(/@deviation\s+([\w.-]+)\s*:\s*([^\n*]*)/g)].map((m) => ({ ruleId: m[1], why: m[2].trim() }))

  return { file: path, problems, deviations }
}

function main(): void {
  const files = process.argv.slice(2).filter((a) => a !== '--' && !a.startsWith('--'))
  const json = process.argv.includes('--json')
  if (files.length === 0) {
    console.error('usage: npm run check:laws -- <file.tsx> [...] [--json]')
    process.exit(2)
  }
  const reports = files.map(checkLaws)
  if (json) console.log(JSON.stringify(reports, null, 1))
  else {
    for (const r of reports) {
      for (const p of r.problems) console.log(`${r.file.replace(ROOT, '')}${p.line ? `:${p.line}` : ''}  [${p.law}] ${p.message}`)
      for (const d of r.deviations) console.log(`${r.file.replace(ROOT, '')}  declared ${d.ruleId}: ${d.why}`)
      if (r.problems.length === 0) console.log(`${r.file.replace(ROOT, '')}  laws hold (tsc, tokens, layers, focus)`)
    }
  }
  process.exit(reports.some((r) => r.problems.length > 0) ? 1 : 0)
}

if (!process.env.VITEST) main()
