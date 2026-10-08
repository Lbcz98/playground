import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative, resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'
import { describe, expect, it } from 'vitest'

/**
 * R7 boundary: the TSX path (check-laws, deploy, the exporter, web/) must not
 * reach ScreenFlow modules. Existing offenders live in ALLOWED and that list may only shrink.
 */
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const rel = (p: string) => relative(ROOT, p).split('\\').join('/')

const FORBIDDEN = [
  /^src\/design-system\/catalog\.ts$/,
  /^src\/design-system\/registry\.tsx$/,
  /^src\/shared\/design-system\/screenflow-manifest\.ts$/,
  /^src\/(store|canvas|app)\//,
  /^electron\//,
]

/** forbidden module -> chain (entry -> ... -> forbidden) that reaches it today. Remove entries as they are fixed. */
const ALLOWED: Record<string, string> = {}

function walk(dir: string, out: string[] = []): string[] {
  for (const n of readdirSync(dir)) {
    if (n === 'node_modules' || n === '.next') continue
    const p = join(dir, n)
    if (statSync(p).isDirectory()) walk(p, out)
    else if (/\.(tsx?|mts)$/.test(n) && !n.endsWith('.d.ts')) out.push(p)
  }
  return out
}

const EXTS = ['', '.ts', '.tsx', '/index.ts', '/index.tsx']
function resolveSpec(from: string, spec: string): string | undefined {
  let base: string
  if (spec.startsWith('@/')) base = join(ROOT, 'src', spec.slice(2))
  else if (spec.startsWith('.')) base = resolve(dirname(from), spec)
  else return undefined
  return EXTS.map((e) => base + e).find((p) => existsSync(p) && statSync(p).isFile())
}

function importsOf(file: string): string[] {
  const info = ts.preProcessFile(readFileSync(file, 'utf8'), true, true)
  return info.importedFiles.map((i) => resolveSpec(file, i.fileName)).filter((p): p is string => !!p)
}

const ENTRIES = [
  join(ROOT, 'scripts/check-laws.ts'),
  join(ROOT, 'scripts/deploy.ts'),
  ...walk(join(ROOT, 'src/shared/export')).filter((f) => /\.ts$/.test(f) && !/\.test\./.test(f)),
  ...walk(join(ROOT, 'web')),
]

/** Reachable forbidden modules, each with its shortest chain from an entry. */
export function reachForbidden(entries: string[]): Record<string, string[]> {
  const parent = new Map<string, string | null>(entries.map((e) => [e, null]))
  const queue = [...entries]
  const found: Record<string, string[]> = {}
  while (queue.length) {
    const f = queue.shift()!
    if (FORBIDDEN.some((re) => re.test(rel(f)))) {
      const chain: string[] = []
      for (let c: string | null | undefined = f; c; c = parent.get(c)) chain.unshift(rel(c))
      found[rel(f)] = chain
      continue // the forbidden world is not walked further
    }
    for (const d of importsOf(f)) if (!parent.has(d)) (parent.set(d, f), queue.push(d))
  }
  return found
}

describe('TSX path does not depend on ScreenFlow', () => {
  const found = reachForbidden(ENTRIES)
  const chains = (m: Record<string, string[]>) => Object.entries(m).map(([k, c]) => `${k}: ${c.join(' -> ')}`)

  it('reaches no forbidden module beyond the allowlist', () => {
    const fresh = Object.fromEntries(Object.entries(found).filter(([k]) => !(k in ALLOWED)))
    expect(chains(fresh), 'new ScreenFlow dependency on the TSX path; remove the import').toEqual([])
  })

  it('allowlist only shrinks: every entry is still reachable', () => {
    const stale = Object.keys(ALLOWED).filter((k) => !(k in found))
    expect(stale, 'no longer reachable; remove these from ALLOWED in tests/checks/boundary.test.ts').toEqual([])
  })
})
