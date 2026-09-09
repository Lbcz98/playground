import { contextBridge, ipcRenderer } from 'electron'
import {
  IPC,
  type ChatTurn,
  type GenerateOptions,
  type GenerateUIRequest,
  type GenerateUIResponse,
} from '@/shared/blueprint'

/**
 * The single, audited surface between the sandboxed renderer and the privileged
 * main process. The renderer can ask for UI to be generated; it can never see the
 * API key, the model config, or the raw network call — only validated Blueprint
 * JSON comes back.
 */
const bridge = {
  version: process.versions.electron,
  platform: process.platform,

  /** Ask the main-process orchestrator to turn a prompt into a Blueprint document. */
  generateUI(
    prompt: string,
    history: ChatTurn[] = [],
    options: GenerateOptions = {},
  ): Promise<GenerateUIResponse> {
    const request: GenerateUIRequest = { prompt, history, options }
    return ipcRenderer.invoke(IPC.generateUI, request)
  },
} as const

export type FlowBridge = typeof bridge

contextBridge.exposeInMainWorld('flow', bridge)
