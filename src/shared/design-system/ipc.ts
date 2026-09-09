/**
 * IPC channel names for the design-system persistence layer (spec §9).
 *
 * The handlers themselves (Electron main `electron/storage.ts` + `electron/ipc.ts`)
 * and the preload bridge surface land in Phase 6B; the constants live here now so
 * both sides import one source of truth.
 */

export const DS_IPC = {
  /** main: return every persisted manifest (+ the built-in). */
  list: 'ds:list',
  /** main: write `<id>.json` to the userData design-systems directory. */
  save: 'ds:save',
  /** main: delete `<id>.json`. */
  delete: 'ds:delete',
  /** main: read the remembered active manifest id. */
  getActive: 'ds:getActive',
  /** main: persist the active manifest id. */
  setActive: 'ds:setActive',
} as const

export type DsIpcChannel = (typeof DS_IPC)[keyof typeof DS_IPC]
