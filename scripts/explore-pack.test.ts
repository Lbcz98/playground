import { spawnSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
// @ts-expect-error plain .mjs, so `node` runs it without a build
import { ALWAYS, chapters, field, named, pack, split } from './explore-pack.mjs'

const brief = `pedido do designer

**Foco:** 24° + São Paulo
Superfície: Content Card

## Opção 1
- **Tese:** o número no ar.
- **Referência:** trilho-de-dias (fileira); ref. 4 do designer.
- **Interação:** Trilho de passos. ←/→ move o dia.
- **Regras:** esqueleto-fixo, rotulo-inequivoco

## Opção 2
- **Tese:** um card que só se olha.
- **Interação:** Estático.
`
const note = (name: string, extra = '') => `# ${name}\nTags: t\nPadrão: p\nResumo: r\n${extra}\n## Cerne\ncerne de ${name}\n\n## Receita\nreceita de ${name}\n\n## Uso\nuso de ${name}\n\n## Ajuste\najuste de ${name}\n`
const root = mkdtempSync(join(tmpdir(), 'explore-pack-'))
const refs = join(root, 'refs'), rules = join(root, 'rules')
mkdirSync(refs); mkdirSync(rules)
for (const r of ['trilho-de-dias', 'orbita']) writeFileSync(join(refs, `${r}.md`), note(r))
for (const r of [...ALWAYS.map(([r]: [string]) => r), 'foco-e-selecao', 'esqueleto-fixo', 'rotulo-inequivoco', 'raios-concentricos']) writeFileSync(join(rules, `${r}.md`), note(r, 'Vale para: cards'))
const interacoes = '# I\n\n## Teclas dentro do card\n\n| Tecla | O que faz |\n| --- | --- |\n| **←  →** | move |\n\n## Padrões\n\n| Padrão | ← → | Enter |\n| --- | --- | --- |\n| **Trilho de passos** | move | abre |\n| **Órbita** | gira | abre |\n'
const direcao = '# D\n\n## 1. Stance\nstance\n\n## 3. Vocabulary\nvague to precise\n\n## 7. Critique\ncritique\n\n## 8. Learnings\nold\n'
const src = { refs, rules, interacoes, direcao }

describe('explore-pack', () => {
  it('splits the brief into the shared text and one block per option', () => {
    const { shared, options } = split(brief)
    expect(shared).toContain('Superfície: Content Card')
    expect(shared).not.toContain('Opção')
    expect(options.map(([n]: [number]) => n)).toEqual([1, 2])
    expect(options[1][1]).toContain('só se olha')
  })

  it('reads a field and finds catalog names in it, in the order written', () => {
    const one = split(brief).options[0][1]
    expect(field(one, 'Refer[eê]ncias?')).toBe('trilho-de-dias (fileira); ref. 4 do designer.')
    expect(field(one, 'Nada')).toBe('')
    expect(named('Órbita e depois trilho-de-dias', ['trilho-de-dias', 'orbita'])).toEqual(['orbita', 'trilho-de-dias'])
  })

  it('keeps only the DIRECAO chapters asked for', () => {
    const out = chapters(direcao, ['3', '7'])
    expect(out).toContain('vague to precise')
    expect(out).toContain('critique')
    expect(out).not.toContain('stance')
    expect(out).not.toContain('old')
  })

  it('packs an interactive option with its own direction, rules, reference, pattern and keys', () => {
    const { shared, options } = split(brief)
    const p = pack('clima', shared, 1, options[0][1], src)
    expect(p.refs).toEqual(['trilho-de-dias'])
    expect(p.pattern).toBe('Trilho de passos')
    expect(p.rules).toEqual(['ponto-focal', 'ancora-e-apoio', 'grupo-por-espaco', 'uma-cor-um-significado', 'foco-e-selecao', 'esqueleto-fixo', 'rotulo-inequivoco'])
    expect(p.text).toContain('o número no ar')
    expect(p.text).not.toContain('só se olha')
    expect(p.text).toContain('cerne de ponto-focal')
    expect(p.text).not.toContain('cerne de ancora-e-apoio')
    expect(p.text).toContain('uso de esqueleto-fixo')
    expect(p.text).toContain('raios-concentricos | p | t | r | vale para: cards')
    expect(p.text).toContain('| **Trilho de passos** | move | abre |')
    expect(p.text).not.toContain('Órbita')
    expect(p.text).toContain('## Teclas dentro do card')
    expect(p.text).toContain('vague to precise')
  })

  it('reports a rule or pattern name that matches nothing, and takes a static option as fine', () => {
    const bad = pack('clima', 'x', 3, '## Opção 3\n- **Interação:** Gesto de arrastar.\n- **Regras:** esqueleto-fixo, regra-inventada', src)
    expect(bad.unknown).toEqual(['regra-inventada'])
    expect(bad.problems).toEqual([expect.stringContaining('nenhum padrão')])
    for (const prose of ['nenhuma', 'ponto-focal e esqueleto-fixo', 'esqueleto-fixo (se houver itens), —', 'só as fixas']) expect(pack('clima', 'x', 5, `## Opção 5\n- **Interação:** Estático.\n- **Regras:** ${prose}`, src).problems, prose).toEqual([])
    expect(pack('clima', 'x', 6, '## Opção 6\n- **Interação:** Estático.\n- **Regras:** esqueleto-fixo, pré-definidas', src).problems).toEqual([])
    expect(pack('clima', 'x', 4, '## Opção 4\n- **Interação:** Estático.', src).problems).toEqual([])
    const { shared, options } = split(brief)
    expect(pack('clima', shared, 1, options[0][1], src).problems).toEqual([])
  })

  it('packs a static option without keys, pattern or the focus rule', () => {
    const { shared, options } = split(brief)
    const p = pack('clima', shared, 2, options[1][1], src)
    expect(p.pattern).toBeUndefined()
    expect(p.static).toBe(true)
    expect(p.rules).not.toContain('foco-e-selecao')
    expect(p.text).not.toContain('Teclas dentro do card')
    expect(p.text).toContain('A direção não cita uma referência do catálogo')
  })

  it('does not count a name that only extends a rule name as unknown', () => {
    expect(pack('clima', 'x', 7, '## Opção 7\n- **Interação:** Estático.\n- **Regras:** esqueleto-fixos', src).unknown).toEqual([])
  })

  describe('the command line', () => {
    const run = (option: string) => {
      const dir = mkdtempSync(join(tmpdir(), 'explore-pack-cli-'))
      writeFileSync(join(dir, 'brief.md'), `pedido\n\n## Opção 1\n${option}\n`)
      return spawnSync('node', [fileURLToPath(new URL('explore-pack.mjs', import.meta.url)), dir], { encoding: 'utf8' })
    }
    it('warns about an unknown rule and still exits 0, with the pack written', () => {
      const r = run('- **Interação:** Estático.\n- **Regras:** esqueleto-fixo, pré-definidas')
      expect(r.status).toBe(0)
      expect(r.stdout).toContain('aviso: nenhuma referência do catálogo; regra desconhecida em **Regras:** pré-definidas')
    })
    it('exits 1 with erro: when an interactive option names no pattern, after writing every pack', () => {
      const r = run('- **Interação:** Gesto de arrastar.')
      expect(r.status).toBe(1)
      expect(r.stderr).toContain('erro: Opção 1: nenhum padrão')
      expect(r.stdout).toContain('pack/1.md')
    })
  })
})
