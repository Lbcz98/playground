import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
// @ts-expect-error plain .mjs, so `node` runs it without a build
import { catalog, head, listing, note, notes, padroes, sections, teclas } from './explore-ref.mjs'

const body = `# orbita-de-pessoas
Tags: arranjo radial, foco com rótulo
Padrão: Órbita
Resumo: pessoas em volta de um centro

## Cerne
A ideia.

## Posição e espaço
- eixo único

## Por que funciona
Porque sim.

## Receita
1. Faça assim.
`
const dir = mkdtempSync(join(tmpdir(), 'explore-ref-'))
writeFileSync(join(dir, 'orbita-de-pessoas.md'), body)
writeFileSync(join(dir, 'trilho-de-dias.md'), body.replace('orbita-de-pessoas', 'trilho-de-dias').replace('Órbita', 'Trilho de passos').replace('arranjo radial', 'trilho'))

describe('explore-ref', () => {
  it('splits a note into sections keyed by their first word, and reads the head', () => {
    expect(Object.keys(sections(body))).toEqual(['cerne', 'posicao', 'porque', 'receita'])
    expect(head(body)).toEqual({ tags: 'arranjo radial, foco com rótulo', padrao: 'Órbita', resumo: 'pessoas em volta de um centro', escopo: '' })
  })

  it('lists one line per note and filters without caring for accents or case', () => {
    expect(catalog(dir)).toHaveLength(2)
    expect(catalog(dir, 'ORBITA')).toEqual(['orbita-de-pessoas | Órbita | arranjo radial, foco com rótulo | pessoas em volta de um centro'])
    expect(catalog(dir, 'trilho de passos')).toHaveLength(1)
  })

  it('answers a filter that matches nothing with the whole catalog under a note', () => {
    expect(listing(dir, 'orbita').split('\n')).toHaveLength(1)
    const out = listing(dir, 'futebol').split('\n')
    expect(out[0]).toBe('nenhuma referência com "futebol"; o catálogo inteiro:')
    expect(out.slice(1)).toEqual(catalog(dir))
  })

  it('returns only the sections asked for, by default cerne and receita', () => {
    const out = note(dir, 'orbita')
    expect(out).toContain('A ideia.')
    expect(out).toContain('Faça assim.')
    expect(out).not.toContain('eixo único')
    expect(note(dir, 'orbita-de-pessoas', ['posicao'])).toContain('eixo único')
    expect(note(dir, 'orbita', ['tudo'])).toContain('Porque sim.')
  })

  it('reads several notes in one call, with the same sections each', () => {
    const out = notes(dir, 'orbita,trilho-de-dias', ['posicao'])
    expect(out).toContain('# orbita-de-pessoas')
    expect(out).toContain('# trilho-de-dias')
    expect(out.match(/eixo único/g)).toHaveLength(2)
    expect(notes(dir, 'orbita')).toBe(note(dir, 'orbita'))
  })

  it('refuses an unknown or ambiguous name and an unknown section, saying what is valid', () => {
    expect(() => note(dir, 'de')).toThrow(/mais de uma referência/)
    expect(() => note(dir, 'nada')).toThrow(/orbita-de-pessoas, trilho-de-dias/)
    expect(() => note(dir, 'orbita', ['sabor'])).toThrow(/cerne posicao porque receita/)
  })

  it('serves the keys and one interaction pattern from interacoes.md', () => {
    const md = '# Padrões\n\nIntro.\n\n## Teclas dentro do card\n\n| Tecla | O que faz |\n| --- | --- |\n| **←  →** | move |\n\n## Padrões\n\n| Padrão | ← → | Enter |\n| --- | --- | --- |\n| **Órbita** | gira | abre |\n| **Interruptor** | move | liga |\n'
    expect(teclas(md)).toContain('| **←  →** | move |')
    expect(teclas(md)).not.toContain('Intro.')
    expect(teclas(md)).not.toContain('Interruptor')
    expect(padroes(md, 'interruptor')).toBe('| Padrão | ← → | Enter |\n| --- | --- | --- |\n| **Interruptor** | move | liga |')
    expect(padroes(md).split('\n')).toHaveLength(4)
    expect(() => padroes(md, 'xyz')).toThrow(/Órbita, Interruptor/)
  })
})
