/**
 * `npm run tokens:audit` — prints which tokens the component layers reference,
 * by tier, as Markdown (see scripts/tokens/audit.ts).
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { auditComponents, renderAudit } from './tokens/audit'
import { TOKENS_SOURCE } from './tokens/compile'

const ROOT = fileURLToPath(new URL('..', import.meta.url))

console.log(renderAudit(auditComponents(ROOT, JSON.parse(readFileSync(join(ROOT, TOKENS_SOURCE), 'utf8')))))
