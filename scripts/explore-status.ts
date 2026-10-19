/**
 * Talks to a running `explore:serve` without curl, reading its url and token from the server's log.
 *
 *   npm run explore:status -- <folder> pending
 *   npm run explore:status -- <folder> <comment id> <aplicando|aplicado|falhou> ["one-line summary"]
 *   npm run explore:status -- <folder> get <figma|judge?option=N>      read one of the server's GET answers
 *   npm run explore:status -- <folder> post <figma-state|tune-apply> '<json>'   write through the server (figma.json, tuned values)
 *
 * Prints the server's JSON answer; exit 1 when the server is gone (stopped or idle).
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
      : what === 'get' ? await fetch(`${url}__explore/${status}${status.includes('?') ? '&' : '?'}token=${token}`)
      : what === 'post' && /^(figma-state|tune-apply)$/.test(status) ? await fetch(`${url}__explore/${status}`, { method: 'POST', headers: { 'x-explore-token': token }, body: summary })
      : await fetch(`${url}__explore/status`, { method: 'POST', headers: { 'x-explore-token': token }, body: JSON.stringify({ id: Number(what), status, summary }) })
    console.log(await r.text())
  } catch {
    console.error('servidor parado')
    process.exit(1)
  }
}

if (!process.env.VITEST) void main()
