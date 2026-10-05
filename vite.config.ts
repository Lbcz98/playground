import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Shared by Storybook (react-vite reads it) and the render audit. The shared app is
// web/ (Next.js); this config only carries the `@` alias to the kit in src/.
export default defineConfig({
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  plugins: [react()],
})
