import { Screen } from '@/ui-kit/Screen'
import { Stack } from '@/primitives'

export default function Hidden() {
  return (
    <Screen model="alert" level={0}>
      <Stack direction="column" justify="end" padding="none" grow />
    </Screen>
  )
}
