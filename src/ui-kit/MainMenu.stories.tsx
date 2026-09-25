import type { Meta, StoryObj } from '@storybook/react-vite'
import { Box } from '@/primitives'
import { MainMenu } from './MainMenu'
import couponIcon from './story-assets/carousel-coupon.png'
import premiereIcon from './story-assets/carousel-premiere.png'
import realityIcon from './story-assets/carousel-bbb.png'
import teamIcon from './story-assets/carousel-team.png'

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

/**
 * Miscellaneous at rest cycles through what it holds — every 3s the icon shrinks
 * out and the next grows in, the lines dissolve (Figma: Dinamic Carousel). The
 * snapshot shows the first item: the visual run stops the motion. The icons are
 * the Figma kit's example content (a crest, programme logos), not kit assets.
 */
export const MiscellaneousCycle: Story = {
  args: {
    miscellaneousItems: [
      { title: 'Previsão do tempo', subtitle: 'São Paulo, SP' },
      { title: 'Flamengo joga hoje!', subtitle: '21:30', iconSrc: teamIcon },
      { title: 'Vote agora no paredão', subtitle: 'BBB 26', iconSrc: realityIcon },
      { title: 'Estréia de Coração Acelerado', subtitle: 'Amanhã, 19h', iconSrc: premiereIcon },
      { title: 'Tem cupom te esperando!', subtitle: 'Mercado Livre', iconSrc: couponIcon },
    ],
  },
}

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
