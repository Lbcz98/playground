// Campeonato: Home → trilha → tabela (times 1–10); Enter no cartão alterna com os times 11–20. Voltar (Esc) é automático.
export default {
  start: 'home',
  transitions: [
    { from: 'home', key: 'up', to: 'rail' },
    { from: 'rail', key: 'down', to: 'home' },
    { from: 'rail', key: 'enter', to: 'tabela-1' },
    { from: 'tabela-1', key: 'enter', to: 'tabela-2' },
    { from: 'tabela-2', key: 'enter', to: 'tabela-1' },
  ],
}
