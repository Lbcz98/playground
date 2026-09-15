/**
 * Spinner — the one loading indicator. Turns continuously (and holds still
 * under `prefers-reduced-motion`), sized by a semantic size token.
 */

import type { ReactNode } from 'react'
import spinnerIcon from '@/ui-kit/icons/spinner.svg'
import './primitives.css'
import { size as sizeRole, type SizeRole } from './tokens'

export interface SpinnerProps {
  size: SizeRole
}

export function Spinner({ size }: SpinnerProps): ReactNode {
  const edge = sizeRole(size)
  return <img src={spinnerIcon} alt="" className="sfs-spin" style={{ width: edge, height: edge, display: 'block' }} />
}
