import type { Meta, StoryObj } from '@storybook/react-vite'
import { InteractivityMenu } from './InteractivityMenu'

const ITEMS = [
  { title: 'Banco da Argentina' },
  { title: 'Banco do Equador' },
  { title: 'Torcida da Argentina' },
  { title: 'Torcida do Equador' },
  { title: 'Dentro de campo' },
  { title: 'Narração' },
  { title: 'Áudio original' },
  { title: 'Descrição de áudio' },
]

const meta = {
  title: 'UI Kit/Interactivity Menu',
  component: InteractivityMenu,
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
  args: { items: ITEMS },
} satisfies Meta<typeof InteractivityMenu>

export default meta
type Story = StoryObj<typeof meta>

/** The rail at rest — every card `default`, nothing entered yet. */
export const AtRest: Story = { args: { activeIndex: null } }

/** Entered: the whole row expands, focus on the first item. */
export const FocusOnFirst: Story = { args: { activeIndex: 0 } }

/**
 * Matches the real usage this was cross-checked against: focus on the LAST
 * item, so the rail has scrolled and earlier items sit dimmed to its left.
 */
export const FocusOnLast: Story = { args: { activeIndex: ITEMS.length - 1, heading: 'Opções de áudio' } }

export const FocusInMiddle: Story = { args: { activeIndex: 3 } }
