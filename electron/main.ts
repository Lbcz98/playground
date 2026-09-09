import 'dotenv/config' // load .env before anything reads process.env
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { app, BrowserWindow } from 'electron'
import { registerIpcHandlers } from './ipc'
import { describeAiSetup } from './ai/llm'
import { palette } from '@/design-system/primitives'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

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
    // Dev-only: confirm the preload bridge is wired (no LLM call — that would bill).
    win.webContents.on('did-finish-load', () => {
      void win.webContents
        .executeJavaScript('typeof window.flow?.generateUI')
        .then(async (t) =>
          console.log(`[main] bridge: window.flow.generateUI is ${t} · AI: ${await describeAiSetup()}`),
        )
    })
  } else {
    void win.loadFile(path.join(DIST_RENDERER, 'index.html'))
  }
}

app.whenReady().then(() => {
  registerIpcHandlers()
  createWindow()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
