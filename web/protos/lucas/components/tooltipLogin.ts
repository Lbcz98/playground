/** Estado do tooltip "Faça o login" para o passeio todo: as telas são trocadas, então ele vive fora delas. 'novo' = a Home ainda não abriu; 'visivel' = o tooltip está na tela; 'feito' = o foco está num botão da esquerda (a pílula encolhe). Volta a 'visivel' quando o foco cai num botão da direita. */
export type FaseTooltip = 'novo' | 'visivel' | 'feito'

/** A primeira entrada espera este tempo depois que a Home aparece. Uma reentrada (foco de volta num botão da direita) não espera. */
const ESPERA_HOME = 1000

let fase: FaseTooltip = 'novo'
let jaEntrou = false
let homeEm = 0
let menuEntrou = false

export function faseTooltip(): FaseTooltip {
  return fase
}

export function reiniciaTooltip(): void {
  fase = 'novo'
  jaEntrou = false
  homeEm = 0
  menuEntrou = false
}

/** Marca a primeira Home. Chamadas seguintes não movem o relógio. */
export function marcaHome(): void {
  if (homeEm === 0) homeEm = Date.now()
}

/** Quanto falta para a primeira entrada, contado da primeira Home. */
export function atrasoEntrada(): number {
  marcaHome()
  return Math.max(0, ESPERA_HOME - (Date.now() - homeEm))
}

/** O foco foi para a esquerda. Devolve se o tooltip estava na tela (só então a saída anima). Se ele ainda não entrou, a fase continua 'novo' e o relógio da Home segue. */
export function irParaEsquerda(): boolean {
  const estava = fase === 'visivel'
  if (estava) fase = 'feito'
  return estava
}

/** Abre o tooltip num botão da direita. Se ele tinha encolhido, a entrada toca de novo e a fase vai a 'visivel' na hora. Na primeira vez a fase fica 'novo' até mostraTooltip(), para a espera de 1s sobreviver a uma remontagem. Devolve se a entrada ainda não tocou até o fim. */
export function abreTooltip(): boolean {
  if (fase === 'feito') {
    jaEntrou = false
    fase = 'visivel'
    return true
  }
  if (fase === 'novo') {
    marcaHome()
    return true
  }
  return !jaEntrou
}

/** A entrada começou de fato: a fase passa a 'visivel'. */
export function mostraTooltip(): void {
  fase = 'visivel'
}

export function entrouTooltip(): void {
  jaEntrou = true
}

/** O tooltip já está na tela e já terminou de entrar: uma Home nova o mostra aceso, sem animar. */
export function tooltipJaEntrou(): boolean {
  return fase === 'visivel' && jaEntrou
}

/** A orquestra do menu toca uma vez por passeio. */
export function menuJaEntrou(): boolean {
  return menuEntrou
}

export function entrouMenu(): void {
  menuEntrou = true
}
