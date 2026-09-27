/**
 * Which element holds the focus inside a canvas node — pure DOM queries, no layout,
 * so it can be tested without a browser.
 */

/** An element that marks itself focused (the main menu's channel button) or draws a focus ring. */
export function isMarkedFocus(el: Element): boolean {
  return el.matches('[data-focused]') || el.querySelector('[data-focus-ring]') !== null
}

/** A node's focusable: the one it draws focused (a menu's focused item), else its first. */
export function focusableInNode<T extends { el: Element }>(node: Element | null, focusables: T[]): T | undefined {
  if (!node) return undefined
  const inside = focusables.filter((f) => f.el === node || node.contains(f.el))
  return inside.find((f) => isMarkedFocus(f.el)) ?? inside[0]
}
