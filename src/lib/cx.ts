/** Minimal classname joiner. No external dependency, no arbitrary-value helpers. */
export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}
