import { ipcMain, type IpcMainInvokeEvent } from 'electron'
import { IPC, type GenerateUIResponse } from '@/shared/blueprint'
import { DS_IPC } from '@/shared/design-system/ipc'
import { handleGenerateUI } from './ai/handler'
import {
  deleteDesignSystem,
  getActiveDesignSystemId,
  listDesignSystems,
  saveDesignSystem,
  setActiveDesignSystemId,
} from './storage'

/**
 * The privileged channels exposed to the renderer. Logic lives in `ai/handler.ts`
 * and `storage.ts`; this file only binds it to Electron IPC.
 */
export function registerIpcHandlers(): void {
  ipcMain.handle(
    IPC.generateUI,
    (_event: IpcMainInvokeEvent, rawRequest: unknown): Promise<GenerateUIResponse> =>
      handleGenerateUI(rawRequest),
  )

  // Design-system persistence (spec §9).
  ipcMain.handle(DS_IPC.list, () => listDesignSystems())
  ipcMain.handle(DS_IPC.save, (_e, manifest: unknown) => saveDesignSystem(manifest))
  ipcMain.handle(DS_IPC.delete, (_e, id: unknown) => deleteDesignSystem(id))
  ipcMain.handle(DS_IPC.getActive, () => getActiveDesignSystemId())
  ipcMain.handle(DS_IPC.setActive, (_e, id: unknown) => setActiveDesignSystemId(id))
}
