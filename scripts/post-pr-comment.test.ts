import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { afterAll, describe, expect, it } from 'vitest'
import { MARKER } from './pr-report'
import { postComment } from './post-pr-comment'

// A `gh` that keeps the comments of one pull request in a file, as GitHub would. READONLY=1 answers 403 to writes.
const tmp = mkdtempSync(join(tmpdir(), 'comment-test-'))
afterAll(() => rmSync(tmp, { recursive: true, force: true }))
const bin = join(tmp, 'bin')
const store = join(tmp, 'comments.json')
mkdirSync(bin)
writeFileSync(
  join(bin, 'gh'),
  `#!/usr/bin/env node
const fs = require('fs')
const a = process.argv.slice(2)
const f = ${JSON.stringify(store)}
const all = fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : []
const body = (a.find((x) => x.startsWith('body=')) || '').slice(5)
const write = a.includes('-X')
if (write && process.env.READONLY) { console.error('HTTP 403: Resource not accessible by integration'); process.exit(1) }
if (!write) { console.log(all.filter((c) => c.body.includes(${JSON.stringify(MARKER)})).map((c) => c.id).join('\\n')); process.exit(0) }
if (a[a.indexOf('-X') + 1] === 'POST') all.push({ id: 100 + all.length, body })
else all.find((c) => String(c.id) === a[a.indexOf('-X') + 2].split('/').pop()).body = body
fs.writeFileSync(f, JSON.stringify(all))
`,
)
chmodSync(join(bin, 'gh'), 0o755)

const gh = (args: string[]) => spawnSync(join(bin, 'gh'), args, { encoding: 'utf8', env: process.env })
const comments = (): { id: number; body: string }[] => (existsSync(store) ? JSON.parse(readFileSync(store, 'utf8')) : [])
const o = { repo: 'o/r', pr: 7, gh }

describe('postComment', () => {
  it('creates once, then updates the same comment', () => {
    rmSync(store, { force: true })
    writeFileSync(join(tmp, 'other'), '')
    expect(postComment(`${MARKER}\nfirst`, o)).toBe('created')
    expect(postComment(`${MARKER}\nsecond`, o)).toBe('updated')
    expect(comments()).toEqual([{ id: 100, body: `${MARKER}\nsecond` }])
  })
  it('leaves other comments alone', () => {
    writeFileSync(store, JSON.stringify([{ id: 5, body: 'a human wrote this' }]))
    expect(postComment(`${MARKER}\nx`, o)).toBe('created')
    expect(comments().map((c) => c.id)).toEqual([5, 101])
  })
  it('does nothing, without failing, on a fork', () => {
    rmSync(store, { force: true })
    expect(postComment(`${MARKER}\nx`, { ...o, fork: true })).toMatch(/^skipped/)
    expect(comments()).toEqual([])
  })
  it('does nothing, without failing, with a read-only token', () => {
    rmSync(store, { force: true })
    process.env.READONLY = '1'
    try {
      expect(postComment(`${MARKER}\nx`, o)).toMatch(/^skipped.*read-only/)
    } finally {
      delete process.env.READONLY
    }
    expect(comments()).toEqual([])
  })
})
