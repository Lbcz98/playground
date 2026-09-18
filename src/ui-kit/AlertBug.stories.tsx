import type { CSSProperties, ReactNode } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Stack, Text, spacing, token } from '@/primitives'
import { AlertBug } from './AlertBug'

/** The bug sits in the bottom-right corner of the clean broadcast. */
const backdrop: CSSProperties = {
  position: 'relative',
  display: 'flex',
  alignItems: 'flex-end',
  justifyContent: 'flex-end',
  padding: spacing('xl'),
  backgroundColor: token('--color-semantic-theme-noite-light'),
}

function Screen({ children }: { children: ReactNode }): ReactNode {
  return <div style={{ ...backdrop, width: '100vw', height: '100vh' }}>{children}</div>
}

const meta = {
  title: 'UI Kit/Alert Bug',
  component: AlertBug,
  parameters: { layout: 'fullscreen' },
  argTypes: {
    bugStyle: { control: 'inline-radio', options: ['interface', 'transmission'] },
    interactionState: { control: 'inline-radio', options: ['default', 'focus'] },
  },
  decorators: [
    (Story) => (
      <Screen>
        <Story />
      </Screen>
    ),
  ],
} satisfies Meta<typeof AlertBug>

export default meta
type Story = StoryObj<typeof meta>

/** The kit's own bug, waiting to be reached. */
export const Interface: Story = { args: { bugStyle: 'interface', interactionState: 'default' } }
/** The same bug once it holds the focus — it grows and takes the focus ring. */
export const InterfaceFocus: Story = { args: { bugStyle: 'interface', interactionState: 'focus' } }
/** The broadcaster's own mark, laid over the picture by the transmission. */
export const Transmission: Story = { args: { bugStyle: 'transmission' } }

/** Every style side by side. */
export const AllStyles: Story = {
  args: {},
  decorators: [(Story) => <Story />],
  render: () => (
    <div style={{ ...backdrop, alignItems: 'center', justifyContent: 'center', height: '100vh', width: '100vw' }}>
      <Stack direction="row" gap="2xl" align="center">
        {(
          [
            ['interface', 'default'],
            ['interface', 'focus'],
            ['transmission', 'default'],
          ] as const
        ).map(([bugStyle, state]) => (
          <Stack key={`${bugStyle}-${state}`} gap="2xs" align="center">
            <AlertBug bugStyle={bugStyle} interactionState={state} />
            <Text variant="footnote-medium" color="secondary">
              {`${bugStyle} · ${state}`}
            </Text>
          </Stack>
        ))}
      </Stack>
    </div>
  ),
}
