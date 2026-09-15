import type { Meta, StoryObj } from '@storybook/react-vite'
import { MainMenu } from './MainMenu'

const meta = {
  title: 'UI Kit/Main Menu',
  component: MainMenu,
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => (
      <div
        style={{
          padding: 'var(--dimension-spacing-core-lg)',
          backgroundColor: 'var(--color-semantic-functional-background-primary)',
        }}
      >
        <Story />
      </div>
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

export const BugFocused: Story = { args: { bugFocused: true } }

export const CustomContent: Story = {
  args: {
    weatherTitle: 'Chuva a qualquer momento',
    weatherSubtitle: 'Rio de Janeiro, RJ',
    programTitle: 'Jornal Nacional',
    programSubtitle: 'Ao vivo agora',
  },
}
