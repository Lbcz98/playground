// node scripts/explore-pack.mjs docs/explorations/<slug>                        one pack/<N>.md per "## Opção N" of brief.md
// node scripts/explore-pack.mjs docs/explorations/<slug> --direcoes <file>      the same for the "## Opção N" blocks of another file (variations, more options)
// A pack is what one proto-explorer needs besides DESIGN.md: the shared brief, its own direction only, and the rule, reference,
// pattern and key notes that direction names. /explore builds it once after the plan, so the parallel agents read one file
// instead of each running the same dozen explore-ref.mjs calls.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { catalog, note, padroes, teclas } from './explore-ref.mjs'

const brain = fileURLToPath(new URL('../design-brain/', import.meta.url))
const plain = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

/** Rules every option follows (step 3 of proto-explorer), with the sections read of each. */
export const ALWAYS = [['ponto-focal', ['cerne', 'receita', 'uso']], ['ancora-e-apoio', ['receita', 'uso']], ['grupo-por-espaco', ['receita', 'uso']], ['uma-cor-um-significado', ['receita', 'uso']]]
const MORE = ['receita', 'uso']

/** brief.md → the text before the first "## Opção N", and [[N, block], …]. */
export function split(md) {
  const [shared, ...rest] = md.split(/^(?=## Op[cç][aã]o \d+)/m)
  return { shared: shared.trim(), options: rest.map((b) => [Number(/^## Op[cç][aã]o (\d+)/.exec(b)[1]), b.trim()]) }
}

/** The text after "**<label>:**" on a direction's line, '' when absent. */
export const field = (block, label) => new RegExp(`\\*\\*${label}:\\*\\*\\s*(.*)$`, 'mi').exec(block)?.[1].trim() ?? ''

/** Names from `names` that occur in `text`, in the order they appear there. */
export const named = (text, names) => {
  const t = plain(text)
  return names.map((n) => [n, t.indexOf(plain(n))]).filter(([, i]) => i >= 0).sort((a, b) => a[1] - b[1]).map(([n]) => n)
}

/** "## 3. …" chapters of DIRECAO.md, by number. */
export const chapters = (md, nums) => md.split(/^(?=## )/m).filter((c) => nums.some((n) => c.startsWith(`## ${n}.`))).map((c) => c.trim()).join('\n\n')

const nameOf = (line) => line.split(' | ')[0]
const patternNames = (md) => (md.split(/^## Padrões/m)[1] ?? '').split('\n').filter((l) => /^\| \*\*/.test(l)).map((l) => l.split('|')[1].replace(/\*/g, '').trim())

/** One option's pack and what went into it. `src` holds the folders and files it reads, so a test can give its own. */
export function pack(slug, shared, n, block, src) {
  const refNames = catalog(src.refs).map(nameOf), ruleNames = catalog(src.rules).map(nameOf)
  const refs = named(field(block, 'Refer[eê]ncias?'), refNames).slice(0, 3)
  const interacao = field(block, 'Intera[cç][aã]o')
  const pattern = named(interacao, patternNames(src.interacoes))[0]
  const interactive = Boolean(pattern) && !/est[aá]tic/i.test(interacao)
  const regras = field(block, 'Regras')
  const asked = named(regras, ruleNames)
  // Only a token shaped like a rule name (a-b-c) can be a typo of one; prose such as "nenhuma" or "e" is not a rule.
  const unknown = regras.split(/[,;\s/()]+/).map((w) => w.replace(/[`.*]/g, '')).filter((w) => /^[a-z0-9]+(-[a-z0-9]+)+$/.test(plain(w)) && !asked.some((r) => plain(w).includes(plain(r))))
  const rules = [...ALWAYS, ...(interactive ? [['foco-e-selecao', MORE]] : []), ...asked.map((r) => [r, MORE])]
    .filter(([r], i, all) => ruleNames.includes(r) && all.findIndex(([x]) => x === r) === i)
  const rest = catalog(src.rules).filter((l) => !rules.some(([r]) => r === nameOf(l)))

  const out = [
    `# Pacote da Opção ${n} · ${slug}`,
    `Gerado por \`scripts/explore-pack.mjs\` a partir do brief; não edite, rode de novo. Leia \`design-brain/DESIGN.md\` inteiro antes; ele vence este pacote onde diferirem.`,
    `## Brief (comum a todas as opções)\n\n${shared}`,
    `## Sua direção\n\n${block.replace(/^## /, '### ')}`,
    `## Regras lidas\n\n${rules.map(([r, s]) => note(src.rules, r, s).replace(/^# /, '### ').replace(/^## /gm, '#### ')).join('\n\n')}`,
    rest.length && `## Outras regras do catálogo\n\nSó se a opção precisar: \`node scripts/explore-ref.mjs --conceito <nome> uso\`.\n\n${rest.join('\n')}`,
    `## Referências\n\n${refs.length ? refs.map((r) => note(src.refs, r).replace(/^# /, '### ').replace(/^## /gm, '#### ')).join('\n\n') : 'A direção não cita uma referência do catálogo: as do designer estão na Direção visual do brief. Mais seções ou outra nota: `node scripts/explore-ref.mjs <nome> <seções>`.'}`,
    pattern && `## Padrão de interação\n\n${padroes(src.interacoes, pattern)}`,
    interactive && teclas(src.interacoes),
    `## Direção: vocabulário e crítica (DIRECAO.md §3 e §7)\n\n${chapters(src.direcao, ['3', '7']).replace(/^## /gm, '### ')}`,
  ].filter(Boolean).join('\n\n') + '\n'
  // An interaction that names no pattern fails the run (the agent would build without its row); an unknown rule name only warns, since a hyphenated word of prose looks like one.
  const problems = [!pattern && !/est[aá]tic/i.test(interacao) && `nenhum padrão de \`--padroes\` em **Interação:** "${interacao.slice(0, 40)}"`].filter(Boolean)
  return { text: out, refs, pattern, interactive, problems, unknown, static: /est[aá]tic/i.test(interacao), rules: rules.map(([r]) => r) }
}

if (process.argv[1]?.endsWith('explore-pack.mjs')) {
  const [dir, flag, file] = process.argv.slice(2)
  const fail = (m) => { console.error(`erro: ${m}`); process.exit(1) }
  if (!dir) fail('uso: docs/explorations/<slug> [--direcoes <arquivo>]')
  if (flag && flag !== '--direcoes') fail(`opção desconhecida: ${flag}`)
  if (!existsSync(join(dir, 'brief.md'))) fail(`sem brief.md em ${dir}`)
  try {
    const { shared, options } = split(readFileSync(join(dir, 'brief.md'), 'utf8'))
    const picked = flag ? split(readFileSync(file, 'utf8')).options : options
    if (!picked.length) fail(`nenhum "## Opção N" em ${flag ? file : join(dir, 'brief.md')}`)
    const src = { refs: `${brain}references/analises`, rules: `${brain}references/conceitos`, interacoes: readFileSync(`${brain}references/interacoes.md`, 'utf8'), direcao: readFileSync(`${brain}DIRECAO.md`, 'utf8') }
    const slug = dir.replace(/\/+$/, '').split('/').pop()
    mkdirSync(join(dir, 'pack'), { recursive: true })
    let failed = 0
    for (const [n, block] of picked) {
      const p = pack(slug, shared, n, block, src)
      const to = join(dir, 'pack', `${n}.md`)
      writeFileSync(to, p.text)
      const warn = [!p.refs.length && 'nenhuma referência do catálogo', p.unknown.length && `regra desconhecida em **Regras:** ${p.unknown.join(', ')}`].filter(Boolean)
      console.log(`${to} · ${(p.text.length / 1000).toFixed(1)} KB · refs: ${p.refs.join(', ') || '—'} · padrão: ${p.pattern ?? '—'} · regras: ${p.rules.join(', ')}${warn.length ? ` · aviso: ${warn.join('; ')}` : ''}`)
      for (const m of p.problems) { console.error(`erro: Opção ${n}: ${m}`); failed++ }
    }
    if (failed) process.exit(1)
  } catch (e) { fail(e.message) }
}
