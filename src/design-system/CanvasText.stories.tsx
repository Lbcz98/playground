import type { Meta, StoryObj } from '@storybook/react-vite'
import { CanvasStack, CanvasText } from './canvasKit'

const meta = {
  title: 'Canvas Kit/Text',
  component: CanvasText,
  parameters: { layout: 'centered' },
  args: { content: 'Choose your plan' },
} satisfies Meta<typeof CanvasText>

export default meta
type Story = StoryObj<typeof meta>

export const Body: Story = {}

/** Every variant, largest first — each renders its own element (h1, h2, h3, p, span). */
export const Variants: Story = {
  render: () => (
    <CanvasStack gap="xs">
      {(['display', 'title', 'heading', 'body', 'caption'] as const).map((variant) => (
        <CanvasText key={variant} variant={variant} content={variant} />
      ))}
    </CanvasStack>
  ),
}

/** Every tone. `inverse` is for text on the brand surface. */
export const Tones: Story = {
  render: () => (
    <CanvasStack gap="xs" padding="sm" surface="subtle">
      {(['default', 'muted', 'inverse', 'brand'] as const).map((tone) => (
        <CanvasText key={tone} tone={tone} content={tone} />
      ))}
    </CanvasStack>
  ),
}
