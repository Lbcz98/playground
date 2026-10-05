// Grade da programação: Home → a trilha → uma interatividade. Voltar (Esc) é automático.
export default {
  start: 'home',
  transitions: [
    { from: 'home', key: 'up', to: 'rail' },
    { from: 'rail', key: 'down', to: 'home' },
    { from: 'rail', key: 'right', to: 'rail-cinema' },
    { from: 'rail-cinema', key: 'left', to: 'rail' },
    { from: 'rail-cinema', key: 'down', to: 'home' },
    { from: 'rail', key: 'enter', to: 'detail' },
    { from: 'rail-cinema', key: 'enter', to: 'detail' },
  ],
}
