import type { Preview } from '@storybook/react-vite'
// Same font + foundational design-token layer main.tsx loads.
import '@fontsource-variable/inter'
import '../src/styles/global.css'

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
       color: /(background|color)$/i,
       date: /Date$/i,
      },
    },
  },
};

export default preview;