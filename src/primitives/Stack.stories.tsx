import type { Meta, StoryObj } from '@storybook/react-vite'
import { Box } from './Box'
import { Stack } from './Stack'
import { Text } from './Text'
import { GRID_SPACING } from './tokens'

function Tile({ label }: { label: string }) {
  return (
    <Box paddingX="sm" paddingY="xs" background="elevated" radius="sm">
      <Text variant="body-sm-bold">{label}</Text>
    </Box>
  )
}

const meta = {
  title: 'Primitives/Stack',
  component: Stack,
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <Box padding="xl" background="primary">
        <Story />
      </Box>
    ),
  ],
  args: {
    direction: 'column',
    gap: 'sm',
    children: [<Tile key="a" label="Início" />, <Tile key="b" label="Agora na TV" />, <Tile key="c" label="Minha lista" />],
  },
} satisfies Meta<typeof Stack>

export default meta
type Story = StoryObj<typeof meta>

export const Column: Story = {}
export const Row: Story = { args: { direction: 'row', align: 'center' } }

/** Every grid spacing step as a gap. `md` is off the grid, so Stack refuses it. */
export const Gaps: Story = {
  render: () => (
    <Stack gap="lg">
      {GRID_SPACING.map((step) => (
        <Stack key={step} gap="3xs">
          <Text variant="caption-medium" color="secondary">
            gap {step}
          </Text>
          <Stack direction="row" gap={step}>
            <Tile label="A" />
            <Tile label="B" />
            <Tile label="C" />
          </Stack>
        </Stack>
      ))}
    </Stack>
  ),
}
