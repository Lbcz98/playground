/**
 * The comment grammar a screen's source speaks to the checks. One home, so the
 * reader (`fromTsx.ts`) and the guide `scripts/build-guides.ts` writes for
 * designers cannot disagree. T03 adds `@reuse` and `@proposal` here.
 */

/** `@deviation <ruleId>: <why>`, read up to the end of the comment or line. */
export const DEVIATION = /@deviation\s+([\w.-]+)\s*:\s*([^\n]*?)\s*(?:\*\/|\n|$)/g

export interface CommentTag {
  tag: string
  /** The shape to write. */
  form: string
  /** What it says, one line. */
  meaning: string
  /** The two places it can sit. */
  node: string
  screen: string
}

export const COMMENT_TAGS: readonly CommentTag[] = [
  {
    tag: '@deviation',
    form: '@deviation <ruleId>: <why>',
    meaning: 'Breaks a pattern rule on purpose (Exploratory mode). Laws and conventions cannot be declared.',
    node: '`{/* @deviation <ruleId>: <why> */}` right before the element it covers.',
    screen: 'A comment on the component (JSDoc or line comments above it); covers the screen.',
  },
]
