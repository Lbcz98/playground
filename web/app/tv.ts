import { TV_FLAG } from './early-script'

/** TV mode (`?tv=1`, set by the early script in the root layout): the page is laid out 1280px wide, the stage at scale 1. */
export function isTvMode(): boolean {
  try {
    return sessionStorage.getItem(TV_FLAG) === '1'
  } catch {
    return false
  }
}
