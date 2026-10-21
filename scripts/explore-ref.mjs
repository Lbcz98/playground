// node scripts/explore-ref.mjs --list [filtro]            one line per reference: nome | padrão | tags | resumo (no match: the whole catalog)
// node scripts/explore-ref.mjs <nome> [seções…]           only those sections of one anatomy note (default: cerne receita)
// node scripts/explore-ref.mjs --teclas                   the keys inside a card (design-brain/references/interacoes.md)
// node scripts/explore-ref.mjs --padroes [nome]           the interaction patterns, or only one row
// The /explore agents use this instead of reading the reference files whole, so only what a direction needs enters their context.
// Sections: cerne pecas tipografia posicao cor hierarquia interacao minucias porque receita falhas | tudo
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../design-brain/references/', import.meta.url))
const plain = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
const KEYS = { cerne: 'cerne', pecas: 'pecas', tipografia: 'tipografia', posicao: 'posicao', cor: 'cor', hierarquia: 'hierarquia', interacao: 'interacao', minucias: 'minucias', por: 'porque', receita: 'receita', falhas: 'falhas' }

// "## Posição e espaço" → key "posicao"; text without the heading line.
export const sections = (md) => {
  const out = {}
  let key = null
  for (const line of md.split('\n')) {
    const h = /^## (.+)/.exec(line)
    if (h) { key = KEYS[plain(h[1]).split(/\s+/)[0]] ?? plain(h[1]); out[key] = []; continue }
    if (key) out[key].push(line)
  }
  return Object.fromEntries(Object.entries(out).map(([k, v]) => [k, v.join('\n').trim()]))
}

// The three lines under the title: Tags, Padrão, Resumo.
export const head = (md) => {
  const field = (name) => new RegExp(`^${name}:\\s*(.*)$`, 'mi').exec(md.split(/^## /m)[0])?.[1].trim() ?? ''
  return { tags: field('Tags'), padrao: field('Padr[aã]o'), resumo: field('Resumo') }
}

const names = (dir) => (existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith('.md')).map((f) => f.slice(0, -3)).sort() : [])

export const catalog = (dir, filter = '') => {
  const f = plain(filter)
  return names(dir)
    .map((n) => { const h = head(readFileSync(`${dir}/${n}.md`, 'utf8')); return `${n} | ${h.padrao} | ${h.tags} | ${h.resumo}` })
    .filter((line) => plain(line).includes(f))
}

// A filter that matches nothing still answers with the whole catalog, so the caller needs no second call.
export const listing = (dir, filter = '') => {
  const hit = catalog(dir, filter)
  return hit.length ? hit.join('\n') : [`nenhuma referência com "${filter}"; o catálogo inteiro:`, ...catalog(dir)].join('\n')
}

export const note = (dir, name, wanted = ['cerne', 'receita']) => {
  const all = names(dir)
  const hit = all.includes(name) ? [name] : all.filter((n) => plain(n).includes(plain(name)))
  if (hit.length !== 1) throw new Error(`${hit.length ? 'mais de uma referência' : 'nenhuma referência'} para "${name}": ${(hit.length ? hit : all).join(', ')}`)
  const sec = sections(readFileSync(`${dir}/${hit[0]}.md`, 'utf8'))
  const keys = wanted.includes('tudo') ? Object.keys(sec) : wanted.map(plain)
  const bad = keys.filter((k) => !(k in sec))
  if (bad.length) throw new Error(`seção desconhecida: ${bad.join(', ')}. Use: ${Object.keys(sec).join(' ')} | tudo`)
  return `# ${hit[0]}\n${keys.map((k) => `## ${k}\n${sec[k]}`).join('\n')}`
}

// interacoes.md: "Teclas dentro do card" (and what follows from it), and the pattern table.
export const teclas = (md) => `## Teclas${md.split(/^## Teclas/m)[1]?.split(/^## Padrões/m)[0] ?? ''}`.trim()
export const padroes = (md, name) => {
  const table = md.split(/^## Padrões/m)[1] ?? ''
  const rows = table.split('\n').filter((l) => l.startsWith('|'))
  const [header, rule, ...body] = rows
  const picked = name ? body.filter((r) => plain(r.split('|')[1] ?? '').includes(plain(name))) : body
  if (!picked.length) throw new Error(`nenhum padrão para "${name}": ${body.map((r) => r.split('|')[1].replace(/\*/g, '').trim()).join(', ')}`)
  return [header, rule, ...picked].join('\n')
}

// By name, not import.meta.url: bundled into design-brain/dist/server.mjs, import.meta.url is the server itself.
if (process.argv[1]?.endsWith('explore-ref.mjs')) {
  const dir = `${root}analises`
  const [a, ...rest] = process.argv.slice(2)
  const fail = (m) => { console.error(`erro: ${m}`); process.exit(1) }
  try {
    if (a === '--list') console.log(listing(dir, rest.join(' ')))
    else if (a === '--teclas') console.log(teclas(readFileSync(`${root}interacoes.md`, 'utf8')))
    else if (a === '--padroes') console.log(padroes(readFileSync(`${root}interacoes.md`, 'utf8'), rest.join(' ')))
    else if (a) console.log(note(dir, a, rest.length ? rest : undefined))
    else fail('uso: --list [filtro] | <nome> [seções…] | --teclas | --padroes [nome]')
  } catch (e) { fail(e.message) }
}
