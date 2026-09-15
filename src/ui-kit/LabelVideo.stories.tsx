import type { Meta, StoryObj } from '@storybook/react-vite'
import { Box, Stack } from '@/primitives'
import { LabelVideo } from './LabelVideo'

const meta = {
  title: 'UI Kit/Label Video',
  component: LabelVideo,
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <Box padding="xl" background="primary">
        <Story />
      </Box>
    ),
  ],
} satisfies Meta<typeof LabelVideo>

export default meta
type Story = StoryObj<typeof meta>

export const LiveFocus: Story = { args: { kind: 'live', focus: true } }
export const LiveRest: Story = { args: { kind: 'live', focus: false } }
export const LiveMini: Story = { args: { kind: 'live', focus: true, mini: true } }
export const ReplayFocus: Story = { args: { kind: 'replay', focus: true } }
export const ReplayRest: Story = { args: { kind: 'replay', focus: false } }

export const AllVariants: Story = {
  args: {},
  render: () => (
    <Stack gap="sm" align="start">
      <Stack direction="row" gap="sm">
        <LabelVideo kind="live" focus />
        <LabelVideo kind="live" focus={false} />
        <LabelVideo kind="live" focus mini />
      </Stack>
      <Stack direction="row" gap="sm">
        <LabelVideo kind="replay" focus />
        <LabelVideo kind="replay" focus={false} />
      </Stack>
    </Stack>
  ),
}
