import type { Meta, StoryObj } from '@storybook/react-vite'
import type { ComponentProps } from 'react'
import { Box, spacing } from '@/primitives'
import { AboutDetailCard } from './AboutDetailCard'
import { TechnicalSheetCard } from './TechnicalSheetCard'
import encontro from './story-assets/encontro.png'

type SheetProps = ComponentProps<typeof TechnicalSheetCard>

const cast = [
  'Duda Santos',
  'Lázaro Ramos',
  'Nicolas Prattes',
  'Erika Januza',
  'Danton Mello',
  'Cassio Gabus Mendes',
  'Fabiana Karla',
  'Emanuelle Araújo',
  'Theresa Fonseca',
  'Rodrigo Simas',
  'Alinne Moraes',
  'Marieta Severo',
]

/** Three lines at the About card's width: the standard height, with room for four lines of sheet. */
const synopsis =
  'Com pautas variadas e atuais, o programa reúne informação, prestação de serviço, música e histórias inspiradoras. Patrícia Poeta recebe convidados, mostra o que acontece no Brasil e conversa sobre comportamento, saúde e cultura.'

/**
 * The sheet next to an About card: it takes the About card's height and shares it between
 * its fields, so the About card's text decides how many lines each field gets.
 */
function BesideAboutCard({
  title = 'Encontro com Patrícia Poeta',
  description = synopsis,
  ...sheet
}: SheetProps & { title?: string; description?: string }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'stretch',
        gap: spacing('sm'),
        width: `calc(150 * ${spacing('2xs')})`,
      }}
    >
      <AboutDetailCard
        logo={{ src: encontro, alt: title }}
        title={title}
        description={description}
        rating="10"
        year="2022"
        category="Variedades"
        genres={['Programa de Auditório', 'Entrevista', 'Música']}
        country="Brasil"
      />
      <TechnicalSheetCard {...sheet} />
    </div>
  )
}

const meta = {
  title: 'UI Kit/Technical Sheet Card',
  component: TechnicalSheetCard,
  parameters: { layout: 'centered' },
  decorators: [
    (Story, context) =>
      context.name.startsWith('Beside') ? (
        <Box padding="xl" background="primary">
          <Story />
        </Box>
      ) : (
        <Box padding="xl" background="primary">
          <div style={{ display: 'flex', width: `calc(61 * ${spacing('2xs')})` }}>
            <Story />
          </div>
        </Box>
      ),
  ],
  args: {
    category: 'Série',
    castNames: ['Patrícia Poeta'],
  },
} satisfies Meta<typeof TechnicalSheetCard>

export default meta
type Story = StoryObj<typeof meta>

export const OneRow: Story = {}

export const MultipleRows: Story = {
  args: {
    directorsNames: ['Alexandre Mattoso'],
    artDirectorsNames: ['Mariano Boni'],
    screenwritersNames: ['Ana Lima', 'Rafael Costa'],
    castNames: ['Patrícia Poeta', 'Tati Machado', 'Valéria Almeida'],
  },
}

/** Alone in a row there is no card to size against, so fields use the caps: 2 lines, 3 for the cast. */
export const LongValues: Story = {
  args: {
    castNames:
      'Patrícia Poeta, Tati Machado, Valéria Almeida, Manoel Soares e convidados de diferentes regiões do Brasil',
  },
}

export const Novela: Story = {
  args: {
    category: 'Novela',
    directorsNames: ['Maria de Médicis'],
    artDirectorsNames: ['João Souza'],
    authorsNames: ['Ana Maria Moretzsohn'],
    castNames: ['Atriz Principal', 'Ator Principal'],
  },
}

export const Empty: Story = {
  args: {
    category: 'Variedades',
    directorsNames: null,
    artDirectorsNames: null,
    screenwritersNames: null,
    authorsNames: null,
    castNames: null,
  },
}

/** Four lines of room: the director takes one, the cast takes the rest it needs. */
export const BesideAboutCardCast: Story = {
  render: (args) => <BesideAboutCard {...args} />,
  args: { directorsNames: ['Jeferson De'], castNames: cast.slice(0, 4) },
}

/** A long cast gets a third line when the other fields leave room, then an ellipsis. */
export const BesideAboutCardLongCast: Story = {
  render: (args) => <BesideAboutCard {...args} />,
  args: { directorsNames: ['Jeferson De'], castNames: cast },
}

/** Four fields share four lines: one line each, and the cast stays visible. */
export const BesideAboutCardFourFields: Story = {
  render: (args) => <BesideAboutCard {...args} />,
  args: {
    directorsNames: ['Luiz Henrique Rios', 'Natália Grimberg', 'Allan Fiterman'],
    artDirectorsNames: ['Natália Grimberg'],
    screenwritersNames: ['Lícia Manzo', 'Daisy Chaves', 'Dora Castellar', 'Cecília Giannetti'],
    castNames: cast,
  },
}

/** A one-line synopsis leaves room for two lines: the lowest-priority fields are hidden. */
export const BesideAboutCardShort: Story = {
  render: (args) => <BesideAboutCard {...args} description="Telejornal local." />,
  args: {
    directorsNames: ['Luiz Henrique Rios', 'Natália Grimberg'],
    artDirectorsNames: ['Natália Grimberg'],
    screenwritersNames: ['Lícia Manzo', 'Daisy Chaves'],
    castNames: cast,
  },
}

/** A two-line title gives five lines: the director gets two and the cast three. */
export const BesideAboutCardTall: Story = {
  render: (args) => (
    <BesideAboutCard
      {...args}
      title="Chef de Alto Nível - 2ª temporada: edição especial de fim de ano com convidados"
    />
  ),
  args: {
    directorsNames: ['Luiz Henrique Rios', 'Natália Grimberg', 'Allan Fiterman', 'Fábio Strazzer'],
    castNames: cast,
  },
}

/** A name with no spaces wraps instead of being clipped. */
export const BesideAboutCardLongName: Story = {
  render: (args) => <BesideAboutCard {...args} />,
  args: {
    directorsNames: ['Jeferson De'],
    castNames: ['MariaDoCarmoAlbuquerqueDeSouzaPereiraDosSantosNascimentoOliveiraFerreira', 'Lucy Ramos'],
  },
}
