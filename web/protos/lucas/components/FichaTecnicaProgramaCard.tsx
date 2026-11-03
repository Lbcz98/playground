import type { ReactNode } from 'react'
import { TechnicalSheetCard, type TechnicalSheetCategory } from '@/ui-kit/TechnicalSheetCard'

interface FichaTecnicaProgramaCardProps {
  categoria: TechnicalSheetCategory
  direcao?: readonly string[]
  elenco?: readonly string[]
}

/**
 * @proposal
 * why: o card "Ficha técnica" (TechnicalSheetCard) é novo no kit e ainda não está no catálogo de componentes que as telas aceitam
 * description: o TechnicalSheetCard do kit com a categoria, a direção e o elenco de um programa da grade (a grade do site não traz direção artística, roteiro nem autor)
 * proposedApi:
 *   categoria: "'Série' | 'Filme' | 'Novela' | 'Variedades'"
 *   direcao: "string[]"
 *   elenco: "string[]"
 */
export function FichaTecnicaProgramaCard({ categoria, direcao, elenco }: FichaTecnicaProgramaCardProps): ReactNode {
  return <TechnicalSheetCard category={categoria} directorsNames={direcao} castNames={elenco} />
}
