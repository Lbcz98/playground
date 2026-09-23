import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  "stories": [
    "../src/**/*.mdx",
    "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"
  ],
  "addons": [
    "@storybook/addon-a11y",
    "@storybook/addon-docs",
    "@storybook/addon-mcp"
  ],
  "framework": "@storybook/react-vite",
  // Emits manifests/components.json (react-docgen per component) on build —
  // the metadata `npm run storybook:manifest` snapshots for the catalog parity tests.
  "features": {
    "componentsManifest": true
  }
};
export default config;