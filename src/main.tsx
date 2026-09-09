import React from 'react'
import ReactDOM from 'react-dom/client'
import { App } from '@/app/App'
import './index.css'

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
