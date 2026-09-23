import type { ReactNode } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Box, Stack, Text, size, spacing, token } from '@/primitives'
import { ContentCard, ContentCardBody, ContentCardFooter, ContentCardHeader } from './ContentCard'
import { TableCell } from './TableCell'

/** A stand-in crest, so the stories show the badge slot without shipping club artwork. */
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

/** A body built the way a screen would build one — rows of the kit's own type. */
function StatRow({ label, value }: { label: string; value: string }): ReactNode {
  return (
    <Stack direction="row" justify="between" align="center" gap="2xs">
      <Text variant="body-sm-medium" color="muted">
        {label}
      </Text>
      <Text variant="body-lg-bold">{value}</Text>
    </Stack>
  )
}

const header = <ContentCardHeader overline="Copa do Mundo · Ao vivo" title="Estatísticas" subtitle="1º tempo" />
const body = (
  <ContentCardBody quote="Um primeiro tempo de paciência, e de pouca pontaria.">
    <StatRow label="Posse de bola" value="62% · 38%" />
    <StatRow label="Finalizações" value="11 · 7" />
    <StatRow label="Escanteios" value="5 · 3" />
  </ContentCardBody>
)
const footer = <ContentCardFooter caption="Atualizado há 1 min" />

const meta = {
  title: 'UI Kit/Content Card',
  component: ContentCard,
  // The zones, so the components manifest documents them with the card.
  subcomponents: { ContentCardHeader, ContentCardBody, ContentCardFooter },
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <Box padding="xl" background="primary">
        <Story />
      </Box>
    ),
  ],
} satisfies Meta<typeof ContentCard>

export default meta
type Story = StoryObj<typeof meta>

/** Every zone, at rest — translucent, content dimmed. */
export const Default: Story = {
  args: { interactionState: 'default' },
  render: (args) => (
    <ContentCard {...args}>
      {header}
      {body}
      {footer}
    </ContentCard>
  ),
}

/** Every zone, focused — the kit's one ring, at full strength. */
export const Focus: Story = {
  args: { interactionState: 'focus' },
  render: Default.render,
}

/** Any zone may be left out. The footer stays on the bottom edge with or without a body. */
export const OptOuts: Story = {
  args: {},
  render: () => (
    <Stack direction="row" align="start" gap="lg">
      <ContentCard height={272}>{header}</ContentCard>
      <ContentCard height={272}>
        {header}
        {footer}
      </ContentCard>
      <ContentCard height={272}>{body}</ContentCard>
      <ContentCard height={272}>
        {body}
        {footer}
      </ContentCard>
    </Stack>
  ),
}

/**
 * Every header the card needs, from one component — each part is optional and
 * collapses when left out, so these are prop combinations rather than variants.
 */
export const Headers: Story = {
  args: {},
  render: () => (
    <Stack direction="column" gap="lg">
      {(
        [
          ['Match', <ContentCardHeader key="m" title="" match={{ home: { badge: home, name: 'EQU' }, away: { badge: away, name: 'ARG' } }} />],
          ['Badge + title + subtitle', <ContentCardHeader key="i" icon={home} title="Equador" subtitle="4-3-3" />],
          ['Title only', <ContentCardHeader key="t" title="Brasileirão Betano 2026" />],
          ['Title + subtitle + columns', <ContentCardHeader key="s" title="Grupo A" subtitle="Fase de grupos" stats={['Pts', 'J', 'V']} />],
          ['Title + subtitle', <ContentCardHeader key="ts" title="Próximos jogos na Globo" subtitle="Copa do Mundo Fifa 2026" />],
          ['Partner', <ContentCardHeader key="p" title="" partner={{ logo: away, name: 'Magalu', verified: true }} />],
          ['Ad tag', <ContentCardHeader key="a" title="" ad={{ label: 'Publicidade', logo: away }} />],
        ] as const
      ).map(([label, node]) => (
        <Stack key={label} direction="column" gap="2xs">
          <Text variant="caption-medium" color="subtle">
            {label}
          </Text>
          <Box padding="lg" background="elevated" radius="2xl">
            <div style={{ width: `calc(${size('content-card-width')} - 2 * ${spacing('lg')})` }}>{node}</div>
          </Box>
        </Stack>
      ))}
    </Stack>
  ),
}

/** A card built the way a screen builds one: a header, then a table of rows. */
export const SportsTable: Story = {
  args: {},
  render: () => (
    <Stack direction="row" align="start" gap="lg">
      <ContentCard height={264}>
        <ContentCardHeader title="" match={{ home: { badge: home, name: 'EQU' }, away: { badge: away, name: 'ARG' } }} />
        <ContentCardBody>
          <TableCell type="scout" label="Posse de bola" values={['49%', '51%']} divider />
          <TableCell position="1" shield={home} name="SAO" stats={['16', '6', '5']} />
          <TableCell position="1" shield={away} name="ARG" stats={['5', '2', '2']} />
        </ContentCardBody>
        <ContentCardFooter caption="Atualizado há 1 min" />
      </ContentCard>
      <ContentCard height={264}>
        <ContentCardHeader icon={home} title="Equador" subtitle="4-3-3" />
        <ContentCardBody>
          <TableCell type="athlete" number="2" name="Félix Torrez" yellowCard />
          <TableCell type="athlete" number="9" name="E. Valencia" goals={2} />
          <TableCell type="athlete" number="23" name="M. Caicedo" substitute="N. Sobrenome" />
        </ContentCardBody>
      </ContentCard>
    </Stack>
  ),
}

/** The height is a count of 8pt grid steps, set per use, up to 456. */
export const Heights: Story = {
  args: {},
  render: () => (
    <Stack direction="row" align="end" gap="lg">
      {[272, 352, 440, 456].map((height) => (
        <ContentCard key={height} height={height}>
          <ContentCardHeader overline="Altura" title={`${height}`} />
          {footer}
        </ContentCard>
      ))}
    </Stack>
  ),
}
