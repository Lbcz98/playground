import type { Meta, StoryObj } from '@storybook/react-vite'
import { Box } from './Box'
import { Heading, type HeadingLevel } from './Heading'
import { Stack } from './Stack'

const LEVELS: HeadingLevel[] = [3, 4, 5]

const meta = {
  title: 'Primitives/Heading',
  component: Heading,
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <Box padding="xl" background="primary">
        <Story />
      </Box>
    ),
  ],
  args: { children: 'Continue assistindo', level: 3, weight: 'bold' },
} satisfies Meta<typeof Heading>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const AllLevels: Story = {
  render: (args) => (
    <Stack gap="lg">
      {LEVELS.map((level) => (
        <Stack key={level} direction="row" gap="xl" align="baseline">
          <Heading {...args} level={level} weight="bold" />
          <Heading {...args} level={level} weight="medium" />
        </Stack>
      ))}
    </Stack>
  ),
}
