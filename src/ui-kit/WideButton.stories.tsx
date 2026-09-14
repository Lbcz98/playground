import type { Meta, StoryObj } from '@storybook/react-vite'
import { WideButton } from './WideButton'

const meta = {
  title: 'UI Kit/Wide Button',
  component: WideButton,
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
  args: { label: 'Label' },
} satisfies Meta<typeof WideButton>

export default meta
type Story = StoryObj<typeof meta>

export const Focus: Story = { args: { status: 'focus' } }
export const Default: Story = { args: { status: 'default' } }
export const Loading: Story = { args: { status: 'loading' } }
export const Disabled: Story = { args: { status: 'disabled' } }
export const WithIcons: Story = {
  args: { status: 'focus', iconLeft: true, iconRight: true },
}

export const AllStatuses: Story = {
  args: {},
  render: (args) => (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--dimension-spacing-core-sm)',
      }}
    >
      <WideButton {...args} status="focus" />
      <WideButton {...args} status="default" />
      <WideButton {...args} status="loading" />
      <WideButton {...args} status="disabled" />
    </div>
  ),
}
