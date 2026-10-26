/**
 * Mesurer (mesurer.dev: rulers, guides, measurements, inspect, X-ray, annotations) on the /tune stage.
 * The stage is plain JS with no bundler, so scripts/explore-server.mjs bundles this file once per run (esbuild, React included)
 * and serves it as /__explore/mesurer.js on /tune pages only. It starts minimized in the stage's top-left corner
 * (12px in, like the stage's own tools in the top-right), clear of the back button where Mesurer would put it.
 */
import { createRoot } from 'react-dom/client'
import { Mesurer, createLocalStoragePersistence, type MesurerPersistence } from 'mesurer'

// Mesurer's saved toolbar spot wins over `initialState.toolbarPosition`, and it always has one, so the start spot goes in as a saved default;
// `free`, because its default `snap` dock pins the toolbar to an edge's end (the back button again).
const saved = createLocalStoragePersistence(window, 'mesurer-tune')
const persistence: MesurerPersistence = {
  ...saved,
  load: () => {
    const s = saved.load()
    return { ...s, settings: { toolbarPosition: { x: 36, y: 84 }, toolbarDock: 'free', ...s?.settings }, workspace: s?.workspace ?? null }
  },
}

const host = Object.assign(document.createElement('div'), { id: 'tune-mesurer' })
document.body.append(host)
createRoot(host).render(<Mesurer persistence={persistence} initialState={{ minimized: true }} />)
