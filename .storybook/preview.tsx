import type { Preview } from '@storybook/react-vite'
// Same font + foundational design-token layer main.tsx loads.
import '@fontsource-variable/inter'
import '../src/styles/global.css'
// The app's own stylesheet (Tailwind + the canvas surface reset), so a story
// that renders the canvas frame lays out exactly as the app does.
import '../src/index.css'

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