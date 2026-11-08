import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))

/** @type {import('next').NextConfig} */
export default {
  // `npm run build:tv` builds into .next-tv, so the TV build never touches the .next a running `next start` serves.
  distDir: process.env.NEXT_DIST_DIR || '.next',
  // The kit, the tokens and `@/…` live in ../src: this app is a viewer for it, not a copy.
  experimental: { externalDir: true },
  outputFileTracingRoot: resolve(here, '..'),
  // The TV (and any other device on the LAN) opens the dev server by IP, which Next blocks by default.
  allowedDevOrigins: ['192.168.15.9', '192.168.*.*'], // <-- the only new line
  // No generated AGENTS.md from `next dev`: this repo's agent rules live in its own CLAUDE.md files.
  agentRules: false,
  // The dev overlay's "N" badge sits over the prototypes.
  devIndicators: false,
  webpack(config, { dev, isServer, webpack, defaultLoaders }) {
    // An explicit older target (`npm run build:tv`, Chrome 68): Next leaves its own server/ files untranspiled, and
    // next/dynamic pulls async-local-storage.js (`??=`) into the browser bundle, a SyntaxError there. Compile it too.
    if (process.env.BROWSERSLIST && !isServer) {
      const { loader, options } = defaultLoaders.babel
      config.module.rules.push({
        test: /next[\\/]dist[\\/](esm[\\/])?server[\\/]app-render[\\/]async-local-storage\.js$/,
        // The SWC loader skips node_modules unless the package is listed as one to transpile.
        use: { loader, options: { ...options, transpilePackages: ['next'] } },
      })
    }
    // Vite hands an imported .svg back as a URL string (the kit's icons are <img src>); so do we, inlined.
    const imageRule = config.module.rules.find((rule) => rule?.test instanceof RegExp && rule.test.test('.svg'))
    if (imageRule) imageRule.exclude = /\.svg$/i
    config.module.rules.push({ test: /\.svg$/i, type: 'asset', parser: { dataUrlCondition: { maxSize: Number.MAX_SAFE_INTEGER } } })
    // `import.meta.env.DEV` (Vite) → the Next mode.
    config.plugins.push(new webpack.DefinePlugin({ 'import.meta.env.DEV': JSON.stringify(dev) }))
    config.resolve.alias['@'] = resolve(here, '..', 'src')
    return config
  },
}