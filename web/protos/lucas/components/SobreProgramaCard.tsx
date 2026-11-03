import type { ReactNode } from 'react'
import { AboutDetailCard } from '@/ui-kit/AboutDetailCard'

type Classificacao = 'L' | '6' | '10' | '12' | '14' | '16' | '18'

interface SobreProgramaCardProps {
  logo: string
  nome: string
  sinopse: string
  classificacao: Classificacao
  categoria: string
  generos: readonly string[]
  pais: string
}

/**
 * @proposal
 * why: o card "Sobre" (AboutDetailCard) é novo no kit e ainda não está no catálogo de componentes que as telas aceitam
 * description: o AboutDetailCard do kit com a sinopse, a classificação e os detalhes de um programa da grade
 * proposedApi:
 *   logo: "string"
 *   nome: "string"
 *   sinopse: "string"
 *   classificacao: "'L' | '6' | '10' | '12' | '14' | '16' | '18'"
 *   categoria: "string"
 *   generos: "string[]"
 *   pais: "string"
 */
export function SobreProgramaCard({ logo, nome, sinopse, classificacao, categoria, generos, pais }: SobreProgramaCardProps): ReactNode {
  return <AboutDetailCard logo={{ src: logo, alt: nome }} title={nome} description={sinopse} rating={classificacao} category={categoria} genres={generos} country={pais} />
}
