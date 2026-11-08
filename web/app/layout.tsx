import type { ReactNode } from 'react'
// Same font and token layer the kit gets in the app and in Storybook.
import '@fontsource-variable/inter'
import '../../src/styles/global.css'
import '../../src/index.css'
import { EARLY_SCRIPT } from './early-script'

export const metadata = { title: 'Playground DTV' }

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    // The early script adds feature classes to <html> before hydration.
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: EARLY_SCRIPT }} />
      </head>
      <body style={{ margin: 0, fontFamily: 'Inter Variable, system-ui, sans-serif' }}>{children}</body>
    </html>
  )
}
