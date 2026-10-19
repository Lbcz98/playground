/**
 * Talks to a running `explore:serve` without curl, reading its url and token from the server's log.
 *
 *   npm run explore:status -- <folder> pending
 *   npm run explore:status -- <folder> <comment id> <aplicando|aplicado|falhou> ["one-line summary"]
 *
 * Prints the server's JSON answer; exit 1 when the server is gone (stopped or idle).
 * Plain `node`, not vite-node: it is called twice per comment, and it needs nothing but Node.
 */
import { readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, join, resolve } from 'node:path'

async function main() {
  const [dir, what, status, summary] = process.argv.slice(2).filter((a) => a !== '--')
  const ready = readFileSync(join(tmpdir(), `explore-${basename(resolve(dir ?? ''))}.log`), 'utf8')
    .split('\n').reverse().find((l) => l.startsWith('READY '))
  if (!what || !ready) return void console.error('uso: explore:status <pasta> pending | <id> <status> [resumo]'), process.exit(1)
  const { url, token } = JSON.parse(ready.slice(6))
  try {
    const r = what === 'pending'
      ? await fetch(`${url}__explore/pending?token=${token}`)
      : await fetch(`${url}__explore/status`, { method: 'POST', headers: { 'x-explore-token': token }, body: JSON.stringify({ id: Number(what), status, summary }) })
    console.log(await r.text())
  } catch {
    console.error('servidor parado')
    process.exit(1)
  }
}

void main()
