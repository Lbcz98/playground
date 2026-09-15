import type { Meta, StoryObj } from '@storybook/react-vite'
import { Box } from './Box'
import { Stack } from './Stack'
import { Text } from './Text'
import { GRID_SPACING, type SurfaceColor } from './tokens'

const SURFACES: SurfaceColor[] = ['primary', 'elevated', 'overlay']

const meta = {
  title: 'Primitives/Box',
  component: Box,
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <Box padding="xl" background="primary">
        <Story />
      </Box>
    ),
  ],
  args: {
    padding: 'lg',
    background: 'elevated',
    border: 'default',
    radius: 'lg',
    children: <Text variant="body-sm-bold">Box</Text>,
  },
} satisfies Meta<typeof Box>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Surfaces: Story = {
  render: () => (
    <Stack direction="row" gap="sm">
      {SURFACES.map((background) => (
        <Box key={background} padding="lg" background={background} border="default" radius="lg">
          <Text variant="body-sm-bold">background-{background}</Text>
        </Box>
      ))}
    </Stack>
  ),
}

/** Every grid spacing step as padding. `md` is off the grid, so Box refuses it. */
export const PaddingScale: Story = {
  render: () => (
    <Stack direction="row" gap="sm" align="start" wrap>
      {GRID_SPACING.map((step) => (
        <Box key={step} padding={step} background="elevated" radius="sm">
          <Box paddingX="2xs" background="overlay" border="default">
            <Text variant="caption-bold">{step}</Text>
          </Box>
        </Box>
      ))}
    </Stack>
  ),
}
