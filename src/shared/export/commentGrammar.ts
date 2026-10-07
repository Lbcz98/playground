/**
 * The comment grammar a screen's source speaks to the checks. One home, so the
 * reader (`fromTsx.ts`) and the guide `scripts/build-guides.ts` writes for
 * designers cannot disagree.
 */

/** `@deviation <ruleId>: <why>`, read up to the end of the comment or line. */
export const DEVIATION = /@deviation\s+([\w.-]+)\s*:\s*([^\n]*?)\s*(?:\*\/|\n|$)/g

/** `@reuse <KitComponent>[, <KitComponent>…]: <why>`, in a JSX comment right before a primitive. */
export const REUSE = /@reuse\s+([^:\n]+?)\s*:\s*([^\n]*?)\s*(?:\*\/|\n|$)/g

/**
 * `@proposal` — a JSDoc block on an exported local component, one field per line:
 *
 *   /**
 *    * @proposal
 *    * why: <why the kit lacks it>
 *    * description: <what it is and does>
 *    * figma: <link, optional>
 *    * proposedApi:
 *    *   <prop>: "<type>"
 *    *\/
 */
export const PROPOSAL_TAG = /@proposal\b/
const FIELD = /^(why|description|figma|proposedApi)\s*:\s*(.*)$/
const API_LINE = /^([A-Za-z][A-Za-z0-9]*)\s*:\s*"([^"]+)"$/

export interface ParsedProposal {
  why: string
  description: string
  figma?: string
  api: Record<string, string>
}

/** The proposal in a JSDoc comment, or what is wrong with it (`missing`), or null when it has no `@proposal` at all. */
export function parseProposal(comment: string): { proposal?: ParsedProposal; missing: string[] } | null {
  if (!PROPOSAL_TAG.test(comment)) return null
  const lines = comment.split('\n').map((l) => l.replace(/^\s*(\/\*\*|\*\/|\*)?\s?/, '').replace(/\s*\*\/\s*$/, ''))
  const f: Record<string, string> = {}
  const api: Record<string, string> = {}
  const bad: string[] = []
  let inApi = false
  for (const raw of lines) {
    const line = raw.trim()
    const field = FIELD.exec(line)
    if (field && !(inApi && /^\s/.test(raw))) {
      inApi = field[1] === 'proposedApi'
      if (!inApi) f[field[1]] = field[2].trim()
    } else if (inApi && line) {
      const m = API_LINE.exec(line)
      if (m) api[m[1]] = m[2]
      else bad.push(`proposedApi line "${line}" must be  <prop>: "<type>"`)
    }
  }
  const missing: string[] = []
  if (!f.why) missing.push('why: <why the kit lacks it>')
  if (!f.description) missing.push('description: <what it is and does>')
  if (Object.keys(api).length === 0) missing.push('proposedApi: followed by indented  <prop>: "<type>"  lines')
  missing.push(...bad)
  if (missing.length > 0) return { missing }
  return { proposal: { why: f.why, description: f.description, ...(f.figma ? { figma: f.figma } : {}), api }, missing }
}

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
  {
    tag: '@reuse',
    form: '@reuse <KitComponent>: <why>',
    meaning: 'A primitive (Box, Text) says which kit component it considered and why none would do. Required on every primitive.',
    node: '`{/* @reuse <KitComponent>: <why> */}` right before the primitive.',
    screen: 'Not applicable: it belongs to one primitive.',
  },
  {
    tag: '@proposal',
    form: '@proposal (JSDoc block: why / description / figma / proposedApi)',
    meaning: 'A component the kit lacks, written in `components/` of your folder. Each exported component carries the block; why, description and one proposedApi line (`<prop>: "<type>"`) are required, figma is optional.',
    node: 'Not applicable: it sits on the component, not on the element that uses it.',
    screen: 'A JSDoc block above each exported component in `components/`.',
  },
]
