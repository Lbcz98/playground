import 'dotenv/config' // load .env before anything reads process.env
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { app, BrowserWindow } from 'electron'
import { registerIpcHandlers } from './ipc'
import { describeAiSetup } from './ai/llm'
import { registerDesignSystemProtocolSchemes, installDesignSystemProtocolHandler } from './protocol'
import { palette } from '@/design-system/primitives'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Must run before app.whenReady() — Electron only honours privileged-scheme
// registration synchronously at module load (Phase 8A, see protocol.ts).
registerDesignSystemProtocolSchemes()

// Built by vite-plugin-electron:
//   dist-electron/main.js      <- this file (ESM)
//   dist-electron/preload.cjs  <- electron/preload.ts (CommonJS, for the sandbox)
// The packaged renderer lives in dist/.
const DIST_ELECTRON = __dirname
const DIST_RENDERER = path.join(__dirname, '../dist')
const DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL

function createWindow(): void {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1080,
    minHeight: 720,
    backgroundColor: palette.gray[100], // matches the renderer's `bg-page`
    title: 'ScreenFlow Studio',
    webPreferences: {
      preload: path.join(DIST_ELECTRON, 'preload.cjs'),
      // Full renderer sandbox: no Node, isolated JS world, preload limited to the
      // `electron` module. The API key and every LLM call stay in this process;
      // the renderer only ever sees validated Blueprint JSON over the IPC bridge.
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  })

  if (DEV_SERVER_URL) {
    void win.loadURL(DEV_SERVER_URL)
    win.webContents.openDevTools({ mode: 'detach' })
    // Dev-only: confirm the preload bridge is wired, and optionally run one real
    // generation through the full pipeline when SFS_SMOKE_PROMPT is set.
    win.webContents.on('did-finish-load', async () => {
      const t = await win.webContents.executeJavaScript('typeof window.flow?.generateUI')
      console.log(`[main] bridge: window.flow.generateUI is ${t} · AI: ${await describeAiSetup()}`)

      const smoke = process.env.SFS_SMOKE_PROMPT
      if (smoke) {
        console.log(`[smoke] generating (rendering to canvas): ${JSON.stringify(smoke)}`)
        const report = await win.webContents.executeJavaScript(
          `(async () => {
             for (let i = 0; i < 40 && !window.__sfsSend; i++) await new Promise(r => setTimeout(r, 100))
             await window.__sfsSend?.(${JSON.stringify(smoke)})
             return JSON.stringify(window.__sfsReport?.() ?? {})
           })()`,
        )
        console.log('[smoke] report:\n' + report)
      }

      // Dev-only: round-trips the design-system:// protocol end-to-end exactly
      // as Phase 8B will actually consume it — a <script> tag load, governed
      // by script-src (NOT fetch, which is a different CSP directive we did
      // NOT open up) — save a throwaway manifest, attach a bundle, load it,
      // clean up. Phase 8A acceptance without touching rendering.
      if (process.env.SFS_BUNDLE_SMOKE) {
        console.log('[smoke:bundle] round-tripping the design-system:// protocol…')
        const result = await win.webContents.executeJavaScript(`
          (async () => {
            const id = 'sfs-smoke-' + Date.now()
            const manifest = {
              id, name: 'Smoke', version: '1.0.0',
              tokens: { colors: {}, spacing: {}, typography: {} },
              components: { Box: { id: 'Box', name: 'Box', description: '', acceptsChildren: true, props: {} } },
            }
            function loadScript(src) {
              return new Promise((resolve) => {
                const s = document.createElement('script')
                s.src = src
                s.onload = () => resolve(true)
                s.onerror = () => resolve(false)
                document.head.appendChild(s)
              })
            }
            try {
              await window.flow.designSystems.save(manifest)
              const beforeBundle = await window.flow.designSystems.hasBundle(id)
              await window.flow.designSystems.saveBundle(id, 'window.__sfsSmokeBundle = { hi: 1 }')
              const afterBundle = await window.flow.designSystems.hasBundle(id)

              const wrongPathLoaded = await loadScript('design-system://' + id + '/other.js')
              const bundleLoaded = await loadScript('design-system://' + id + '/bundle.js')
              const sideEffect = window.__sfsSmokeBundle

              await window.flow.designSystems.remove(id)
              return JSON.stringify({ beforeBundle, afterBundle, wrongPathLoaded, bundleLoaded, sideEffect })
            } catch (err) {
              await window.flow.designSystems.remove(id).catch(() => {})
              return JSON.stringify({ error: String(err) })
            }
          })()
        `)
        console.log('[smoke:bundle] result:', result)
      }

      // Dev-only: Phase 8B end-to-end — import components, attach a live
      // bundle, render a node with it (real markup, not the generic
      // placeholder), crash one deliberately (error boundary catches it,
      // canvas survives), then fix the prop and confirm it recovers.
      if (process.env.SFS_LIVE_SMOKE) {
        console.log('[smoke:live] exercising Phase 8B live rendering…')
        const result = await win.webContents.executeJavaScript(`
          (async () => {
            const { useDesignSystemStore } = await import('/src/store/designSystemStore.ts')
            const { useFlowStore } = await import('/src/store/flowStore.ts')
            const id = 'sfs-live-smoke'
            const ds = useDesignSystemStore
            const flow = useFlowStore

            const componentsJson = {
              components: {
                Hero: { displayName: 'Hero', props: { title: { required: false, type: { name: 'string' } } } },
                Crasher: { displayName: 'Crasher', props: { title: { required: false, type: { name: 'string' } } } },
              },
            }
            const bundleCode = [
              '(function(){',
              "  var h = window.React.createElement;",
              '  function Hero(props) { return h("div", { "data-live": "hero", className: props.className, onClick: props.onClick }, "LIVE:" + (props.title || "")) }',
              '  function Crasher(props) {',
              '    if (props.title === "boom") throw new Error("intentional crash for testing");',
              '    return h("div", { "data-live": "crasher" }, "ok:" + (props.title || ""));',
              '  }',
              '  window.__sfsDesignSystem = { Hero: Hero, Crasher: Crasher };',
              '})();',
            ].join('\\n')

            function mk(type, props) {
              return { id: 'n_' + Math.random().toString(16).slice(2, 10), type, props: props || {}, children: [] }
            }
            async function waitForBundle() {
              for (let i = 0; i < 50; i++) {
                const s = ds.getState().liveComponents[id]
                if (s && s !== 'loading') return s
                await new Promise((r) => setTimeout(r, 100))
              }
              return ds.getState().liveComponents[id]
            }

            try {
              await ds.getState().importStorybook(componentsJson, { id, name: 'LiveSmoke', version: '1.0.0' })
              const bundleResult = await ds.getState().importBundle(bundleCode)
              const bundleState = await waitForBundle()
              const registryAfterLoad = {
                liveCount: ds.getState().registry.liveCount,
                genericCount: ds.getState().registry.genericCount,
                heroLive: ds.getState().registry.get('Hero')?.live,
              }

              flow.getState().replaceDocument(mk('Hero', { title: 'hi' }), 'live smoke: hero')
              await new Promise((r) => setTimeout(r, 50))
              const heroEl = document.querySelector('[data-canvas-theme] [data-live="hero"]')
              const heroText = heroEl?.textContent
              flow.getState().select(flow.getState().tree.id)
              await new Promise((r) => setTimeout(r, 50))
              const heroSelectedClass = document.querySelector('[data-canvas-theme] [data-live="hero"]')?.className
              flow.getState().select(null)
              await new Promise((r) => setTimeout(r, 50))
              document.querySelector('[data-canvas-theme] [data-live="hero"]')?.click()
              await new Promise((r) => setTimeout(r, 50))
              const selectedAfterClick = flow.getState().selectedId === flow.getState().tree.id
              flow.getState().select(null)

              flow.getState().replaceDocument(mk('Crasher', { title: 'boom' }), 'live smoke: crash')
              await new Promise((r) => setTimeout(r, 50))
              const crashedText = document.body.innerText.includes('crashed')

              const rootId = flow.getState().tree.id
              flow.getState().updateNodeProps(rootId, { title: 'fixed' })
              await new Promise((r) => setTimeout(r, 50))
              const recoveredText = document.querySelector('[data-canvas-theme] [data-live="crasher"]')?.textContent
              const stillCrashed = document.body.innerText.includes('crashed')

              await ds.getState().remove(id)
              return JSON.stringify({
                bundleResult, bundleState: bundleState && Object.keys(bundleState),
                registryAfterLoad, heroText, heroSelectedClass, selectedAfterClick, crashedText, recoveredText, stillCrashed,
              })
            } catch (err) {
              await ds.getState().remove(id).catch(() => {})
              return JSON.stringify({ error: String(err && err.stack || err) })
            }
          })()
        `)
        console.log('[smoke:live] result:', result)
      }
    })
  } else {
    void win.loadFile(path.join(DIST_RENDERER, 'index.html'))
  }
}

app.whenReady().then(() => {
  installDesignSystemProtocolHandler()
  registerIpcHandlers()
  createWindow()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
