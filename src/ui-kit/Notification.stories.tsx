import type { CSSProperties, ReactNode } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Stack, Text, spacing, token } from '@/primitives'
import { Notification } from './Notification'

/**
 * The notification over a bright stand-in for the video, so the translucent pill
 * and the focus ring read the way they do on air.
 */
const backdrop: CSSProperties = {
  position: 'relative',
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'flex-end',
  padding: spacing('xl'),
  backgroundColor: token('--color-semantic-theme-noite-light'),
}

function Screen({ children }: { children: ReactNode }): ReactNode {
  return <div style={{ ...backdrop, width: '100vw', height: '100vh' }}>{children}</div>
}

const meta = {
  title: 'UI Kit/Notification',
  component: Notification,
  parameters: { layout: 'fullscreen' },
  argTypes: {
    kind: { control: 'inline-radio', options: ['message', 'rounded'] },
    interactionState: { control: 'inline-radio', options: ['default', 'focus'] },
  },
  decorators: [
    (Story) => (
      <Screen>
        <Story />
      </Screen>
    ),
  ],
} satisfies Meta<typeof Notification>

export default meta
type Story = StoryObj<typeof meta>

/** The message as it arrives, at rest. */
export const Message: Story = { args: { kind: 'message', interactionState: 'default' } }
/** The message once the viewer reaches it. */
export const MessageFocus: Story = { args: { kind: 'message', interactionState: 'focus' } }
/** The logo alone — the notification with its text withheld. */
export const Rounded: Story = { args: { kind: 'rounded', interactionState: 'default' } }
/** The logo alone, focused. */
export const RoundedFocus: Story = { args: { kind: 'rounded', interactionState: 'focus' } }

/** Every variant together. */
export const AllVariants: Story = {
  args: {},
  decorators: [(Story) => <Story />],
  render: () => (
    <div style={{ ...backdrop, alignItems: 'center', justifyContent: 'center', height: '100vh', width: '100vw' }}>
      <Stack gap="lg" align="center">
        {(['default', 'focus'] as const).map((state) => (
          <Stack key={state} direction="row" gap="lg" align="center">
            <Notification kind="message" interactionState={state} />
            <Notification kind="rounded" interactionState={state} />
            <Text variant="footnote-medium" color="secondary">
              {state}
            </Text>
          </Stack>
        ))}
      </Stack>
    </div>
  ),
}
