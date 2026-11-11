import type { ReactNode } from 'react'

const SUPERFICIES = `nav .sfs-round-button[data-state=default] > .sfs-round-button-circle,
.sfs-content-card,
.sfs-about-detail-card,
.sfs-technical-sheet-card`

// Sem aspas, ">", "&" nem "<" no texto do CSS: o React os escapa no servidor e o cliente discorda (erro de hidratação).
const css = (desfoque: string): string => `
${SUPERFICIES} {
  background-color: var(--color-opacity-dark-70);
}
@supports ((backdrop-filter: blur(0)) or (-webkit-backdrop-filter: blur(0))) {
  ${SUPERFICIES} {
    background-color: var(--color-opacity-dark-50);
    -webkit-backdrop-filter: blur(${desfoque});
    backdrop-filter: blur(${desfoque});
  }
}
`

export interface VidroNaTelaProps {
  /** Raio do desfoque do fundo. */
  desfoque?: string
}

/**
 * Vidro fosco sobre o vídeo, só nos botões redondos do menu e nos cards (a trilha de interactivity buttons fica de fora).
 * Segue measurements/video-glass: o desfoque é `backdrop-filter`, que borra o que está atrás do painel e deixa o texto
 * nítido (`filter: blur` borraria o próprio painel); o vídeo nunca é tocado. O Chrome 68 da TV não tem `backdrop-filter`:
 * lá o painel fica só no véu escuro (o relatório mede 5,9:1 de contraste com 65% de véu e 2,4:1 com 35%), sem desfoque.
 *
 * @proposal
 * why: o kit pinta o fundo translúcido dos botões do menu e dos cards sem desfoque; o designer quer ver o vidro fosco sobre o vídeo ao vivo
 * description: o CSS do vidro fosco (backdrop-filter com véu escuro, e só o véu onde o navegador não tem desfoque) para os botões redondos do MainMenu e para ContentCard, AboutDetailCard e TechnicalSheetCard; não desenha nada por si
 * proposedApi:
 *   desfoque: "string"
 */
export function VidroNaTela({ desfoque = '12px' }: VidroNaTelaProps): ReactNode {
  return <style>{css(desfoque)}</style>
}
