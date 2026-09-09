import { Toolbar } from './Toolbar'
import { DesignSystemSwitcher } from './DesignSystemSwitcher'
import { ComponentPalette } from './ComponentPalette'
import { LayersPanel } from './LayersPanel'
import { PropertyInspector } from './PropertyInspector'
import { AgentPanel } from './AgentPanel'
import { Canvas } from '@/canvas/Canvas'
import { DesignSystemProvider } from '@/design-system/DesignSystemProvider'

export function App(): JSX.Element {
  return (
    <DesignSystemProvider>
      <div className="flex h-full flex-col bg-page font-sans text-ink">
        <Toolbar />
        <div className="flex min-h-none flex-1">
          <aside className="flex w-panel-sm flex-col gap-lg overflow-auto border-r border-line bg-surface p-lg">
            <DesignSystemSwitcher />
            <ComponentPalette />
            <LayersPanel />
          </aside>

          <main className="flex min-w-none flex-1">
            <Canvas />
          </main>

          <aside className="flex w-panel-lg flex-col overflow-hidden border-l border-line bg-surface">
            <div className="max-h-inspector shrink-0 overflow-auto border-b border-line">
              <PropertyInspector />
            </div>
            <AgentPanel />
          </aside>
        </div>
      </div>
    </DesignSystemProvider>
  )
}
