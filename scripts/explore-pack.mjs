// node scripts/explore-pack.mjs docs/explorations/<slug>                        one pack/<N>.md per "## Opção N" of brief.md
// node scripts/explore-pack.mjs docs/explorations/<slug> --direcoes <file>      the same for the "## Opção N" blocks of another file (variations, more options)
// A pack is what one proto-explorer needs besides DESIGN.md: the shared brief, its own direction only, the rule, reference,
// pattern and key notes that direction names, and 2 or 3 gold cards (contact sheet + notes). /explore builds it once after
// the plan, so the parallel agents read one file instead of each running the same dozen explore-ref.mjs calls.
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { catalog, note, padroes, teclas } from './explore-ref.mjs'
import { flag } from './explore-economy.mjs'

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

/**
 * A direction with no keys: "estático", or a visual-only line such as "nenhuma (só visual)".
 * "nenhuma" counts only as the statement of the line, so a pattern note that happens to say it does not.
 */
export const isStatic = (interacao) => {
  const t = plain(interacao).trim()
  if (!t) return false
  if (/\b(estatico|so visual|apenas visual|visual only|no interaction)\b/.test(t)) return true
  // "interação" still has letters after the stem, so the stem cannot end on a word boundary.
  if (/\b(sem interac|nenhuma interac|sem tecla)/.test(t)) return true
  return /^nenhuma\b/.test(t)
}

/** Names from `names` that occur in `text`, in the order they appear there. */
export const named = (text, names) => {
  const t = plain(text)
  return names.map((n) => [n, t.indexOf(plain(n))]).filter(([, i]) => i >= 0).sort((a, b) => a[1] - b[1]).map(([n]) => n)
}

/** "## 3. …" chapters of DIRECAO.md, by number. */
export const chapters = (md, nums) => md.split(/^(?=## )/m).filter((c) => nums.some((n) => c.startsWith(`## ${n}.`))).map((c) => c.trim()).join('\n\n')

const SKIP_TOPIC = new Set(['COVERAGE', 'process'])
const DIRECTION_IN_PACK = ['direction-vocabulary', 'direction-boldness', 'direction-critique']
const TOPIC_ORDER = ['focal-point', 'type', 'color', 'surfaces', 'elevation', 'frame', 'principles', 'icons', 'focus', 'remote-keys', 'motion', 'arrangement', 'repeated-items', 'data-card', 'imagery']
const CRAFT_ALWAYS = ['page', 'severity', 'report', 'compare']
const REPEAT_RE = /\b(dias|horas|passos|chips|itens|fileira|trilho)\b/
const DATA_RE = /\b(dado|dados|numero|temperatura|grafico|chart|clima|metrica|eixo|previsao|status|barra)\b/
const ICON_RE = /\b(icone|icones|icon|glifo|simbolo|pictograma)\b/
const ELEVATION_RE = /\b(sombra|elevacao|elevado|profundidade|vidro|blur|overlay)\b/
const IMAGE_RE = /\b(imagem|imagens|foto|poster|arte|scrim|retrato|elenco|ilustra)\b/

/**
 * Topic files an option's pack pastes. Static vs interactive, data vs not, and the concept names decide it.
 * The brief's **Foco:** label is the focal group, not the focus ring, so it does not pull `focus`.
 */
export function selectTopics({ shared = '', block = '', interactive = false, rules = [], lean = false } = {}) {
  // The brief's **Foco:** line names the focal group. It is not a request to draw the focus ring.
  const text = plain(`${shared}\n${block}`).replace(/^.*\bfoco:.*$/gm, '')
  const names = new Set(['focal-point', 'type', 'color', 'surfaces', 'elevation', 'frame', 'principles', 'icons'])
  // lean_pack: a static brief draws no focus ring, so the word "foco" alone does not pull the topic; only the rule does.
  if (interactive || rules.includes('foco-e-selecao') || (!lean && /\bfoco\b|\bselecion/.test(text))) names.add('focus')
  if (interactive) { names.add('remote-keys'); names.add('motion') }
  if (interactive || rules.includes('esqueleto-fixo') || rules.includes('rotulo-inequivoco') || REPEAT_RE.test(text)) {
    names.add('arrangement')
    names.add('repeated-items')
  }
  if (rules.includes('tipografia-de-detalhe') || DATA_RE.test(text)) names.add('data-card')
  if (IMAGE_RE.test(text)) names.add('imagery')
  // lean_pack: icons and elevation are core topics only when the brief or the direction speaks of them.
  if (lean && !ICON_RE.test(text)) names.delete('icons')
  if (lean && !ELEVATION_RE.test(text)) names.delete('elevation')
  return TOPIC_ORDER.filter((n) => names.has(n))
}

/** `design-brain/rules/*.md` except the index and the process doc. `null` when the folder is absent. */
export function loadTopicDir(dir) {
  if (!dir || !existsSync(dir)) return null
  const out = {}
  for (const f of readdirSync(dir)) {
    if (!f.endsWith('.md')) continue
    const name = f.slice(0, -3)
    if (SKIP_TOPIC.has(name)) continue
    out[name] = readFileSync(join(dir, f), 'utf8').trim()
  }
  return out
}

/** `design-brain/rules/craft/*.md`. */
export function loadCraftDir(dir) {
  if (!dir || !existsSync(dir)) return null
  const out = {}
  for (const f of readdirSync(dir)) {
    if (!f.endsWith('.md')) continue
    out[f.slice(0, -3)] = readFileSync(join(dir, f), 'utf8').trim()
  }
  return out
}

/** Craft files for a set of topics: the four that every judgment needs, then one per topic that has a check. */
export function selectCraft(topicNames, craft) {
  if (!craft) return []
  return [...CRAFT_ALWAYS, ...topicNames].filter((n, i, all) => craft[n] && all.indexOf(n) === i)
}

/** The judge's only read: the craft checks for the topics in play. */
export function judgeText(topicNames, craft) {
  const body = selectCraft(topicNames, craft).map((n) => craft[n]).join('\n\n')
  return `# Checagens do juiz\n\nLeia só este arquivo. Não abra DESIGN.md, playbook.md, judge.md nem os tópicos que não estão aqui.\n\n${body}\n`
}

/** `loop_cap`: the explorer's look-and-fix limit. Pasted into the pack, so the agent never reads the switch. */
export const LOOP_CAP = `## Limite do olhar (loop_cap)

- Uma só chamada Bash para checar e fotografar: \`node scripts/check-explore-tokens.mjs <alvo> && node scripts/check-explore-layout.mjs <alvo> --shots "$TMPDIR/explore-shots"\` (com \`--keys ArrowRight,Enter\` se a opção é interativa). Sem uma chamada por checagem.
- No máximo **2 rodadas** de olhar e corrigir. Depois da segunda, pare: o que ainda falha vai no relatório como \`ainda aberto: <o quê>\`, sem uma terceira volta.
- Leia só o \`opcao-<N>-folha.png\` da sua opção (ou o PNG de repouso). Nunca outra opção, e nunca releia um PNG \`inalterado:\`.`

/** lean_pack: the lines of a pasted note that only matter to modes this option does not use. */
const ROW_BULLET = /fileira|escolhid[oa]s? (inverte|invert)|op[cç][oõ]es n[aã]o escolhidas|tr[eê]s perfis|sete dias|nome de uma op[cç][aã]o/i
const CONTROL_BULLET = /foco do controle|a intera[cç][aã]o troca|visualiza[cç][aã]o muda/i
// Numbered rules about a selector, a chart or a video card: dead weight in a static option.
const CONTROL_ITEM = /\bselector\b|video card|\b(a|in a) chart\b/i
// Bullets of `principles` that only point at, or repeat, topics every pack already holds (focal-point, surfaces).
const DUP_BULLET = /^- \*\*Respiro:\*\*|^- \*\*Proximity:\*\*|^- \*\*Hierarchy:\*\*|^- Judge intent, not personal taste/
// Day and axis labels belong to repeated items.
const AXIS_ITEM = /\b(axis and day|day|axis) labels\b/i
// The explorer never interviews: that bullet is for the entrevista step.
const INTERVIEW_BULLET = /primeira pergunta da entrevista/i
const TOKEN = /--[a-z0-9]+(?:-[a-z0-9]+)+/g
/** A "uso" bullet that is only a token list already pasted in a topic of the same pack says nothing new. */
const repeatsTopic = (l, seen) => {
  if (!seen) return false
  const tokens = l.match(TOKEN) ?? []
  return tokens.length > 0 && l.length < 260 && tokens.every((t) => seen.includes(t))
}
export function leanNote(md, { row = false, interactive = false, seen = '' } = {}) {
  let inUse = false
  return md
    .split('\n')
    .filter((l) => {
      if (/^#{2,4} /.test(l)) inUse = /uso/i.test(l)
      if (/^\d+\. /.test(l)) return (interactive || !CONTROL_ITEM.test(l)) && (row || !AXIS_ITEM.test(l))
      if (!/^\s*- /.test(l)) return true
      if (INTERVIEW_BULLET.test(l) || DUP_BULLET.test(l)) return false
      if (!row && ROW_BULLET.test(l)) return false
      if (!interactive && CONTROL_BULLET.test(l)) return false
      return !(inUse && repeatsTopic(l, seen))
    })
    .join('\n')
    .replace(/^Applies when:.*\n+/m, '')
    .replace(/ ?\*Why:[^*\n]*\*/g, '')
}

const demote = (md) => md.replace(/^# /m, '### ').replace(/^## /gm, '#### ')

/**
 * `design-brain/toolbox/references/gold.json` plus each card's `why.md`.
 * `null` when the catalog is absent (a test fixture that does not ship the gold set).
 */
export function loadGold(dir) {
  const file = join(dir, 'gold.json')
  if (!existsSync(file)) return null
  const data = JSON.parse(readFileSync(file, 'utf8'))
  const cards = (data.cards ?? []).map((c) => {
    const whyFile = join(dir, c.id, 'why.md')
    if (!existsSync(whyFile)) throw new Error(`gold: sem why.md em ${c.id}`)
    return { ...c, why: readFileSync(whyFile, 'utf8').trim() }
  })
  return { sheet: data.sheet, cards }
}

/**
 * Two or three gold cards for one pack: the ones whose tags occur in the brief and the direction,
 * filled out to 2 when fewer match and capped at 3. Catalog order breaks a tie.
 */
export function pickGold(text, cards, { min = 2, max = 3 } = {}) {
  if (!cards?.length) return []
  const t = plain(text)
  const ranked = cards
    .map((c, i) => ({ c, i, score: (c.tags ?? []).filter((tag) => tag && t.includes(plain(tag))).length }))
    .sort((a, b) => b.score - a.score || a.i - b.i)
  const positive = ranked.filter((r) => r.score > 0).length
  const count = Math.min(cards.length, max, Math.max(Math.min(min, cards.length), Math.min(positive, max)))
  return ranked.slice(0, count).map((r) => r.c)
}

/** The few-shot block: the contact sheet plus the notes of the cards `pickGold` chose. Empty when there is no catalog. */
export function goldBlock(text, gold) {
  if (!gold?.cards?.length) return ''
  const picked = pickGold(text, gold.cards)
  const notes = picked.map((c) => `### ${c.title} (\`${c.id}\`)\n\n${c.why.replace(/^# .+\n+/, '')}`).join('\n\n')
  return [
    '## Exemplos bons (aprenda, não copie)',
    '',
    `Antes da primeira linha de CSS, leia a folha de contato \`${gold.sheet}\` (uma imagem) e as notas abaixo. São cards que o designer escolheu. Leve o respiro, a hierarquia, o alinhamento e o jeito como uma interação cabe no card. Não copie o assunto, o arranjo, as medidas nem as cores: o kit e o brief desta opção mandam. Não abra o HTML desses exemplos para reaproveitar o código.`,
    '',
    notes,
  ].join('\n')
}

const nameOf = (line) => line.split(' | ')[0]
const patternNames = (md) => (md.split(/^## Padrões/m)[1] ?? '').split('\n').filter((l) => /^\| \*\*/.test(l)).map((l) => l.split('|')[1].replace(/\*/g, '').trim())

/** One option's pack and what went into it. `src` holds the folders and files it reads, so a test can give its own. */
export function pack(slug, shared, n, block, src) {
  const loopCap = src.loopCap ?? flag('loop_cap')
  const refNames = catalog(src.refs).map(nameOf), ruleNames = catalog(src.rules).map(nameOf)
  const refs = named(field(block, 'Refer[eê]ncias?'), refNames).slice(0, 3)
  const interacao = field(block, 'Intera[cç][aã]o')
  const pattern = named(interacao, patternNames(src.interacoes))[0]
  const visualOnly = isStatic(interacao)
  const interactive = Boolean(pattern) && !visualOnly
  const regras = field(block, 'Regras')
  const asked = named(regras, ruleNames)
  // Only a token shaped like a rule name (a-b-c) can be a typo of one; prose such as "nenhuma" or "e" is not a rule.
  const unknown = regras.split(/[,;\s/()]+/).map((w) => w.replace(/[`.*]/g, '')).filter((w) => /^[a-z0-9]+(-[a-z0-9]+)+$/.test(plain(w)) && !asked.some((r) => plain(w).includes(plain(r))))
  const lean = src.lean ?? flag('lean_pack')
  const rules = [...ALWAYS, ...(interactive ? [['foco-e-selecao', MORE]] : []), ...asked.map((r) => [r, MORE])]
    .filter(([r], i, all) => ruleNames.includes(r) && all.findIndex(([x]) => x === r) === i)
  const rest = catalog(src.rules).filter((l) => !rules.some(([r]) => r === nameOf(l)))

  const gold = goldBlock(`${shared}\n${block}`, src.gold)
  const topicNames = src.topics ? selectTopics({ shared, block, interactive, rules: rules.map(([r]) => r), lean }) : []
  const row = topicNames.includes('repeated-items')
  const topicText = topicNames.filter((name) => src.topics[name]).map((name) => leanNote(src.topics[name], { row, interactive })).join('\n')
  const trim = (md) => (lean ? leanNote(md, { row, interactive, seen: topicText }) : md)
  const topicBodies = topicNames.filter((name) => src.topics[name]).map((name) => demote(lean ? leanNote(src.topics[name], { row, interactive }) : src.topics[name]))
  // lean_pack: boldness and critique are the art director's reading; the explorer works from the brief's Direção visual.
  // A brief that already holds the Direção visual block has its vague words turned into mechanisms; the vocabulary table adds nothing.
  const directed = lean && /Dire[cç][aã]o visual/.test(shared)
  const directionBodies = (src.topics && !directed ? (lean ? DIRECTION_IN_PACK.slice(0, 1) : DIRECTION_IN_PACK).filter((name) => src.topics[name]).map((name) => demote(src.topics[name])) : [])
  const direction = directed ? '' : directionBodies.length
    ? `## Direção\n\n${directionBodies.join('\n\n')}`
    : src.direcao && `## Direção: vocabulário e crítica (DIRECAO.md §3 e §7)\n\n${chapters(src.direcao, ['3', '7']).replace(/^## /gm, '### ')}`
  const out = [
    `# Pacote da Opção ${n} · ${slug}`,
    `Gerado por \`scripts/explore-pack.mjs\` a partir do brief; não edite, rode de novo. As regras desta opção estão nos tópicos abaixo. Não leia \`design-brain/DESIGN.md\`, \`playbook.md\`, \`judge.md\` nem \`DIRECAO.md\` inteiros: onde um tópico e uma nota de conceito divergirem, o tópico vence.`,
    loopCap && LOOP_CAP,
    `## Brief (comum a todas as opções)\n\n${shared}`,
    `## Sua direção\n\n${block.replace(/^## /, '### ')}`,
    gold,
    topicBodies.length && `## Tópicos desta opção\n\n${topicBodies.join('\n\n')}`,
    `## Regras lidas\n\n${rules.map(([r, s]) => trim(note(src.rules, r, lean && r === 'ponto-focal' ? MORE : s)).replace(/^# /, '### ').replace(/^## /gm, '#### ')).join('\n\n')}`,
    rest.length && (lean
      ? `## Outras regras do catálogo\n\nLista: \`node scripts/explore-ref.mjs --conceitos\`. Só se a opção precisar: \`--conceito <nome> uso\`.`
      : `## Outras regras do catálogo\n\nSó se a opção precisar: \`node scripts/explore-ref.mjs --conceito <nome> uso\`.\n\n${rest.join('\n')}`),
    `## Referências\n\n${refs.length ? refs.map((r) => note(src.refs, r).replace(/^# /, '### ').replace(/^## /gm, '#### ')).join('\n\n') : 'A direção não cita uma referência do catálogo: as do designer estão na Direção visual do brief. Mais seções ou outra nota: `node scripts/explore-ref.mjs <nome> <seções>`.'}`,
    pattern && `## Padrão de interação\n\n${padroes(src.interacoes, pattern)}`,
    interactive && teclas(src.interacoes),
    direction,
  ].filter(Boolean).join('\n\n') + '\n'
  // An interaction that names no pattern fails the run (the agent would build without its row); an unknown rule name only warns, since a hyphenated word of prose looks like one.
  const problems = [!pattern && !visualOnly && `nenhum padrão de \`--padroes\` em **Interação:** "${interacao.slice(0, 40)}"`].filter(Boolean)
  return { text: out, refs, pattern, interactive, problems, unknown, static: visualOnly, rules: rules.map(([r]) => r), topics: topicNames, gold: src.gold ? pickGold(`${shared}\n${block}`, src.gold.cards).map((c) => c.id) : [] }
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
    const src = { refs: `${brain}references/analises`, rules: `${brain}references/conceitos`, interacoes: readFileSync(`${brain}references/interacoes.md`, 'utf8'), direcao: readFileSync(`${brain}DIRECAO.md`, 'utf8'), topics: loadTopicDir(`${brain}rules`), gold: loadGold(`${brain}toolbox/references`) }
    const craft = loadCraftDir(`${brain}rules/craft`)
    const slug = dir.replace(/\/+$/, '').split('/').pop()
    mkdirSync(join(dir, 'pack'), { recursive: true })
    let failed = 0
    const union = []
    for (const [n, block] of picked) {
      const p = pack(slug, shared, n, block, src)
      const to = join(dir, 'pack', `${n}.md`)
      writeFileSync(to, p.text)
      for (const t of p.topics) if (!union.includes(t)) union.push(t)
      const warn = [!p.refs.length && 'nenhuma referência do catálogo', p.unknown.length && `regra desconhecida em **Regras:** ${p.unknown.join(', ')}`].filter(Boolean)
      console.log(`${to} · ${(p.text.length / 1000).toFixed(1)} KB · refs: ${p.refs.join(', ') || '—'} · padrão: ${p.pattern ?? '—'} · regras: ${p.rules.join(', ')} · tópicos: ${p.topics.join(', ') || '—'} · ouro: ${p.gold.join(', ') || '—'}${warn.length ? ` · aviso: ${warn.join('; ')}` : ''}`)
      for (const m of p.problems) { console.error(`erro: Opção ${n}: ${m}`); failed++ }
    }
    if (craft && union.length) {
      const judge = join(dir, 'pack', 'judge.md')
      writeFileSync(judge, judgeText(union, craft))
      console.log(`${judge} · ${(judgeText(union, craft).length / 1000).toFixed(1)} KB · checagens: ${selectCraft(union, craft).join(', ')}`)
    }
    if (failed) process.exit(1)
  } catch (e) { fail(e.message) }
}
