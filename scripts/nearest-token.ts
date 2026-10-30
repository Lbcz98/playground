/**
 * Nearest token for tuned values: `npm run nearest-token -- "144px" "#e10600" "72%"`.
 * Reads web/protos/generated/tokens.md (the tokens a screen can name) and prints, per value, the closest one and the distance.
 * Lengths and opacities compare by number, colors by RGB. The proto writer uses it for the "O que fere o sistema" table.
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

export interface Token {
  path: string
  value: string
}

const TOKENS = fileURLToPath(new URL('../web/protos/generated/tokens.md', import.meta.url))

export const tokensFrom = (md: string): Token[] =>
  [...md.matchAll(/^\| `([\w.-]+)` \| ([^|]+?) \|/gm)].map((m) => ({ path: m[1], value: m[2] }))

const rgb = (hex: string): number[] => {
  const h = hex.slice(1)
  const full = h.length <= 4 ? [...h].map((c) => c + c).join('') : h
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16))
}

/** The closest token of the same kind as `value` (px, %, or #hex), with the distance in that kind's unit. */
export function nearestToken(value: string, tokens: Token[]): { token: Token; distance: string } | undefined {
  const v = value.trim()
  if (v.startsWith('#')) {
    const a = rgb(v)
    const best = tokens
      .filter((t) => t.value.startsWith('#'))
      .map((token) => ({ token, d: Math.hypot(...rgb(token.value).map((c, i) => c - a[i])) }))
      .sort((x, y) => x.d - y.d)[0]
    return best && { token: best.token, distance: `${best.d.toFixed(0)} de 441 (RGB)` }
  }
  const unit = v.match(/(px|%)$/)?.[1]
  if (!unit) return undefined
  const n = parseFloat(v)
  const best = tokens
    .filter((t) => t.value.endsWith(unit) && !Number.isNaN(parseFloat(t.value)))
    .map((token) => ({ token, d: Math.abs(parseFloat(token.value) - n) }))
    .sort((x, y) => x.d - y.d)[0]
  return best && { token: best.token, distance: `${best.d}${unit}` }
}

if (!process.env.VITEST) {
  const tokens = tokensFrom(readFileSync(TOKENS, 'utf8'))
  for (const v of process.argv.slice(2)) {
    const hit = nearestToken(v, tokens)
    console.log(hit ? `${v} → ${hit.token.path} (${hit.token.value}), distância ${hit.distance}` : `${v} → nenhum token desse tipo`)
  }
}
