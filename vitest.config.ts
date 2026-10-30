import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

// The `@` alias matches tsconfig.
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    // The checker builds a TypeScript program per screen: well under a second alone, seconds on a loaded full run.
    testTimeout: 30_000,
    include: ['src/**/*.test.{ts,tsx}', 'scripts/**/*.test.ts', 'tests/**/*.test.ts'],
  },
})
