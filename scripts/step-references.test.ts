import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const dirs = ['.claude/commands', '.claude/agents']
const files = dirs.flatMap((d) => readdirSync(d).filter((f) => f.endsWith('.md')).map((f) => join(d, f)))
const text = Object.fromEntries(files.map((f) => [f, readFileSync(f, 'utf8')]))
const commands = files.filter((f) => f.startsWith('.claude/commands'))

/** The lettered steps ("a. …") under the heading that starts with `title`, in any command file. */
const letters = (title: string) =>
  commands.flatMap((f) => (text[f].split(/^(?=## )/m).find((s) => s.startsWith(`## ${title}`)) ?? '').split('\n').flatMap((l) => /^([a-z])\. /.exec(l)?.[1] ?? []))

describe('step references between commands', () => {
  it('every `passo <letter> de "<Section>"` names a lettered step that exists in that section', () => {
    const refs = files.flatMap((f) => [...text[f].matchAll(/passo ([a-z]) de "([^"]+)"/g)].map((m) => ({ f, letter: m[1], title: m[2] })))
    expect(refs.length).toBeGreaterThan(0)
    for (const r of refs) expect(letters(r.title), `${r.f}: passo ${r.letter} de "${r.title}"`).toContain(r.letter)
  })
})
