import { describe, expect, it } from 'vitest'
import { nearestToken, tokensFrom } from './nearest-token'

const TOKENS = tokensFrom(`
| \`color.semantic.functional.status-live\` | #FD4142 | x |
| \`color.semantic.functional.text-inverse\` | #000000 | x |
| \`dimension.radius.semantic.card\` | 24px | x |
| \`dimension.radius.semantic.pill\` | 100px | x |
`)

describe('nearestToken', () => {
  it('picks the closest length, with the distance', () => {
    expect(nearestToken('30px', TOKENS)).toMatchObject({ token: { path: 'dimension.radius.semantic.card' }, distance: '6px' })
  })
  it('picks the closest color by RGB', () => {
    expect(nearestToken('#e10600', TOKENS)?.token.path).toBe('color.semantic.functional.status-live')
  })
  it('says nothing for a value of a kind no token has', () => {
    expect(nearestToken('150ms', TOKENS)).toBeUndefined()
  })
})
