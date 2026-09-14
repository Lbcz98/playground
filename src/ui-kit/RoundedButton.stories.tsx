import type { Meta, StoryObj } from '@storybook/react-vite'
import { RoundedButton } from './RoundedButton'

const meta = {
  title: 'UI Kit/Rounded Button',
  component: RoundedButton,
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
} satisfies Meta<typeof RoundedButton>

export default meta
type Story = StoryObj<typeof meta>

export const Focus: Story = { args: { focus: true } }
export const Rest: Story = { args: { focus: false } }

export const BothStates: Story = {
  args: {},
  render: (args) => (
    <div style={{ display: 'flex', gap: 'var(--dimension-spacing-core-sm)' }}>
      <RoundedButton {...args} focus />
      <RoundedButton {...args} focus={false} />
    </div>
  ),
}
