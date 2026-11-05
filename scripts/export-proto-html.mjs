/**
 * `npm run export:html -- <designer>/<fluxo>` — um fluxo de web/protos/<designer>/<fluxo>/ num único .html
 * compartilhável: o player, as telas, o kit, os tokens, a fonte e as imagens vão dentro do arquivo, que abre
 * com dois cliques, sem servidor. Sai em dist-share/<designer>-<fluxo>.html.
 *
 * O arquivo roda o mesmo `Flow` do app (setas e Enter, Esc volta, R reinicia). Só o que vem de fora continua
 * fora: o vídeo ao vivo (hls.js pela rede e a playlist do designer, que pode expirar).
 */
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { build } from 'vite'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const target = process.argv.slice(2).find((a) => !a.startsWith('-'))
const match = target && /^([\w-]+)\/([\w-]+)$/.exec(target)
if (!match) {
  console.error('uso: npm run export:html -- <designer>/<fluxo>   (ex.: lucas/bug-home-login)')
  process.exit(1)
}
const [, designer, flow] = match
const folder = `web/protos/${designer}/${flow}`
try {
  readFileSync(join(ROOT, folder, 'flow.ts'))
} catch {
  console.error(`${folder}/flow.ts não existe: ${target} não é um fluxo.`)
  process.exit(1)
}

const ENTRY = join(ROOT, `.export-html-entry-${designer}-${flow}.tsx`)
writeFileSync(
  ENTRY,
  `import { createRoot } from 'react-dom/client'
import '/src/styles/global.css'
import '/src/index.css'
import { Flow } from '/web/app/[designer]/[screen]/FlowPlayer'

const states = import.meta.glob('/${folder}/*.tsx')
const loadState = (name: string) => {
  const load = states['/${folder}/' + name + '.tsx']
  return load ? load() : Promise.reject(new Error('sem tela ' + name))
}
createRoot(document.getElementById('root')!).render(<Flow flow={() => import('/${folder}/flow.ts')} state={loadState as never} />)
`,
)

let output
try {
  const result = await build({
    root: ROOT,
    configFile: false,
    logLevel: 'warn',
    plugins: [react()],
    // Uma cópia só do React: as telas de web/ e o kit de src/ não podem ter cada um o seu (os hooks não achariam o dispatcher).
    resolve: { alias: { '@': join(ROOT, 'src') }, dedupe: ['react', 'react-dom'] },
    build: {
      write: false,
      assetsInlineLimit: Number.MAX_SAFE_INTEGER,
      cssCodeSplit: false,
      chunkSizeWarningLimit: 100000,
      rollupOptions: { input: ENTRY, output: { format: 'es', codeSplitting: false } },
    },
  })
  output = (Array.isArray(result) ? result[0] : result).output
} finally {
  rmSync(ENTRY, { force: true })
}

const js = output.find((o) => o.type === 'chunk')?.code
const css = output.filter((o) => o.type === 'asset' && o.fileName.endsWith('.css')).map((o) => String(o.source)).join('\n')
if (!js) throw new Error('o bundle não gerou JavaScript')

// A fonte do kit (Inter, só o latim: o suficiente para o português), embutida.
const woff2 = readFileSync(join(ROOT, 'node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2')).toString('base64')
const font = `@font-face{font-family:'Inter Variable';font-style:normal;font-display:swap;font-weight:100 900;src:url(data:font/woff2;base64,${woff2}) format('woff2-variations')}`

const html = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${designer}/${flow} · Playground DTV</title>
<style>${font}</style>
<style>${css}</style>
<style>html,body{margin:0}body{font-family:'Inter Variable',system-ui,sans-serif}</style>
</head>
<body>
<div id="root"></div>
<script type="module">${js.replace(/<\/script/gi, '<\\/script')}</script>
</body>
</html>
`

mkdirSync(join(ROOT, 'dist-share'), { recursive: true })
const file = join(ROOT, 'dist-share', `${designer}-${flow}.html`)
writeFileSync(file, html)
console.log(`Wrote ${file} (${(html.length / 1024 / 1024).toFixed(1)} MB)`)
