import { cloneElement, isValidElement, type ReactNode } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import type { CanvasNode } from '@/model/nodeTree'
import { hydrateRegistry } from '@/design-system/registry'
import { interpretBlueprint } from '@/interpreter/interpret'
import { SCREENFLOW_MANIFEST } from '@/shared/design-system/screenflow-manifest'
import { screenLayersOf, screenModel } from '@/shared/design-system/screen-layers'
import { SCREEN_TEMPLATES, type ScreenTemplate, screenTemplate } from '@/shared/templates'
import { ScreenFrame } from './ScreenFrame'

/**
 * The screen templates, each rendered through the very frame the canvas uses
 * (`ScreenFrame`) from the very blueprint the agent copies — so the snapshot the
 * visual run writes is the screen, not an illustration of it.
 */
const REGISTRY = hydrateRegistry(SCREENFLOW_MANIFEST)
const LAYERS = screenLayersOf(SCREENFLOW_MANIFEST)

/** The canvas renderer without the editing chrome — no selection, no rings. */
function renderNode(node: CanvasNode): ReactNode {
  const entry = REGISTRY.get(node.type)
  if (!entry) return null
  const parsed = entry.schema.safeParse(node.props)
  const props = parsed.success ? (parsed.data as Record<string, unknown>) : entry.defaultProps
  // Keyed like the canvas does it — on the component's own element, so no
  // wrapper ever lands between a container and its children.
  const children = entry.acceptsChildren
    ? node.children.map((child) => {
        const rendered = renderNode(child)
        return isValidElement(rendered) ? cloneElement(rendered, { key: child.id }) : rendered
      })
    : null
  return entry.render(props, children)
}

function Template({ id }: { id: string }): ReactNode {
  const template = screenTemplate(id) as ScreenTemplate
  const result = interpretBlueprint(template.blueprint, SCREENFLOW_MANIFEST)
  if (!result.ok) return <pre>{result.error}</pre>
  const { tree } = result
  const model = screenModel(LAYERS, template.blueprint.screen?.model)
  return (
    <ScreenFrame
      tree={tree}
      layers={LAYERS}
      tokens={SCREENFLOW_MANIFEST.tokens}
      focusSide={model?.side ?? 'neutral'}
      renderNode={renderNode}
    />
  )
}

const meta = {
  title: 'Templates/Screens',
  component: Template,
  parameters: { layout: 'fullscreen' },
  argTypes: { id: { control: 'select', options: SCREEN_TEMPLATES.map((t) => t.id) } },
} satisfies Meta<typeof Template>

export default meta
type Story = StoryObj<typeof meta>

/** Nível 1 — the home screen: interactivity rail at rest, main menu, focus on the programme. */
export const Home: Story = { args: { id: 'home' } }
/** Nível 1 — the same screen while a notification shows in the top-right corner. */
export const HomeNotificacao: Story = { name: 'Home + Notificação', args: { id: 'home-notification' } }
/** Nível 2 — the rail entered: no menu, one card focused, the rest selected. */
export const InteratividadesBotoes: Story = {
  name: 'Interatividades · Botões Direita',
  args: { id: 'interactivity-buttons-right' },
}
/** Nível 3 — one interactivity on the right, its close button anchored. */
export const InteratividadesCardsDireita: Story = {
  name: 'Interatividades · Cards Direita',
  args: { id: 'interactivity-cards-right' },
}
/** Nível 3 — the same screen mirrored to the left. */
export const InteratividadesCardsEsquerda: Story = {
  name: 'Interatividades · Cards Esquerda',
  args: { id: 'interactivity-cards-left' },
}
/** Nível 0 — the clean broadcast with the interactivity alert bug. */
export const Alerta: Story = { args: { id: 'alert' } }
