// The kit is written for Vite; these are the three Vite-isms it leans on, answered for Next.
declare module '*.svg' {
  const url: string
  export default url
}
interface ImportMeta {
  readonly env: { readonly DEV: boolean; readonly PROD: boolean; readonly MODE: string }
}
interface Window {
  /** Electron preload bridge; absent on the web. */
  flow?: any
}
