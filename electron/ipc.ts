import { ipcMain, type IpcMainInvokeEvent } from 'electron'
import { IPC, type GenerateUIResponse } from '@/shared/blueprint'
import { handleGenerateUI } from './ai/handler'

/**
 * The one privileged channel exposed to the renderer. All logic lives in
 * `ai/handler.ts`; this file only binds it to Electron IPC.
 */
export function registerIpcHandlers(): void {
  ipcMain.handle(
    IPC.generateUI,
    (_event: IpcMainInvokeEvent, rawRequest: unknown): Promise<GenerateUIResponse> =>
      handleGenerateUI(rawRequest),
  )
}
