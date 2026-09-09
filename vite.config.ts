import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import electron from 'vite-plugin-electron/simple'
import renderer from 'vite-plugin-electron-renderer'

// The renderer is a sandboxed Chromium window: no Node integration, context isolation on.
// All privileged work (LLM calls, API keys) happens in electron/main.ts and is reached
// through the typed bridge exposed by electron/preload.ts.
const alias = {
  '@': fileURLToPath(new URL('./src', import.meta.url)),
}

export default defineConfig({
  resolve: { alias },
  plugins: [
    react(),
    electron({
      main: {
        entry: 'electron/main.ts',
        // The `@/shared/*` modules are imported by main, preload and renderer alike.
        vite: {
          resolve: { alias },
          build: {
            rollupOptions: {
              // Keep the Node SDKs as runtime requires instead of bundling them
              // into main.js (the Anthropic SDK uses dynamic imports and would
              // otherwise force code-splitting).
              external: ['@anthropic-ai/sdk', 'dotenv'],
            },
          },
        },
      },
      preload: {
        input: 'electron/preload.ts',
        vite: {
          resolve: { alias },
          build: {
            rollupOptions: {
              output: {
                // The plugin emits CJS content but, under `"type": "module"`,
                // names it `.mjs` — which Electron then loads as ESM and chokes on
                // (`require is not defined`). Force an unambiguous `.cjs` so the
                // sandboxed preload loads as CommonJS.
                format: 'cjs',
                entryFileNames: '[name].cjs',
                chunkFileNames: '[name].cjs',
                inlineDynamicImports: true,
              },
            },
          },
        },
      },
      renderer: {},
    }),
    renderer(),
  ],
})
