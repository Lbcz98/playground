/** One interaction-state vocabulary for every interactive component: each takes `interactionState`, a subset of this union. */
export type InteractionState = 'default' | 'focus' | 'selected' | 'loading' | 'disabled'
