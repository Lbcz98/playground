/**
 * Põe um <style> no <head> uma vez por página, quando o módulo carrega (o fluxo pré-carrega todas as telas ao abrir).
 *
 * Um <style> dentro do JSX entra de novo a cada montagem, e cada troca de foco remonta o menu: o navegador relê a folha
 * e recalcula o estilo da página inteira. Postada uma vez, a folha não custa nada na troca. Num recarregamento do dev o
 * texto é trocado. Medido na TV (Chrome 68): a troca de foco passou a não bloquear a thread principal, mas o efeito
 * só desta mudança não foi separado das outras (menu estável na árvore, troca em um render), então o ganho é provável,
 * não provado.
 */
export function estiloUnico(id: string, css: string): void {
  if (typeof document === 'undefined') return
  const existente = document.getElementById(id)
  if (existente) {
    if (existente.textContent !== css) existente.textContent = css
    return
  }
  const tag = document.createElement('style')
  tag.id = id
  tag.textContent = css
  document.head.appendChild(tag)
}
