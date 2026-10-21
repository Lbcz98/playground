import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
// @ts-expect-error plain .mjs, so `node` runs it without a build
import { head, sections } from './explore-ref.mjs'

const ROOT = join(__dirname, '..')
const dir = join(ROOT, 'design-brain/references/conceitos')
const notes = readdirSync(dir).filter((f) => f.endsWith('.md')).map((f) => [f, readFileSync(join(dir, f), 'utf8')] as const)
const css = readFileSync(join(ROOT, 'src/styles/global.css'), 'utf8')
const kit = new Set(css.match(/--[\w-]+(?=\s*:)/g))
const classes = new Set(readFileSync(join(ROOT, 'web/protos/generated/explore-tokens.md'), 'utf8').match(/\.text-[\w-]+/g))

describe('design-brain concept notes', () => {
  it('has the catalog head and the four sections an agent asks for', () => {
    expect(notes.length).toBeGreaterThan(0)
    for (const [f, md] of notes) {
      const h = head(md)
      expect([h.tags, h.padrao, h.resumo, h.escopo], f).not.toContain('')
      expect(md, f).toMatch(/^Fonte: .+/m)
      expect(Object.keys(sections(md)), f).toEqual(['cerne', 'receita', 'uso', 'ajuste'])
    }
  })

  it('names only kit tokens and type classes, so a rule never sends an agent to a name that does not exist', () => {
    for (const [f, md] of notes) {
      // `--x-*` and a name that ends in `-` stand for a family: one kit variable with that prefix is enough.
      for (const [name] of md.matchAll(/--[\w-]+/g)) {
        const family = name.endsWith('-')
        expect(family ? [...kit].some((k) => k.startsWith(name)) : kit.has(name), `${f}: ${name}`).toBe(true)
      }
      for (const [name] of md.matchAll(/\.text-[\w-]+/g)) {
        const family = name.endsWith('-')
        expect(family ? [...classes].some((c) => c.startsWith(name)) : classes.has(name), `${f}: ${name}`).toBe(true)
      }
    }
  })

  it('keeps raw pixel and colour values out of the rules: ratios and token names carry the numbers', () => {
    for (const [f, md] of notes) {
      expect(md, f).not.toMatch(/\b\d+px\b/)
      expect(md, f).not.toMatch(/#[0-9a-f]{3,8}\b/i)
    }
  })
})
