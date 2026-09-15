import type { Meta, StoryObj } from '@storybook/react-vite'
import { Box, Stack } from '@/primitives'
import { RoundedButton } from './RoundedButton'

const meta = {
  title: 'UI Kit/Rounded Button',
  component: RoundedButton,
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <Box padding="xl" background="primary">
        <Story />
      </Box>
    ),
  ],
} satisfies Meta<typeof RoundedButton>

export default meta
type Story = StoryObj<typeof meta>

export const Focus: Story = { args: { interactionState: 'focus' } }
export const Rest: Story = { args: { interactionState: 'default' } }

export const BothStates: Story = {
  args: {},
  render: (args) => (
    <Stack direction="row" gap="sm">
      <RoundedButton {...args} interactionState="focus" />
      <RoundedButton {...args} interactionState="default" />
    </Stack>
  ),
}
