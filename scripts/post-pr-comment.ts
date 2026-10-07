/**
 * `npm run pr:comment -- report.md` — one sticky comment per pull request.
 * Finds the comment holding the marker and updates it, else creates it. The markdown always goes to
 * $GITHUB_STEP_SUMMARY. On a fork, or with a read-only token, nothing is posted and the exit is 0.
 */
import { spawnSync } from 'node:child_process'
import { appendFileSync, readFileSync } from 'node:fs'
import { MARKER } from './pr-report'

export interface PostOptions {
  repo: string
  pr: number
  fork?: boolean
  gh?: (args: string[]) => { status: number | null; stdout: string; stderr: string }
}

const realGh = (args: string[]) => spawnSync('gh', args, { encoding: 'utf8' })

/** Returns what it did: 'created', 'updated', or 'skipped: <why>'. */
export function postComment(body: string, o: PostOptions): string {
  if (o.fork) return 'skipped: pull request from a fork (read-only token)'
  const gh = o.gh ?? realGh
  const base = `repos/${o.repo}/issues`
  const list = gh(['api', '--paginate', `${base}/${o.pr}/comments`, '--jq', `.[] | select(.body | contains("${MARKER}")) | .id`])
  if (list.status !== 0) return denied('list', list.stderr)
  const id = list.stdout.split('\n').find((l) => l.trim())?.trim()
  const w = id ? gh(['api', '-X', 'PATCH', `${base}/comments/${id}`, '-f', `body=${body}`]) : gh(['api', '-X', 'POST', `${base}/${o.pr}/comments`, '-f', `body=${body}`])
  if (w.status !== 0) return denied('write', w.stderr)
  return id ? 'updated' : 'created'
}

function denied(step: string, stderr: string): string {
  if (/403|resource not accessible|forbidden/i.test(stderr)) return `skipped: the token cannot ${step} comments (read-only)`
  throw new Error(`pr:comment: could not ${step} the comment: ${stderr.trim()}`)
}

if (!process.env.VITEST) {
  const file = process.argv.slice(2).find((a) => a !== '--')
  if (!file) {
    console.error('usage: npm run pr:comment -- report.md')
    process.exit(2)
  }
  const body = readFileSync(file, 'utf8')
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, body)
  const event = process.env.GITHUB_EVENT_PATH ? JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8')) : {}
  const pr = event.pull_request?.number
  const repo = process.env.GITHUB_REPOSITORY
  if (!pr || !repo) console.log('pr:comment: not a pull request run, nothing to post')
  else console.log(`pr:comment: ${postComment(body, { repo, pr, fork: event.pull_request.head?.repo?.fork === true })}`)
}
