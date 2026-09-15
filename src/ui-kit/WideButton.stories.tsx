import type { Meta, StoryObj } from '@storybook/react-vite'
import { Box, Stack } from '@/primitives'
import { WideButton } from './WideButton'

const meta = {
  title: 'UI Kit/Wide Button',
  component: WideButton,
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <Box padding="xl" background="primary">
        <Story />
      </Box>
    ),
  ],
  args: { label: 'Label' },
} satisfies Meta<typeof WideButton>

export default meta
type Story = StoryObj<typeof meta>

export const Focus: Story = { args: { interactionState: 'focus' } }
export const Default: Story = { args: { interactionState: 'default' } }
export const Loading: Story = { args: { interactionState: 'loading' } }
export const Disabled: Story = { args: { interactionState: 'disabled' } }
export const WithIcons: Story = {
  args: { interactionState: 'focus', iconLeft: true, iconRight: true },
}

export const AllStatuses: Story = {
  args: {},
  render: (args) => (
    <Stack gap="sm">
      <WideButton {...args} interactionState="focus" />
      <WideButton {...args} interactionState="default" />
      <WideButton {...args} interactionState="loading" />
      <WideButton {...args} interactionState="disabled" />
    </Stack>
  ),
}
