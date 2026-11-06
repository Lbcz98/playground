/** Estado do tooltip "Faça o login" para o passeio todo: as telas são trocadas, então ele vive fora delas. 'novo' = a Home ainda não abriu; 'visivel' = o tooltip está na tela; 'feito' = o foco já foi para a esquerda (o selo entra). */
export type FaseTooltip = 'novo' | 'visivel' | 'feito'

let fase: FaseTooltip = 'novo'
let jaEntrou = false

export function faseTooltip(): FaseTooltip {
  return fase
}

export function reiniciaTooltip(): void {
  fase = 'novo'
  jaEntrou = false
}

/** O foco foi para a esquerda. Devolve se o tooltip estava na tela (só então a saída anima). */
export function irParaEsquerda(): boolean {
  const estava = fase === 'visivel'
  fase = 'feito'
  return estava
}

/** Abre o tooltip se ainda não abriu. Devolve se a entrada ainda não tocou até o fim (só então ela anima). Quem chama avisa com entrouTooltip() quando a entrada terminou: montar duas vezes (modo estrito, remontagem) não gasta a animação. */
export function abreTooltip(): boolean {
  if (fase === 'feito') return false
  fase = 'visivel'
  return !jaEntrou
}

export function entrouTooltip(): void {
  jaEntrou = true
}

/** O tooltip já está na tela e já terminou de entrar: uma Home nova o mostra aceso, sem animar. */
export function tooltipJaEntrou(): boolean {
  return fase === 'visivel' && jaEntrou
}
