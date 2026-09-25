import type { Meta, StoryObj } from '@storybook/react-vite'
import { Box } from '@/primitives'
import { MainMenu } from './MainMenu'

const meta = {
  title: 'UI Kit/Main Menu',
  component: MainMenu,
  parameters: { layout: 'fullscreen' },
  args: {
    weatherTitle: 'Previsão do tempo',
    weatherSubtitle: 'São Paulo, SP',
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
 * No avatarSrc/logoSrc/bugSrc — these are per-viewer/per-broadcast content,
 * not kit assets, so the default renders their token-coloured placeholder.
 */
export const Default: Story = {}

export const BugFocused: Story = { args: { focusedItem: 'channel-bug' } }

/** The programme's logo holding the focus — e.g. after the viewer moves left from the channel button. */
export const ProgramFocused: Story = { args: { focusedItem: 'program' } }

export const CustomContent: Story = {
  args: {
    weatherTitle: 'Chuva a qualquer momento',
    weatherSubtitle: 'Rio de Janeiro, RJ',
    programTitle: 'Jornal Nacional',
    programSubtitle: 'Ao vivo agora',
  },
}
