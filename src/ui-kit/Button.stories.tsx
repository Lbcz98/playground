import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button } from './Button'

const meta = {
  title: 'UI Kit/Button',
  component: Button,
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
  args: { title: 'Title', overline: 'Overline', subtitle: 'Subtitle', live: true },
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

export const Focus: Story = { args: { state: 'focus' } }
export const Selected: Story = { args: { state: 'selected' } }
export const Default: Story = { args: { state: 'default' } }
export const WithCheck: Story = { args: { state: 'focus', check: true } }

export const AllStates: Story = {
  args: {},
  render: (args) => (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--dimension-spacing-core-lg)',
      }}
    >
      <Button {...args} state="focus" />
      <Button {...args} state="selected" />
      <Button {...args} state="default" />
    </div>
  ),
}
