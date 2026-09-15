/**
 * Token-usage audit for the component layers (`src/ui-kit`, `src/primitives`).
 *
 * For every source file (stories included, tests excluded) it records:
 *   - each custom property referenced, by tier — `core` holds a raw value,
 *     `semantic` names an intent and aliases core (tokens.json's `semantic` groups);
 *   - untyped `var(--…)` string literals in TS/TSX, which the compiler can't check;
 *   - `.text-*` classes applied as raw strings instead of through `<Text>`;
 *   - measured sizes read from `ui-kit/untokenized.ts`.
 *
 * `scripts/audit-tokens.ts` prints it; `audit.test.ts` holds components to it.
 */

import { readdirSync, readFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import { collectTokens, cssVarName, textClassName } from './compile'

export const AUDITED_DIRS = ['src/ui-kit', 'src/primitives'] as const

export type Tier = 'core' | 'semantic'

export interface FileAudit {
  file: string
  /** Token name → occurrences. */
  core: Map<string, number>
  semantic: Map<string, number>
  untypedVars: number
  rawTextClasses: number
  measuredSizes: number
}

const VAR_NAME = /--[a-z0-9]+(?:-[a-z0-9]+)*/g
const UNTYPED_VAR = /var\(--/g
const RAW_TEXT_CLASS = /['"`](text-[a-z0-9-]+)['"`\s]/g
const MEASURED_SIZE = /\b(?:CARD|ROUNDED|WIDE)\.\w+/g

function* sourceFiles(dir: string): Generator<string> {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) yield* sourceFiles(full)
    else if (/\.(tsx?|css)$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name)) yield full
  }
}

function bump(map: Map<string, number>, key: string): void {
  map.set(key, (map.get(key) ?? 0) + 1)
}

export function auditComponents(root: string, tokensJson: Record<string, unknown>): FileAudit[] {
  const tokens = collectTokens(tokensJson)
  const tiers = new Map<string, Tier>(
    tokens
      .filter((t) => t.type !== 'typography')
      .map((t) => [cssVarName(t.path), t.path.includes('semantic') ? 'semantic' : 'core']),
  )
  const textClasses = new Set(tokens.filter((t) => t.type === 'typography').map((t) => textClassName(t.path)))

  const audits: FileAudit[] = []
  for (const dir of AUDITED_DIRS) {
    for (const path of sourceFiles(join(root, dir))) {
      const text = readFileSync(path, 'utf8')
      const audit: FileAudit = {
        file: relative(root, path),
        core: new Map(),
        semantic: new Map(),
        untypedVars: path.endsWith('.css') ? 0 : (text.match(UNTYPED_VAR) ?? []).length,
        rawTextClasses: [...text.matchAll(RAW_TEXT_CLASS)].filter((m) => textClasses.has(m[1])).length,
        measuredSizes: path.endsWith('untokenized.ts') ? 0 : (text.match(MEASURED_SIZE) ?? []).length,
      }
      for (const [name] of text.matchAll(VAR_NAME)) {
        const tier = tiers.get(name)
        if (tier) bump(audit[tier], name)
      }
      audits.push(audit)
    }
  }
  return audits.sort((a, b) => a.file.localeCompare(b.file))
}

const sum = (map: Map<string, number>): number => [...map.values()].reduce((a, b) => a + b, 0)

export function renderAudit(audits: FileAudit[]): string {
  const lines = [
    '| File | Core refs | Semantic refs | Untyped `var()` strings | Raw `.text-*` strings | Measured sizes |',
    '| --- | ---: | ---: | ---: | ---: | ---: |',
  ]
  const totals = { core: 0, semantic: 0, untyped: 0, text: 0, sizes: 0 }
  for (const a of audits) {
    const row = { core: sum(a.core), semantic: sum(a.semantic), untyped: a.untypedVars, text: a.rawTextClasses, sizes: a.measuredSizes }
    if (!Object.values(row).some(Boolean)) continue
    lines.push(`| \`${a.file}\` | ${row.core} | ${row.semantic} | ${row.untyped} | ${row.text} | ${row.sizes} |`)
    totals.core += row.core
    totals.semantic += row.semantic
    totals.untyped += row.untyped
    totals.text += row.text
    totals.sizes += row.sizes
  }
  lines.push(
    `| **Total** | **${totals.core}** | **${totals.semantic}** | **${totals.untyped}** | **${totals.text}** | **${totals.sizes}** |`,
  )

  const byToken = new Map<string, { uses: number; files: Set<string> }>()
  for (const a of audits) {
    for (const [name, uses] of a.core) {
      const entry = byToken.get(name) ?? { uses: 0, files: new Set<string>() }
      entry.uses += uses
      entry.files.add(a.file.replace(/^src\//, ''))
      byToken.set(name, entry)
    }
  }
  if (byToken.size) {
    lines.push('', '**Core tokens referenced directly**', '', '| Token | Uses | Files |', '| --- | ---: | --- |')
    for (const [name, { uses, files }] of [...byToken].sort((a, b) => a[0].localeCompare(b[0]))) {
      lines.push(`| \`${name}\` | ${uses} | ${[...files].join(', ')} |`)
    }
  }
  return lines.join('\n')
}
