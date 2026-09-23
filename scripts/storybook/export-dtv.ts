/**
 * `npm run dtv:export` — the DTV design system as an EXTERNAL import, built from
 * nothing but what Storybook documents and the DTCG tokens:
 *
 *   dist-dtv/dtv-storybook.json  Storybook's components manifest, cut to the DTV
 *                                system, with tokens/tokens.json carried inside —
 *                                Design system › Import Storybook JSON…
 *   dist-dtv/dtv.bundle.js       the same components as a live bundle (react and
 *                                react-dom from the app's window globals) —
 *                                Design system › Import component bundle…
 *
 * The DTV system is every `UI Kit/*` and `Primitives/*` component, less the
 * overlays: the engine paints those from the screen's layer model, a Blueprint
 * never places one. `Canvas Kit/*` (ScreenFlow's own Tailwind layout) and
 * `Templates/*` stay out.
 *
 * `--from=<dir>` reads an existing `storybook build` instead of building one.
 */
import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { build } from 'vite'
import { storybookComponentSources } from '../../src/shared/design-system/storybook-adapter'
import { LIVE_BUNDLE_GLOBAL } from '../../src/design-system/liveBundle'

const ROOT = fileURLToPath(new URL('../..', import.meta.url))
const OUT = join(ROOT, 'dist-dtv')
const from = process.argv.find((arg) => arg.startsWith('--from='))?.slice('--from='.length)

/** The Storybook component ids that make up the DTV system. */
const DTV = /^(ui-kit|primitives)-/
const ENGINE_DRAWN = /^ui-kit-overlay/

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)

function storybookBuild(): string {
  const dir = mkdtempSync(join(tmpdir(), 'sfs-storybook-'))
  const result = spawnSync(join(ROOT, 'node_modules', '.bin', 'storybook'), ['build', '--test', '--quiet', '-o', dir], {
    cwd: ROOT,
    stdio: ['ignore', 'ignore', 'inherit'],
  })
  if (result.status !== 0) {
    console.error('storybook build failed.')
    process.exit(1)
  }
  return dir
}

const dir = from ?? storybookBuild()
try {
  const manifest = JSON.parse(readFileSync(join(dir, 'manifests', 'components.json'), 'utf8'))
  const components = Object.fromEntries(
    Object.entries(manifest.components as Record<string, unknown>).filter(([id]) => DTV.test(id) && !ENGINE_DRAWN.test(id)),
  ) as Record<string, Record<string, unknown>>

  mkdirSync(OUT, { recursive: true })
  const exported = {
    ...manifest,
    name: 'DTV',
    version: JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')).version,
    components,
    tokens: JSON.parse(readFileSync(join(ROOT, 'tokens', 'tokens.json'), 'utf8')),
  }
  writeFileSync(join(OUT, 'dtv-storybook.json'), `${JSON.stringify(exported, null, 2)}\n`)

  // The bundle maps each component's imported name to the export docgen found it at.
  const imports: string[] = []
  const entries: string[] = []
  for (const [i, { name, entry }] of storybookComponentSources({ components }).entries()) {
    const docgen = entry.reactDocgen
    if (!isObject(docgen) || typeof docgen.definedInFile !== 'string' || typeof docgen.exportName !== 'string') continue
    imports.push(`import { ${docgen.exportName} as C${i} } from ${JSON.stringify(docgen.definedInFile)}`)
    entries.push(`  ${JSON.stringify(name.replace(/[^A-Za-z0-9_]/g, ''))}: C${i},`)
  }
  const entryFile = join(dir, 'dtv-bundle-entry.ts')
  writeFileSync(entryFile, `${imports.join('\n')}\n\n;(window as any).${LIVE_BUNDLE_GLOBAL} = {\n${entries.join('\n')}\n}\n`)

  await build({
    configFile: false,
    root: ROOT,
    logLevel: 'warn',
    resolve: { alias: { '@': join(ROOT, 'src') } },
    // Classic JSX against the app's React (window.React), never a second copy.
    esbuild: { jsx: 'transform', jsxFactory: 'React.createElement', jsxFragment: 'React.Fragment', jsxInject: "import React from 'react'" },
    define: { 'process.env.NODE_ENV': '"production"' },
    build: {
      outDir: OUT,
      emptyOutDir: false,
      minify: false,
      lib: { entry: entryFile, formats: ['iife'], name: 'sfsDtvBundle', fileName: () => 'dtv.bundle.js' },
      rollupOptions: {
        external: ['react', 'react-dom'],
        output: { globals: { react: 'React', 'react-dom': 'ReactDOM' } },
      },
    },
  })

  console.log(`Wrote dist-dtv/dtv-storybook.json (${Object.keys(components).length} story components) and dist-dtv/dtv.bundle.js (${entries.length} components).`)
} finally {
  if (!from) rmSync(dir, { recursive: true, force: true })
}
