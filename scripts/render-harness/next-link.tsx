/** `next/link` for the render harness: match the anchor used by Next for screen links. */
import type { CSSProperties, ReactNode } from 'react'

export default function Link({ href, children, style, className, 'aria-label': ariaLabel }: { href: string; children?: ReactNode; style?: CSSProperties; className?: string; 'aria-label'?: string }) {
  return (
    <a href={href} style={{ display: 'inline-block', ...style }} className={className} aria-label={ariaLabel}>
      {children}
    </a>
  )
}
