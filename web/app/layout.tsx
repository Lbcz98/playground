import type { ReactNode } from 'react'
// Same font and token layer the kit gets in the app and in Storybook.
import '@fontsource-variable/inter'
import '../../src/styles/global.css'
import '../../src/index.css'

export const metadata = { title: 'Playground DTV' }

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body style={{ margin: 0, fontFamily: 'Inter Variable, system-ui, sans-serif' }}>{children}</body>
    </html>
  )
}
