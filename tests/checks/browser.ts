import { describe, it } from 'vitest'

/** Browser coverage is required by default. Only a deliberate local opt-out is a skip. */
export function skipBrowserTests(env: NodeJS.ProcessEnv): boolean {
  if (env.SKIP_BROWSER_TESTS !== '1') return false
  if (env.CI && env.CI !== 'false' && env.CI !== '0') throw new Error('SKIP_BROWSER_TESTS=1 is a local opt-out; CI requires browser coverage.')
  return true
}

export const browserDescribe = describe.skipIf(skipBrowserTests(process.env))
export const browserIt = it.skipIf(skipBrowserTests(process.env))
