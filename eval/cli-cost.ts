/**
 * Cost of one `claude -p` call, cold then warm: a tiny prompt, the planner prompt and the generator prompt, twice each.
 *   npx vite-node --config vitest.config.ts eval/cli-cost.ts            # default (not isolated)
 *   SFS_CLI_ISOLATE=1 npx vite-node --config vitest.config.ts eval/cli-cost.ts
 * About US$ 0.3 isolated (SFS_CLI_ISOLATE=1), ~US$ 0.8 not. Prints written / read / uncached input / output tokens and cost per call.
 */
import { claudeCliProvider } from '../electron/ai/providers/claudeCli'
import { buildPlannerPrompt, buildSystemPrompt } from '@/design-system/promptSpec'
import { SCREENFLOW_MANIFEST as M } from '@/shared/design-system/screenflow-manifest'

const REQUEST = 'Tela inicial do app com o placar do jogo, uma lista de notícias e um botão de assistir ao vivo.'
const mode = (process.env.MODE as 'faithful' | 'exploratory') || 'exploratory'
const cases = [
  { name: 'tiny', system: 'You are a terse echo bot.', user: 'Say ok', effort: 'low' },
  { name: 'planner', system: buildPlannerPrompt(M, { prompt: REQUEST, mode }), user: REQUEST, effort: 'low' },
  { name: 'generator', system: buildSystemPrompt('json', M, mode), user: `Plan:\n1. Root Stack\n2. Header with score\n3. News list\n4. Watch button\n\nRequest: ${REQUEST}`, effort: 'medium' },
]
let total = 0
for (const c of cases) {
  for (const n of [1, 2]) {
    const r = await claudeCliProvider.complete({ system: c.system, messages: [{ role: 'user', content: c.user }], effort: c.effort })
    const u = r.usage!
    total += u.costUsd ?? 0
    console.log(`${c.name.padEnd(10)} #${n} written ${u.cacheWriteTokens} read ${u.cacheReadTokens} in ${u.inputTokens} out ${u.outputTokens} $${u.costUsd?.toFixed(4)}  (system ${c.system.length} chars)`)
  }
}
console.log(`total $${total.toFixed(3)}`)
