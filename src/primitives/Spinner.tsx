/**
 * Spinner — the one loading indicator. Turns continuously (and holds still
 * under `prefers-reduced-motion`), sized by a semantic size token.
 */

import type { ReactNode } from 'react'
import spinnerIcon from '@/ui-kit/icons/spinner.svg'
import './primitives.css'
import { size as sizeRole, type SizeRole, vars } from './tokens'

export interface SpinnerProps {
  size: SizeRole
}

export function Spinner({ size }: SpinnerProps): ReactNode {
  return <img src={spinnerIcon} alt="" className="sfs-spinner sfs-spin" style={vars({ '--_size': sizeRole(size) })} />
}
