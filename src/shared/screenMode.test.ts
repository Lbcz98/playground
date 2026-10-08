/** `screenMode` is the one place that says an absent mode means Faithful. */
import { describe, expect, it } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { screenMode } from './blueprint'

describe('screenMode', () => {
  it('reads the mode off an entry, a document or a response', () => {
    expect(screenMode({ mode: 'exploratory' })).toBe('exploratory')
    expect(screenMode({ mode: 'faithful' })).toBe('faithful')
  })

  it('an absent or unrecognised mode is Faithful, whatever the thing is', () => {
    for (const entry of [{}, { mode: undefined }, { mode: 'wild' }, { mode: 3 }, undefined, null, 'text', 7, []]) {
      expect(screenMode(entry), JSON.stringify(entry)).toBe('faithful')
    }
  })

  it('falls back to the caller’s policy when there is one, and only then', () => {
    expect(screenMode({}, 'exploratory')).toBe('exploratory')
    expect(screenMode({ mode: 'faithful' }, 'exploratory')).toBe('faithful')
    expect(screenMode({ mode: 'wild' }, 'exploratory')).toBe('exploratory')
  })
})

describe('nobody else defaults a mode', () => {
  const files = (dir: string): string[] =>
    readdirSync(dir).flatMap((name) => {
      const path = join(dir, name)
      if (statSync(path).isDirectory()) return name === 'node_modules' ? [] : files(path)
      return /\.(ts|tsx)$/.test(name) && !/\.test\.tsx?$/.test(name) ? [path] : []
    })

  it('no source file compares a mode with "faithful" or falls back to it by hand', () => {
    const offenders = [...files('src'), ...files('scripts')]
      .filter((f) => !f.endsWith('blueprint.ts'))
      .flatMap((f) =>
        readFileSync(f, 'utf8')
          .split('\n')
          .map((line, i) => ({ f, line, n: i + 1 }))
          .filter(({ line }) => /(===|!==) 'faithful'|\?\? 'faithful'|\|\| 'faithful'/.test(line))
          .map(({ f, n }) => `${f}:${n}`),
      )
    expect(offenders).toEqual([])
  })
})
