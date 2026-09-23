import type { Meta, StoryObj } from '@storybook/react-vite'
import { CanvasButton, CanvasStack, CanvasText } from './canvasKit'

const meta = {
  title: 'Canvas Kit/Button',
  component: CanvasButton,
  parameters: { layout: 'centered' },
  args: { label: 'Start watching' },
} satisfies Meta<typeof CanvasButton>

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = {}

/** Every variant, at the default size. */
export const Variants: Story = {
  render: () => (
    <CanvasStack direction="horizontal" gap="xs" align="center">
      {(['primary', 'secondary', 'ghost', 'danger'] as const).map((variant) => (
        <CanvasButton key={variant} variant={variant} label={variant} />
      ))}
    </CanvasStack>
  ),
}

/** Every size. */
export const Sizes: Story = {
  render: () => (
    <CanvasStack direction="horizontal" gap="xs" align="center">
      {(['sm', 'md', 'lg'] as const).map((size) => (
        <CanvasButton key={size} size={size} label={size} />
      ))}
    </CanvasStack>
  ),
}

export const Disabled: Story = { args: { disabled: true } }
/** Fills its container — here a stack as wide as the line above it. */
export const FullWidth: Story = {
  render: () => (
    <CanvasStack gap="xs">
      <CanvasText content="Every channel, live and on demand." />
      <CanvasButton label="Start watching" fullWidth />
    </CanvasStack>
  ),
}
