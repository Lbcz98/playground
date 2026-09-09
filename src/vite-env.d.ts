/// <reference types="vite/client" />

import type { FlowBridge } from '../electron/preload'

declare global {
  interface Window {
    flow: FlowBridge
  }
}

export {}
