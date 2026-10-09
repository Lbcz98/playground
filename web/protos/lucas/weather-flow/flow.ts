export default {
  start: 'home-bug',
  transitions: [
    { from: 'home-bug', key: 'left', to: 'home-program' },
    { from: 'home-program', key: 'right', to: 'home-bug' },
    { from: 'home-program', key: 'up', to: 'rail-program' },
    { from: 'rail-program', key: 'down', to: 'home-program' },
    { from: 'rail-program', key: 'enter', to: 'detail' },
    { from: 'home-program', key: 'back', to: 'home-bug' },
    { from: 'home-bug', key: 'back', to: 'hidden' },
  ],
}
