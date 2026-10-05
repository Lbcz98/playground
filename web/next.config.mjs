import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))

/** @type {import('next').NextConfig} */
export default {
  // The kit, the tokens and `@/…` live in ../src: this app is a viewer for it, not a copy.
  experimental: { externalDir: true },
  webpack(config, { dev, webpack }) {
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
