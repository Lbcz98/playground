import type { Meta, StoryObj } from '@storybook/react-vite'
import { Stack } from '@/primitives'
import { InteractivityButton } from './InteractivityButton'
import { InteractivityMenu } from './InteractivityMenu'
import { MainMenu } from './MainMenu'
import { Screen } from './Screen'

// Not under "UI Kit": the visual regression covers each screen through the Templates stories.
// This story exists so the frame is documented where the agent looks (docs-list): every screen starts here.

/** The frame every prototype screen starts from: video, overlay shades by `model`, and a transparent content layer. */
const meta = {
  title: 'Foundations/Screen',
  component: Screen,
  parameters: { layout: 'fullscreen' },
  argTypes: {
    level: { control: 'inline-radio', options: [0, 1, 2, 3] },
    focusSide: { control: 'inline-radio', options: ['left', 'right'] },
  },
} satisfies Meta<typeof Screen>

export default meta
type Story = StoryObj<typeof meta>

/**
 * The 1280×720 frame every screen is built in: video, then the overlay's shades (`model`), then the
 * content. The content layer is transparent, so its root container paints no background and adds
 * no margin — the frame owns the 32pt safe area and the gutter. Import it as
 * `import { Screen } from '@/ui-kit/Screen'`.
 */
export const Home: Story = {
  args: { model: 'home', level: 1 },
  render: (args) => (
    <Screen {...args}>
      <Stack direction="column" justify="end" gap="sm" padding="none" grow>
        <Stack direction="column" justify="end" gap="2xl">
          <InteractivityMenu align="end">
            <InteractivityButton title="Opções de áudio" interactionState="default" />
            <InteractivityButton title="Estatísticas" interactionState="default" />
          </InteractivityMenu>
          <MainMenu
            miscellaneousTitle="Previsão do tempo"
            miscellaneousSubtitle="São Paulo, SP"
            programTitle="Copa do Mundo: Equador x Argentina"
            programSubtitle="A seguir Central da Copa"
          />
        </Stack>
      </Stack>
    </Screen>
  ),
}
