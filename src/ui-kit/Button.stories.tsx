import type { Meta, StoryObj } from '@storybook/react-vite'
import { Box, Stack } from '@/primitives'
import { Button } from './Button'

const meta = {
  title: 'UI Kit/Button',
  component: Button,
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <Box padding="xl" background="primary">
        <Story />
      </Box>
    ),
  ],
  args: { title: 'Title', overline: 'Overline', subtitle: 'Subtitle', live: true },
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

export const Focus: Story = { args: { interactionState: 'focus' } }
export const Selected: Story = { args: { interactionState: 'selected' } }
export const Default: Story = { args: { interactionState: 'default' } }
export const WithCheck: Story = { args: { interactionState: 'focus', check: true } }
/** A sponsored card: the sponsor row under its text. Without a logo it is the wording alone. */
export const Sponsored: Story = { args: { interactionState: 'focus', advertising: { label: 'Publicidade' } } }

export const AllStates: Story = {
  args: {},
  render: (args) => (
    <Stack direction="row" align="center" gap="lg">
      <Button {...args} interactionState="focus" />
      <Button {...args} interactionState="selected" />
      <Button {...args} interactionState="default" />
    </Stack>
  ),
}
