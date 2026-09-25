import type { Meta, StoryObj } from '@storybook/react-vite'
import { Box } from '@/primitives'
import { MainMenu } from './MainMenu'

const meta = {
  title: 'UI Kit/Main Menu',
  component: MainMenu,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: [
          'The home menu along the bottom. One button holds the TV focus at a time — **Program** when Home opens.',
          '',
          'Each button owns a rail of interactivity buttons:',
          '',
          '| Button | Rail | Holds |',
          '| --- | --- | --- |',
          '| **Program** | right | the programme’s context |',
          '| **Miscellaneous** | left | various types of interactivities |',
          '| **Schedule** | left | one card per programme — time, live or not, name |',
          '| **Login** | left | account settings |',
          '',
          'On Home, the focused button is the one whose rail is on screen (see *Templates / Screens › Home · Programação*).',
        ].join('\n'),
      },
    },
  },
  args: {
    miscellaneousTitle: 'Previsão do tempo',
    miscellaneousSubtitle: 'São Paulo, SP',
    programTitle: 'Copa do Mundo: Equador x Argentina',
    programSubtitle: 'A seguir Central da Copa',
  },
  decorators: [
    (Story) => (
      <Box padding="lg" background="primary">
        <Story />
      </Box>
    ),
  ],
} satisfies Meta<typeof MainMenu>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Program focused — how Home opens. Its rail sits on the right and holds the
 * programme's context. No avatarSrc/logoSrc/bugSrc: they are per-viewer and
 * per-broadcast content, so the default renders their token-coloured placeholder.
 */
export const Default: Story = {}

/** Miscellaneous focused: its rail sits on the left and holds various types of interactivities. Focused, it shows the dots of "more". */
export const MiscellaneousFocused: Story = { args: { focusedItem: 'miscellaneous' } }

/** Schedule focused: its rail sits on the left, one card per programme — time, live or not, name. */
export const ScheduleFocused: Story = { args: { focusedItem: 'schedule' } }

/** Login focused: its rail sits on the left and holds the account settings. */
export const LoginFocused: Story = { args: { focusedItem: 'login' } }

/** The channel logo focused — not a menu role; it leads back to the clean broadcast. */
export const BugFocused: Story = { args: { focusedItem: 'channel-bug' } }

export const CustomContent: Story = {
  args: {
    miscellaneousTitle: 'Chuva a qualquer momento',
    miscellaneousSubtitle: 'Rio de Janeiro, RJ',
    programTitle: 'Jornal Nacional',
    programSubtitle: 'Ao vivo agora',
  },
}
