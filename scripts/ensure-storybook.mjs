/**
 * Starts Storybook in the background if it is not already listening, so the Storybook MCP
 * (`.mcp.json` → http://localhost:6006/mcp) is there when Claude Code opens in this repo.
 * Run by the SessionStart hook in `.claude/settings.json`. Never blocks and never fails the session.
 */
import { spawn } from 'node:child_process'
import { openSync } from 'node:fs'
import { createConnection } from 'node:net'
import { fileURLToPath } from 'node:url'

const PORT = 6006
const ROOT = fileURLToPath(new URL('..', import.meta.url))

const listening = await new Promise((resolve) => {
  const socket = createConnection({ port: PORT, host: '127.0.0.1' })
  socket.once('connect', () => (socket.destroy(), resolve(true)))
  socket.once('error', () => resolve(false))
})

if (listening) {
  console.log(`Storybook já está em http://localhost:${PORT}`)
} else {
  const log = openSync(`${ROOT}/.storybook-mcp.log`, 'a')
  const child = spawn('npx', ['storybook', 'dev', '-p', String(PORT), '--ci', '--no-open'], { cwd: ROOT, detached: true, stdio: ['ignore', log, log] })
  child.unref()
  console.log(`Storybook iniciando em http://localhost:${PORT} (log em .storybook-mcp.log); o MCP fica pronto em cerca de 10 s.`)
}
