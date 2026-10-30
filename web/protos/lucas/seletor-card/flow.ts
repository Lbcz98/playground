export default {
  start: 'voltar',
  transitions: [
    { from: 'voltar', key: 'up', to: 'card' },
    { from: 'card', key: 'down', to: 'voltar' },
  ],
}
