import type { Meta, StoryObj } from '@storybook/react-vite'
import { CanvasButton, CanvasStack, CanvasText } from './canvasKit'

const children = [
  <CanvasText key="title" variant="heading" content="Premium" />,
  <CanvasText key="body" tone="muted" content="Every channel, live and on demand." />,
  <CanvasButton key="cta" label="Start watching" />,
]

const meta = {
  title: 'Canvas Kit/Stack',
  component: CanvasStack,
  parameters: { layout: 'centered' },
  args: { direction: 'vertical', gap: 'sm', children },
} satisfies Meta<typeof CanvasStack>

export default meta
type Story = StoryObj<typeof meta>

export const Vertical: Story = {}
export const Horizontal: Story = { args: { direction: 'horizontal', align: 'center' } }

/** The planner's card pattern: padding, a surface, a border, a radius and a small shadow. */
export const Card: Story = {
  args: { gap: 'xs', padding: 'lg', surface: 'surface', bordered: true, radius: 'lg', shadow: 'sm' },
}
