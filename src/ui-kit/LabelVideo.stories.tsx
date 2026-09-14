import type { Meta, StoryObj } from '@storybook/react-vite'
import { LabelVideo } from './LabelVideo'

const meta = {
  title: 'UI Kit/Label Video',
  component: LabelVideo,
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <div
        style={{
          padding: 'var(--dimension-spacing-core-xl)',
          backgroundColor: 'var(--color-semantic-functional-background-primary)',
        }}
      >
        <Story />
      </div>
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
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--dimension-spacing-core-sm)',
        alignItems: 'start',
      }}
    >
      <div style={{ display: 'flex', gap: 'var(--dimension-spacing-core-sm)' }}>
        <LabelVideo kind="live" focus />
        <LabelVideo kind="live" focus={false} />
        <LabelVideo kind="live" focus mini />
      </div>
      <div style={{ display: 'flex', gap: 'var(--dimension-spacing-core-sm)' }}>
        <LabelVideo kind="replay" focus />
        <LabelVideo kind="replay" focus={false} />
      </div>
    </div>
  ),
}
