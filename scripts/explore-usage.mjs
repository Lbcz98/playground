// node scripts/explore-usage.mjs <exploration-dir> <role> [json-file]
// Appends one line to <dir>/usage.jsonl from a `claude -p --output-format json` result.
// The JSON may be a file or stdin. Missing usage fields count as 0. The script does not call Claude.
import { appendFileSync, mkdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const num = (u, k) => (typeof u?.[k] === 'number' ? u[k] : 0)

/** `{ input, output, cache_read, cache_write }` from a Claude JSON result. */
export function usageFrom(raw) {
  const data = typeof raw === 'string' ? JSON.parse(raw) : raw
  const u = data?.usage ?? data ?? {}
  return {
    input: num(u, 'input_tokens'),
    output: num(u, 'output_tokens'),
    cache_read: num(u, 'cache_read_input_tokens'),
    cache_write: num(u, 'cache_creation_input_tokens'),
  }
}

/** Appends one JSON line and returns the token counts. */
export function recordUsage(dir, role, raw) {
  const tokens = usageFrom(raw)
  mkdirSync(dir, { recursive: true })
  appendFileSync(join(dir, 'usage.jsonl'), JSON.stringify({ at: new Date().toISOString(), role, ...tokens }) + '\n')
  return tokens
}

if (process.argv[1]?.endsWith('explore-usage.mjs')) {
  const [dir, role, file] = process.argv.slice(2)
  const fail = (m) => { console.error(`erro: ${m}`); process.exit(1) }
  if (!dir || !role) fail('uso: <pasta da exploração> <papel> [arquivo.json]')
  const raw = file ? readFileSync(file, 'utf8') : readFileSync(0, 'utf8')
  try {
    const tokens = recordUsage(dir, role, raw)
    console.log(`${join(dir, 'usage.jsonl')} · ${role} · in ${tokens.input} · out ${tokens.output} · cache ${tokens.cache_read}+${tokens.cache_write}`)
  } catch (e) { fail(e.message) }
}
