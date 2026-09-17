import type { CSSProperties, ReactNode } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Stack, Text, spacing, token } from '@/primitives'
import { DTV_SCREEN_LAYERS } from '@/shared/design-system/screen-layers'
import { SCREEN_MODEL_IDS, ScreenOverlay } from './Overlay'

/**
 * The layer rule (Camadas): each screen model's shades over a flat stand-in for
 * the video, as in the Figma Modelos table. The regression run renders each at
 * 1280×720.
 */
const backdrop: CSSProperties = {
  position: 'relative',
  overflow: 'hidden',
  backgroundColor: token('--color-semantic-theme-day-light'),
}

function Screen({ children }: { children: ReactNode }): ReactNode {
  return <div style={{ ...backdrop, width: '100vw', height: '100vh' }}>{children}</div>
}

const meta = {
  title: 'UI Kit/Overlay/Screen models',
  component: ScreenOverlay,
  parameters: { layout: 'fullscreen' },
  argTypes: { model: { control: 'select', options: SCREEN_MODEL_IDS } },
  decorators: [
    (Story) => (
      <Screen>
        <Story />
      </Screen>
    ),
  ],
} satisfies Meta<typeof ScreenOverlay>

export default meta
type Story = StoryObj<typeof meta>

/** Nível 0 — an alert bug on the clean broadcast. */
export const Alerta: Story = { args: { model: 'alert' } }
/** Nível 0 — a notification on the clean broadcast; no scrim. */
export const Notificacao: Story = { name: 'Notificação', args: { model: 'notification' } }
/** Nível 1 — the home screen. */
export const Home: Story = { args: { model: 'home' } }
/** Nível 1 — the home screen with a notification. */
export const HomeNotificacao: Story = { name: 'Home + Notificação', args: { model: 'home-notification' } }
/** Nível 1 — home buttons on the right. */
export const HomeBotoesDireita: Story = { name: 'Home · Botões Direita', args: { model: 'home-buttons-right' } }
/** Nível 1 — home buttons on the left. */
export const HomeBotoesEsquerda: Story = { name: 'Home · Botões Esquerda', args: { model: 'home-buttons-left' } }
/** Nível 2 — a focused rail on the right. */
export const InteratividadesBotoesDireita: Story = {
  name: 'Interatividades · Botões Direita',
  args: { model: 'interactivity-buttons-right' },
}
/** Nível 2 — a focused rail on the left. */
export const InteratividadesBotoesEsquerda: Story = {
  name: 'Interatividades · Botões Esquerda',
  args: { model: 'interactivity-buttons-left' },
}
/** Nível 3 — one interactivity on the right. */
export const InteratividadesCardsDireita: Story = {
  name: 'Interatividades · Cards Direita',
  args: { model: 'interactivity-cards-right' },
}
/** Nível 3 — one interactivity on the left. */
export const InteratividadesCardsEsquerda: Story = {
  name: 'Interatividades · Cards Esquerda',
  args: { model: 'interactivity-cards-left' },
}

const tile: CSSProperties = { ...backdrop, aspectRatio: '16 / 9' }

/** Every model, by navigation level. */
export const AllModels: Story = {
  args: { model: 'home' },
  decorators: [(Story) => <Story />],
  render: () => (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: spacing('sm'),
        padding: spacing('xl'),
        backgroundColor: token('--color-semantic-functional-background-primary'),
      }}
    >
      {DTV_SCREEN_LAYERS.models.map((model) => (
        <Stack key={model.id} gap="2xs">
          <div style={tile}>
            <ScreenOverlay model={model.id} />
          </div>
          <Text variant="footnote-medium" color="secondary">
            {`Nível ${model.level} · ${model.name}`}
          </Text>
        </Stack>
      ))}
    </div>
  ),
}
