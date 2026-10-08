/** `next/link` for the render harness: an `<a href>` with no layout box of its own, so the kit element inside measures as without it. */
import type { ReactNode } from 'react'

export default function Link({ href, children }: { href: string; children?: ReactNode }) {
  return (
    <a href={href} style={{ display: 'contents' }}>
      {children}
    </a>
  )
}
