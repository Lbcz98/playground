import type { Meta, StoryObj } from '@storybook/react-vite'
import { Box, Stack } from '@/primitives'
import { CloseButton } from './CloseButton'

const meta = {
  title: 'UI Kit/Close Button',
  component: CloseButton,
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <Box padding="xl" background="primary">
        <Story />
      </Box>
    ),
  ],
} satisfies Meta<typeof CloseButton>

export default meta
type Story = StoryObj<typeof meta>

export const Focus: Story = { args: { interactionState: 'focus' } }
export const Rest: Story = { args: { interactionState: 'default' } }

export const BothStates: Story = {
  args: {},
  render: (args) => (
    <Stack direction="row" gap="sm">
      <CloseButton {...args} interactionState="focus" />
      <CloseButton {...args} interactionState="default" />
    </Stack>
  ),
}
