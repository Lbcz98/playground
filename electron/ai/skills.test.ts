import { mkdirSync, mkdtempSync, symlinkSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { activeSkills, checkSkills, loadSkills, parseSkill, sentencesOf, SKILLS_DIR, withSkills } from './skills'

const skill = (front: string, body = '# Body\n') => `---\n${front}\n---\n\n${body}`
const GOOD = 'name: x\ndescription: Use when testing. Covers the loader.\nautonomy: informational'

/** A throwaway skills directory: `{ dirName: SKILL.md text }`. */
function skillsDir(files: Record<string, string>): string {
  const root = mkdtempSync(path.join(os.tmpdir(), 'sfs-skills-'))
  for (const [dir, text] of Object.entries(files)) {
    mkdirSync(path.join(root, dir))
    writeFileSync(path.join(root, dir, 'SKILL.md'), text)
  }
  return root
}

describe('the skills in skills/', () => {
  it('are all valid: name = directory, a one- or two-sentence description, a known autonomy', () => {
    const checked = checkSkills()
    expect(checked.length, `no skill found under ${SKILLS_DIR}`).toBeGreaterThan(0)
    for (const { dir, errors } of checked) expect(errors, `skills/${dir}/SKILL.md:\n${errors.join('\n')}`).toEqual([])
  })

  it('load into the registry with their full text', () => {
    const focus = loadSkills().find((s) => s.name === 'dtv-focus-micro-interaction')
    expect(focus).toMatchObject({ autonomy: 'autonomous' })
    expect(focus!.text).toMatch(/^---\nname: dtv-focus-micro-interaction\n/)
    expect(focus!.text).toContain('## Before you finish')
  })
})

describe('a SKILL.md', () => {
  it('parses name, description and autonomy from its frontmatter', () => {
    expect(parseSkill(skill(GOOD), 'x')).toEqual({
      skill: { name: 'x', description: 'Use when testing. Covers the loader.', autonomy: 'informational', text: skill(GOOD) },
      errors: [],
    })
    expect(parseSkill(skill('name: "x"\ndescription: \'One.\'\nautonomy: requires-approval'), 'x').skill).toMatchObject({ name: 'x', description: 'One.' })
  })

  it('fails with a message naming the file and the problem', () => {
    const errors = (front: string, dir = 'x') => parseSkill(skill(front), dir).errors
    expect(errors(GOOD, 'other')).toEqual(['skills/other/SKILL.md: name "x" must equal its directory name "other"'])
    expect(errors('name: x\ndescription: One. Two. Three.\nautonomy: autonomous')).toEqual([
      'skills/x/SKILL.md: description has 3 sentences; it must have one or two: "One." "Two." "Three."',
    ])
    expect(errors('name: x\ndescription: One.\nautonomy: sometimes')).toEqual([
      'skills/x/SKILL.md: autonomy "sometimes" must be one of autonomous, requires-approval, informational',
    ])
    expect(errors('description: One.')).toEqual(['skills/x/SKILL.md: frontmatter has no "name"', 'skills/x/SKILL.md: frontmatter has no "autonomy"'])
    expect(parseSkill('# No frontmatter\n', 'x').errors).toEqual(['skills/x/SKILL.md does not start with a "---" frontmatter line'])
    expect(parseSkill('---\nname: x\n', 'x').errors).toEqual(['skills/x/SKILL.md has no closing "---" after its frontmatter'])
    expect(errors('name x')).toEqual(['skills/x/SKILL.md frontmatter line 2 is not "key: value": "name x"'])
  })

  it('accepts what authors write: a BOM, CRLF, trailing spaces on a delimiter, quoted values', () => {
    const crlf = `\uFEFF---  \r\nname: x\r\ndescription: "Use when testing. Covers the loader."\r\nautonomy: autonomous\r\n--- \r\n\r\n# Body\r\n`
    const parsed = parseSkill(crlf, 'x')
    expect(parsed.errors).toEqual([])
    expect(parsed.skill!.text).toBe(`---  \nname: x\ndescription: "Use when testing. Covers the loader."\nautonomy: autonomous\n--- \n\n# Body\n`)
    expect(parsed.skill!.description).toBe('Use when testing. Covers the loader.')
  })

  it('rejects a repeated key and an empty description', () => {
    expect(parseSkill(skill('name: y\nname: x\ndescription: One.\nautonomy: autonomous'), 'x').errors).toEqual(['skills/x/SKILL.md frontmatter line 3 repeats "name"'])
    expect(parseSkill(skill('name: x\ndescription: "  "\nautonomy: autonomous'), 'x').errors).toEqual(['skills/x/SKILL.md: frontmatter has no "description"'])
  })

  it('makes the whole registry fail, listing every problem', () => {
    const dir = skillsDir({ x: skill(GOOD), y: skill('name: z\ndescription: One.\nautonomy: never') })
    expect(() => loadSkills(dir)).toThrow(
      'Invalid skills:\n- skills/y/SKILL.md: name "z" must equal its directory name "y"\n- skills/y/SKILL.md: autonomy "never" must be one of autonomous, requires-approval, informational',
    )
  })
})

describe('a description’s sentences', () => {
  it('end at a stop followed by a capital, a digit or a quote, not at an abbreviation, an ellipsis or a decimal', () => {
    expect(sentencesOf('Use when e.g. a menu has focus. Covers x.')).toHaveLength(2)
    expect(sentencesOf('Use when, i.e. a menu. Covers x.')).toHaveLength(2)
    expect(sentencesOf('Wait... then go. Covers x.')).toHaveLength(2)
    expect(sentencesOf('Covers v1.2 etc. and more. Done.')).toHaveLength(2)
    expect(sentencesOf('Costs 0.5 points. Covers x.')).toHaveLength(2)
    expect(sentencesOf('One.')).toHaveLength(1)
    expect(sentencesOf('No final stop')).toHaveLength(1)
    expect(sentencesOf('One. Two. Three.')).toHaveLength(3)
  })

  it('count a quote or bracket after the stop as part of the sentence it closes', () => {
    expect(sentencesOf('Says "go." Then x. Covers y.')).toHaveLength(3)
    expect(sentencesOf('Covers x (and y.) Then z.')).toHaveLength(2)
  })

  it('are two in the focus skill’s description', () => {
    expect(sentencesOf(loadSkills().find((s) => s.name === 'dtv-focus-micro-interaction')!.description)).toHaveLength(2)
  })
})

describe('the skills directory', () => {
  it('ignores hidden directories and loose files, and reports a SKILL.md that is not a file', () => {
    const dir = skillsDir({ x: skill(GOOD) })
    mkdirSync(path.join(dir, '.vscode'))
    writeFileSync(path.join(dir, 'README.md'), '# not a skill\n')
    expect(loadSkills(dir).map((s) => s.name)).toEqual(['x'])
    mkdirSync(path.join(dir, 'y'))
    mkdirSync(path.join(dir, 'y', 'SKILL.md'))
    symlinkSync(path.join(dir, 'gone'), path.join(dir, 'z'))
    expect(checkSkills(dir)).toEqual([
      { dir: 'x', errors: [] },
      { dir: 'y', errors: ['skills/y/ has no SKILL.md'] },
    ])
  })

  it('has no skills when it does not exist', () => {
    expect(checkSkills(path.join(os.tmpdir(), 'sfs-no-such-skills-dir'))).toEqual([])
    expect(loadSkills(path.join(os.tmpdir(), 'sfs-no-such-skills-dir'))).toEqual([])
  })
})

describe('SFS_SKILLS', () => {
  const dir = skillsDir({ x: skill(GOOD), w: skill(GOOD.replace('name: x', 'name: w'), '# W\n') })

  it('turns nothing on when unset or empty — and reads nothing', () => {
    const nowhere = path.join(os.tmpdir(), 'sfs-no-such-skills-dir')
    for (const value of [undefined, '', ' ', ' , ']) expect(activeSkills(value, nowhere)).toEqual([])
  })

  it('turns on the named skills, in the order given', () => {
    expect(activeSkills('w, x', dir).map((s) => s.name)).toEqual(['w', 'x'])
  })

  it('rejects a name the registry does not have, and a name given twice', () => {
    expect(() => activeSkills('x,nope', dir)).toThrow('SFS_SKILLS names an unknown skill "nope". Known: w, x.')
    expect(() => activeSkills('x,x', dir)).toThrow('SFS_SKILLS names "x" more than once.')
  })
})

describe('the skills block', () => {
  it('leaves a prompt byte-identical when no skill is on', () => {
    expect(withSkills('SYSTEM', [])).toBe('SYSTEM')
  })

  it('appends each skill’s full text, labelled with its name', () => {
    const [x] = activeSkills('x', skillsDir({ x: skill(GOOD) }))
    expect(withSkills('SYSTEM', [x])).toBe(`SYSTEM\n\n# Skills\n\nThe skills below are part of these instructions.\n\n<skill name="x">\n${skill(GOOD).trim()}\n</skill>`)
  })
})
