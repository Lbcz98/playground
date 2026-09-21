import type { ReactNode } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Box, Stack, Text } from '@/primitives'
import { ContentCard, ContentCardBody, ContentCardFooter, ContentCardHeader } from './ContentCard'

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
