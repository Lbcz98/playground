import { readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'

/**
 * Skills (Orchestration v2, phase 1): every `skills/<name>/SKILL.md`, parsed and validated into an in-memory
 * registry. The generator's system prompt carries the full text of the skills `SFS_SKILLS` names, in a labelled
 * block at its end; with `SFS_SKILLS` unset or empty, nothing is read and every prompt is byte-identical to before.
 */

export const AUTONOMY = ['autonomous', 'requires-approval', 'informational'] as const
export type Autonomy = (typeof AUTONOMY)[number]

export interface Skill {
  name: string
  description: string
  autonomy: Autonomy
  /** The whole SKILL.md, frontmatter included, as written (LF line endings, no byte-order mark). */
  text: string
}

/** The repo's skills. Read from the working directory, like `.env`: the app, the tests and the eval all run from the repo root. */
export const SKILLS_DIR = path.resolve(process.cwd(), 'skills')

/**
 * Sentences in a description: a `.`, `!` or `?` (and any closing quote or bracket) followed by a space and a capital
 * letter, a digit, or an opening quote or bracket. "e.g. a menu", "Wait... then go" and "v1.2 etc. and more" do not end one.
 */
export function sentencesOf(text: string): string[] {
  return text
    .trim()
    .split(/(?<=[.!?]["')\]]*)\s+(?=[\p{Lu}\p{N}"'(])/u)
    .filter((s) => s.length > 0)
}

/** A file's text as the model gets it: no byte-order mark, LF line endings. */
const normalized = (text: string): string => text.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n')

/** The `key: value` lines between the opening and closing `---` of an already normalized text, or the reason there are none. */
function frontmatterOf(text: string): { fields: Record<string, string> } | { error: string } {
  const lines = text.split('\n')
  if (lines[0].trimEnd() !== '---') return { error: 'does not start with a "---" frontmatter line' }
  const end = lines.findIndex((line, i) => i > 0 && line.trimEnd() === '---')
  if (end < 0) return { error: 'has no closing "---" after its frontmatter' }
  const fields: Record<string, string> = {}
  for (const [i, line] of lines.slice(1, end).entries()) {
    if (line.trim() === '') continue
    const match = line.match(/^([A-Za-z][\w-]*):\s*(.*)$/)
    if (!match) return { error: `frontmatter line ${i + 2} is not "key: value": ${JSON.stringify(line)}` }
    if (match[1] in fields) return { error: `frontmatter line ${i + 2} repeats "${match[1]}"` }
    fields[match[1]] = match[2].trim().replace(/^(["'])(.*)\1$/, '$2').trim()
  }
  return { fields }
}

/** One SKILL.md: the skill, or every reason it is not one. `dir` is its directory's name. */
export function parseSkill(raw: string, dir: string): { skill: Skill; errors: [] } | { skill?: undefined; errors: string[] } {
  const text = normalized(raw)
  const front = frontmatterOf(text)
  if ('error' in front) return { errors: [`skills/${dir}/SKILL.md ${front.error}`] }
  const { name, description, autonomy } = front.fields
  const errors: string[] = []
  const at = `skills/${dir}/SKILL.md`
  if (!name) errors.push(`${at}: frontmatter has no "name"`)
  else if (name !== dir) errors.push(`${at}: name "${name}" must equal its directory name "${dir}"`)
  if (!description) errors.push(`${at}: frontmatter has no "description"`)
  else {
    const sentences = sentencesOf(description)
    if (sentences.length > 2) {
      errors.push(`${at}: description has ${sentences.length} sentences; it must have one or two: ${sentences.map((s) => JSON.stringify(s)).join(' ')}`)
    }
  }
  if (!autonomy) errors.push(`${at}: frontmatter has no "autonomy"`)
  else if (!(AUTONOMY as readonly string[]).includes(autonomy)) {
    errors.push(`${at}: autonomy "${autonomy}" must be one of ${AUTONOMY.join(', ')}`)
  }
  if (errors.length > 0) return { errors }
  return { skill: { name, description, autonomy: autonomy as Autonomy, text }, errors: [] }
}

/** The skill directories under `dir`: its subdirectories, hidden ones (`.vscode`, `.git`) aside. A missing `dir` has none. */
function skillDirs(dir: string): string[] {
  let entries: string[]
  try {
    entries = readdirSync(dir)
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return []
    throw err
  }
  return entries
    .filter((entry) => !entry.startsWith('.') && statSync(path.join(dir, entry), { throwIfNoEntry: false })?.isDirectory())
    .sort()
}

const isFile = (file: string): boolean => statSync(file, { throwIfNoEntry: false })?.isFile() ?? false

/** Every skill directory's problems, by directory — empty when all of them are valid. */
export function checkSkills(dir: string = SKILLS_DIR): { dir: string; errors: string[] }[] {
  return skillDirs(dir).map((entry) => {
    const file = path.join(dir, entry, 'SKILL.md')
    if (!isFile(file)) return { dir: entry, errors: [`skills/${entry}/ has no SKILL.md`] }
    return { dir: entry, errors: parseSkill(readFileSync(file, 'utf8'), entry).errors }
  })
}

/** The registry: every valid skill, by directory name. A single invalid skill makes it throw, naming every problem. */
export function loadSkills(dir: string = SKILLS_DIR): Skill[] {
  const problems = checkSkills(dir).flatMap((c) => c.errors)
  if (problems.length > 0) throw new Error(`Invalid skills:\n- ${problems.join('\n- ')}`)
  return skillDirs(dir).map((entry) => parseSkill(readFileSync(path.join(dir, entry, 'SKILL.md'), 'utf8'), entry).skill as Skill)
}

/**
 * The skills `SFS_SKILLS` turns on (a comma-separated list of names), in the order given. Unset or empty: none, and
 * nothing is read. A name the registry does not have, or a name given twice, is an error.
 */
export function activeSkills(value: string | undefined = process.env.SFS_SKILLS, dir: string = SKILLS_DIR): Skill[] {
  const names = (value ?? '')
    .split(',')
    .map((n) => n.trim())
    .filter(Boolean)
  if (names.length === 0) return []
  const twice = names.filter((n, i) => names.indexOf(n) !== i)
  if (twice.length > 0) throw new Error(`SFS_SKILLS names ${[...new Set(twice)].map((n) => `"${n}"`).join(', ')} more than once.`)
  const registry = loadSkills(dir)
  return names.map((name) => {
    const skill = registry.find((s) => s.name === name)
    if (!skill) {
      throw new Error(`SFS_SKILLS names an unknown skill "${name}". Known: ${registry.map((s) => s.name).join(', ') || 'none'}.`)
    }
    return skill
  })
}

/** A system prompt with the skills' full text appended in a labelled block — the prompt itself, unchanged, when there are none. */
export function withSkills(system: string, skills: readonly Skill[]): string {
  if (skills.length === 0) return system
  const blocks = skills.map((s) => `<skill name="${s.name}">\n${s.text.trim()}\n</skill>`)
  return `${system}\n\n# Skills\n\nThe skills below are part of these instructions.\n\n${blocks.join('\n\n')}`
}
