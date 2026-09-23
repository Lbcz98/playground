import type { ReactNode } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Box, Stack, Text, size, spacing, token } from '@/primitives'
import { TableCell, type TeamCellProps } from './TableCell'

/** A stand-in crest, so the stories show the slot without shipping club artwork. */
function Badge({ color }: { color: string }): ReactNode {
  return (
    <span style={{ display: 'flex', color }} aria-hidden>
      <svg viewBox="0 0 20 20" style={{ width: size('icon-md'), height: size('icon-md'), display: 'block' }} fill="none">
        <path d="M10 1 18 3.5V10c0 4.4-3.3 7.6-8 9-4.7-1.4-8-4.6-8-9V3.5Z" fill="currentColor" />
      </svg>
    </span>
  )
}

const home = <Badge color={token('--color-semantic-functional-status-error')} />
const away = <Badge color={token('--color-semantic-functional-status-live')} />

const meta = {
  title: 'UI Kit/Table Cell',
  component: TableCell,
  args: { name: 'SAO', position: '1', stats: ['16', '6', '5'] },
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <Box padding="xl" background="primary">
        {/* The width a row actually gets: the card, less its inset on both sides. */}
        <div style={{ width: `calc(${size('content-card-width')} - 2 * ${spacing('lg')})` }}>
          <Story />
        </div>
      </Box>
    ),
  ],
} satisfies Meta<TeamCellProps>

export default meta
type Story = StoryObj<typeof meta>

/** The default row: a team, its position, crest and stats, at the `table-cell-md` height. */
export const Team: Story = {
  render: () => <TableCell position="1" shield={home} name="SAO" stats={['16', '6', '5']} />,
}

/** Every part on: the viewer's own team, with a fourth column in the subtler tone. */
export const TeamEverything: Story = {
  render: () => (
    <TableCell position="1" shield={home} name="SAO" favorite stats={['16', '6', '5', '2']} divider />
  ),
}

/**
 * Parts left out collapse: the row closes up flush left rather than holding a gap
 * where the position and crest would have been.
 */
export const TeamCollapsing: Story = {
  render: () => (
    <Stack direction="column" gap="2xs">
      <TableCell position="1" shield={home} name="SAO" stats={['16', '6', '5']} />
      <TableCell shield={home} name="SAO" stats={['16', '6', '5']} />
      <TableCell name="SAO" stats={['16', '6', '5']} />
      <TableCell name="SAO" />
    </Stack>
  ),
}

/** The athlete row: one line, at the `table-cell-sm` height. */
export const Athlete: Story = {
  render: () => <TableCell type="athlete" number="2" name="Félix Torrez" />,
}

/** Its marks, each on its own toggle — cards, goals scored, and who came on. */
export const AthleteMarks: Story = {
  render: () => (
    <Stack direction="column" gap="2xs">
      <TableCell type="athlete" number="2" name="Félix Torrez" yellowCard />
      <TableCell type="athlete" number="5" name="A. Franco" yellowCard redCard />
      <TableCell type="athlete" number="9" name="E. Valencia" goals={2} />
      <TableCell type="athlete" number="23" name="M. Caicedo" goals={1} substitute="N. Sobrenome" />
    </Stack>
  ),
}

/** The scout row: a stat named between the two sides' values, at the `table-cell-lg` height. */
export const Scout: Story = {
  render: () => <TableCell type="scout" label="Posse de bola" values={['49%', '51%']} divider />,
}

/** Without values the label stays centred, so it still reads as a heading. */
export const ScoutLabelOnly: Story = {
  render: () => <TableCell type="scout" label="Posse de bola" divider />,
}

/** The three row heights together, each from its own token. */
export const Heights: Story = {
  render: () => (
    <Stack direction="column" gap="2xs">
      <Text variant="caption-medium" color="subtle">
        scout · table-cell-lg
      </Text>
      <TableCell type="scout" label="Posse de bola" values={['49%', '51%']} divider />
      <Text variant="caption-medium" color="subtle">
        team · table-cell-md
      </Text>
      <TableCell position="1" shield={home} name="SAO" stats={['16', '6', '5']} />
      <Text variant="caption-medium" color="subtle">
        athlete · table-cell-sm
      </Text>
      <TableCell type="athlete" number="2" name="Félix Torrez" goals={2} />
    </Stack>
  ),
}

/** A table is a stack of rows — the heading, then the sides. */
export const AsATable: Story = {
  render: () => (
    <Stack direction="column" gap="2xs">
      <TableCell type="scout" label="Posse de bola" values={['49%', '51%']} divider />
      <TableCell position="1" shield={home} name="SAO" stats={['16', '6', '5']} />
      <TableCell position="1" shield={away} name="ARG" stats={['5', '2', '2']} />
    </Stack>
  ),
}
