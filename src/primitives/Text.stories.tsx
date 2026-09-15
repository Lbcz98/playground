import type { Meta, StoryObj } from '@storybook/react-vite'
import { TEXT_STYLES } from '@/styles/global-tokens'
import { Box } from './Box'
import { Stack } from './Stack'
import { Text } from './Text'

const meta = {
  title: 'Primitives/Text',
  component: Text,
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <Box padding="xl" background="primary">
        <Story />
      </Box>
    ),
  ],
  args: { children: 'Copa do Mundo: Equador x Argentina', variant: 'body-md-regular', color: 'primary' },
  argTypes: { variant: { control: 'select', options: [...TEXT_STYLES] } },
} satisfies Meta<typeof Text>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const Secondary: Story = {
  args: { variant: 'footnote-medium', color: 'secondary', children: 'A seguir Central da Copa' },
}
export const Status: Story = {
  args: { variant: 'body-sm-bold', color: 'status-error', children: 'Não foi possível carregar' },
}

/** Every `.text-*` class generated from tokens.json, in contract order. */
export const TypeScale: Story = {
  render: (args) => (
    <Stack gap="sm">
      {TEXT_STYLES.map((variant) => (
        <Stack key={variant} gap="3xs">
          <Text variant="caption-medium" color="secondary">
            text-{variant}
          </Text>
          <Text {...args} variant={variant} />
        </Stack>
      ))}
    </Stack>
  ),
}
