// MCP server over the reference notes and the host repo's tokens. Text only: agents never see the reference images.
// Built to dist/server.mjs (npm run build), which is what the plugin runs, so the paths below are relative to dist/.
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { listing, note, padroes, teclas } from '../scripts/explore-ref.mjs'

const refs = fileURLToPath(new URL('../references/', import.meta.url))
const notes = join(refs, 'analises')
const interacoes = () => readFileSync(join(refs, 'interacoes.md'), 'utf8')

// The host repo's generated tokens, so nothing here goes stale; DESIGN_TOKENS_PATH for any other layout.
const tokensPath = () => [process.env.DESIGN_TOKENS_PATH, join(process.cwd(), 'tokens/tokens.json')].find((p) => p && existsSync(p))

// stdout carries JSON-RPC; diagnostics go to stderr.
console.error(`[design-brain] cwd=${process.cwd()} tokens=${tokensPath() ?? 'none'}`)

const text = (s) => ({ content: [{ type: 'text', text: s }] })
const server = new McpServer({ name: 'design-brain', version: '0.1.0' })

server.registerTool('list_references', {
  description: 'Catalog of reference notes, one line each: nome | padrão | tags | resumo. A filter word narrows it; no match returns the whole catalog.',
  inputSchema: { filter: z.string().optional() },
}, async ({ filter }) => text(listing(notes, filter)))

server.registerTool('get_reference', {
  description: 'Only the asked sections of one reference note (default: cerne, receita). Sections: cerne pecas tipografia posicao cor hierarquia interacao minucias porque receita falhas | tudo.',
  inputSchema: { name: z.string(), sections: z.array(z.string()).optional() },
}, async ({ name, sections }) => text(note(notes, name, sections?.length ? sections : undefined)))

server.registerTool('get_patterns', {
  description: 'The interaction pattern table, or only the row of one pattern by name.',
  inputSchema: { name: z.string().optional() },
}, async ({ name }) => text(padroes(interacoes(), name)))

server.registerTool('get_keys', {
  description: 'The remote-control keys inside a card.',
  inputSchema: {},
}, async () => text(teclas(interacoes())))

server.registerTool('get_tokens', {
  description: 'Design tokens from the host repo. No category: the top-level categories. With one (color, dimension, typography…): that subtree.',
  inputSchema: { category: z.string().optional() },
}, async ({ category }) => {
  const path = tokensPath()
  if (!path) return text('tokens/tokens.json not found in this repo; set DESIGN_TOKENS_PATH.')
  const tokens = JSON.parse(readFileSync(path, 'utf8'))
  if (!category) return text(`categories: ${Object.keys(tokens).join(', ')}`)
  if (!(category in tokens)) throw new Error(`no category "${category}": ${Object.keys(tokens).join(', ')}`)
  return text(JSON.stringify({ [category]: tokens[category] }, null, 2))
})

await server.connect(new StdioServerTransport())
