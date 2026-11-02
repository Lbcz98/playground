import type { Meta, StoryObj } from '@storybook/react-vite'
import { Box, Stack } from '@/primitives'
import { InteractivityButton } from './InteractivityButton'
import poster from './story-assets/extra-info-oscar.png'

const meta = {
  title: 'UI Kit/Interactivity Button',
  component: InteractivityButton,
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <Box padding="xl" background="primary">
        <Story />
      </Box>
    ),
  ],
  args: { title: 'Title', overline: 'Overline', subtitle: 'Subtitle', live: true },
} satisfies Meta<typeof InteractivityButton>

export default meta
type Story = StoryObj<typeof meta>

export const Focus: Story = { args: { interactionState: 'focus' } }
export const Selected: Story = { args: { interactionState: 'selected' } }
export const Default: Story = { args: { interactionState: 'default' } }
export const WithCheck: Story = { args: { interactionState: 'focus', check: true } }
/** A sponsored card: the sponsor row under its text. Without a logo it is the wording alone. */
export const Sponsored: Story = { args: { interactionState: 'focus', advertising: { label: 'Publicidade' } } }
/** A programme in the schedule rail: time, live badge and name over its art. The art dissolves in under focus. */
export const Poster: Story = {
  args: {
    interactionState: 'focus',
    overline: '16:50 – 17:04',
    title: 'Boletim RJ2',
    subtitle: undefined,
    posterSrc: poster,
  },
}
/** The same card through the three states: selected and default hide the art and dim the text. */
export const PosterAllStates: Story = {
  args: { overline: '17:05 – 18:24', title: 'Vale a Pena Ver de Novo', subtitle: undefined, live: false, posterSrc: poster },
  render: (args) => (
    <Stack direction="row" align="center" gap="lg">
      <InteractivityButton {...args} interactionState="focus" />
      <InteractivityButton {...args} interactionState="selected" />
      <InteractivityButton {...args} interactionState="default" />
    </Stack>
  ),
}

export const AllStates: Story = {
  args: {},
  render: (args) => (
    <Stack direction="row" align="center" gap="lg">
      <InteractivityButton {...args} interactionState="focus" />
      <InteractivityButton {...args} interactionState="selected" />
      <InteractivityButton {...args} interactionState="default" />
    </Stack>
  ),
}
