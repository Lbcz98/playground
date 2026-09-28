import type { CSSProperties, ReactNode } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Stack, Text, spacing, token } from '@/primitives'
import { OVERLAY_DIRECTIONS, Overlay, type OverlayDirection } from './Overlay'
import { WideButton } from './WideButton'

/**
 * A bright, flat stand-in for the video, so the shade reads clearly. The frame is
 * the story viewport — the regression run renders it at 1280×720.
 */
const backdrop: CSSProperties = {
  position: 'relative',
  overflow: 'hidden',
  backgroundColor: token('--color-semantic-theme-noite-light'),
}

function Screen({ children }: { children: ReactNode }): ReactNode {
  return <div style={{ ...backdrop, width: '100vw', height: '100vh' }}>{children}</div>
}

const meta = {
  title: 'UI Kit/Overlay',
  component: Overlay,
  parameters: { layout: 'fullscreen' },
  argTypes: { direction: { control: 'select', options: OVERLAY_DIRECTIONS } },
  decorators: [
    (Story) => (
      <Screen>
        <Story />
      </Screen>
    ),
  ],
} satisfies Meta<typeof Overlay>

export default meta
type Story = StoryObj<typeof meta>

/** The scrim alone — 10% black over the whole frame. */
export const Base: Story = { args: { direction: 'base' } }
/** Content anchored to the bottom edge. */
export const Bottom: Story = { args: { direction: 'bottom' } }
/** A panel or list on the left. */
export const Left: Story = { args: { direction: 'left' } }
/** A panel or list on the right. */
export const Right: Story = { args: { direction: 'right' } }
/** Content in the bottom-right corner. */
export const BottomRight: Story = { args: { direction: 'bottom-right' } }
/** Content in the bottom-left corner. */
export const BottomLeft: Story = { args: { direction: 'bottom-left' } }
/** A notification in the top-right corner — the shade without the scrim. */
export const TopRight: Story = { args: { direction: 'top-right' } }

const tile: CSSProperties = { ...backdrop, aspectRatio: '16 / 9' }

/** Every direction side by side. */
export const AllDirections: Story = {
  args: {},
  decorators: [(Story) => <Story />],
  render: () => (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: spacing('sm'),
        padding: spacing('xl'),
        backgroundColor: token('--color-semantic-functional-background-primary'),
      }}
    >
      {OVERLAY_DIRECTIONS.map((direction: OverlayDirection) => (
        <Stack key={direction} gap="2xs">
          <div style={tile}>
            <Overlay direction={direction} />
          </div>
          <Text variant="footnote-medium" color="secondary">
            {direction}
          </Text>
        </Stack>
      ))}
    </div>
  ),
}

/**
 * A template in miniature: background → overlay → content. The overlay follows the
 * content's corner, and every value on the screen is a token.
 */
export const InATemplate: Story = {
  args: { direction: 'bottom-left' },
  render: (args) => (
    <>
      <Overlay {...args} />
      <div style={{ position: 'absolute', left: spacing('xl'), bottom: spacing('xl') }}>
        <Stack gap="sm" align="start">
          <Stack gap="3xs">
            <Text variant="footnote-medium" color="muted">
              A seguir
            </Text>
            <Text as="h3" variant="heading-3-bold">Copa do Mundo: Equador x Argentina</Text>
          </Stack>
          <WideButton label="Assistir" interactionState="focus" />
        </Stack>
      </div>
    </>
  ),
}
