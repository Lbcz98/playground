import 'dotenv/config' // load .env before anything reads process.env
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { app, BrowserWindow } from 'electron'
import { registerIpcHandlers } from './ipc'
import { describeAiSetup } from './ai/providers'
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

      // Dev-only: run a script file in the renderer and log what it returns — a
      // way to drive the real window (live bundles, the real protocol) from a
      // terminal. SFS_EVAL_QUIT=1 closes the app afterwards.
      const evalFile = process.env.SFS_EVAL_FILE
      if (evalFile) {
        const { readFileSync } = await import('node:fs')
        try {
          const result = await win.webContents.executeJavaScript(readFileSync(evalFile, 'utf8'))
          console.log('[smoke:eval] result:', typeof result === 'string' ? result : JSON.stringify(result))
        } catch (err) {
          console.log('[smoke:eval] error:', err instanceof Error ? err.message : String(err))
        }
        if (process.env.SFS_EVAL_QUIT) app.quit()
      }

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
