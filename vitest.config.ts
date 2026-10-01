import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

// Standalone config — no Electron plugin, so main-process modules can be unit
// tested as plain Node ESM. The `@` alias matches tsconfig.
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    include: ['electron/**/*.test.ts', 'src/**/*.test.{ts,tsx}', 'scripts/**/*.test.ts', 'tests/**/*.test.ts', 'eval/**/*.test.ts'],
  },
})
