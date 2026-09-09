import { contextBridge, ipcRenderer } from 'electron'
import {
  IPC,
  type ChatTurn,
  type GenerateOptions,
  type GenerateUIRequest,
  type GenerateUIResponse,
} from '@/shared/blueprint'
import type { DesignSystemManifest } from '@/shared/design-system/manifest'
import { DS_IPC } from '@/shared/design-system/ipc'

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
    manifest?: DesignSystemManifest,
  ): Promise<GenerateUIResponse> {
    const request: GenerateUIRequest = { prompt, history, options, manifest }
    return ipcRenderer.invoke(IPC.generateUI, request)
  },

  /** Design-system library persistence (spec §9). */
  designSystems: {
    list(): Promise<DesignSystemManifest[]> {
      return ipcRenderer.invoke(DS_IPC.list)
    },
    save(manifest: DesignSystemManifest): Promise<DesignSystemManifest> {
      return ipcRenderer.invoke(DS_IPC.save, manifest)
    },
    remove(id: string): Promise<void> {
      return ipcRenderer.invoke(DS_IPC.delete, id)
    },
    getActiveId(): Promise<string | null> {
      return ipcRenderer.invoke(DS_IPC.getActive)
    },
    setActiveId(id: string): Promise<void> {
      return ipcRenderer.invoke(DS_IPC.setActive, id)
    },
  },
} as const

export type FlowBridge = typeof bridge

contextBridge.exposeInMainWorld('flow', bridge)
