import { useEffect, useState, type ComponentProps, type CSSProperties, type ReactNode } from 'react'
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

/** The kit's example copy — the component itself has no default text. */
const EXAMPLE_TITLE = 'Paredão formado! Vote agora para eliminar'

/** How long the loop rests open and closed — the story's pacing, not the component's. */
const HOLD_MS = 2500
const PAUSE_MS = 400

function ms(name: string): number {
  return parseFloat(getComputedStyle(document.documentElement).getPropertyValue(name)) || 0
}

/** Opens, rests, leaves and comes back, on the component's own timings. */
function MotionLoop(props: ComponentProps<typeof Notification>): ReactNode {
  const [open, setOpen] = useState(false)
  useEffect(() => {
    const opening = ms('--motion-semantic-notification-duration')
    const closing = ms('--motion-semantic-notification-close-delay') + opening
    const timer = setTimeout(() => setOpen(!open), open ? opening + HOLD_MS : closing + PAUSE_MS)
    return () => clearTimeout(timer)
  }, [open])
  return <Notification {...props} open={open} />
}

const meta = {
  title: 'UI Kit/Notification',
  component: Notification,
  parameters: { layout: 'fullscreen' },
  args: { title: EXAMPLE_TITLE, open: true },
  argTypes: {
    kind: { control: 'inline-radio', options: ['message', 'rounded'] },
    interactionState: { control: 'inline-radio', options: ['default', 'focus'] },
    open: { control: 'boolean' },
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

/** Arriving and leaving on a loop. Toggle `interactionState` to watch the focus ring follow the pill. */
export const Motion: Story = {
  args: { kind: 'message', interactionState: 'default' },
  argTypes: { open: { control: false } },
  render: (args) => <MotionLoop {...args} />,
}

/** Every variant together. */
export const AllVariants: Story = {
  args: {},
  decorators: [(Story) => <Story />],
  render: () => (
    <div style={{ ...backdrop, alignItems: 'center', justifyContent: 'center', height: '100vh', width: '100vw' }}>
      <Stack gap="lg" align="center">
        {(['default', 'focus'] as const).map((state) => (
          <Stack key={state} direction="row" gap="lg" align="center">
            <Notification kind="message" interactionState={state} title={EXAMPLE_TITLE} />
            <Notification kind="rounded" interactionState={state} title={EXAMPLE_TITLE} />
            <Text variant="footnote-medium" color="secondary">
              {state}
            </Text>
          </Stack>
        ))}
      </Stack>
    </div>
  ),
}
