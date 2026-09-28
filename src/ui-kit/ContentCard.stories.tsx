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

// ---------------------------------------------------------------------------
// The four sports cards as Figma composes them (UI Kit, page "Botões"). Each one
// is built here from the same library components the Figma frame uses — one
// ContentCardHeader, a body of Table Cells, and a footer where Figma has one —
// with Figma's content. Crests and flags are the stand-in badge, as in every
// story here. No height is set: the card hugs its content, as Figma's frames do.
// ---------------------------------------------------------------------------

const standings: [string, string, string, string][] = [
  ['FLA', '60', '28', '18'], ['PAL', '57', '28', '16'], ['CAP', '49', '28', '14'], ['FLU', '48', '28', '13'],
  ['BAH', '46', '28', '12'], ['CRU', '45', '28', '13'], ['CAM', '40', '28', '11'], ['SAN', '38', '28', '10'],
  ['CFC', '38', '28', '10'], ['RBR', '36', '28', '10'], ['BOT', '35', '28', '9'], ['SAO', '34', '28', '9'],
  ['GRE', '33', '28', '9'], ['VAS', '32', '28', '8'], ['INT', '31', '28', '8'], ['COR', '30', '28', '7'],
  ['JUV', '28', '28', '7'], ['VIT', '26', '28', '6'], ['CUI', '22', '28', '5'], ['CRI', '19', '28', '4'],
]

/**
 * Tabela de classificação — Figma 6371:7480 (288×410). Title, then the round with
 * the column headings beside it, ten team rows and a "see more" footer. Click the
 * card (or Enter / Space on it) for teams 11–20, and again to go back.
 */
export const TabelaDeCampeonato: Story = {
  name: 'Tabela de campeonato',
  args: {},
  render: () => (
    // Ten team rows fill the card, so the twenty page: a click on the card shows the next ten.
    <ContentCard rowsPerPage={10}>
      <ContentCardHeader title="Campeonato Brasileiro" subtitle="Rodada 28" stats={['Pts', 'J', 'V']} />
      <ContentCardBody>
        {standings.map(([name, pts, j, v], i) => (
          <TableCell key={name} position={String(i + 1)} shield={home} name={name} stats={[pts, j, v]} />
        ))}
      </ContentCardBody>
      <ContentCardFooter caption="Clique para ver mais" />
    </ContentCard>
  ),
}

/** Tabela de grupos — Figma 6371:12305 (288×209). A group's four teams, no footer. */
export const TabelaDeGrupos: Story = {
  name: 'Tabela de grupos',
  args: {},
  render: () => (
    <ContentCard>
      <ContentCardHeader title="Grupo A" subtitle="Fase de Grupos" stats={['Pts', 'J', 'V']} />
      <ContentCardBody>
        {[['MEX', '9', '3', '3'], ['AFR', '4', '3', '1'], ['COR', '3', '3', '1'], ['TCH', '1', '3', '0']].map(([name, pts, j, v], i) => (
          <TableCell key={name} position={String(i + 1)} shield={away} name={name} stats={[pts, j, v]} />
        ))}
      </ContentCardBody>
    </ContentCard>
  ),
}

const lineup: [string, string][] = [
  ['2', 'Félix Torrez'], ['3', 'Hincapié'], ['4', 'Ordóñez'], ['6', 'Pacho'], ['7', 'Arévalo'], ['9', 'Yeboah'],
  ['10', 'Páez'], ['12', 'Ramirez'], ['13', 'Castillo'], ['21', 'Alan Franco'], ['23', 'Caicedo'],
]

/** Escalação — Figma 6371:15578 (288×405). The flag beside the team and its formation, eleven athlete rows. */
export const Escalacao: Story = {
  name: 'Escalação',
  args: {},
  render: () => (
    <ContentCard>
      <ContentCardHeader icon={home} title="Equador" subtitle="4-3-3" />
      <ContentCardBody>
        {lineup.map(([number, name], i) => (
          <TableCell key={number} type="athlete" number={number} name={name} divider={i < lineup.length - 1} />
        ))}
      </ContentCardBody>
    </ContentCard>
  ),
}

const scouts: [string, string, string][] = [
  ['Posse de bola', '49%', '51%'], ['Finalizações', '7', '9'], ['Escanteios a favor', '5', '6'], ['Desarmes', '11', '8'],
  ['Faltas', '3', '9'], ['Cartões amarelos', '1', '2'], ['Cartões vermelhos', '0', '1'],
]

/** Estatísticas — Figma 6371:18685 (288×366). The match in the header, seven scout rows. */
export const Estatisticas: Story = {
  name: 'Estatísticas',
  args: {},
  render: () => (
    <ContentCard>
      <ContentCardHeader title="" match={{ home: { badge: home, name: 'EQU' }, away: { badge: away, name: 'ARG' } }} />
      <ContentCardBody>
        {scouts.map(([label, left, right], i) => (
          <TableCell key={label} type="scout" label={label} values={[left, right]} divider={i < scouts.length - 1} />
        ))}
      </ContentCardBody>
    </ContentCard>
  ),
}

/**
 * Both gaps are yours to set, in px, anywhere on the 8pt scale — a multiple of 8,
 * or the tight 4 and 12. `gap` on the card spaces its header, body and footer
 * (default 16); `gap` on the body spaces its rows (default 8, `table-row-gap`).
 * Anything off the scale (5, 20, 28) is rejected by the validator.
 */
export const Gaps: Story = {
  args: {},
  render: () => (
    <Stack direction="row" align="start" gap="lg">
      {([
        [8, 4],
        [16, 8],
        [24, 16],
      ] as const).map(([zones, rows]) => (
        <Stack key={zones} direction="column" gap="2xs">
          <Text variant="caption-medium" color="subtle">
            {`card gap ${zones} · body gap ${rows}`}
          </Text>
          <ContentCard gap={zones}>
            <ContentCardHeader title="Grupo A" subtitle="Fase de Grupos" stats={['Pts', 'J', 'V']} />
            <ContentCardBody gap={rows}>
              {[['MEX', '9', '3', '3'], ['AFR', '4', '3', '1'], ['COR', '3', '3', '1'], ['TCH', '1', '3', '0']].map(([name, pts, j, v], i) => (
                <TableCell key={name} position={String(i + 1)} shield={away} name={name} stats={[pts, j, v]} />
              ))}
            </ContentCardBody>
            <ContentCardFooter caption="Atualizado há 1 min" />
          </ContentCard>
        </Stack>
      ))}
    </Stack>
  ),
}
