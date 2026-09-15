import type { Meta, StoryObj } from '@storybook/react-vite'
import arrowLeftIcon from '@/ui-kit/icons/arrow-left.svg'
import arrowRightIcon from '@/ui-kit/icons/arrow-right.svg'
import { Box } from './Box'
import { Button, type ButtonStatus, type ButtonVariant } from './Button'
import { Stack } from './Stack'
import { Text } from './Text'

const VARIANTS: ButtonVariant[] = ['primary', 'secondary', 'ghost']
const STATUSES: ButtonStatus[] = ['default', 'focus', 'loading', 'disabled']

const icon = (src: string) => <img src={src} alt="" style={{ width: '100%', height: '100%', display: 'block' }} />

const meta = {
  title: 'Primitives/Button',
  component: Button,
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <Box padding="xl" background="primary">
        <Story />
      </Box>
    ),
  ],
  args: { children: 'Assistir', variant: 'primary', size: 'md', status: 'default' },
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = {}
export const Focus: Story = { args: { status: 'focus' } }
export const Secondary: Story = { args: { variant: 'secondary' } }
export const Ghost: Story = { args: { variant: 'ghost' } }
export const Loading: Story = { args: { status: 'loading' } }
export const Disabled: Story = { args: { status: 'disabled' } }
export const Large: Story = { args: { size: 'lg', status: 'focus' } }
export const WithIcons: Story = {
  args: { status: 'focus', iconLeft: icon(arrowLeftIcon), iconRight: icon(arrowRightIcon) },
}

/** Every variant × status. The focus column matches across variants by design: TV has one focus language. */
export const AllStates: Story = {
  render: (args) => (
    <Stack gap="lg">
      {VARIANTS.map((variant) => (
        <Stack key={variant} gap="2xs">
          <Text variant="caption-medium" color="secondary">
            {variant}
          </Text>
          <Stack direction="row" gap="sm" align="center">
            {STATUSES.map((status) => (
              <Button key={status} {...args} variant={variant} status={status} />
            ))}
          </Stack>
        </Stack>
      ))}
    </Stack>
  ),
}
