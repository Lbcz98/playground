import React from 'react'
import ReactDOM from 'react-dom/client'
import * as ReactDOMFull from 'react-dom'
import { App } from '@/app/App'
// Self-hosted: the CSP has no font-src, so fonts fall back to default-src 'self'
// and a CDN copy would be blocked — and the packaged app has to work offline.
import '@fontsource-variable/inter'
// Foundational design-token layer — must load before index.css so every
// component (hand-authored or AI-generated) can reference the resulting
// var(--...) custom properties with no per-file import.
import '@/styles/global.css'
import './index.css'

// Phase 8A: the one deliberate global leak. A live design-system bundle
// (Phase 8B, loaded via a UMD <script> pointed at design-system://<id>/bundle.js)
// must run against THIS SAME React instance, not a second copy it bundles
// itself — two React copies in one page means "invalid hook call" the moment
// a bundle mounts. Exposing our own instances is what lets a UMD build declare
// react/react-dom as externals resolved to window.React / window.ReactDOM.
declare global {
  interface Window {
    React?: typeof React
    ReactDOM?: typeof ReactDOMFull
  }
}
window.React = React
window.ReactDOM = ReactDOMFull

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

// Dev-only seam so `SFS_SMOKE_PROMPT` (electron/main.ts) can drive a real
// generation through the full chat flow and render it on the canvas.
if (import.meta.env.DEV) {
  void Promise.all([import('@/store/chatStore'), import('@/store/flowStore')]).then(
    ([{ useChatStore }, { useFlowStore }]) => {
      const w = window as unknown as {
        __sfsSend?: (p: string) => Promise<void>
        __sfsReport?: () => unknown
      }
      w.__sfsSend = (p) => useChatStore.getState().send(p)
      w.__sfsReport = () => {
        const msgs = useChatStore.getState().messages
        const last = msgs[msgs.length - 1]
        return {
          text: last?.text,
          model: last?.model,
          provider: last?.provider,
          usage: last?.usage,
          steps: last?.steps,
          issues: last?.run && last.run.ok ? last.run.issues : undefined,
          nodeCount: last?.run && last.run.ok ? last.run.nodeCount : undefined,
          tree: useFlowStore.getState().tree,
        }
      }
    },
  )
}
