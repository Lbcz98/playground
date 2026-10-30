import { describe, expect, it } from 'vitest'
import { skipBrowserTests } from './browser'

describe('browser coverage policy', () => {
  it('requires a browser by default, including with a bad executable path', () => {
    expect(skipBrowserTests({})).toBe(false)
    expect(skipBrowserTests({ CHROMIUM_PATH: '/nonexistent' })).toBe(false)
    expect(skipBrowserTests({ CI: 'true' })).toBe(false)
  })
  it('reports explicit local opt-out as skipped and forbids it in CI', () => {
    expect(skipBrowserTests({ SKIP_BROWSER_TESTS: '1' })).toBe(true)
    expect(() => skipBrowserTests({ CI: 'true', SKIP_BROWSER_TESTS: '1' })).toThrow('CI requires browser coverage')
  })
})
