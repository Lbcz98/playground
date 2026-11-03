import type { Meta, StoryObj } from '@storybook/react-vite'
import { Box, Stack, spacing, token } from '@/primitives'
import { AboutDetailCard, type ContentRating } from './AboutDetailCard'
import { TechnicalSheetCard } from './TechnicalSheetCard'
import encontro from './story-assets/encontro.png'

function DetailsComposition({ liveProduct = false }: { liveProduct?: boolean }) {
  const scale = globalThis.innerWidth >= 1920 ? 1.5 : 1

  return (
    <div
      style={{
        width: 1280 * scale,
        height: 720 * scale,
        overflow: 'hidden',
        backgroundColor: token('--color-semantic-functional-background-primary'),
      }}
    >
      <main
        style={{
          boxSizing: 'border-box',
          display: 'flex',
          alignItems: 'end',
          width: 1280,
          height: 720,
          padding: `calc(5 * ${spacing('2xs')})`,
          backgroundColor: token('--color-semantic-functional-background-primary'),
          backgroundImage: token('--gradient-semantic-overlay-bottom'),
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'stretch',
            gap: spacing('sm'),
            width: '100%',
          }}
        >
          {liveProduct ? (
            <>
              <AboutDetailCard
                logo={{ src: encontro, alt: 'A Nobreza do Amor' }}
                title="A Nobreza do Amor"
                description="O mundo da realeza africana, a luta por justiça e o amor entre uma princesa da África e um trabalhador do Brasil nesta fábula dos anos de 1920, cheia de romance, aventura e humor."
                rating="12"
                year="2026"
                category="Novelas"
                genres={['Romance', 'Drama', 'Época']}
                country="Brasil"
              />
              <TechnicalSheetCard
                category="Série"
                artDirectorsNames={['Gustavo Fernandez']}
                screenwritersNames={['Alessandro Marson', 'Dora Castellar', 'Duba Elia', 'Dione Carlos']}
                castNames={[
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
                ]}
              />
            </>
          ) : (
            <>
              <AboutDetailCard
                logo={{ src: encontro, alt: 'Encontro com Patrícia Poeta' }}
                title="Encontro com Patrícia Poeta"
                description="Com pautas variadas e atuais, o programa reúne informação, prestação de serviço, música e histórias inspiradoras."
                rating="10"
                year="2022"
                category="Variedades"
                genres={['Programa de Auditório', 'Entrevista', 'Música']}
                country="Brasil"
              />
              <TechnicalSheetCard category="Variedades" castNames={['Patrícia Poeta']} />
            </>
          )}
        </div>
      </main>
    </div>
  )
}

const meta = {
  title: 'UI Kit/About Detail Card',
  component: AboutDetailCard,
  parameters: { layout: 'centered' },
  decorators: [
    (Story, context) =>
      context.name.startsWith('Details Row') ? (
        <Story />
      ) : (
        <Box padding="xl" background="primary">
          <Story />
        </Box>
      ),
  ],
  args: {
    logo: { src: encontro, alt: 'Encontro com Patrícia Poeta' },
    title: 'Encontro com Patrícia Poeta',
    description:
      'Com pautas variadas e atuais, o programa reúne informação, prestação de serviço, música e histórias inspiradoras.',
    rating: '10',
    year: '2022',
    category: 'Variedades',
    genres: ['Programa de Auditório', 'Entrevista', 'Música'],
    country: 'Brasil',
  },
} satisfies Meta<typeof AboutDetailCard>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const LongContent: Story = {
  args: {
    title: 'Encontro com Patrícia Poeta — edição especial de aniversário',
    description:
      'Uma edição especial ao vivo reúne convidados, música, informação, prestação de serviço e histórias de diferentes regiões do Brasil para celebrar a trajetória do programa.',
    category: 'Variedades e entretenimento',
    genres: ['Programa de Auditório', 'Entrevista', 'Música', 'Jornalismo', 'Comportamento'],
  },
}

const ratings: ContentRating[] = ['L', '6', '10', '12', '14', '16', '18']

export const Ratings: Story = {
  render: (args) => (
    <Stack gap="sm">
      {ratings.map((rating) => (
        <AboutDetailCard {...args} key={rating} rating={rating} />
      ))}
    </Stack>
  ),
}

export const DetailsRow: Story = {
  parameters: { layout: 'fullscreen' },
  render: () => <DetailsComposition />,
}

export const DetailsRowLiveProduct: Story = {
  parameters: { layout: 'fullscreen' },
  render: () => <DetailsComposition liveProduct />,
}
