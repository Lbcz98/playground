import { describe, expect, it } from 'vitest'
import { parseTsx } from './fromTsx'

const src = (inner: string, imp = "import Link from 'next/link'"): string => `
${imp}
import { InteractivityButton } from '@/ui-kit/InteractivityButton'
import { Screen } from '@/ui-kit/Screen'
export default function S() {
  return <Screen model="home" level={1}>${inner}</Screen>
}
`
const BTN = '<InteractivityButton title="a" />'
const first = (code: string) => parseTsx(code)[0]

describe('<Link> from next/link', () => {
  it('around one kit element becomes goTo on it', () => {
    const p = first(src(`<Link href="/lucas/rail">${BTN}</Link>`))
    expect(p.doc.root.type).toBe('InteractivityButton')
    expect(p.doc.root.goTo).toBe('lucas/rail')
    expect(p.links.map((l) => [l.href, l.line])).toEqual([['/lucas/rail', 6]])
    expect(p.notRead).toEqual([])
  })
  it('a deviation right before the <Link> lands on the element it wraps', () => {
    const p = first(src(`{/* @deviation flow.next-level: why */}<Link href="/lucas/rail">${BTN}</Link>`))
    expect(p.doc.root.deviation).toEqual({ ruleId: 'flow.next-level', why: 'why' })
  })
  it('a computed href, no href, or several elements are not read, never guessed', () => {
    for (const link of [`<Link href={'/a/' + 'b'}>${BTN}</Link>`, `<Link>${BTN}</Link>`, `<Link href="/a/b">${BTN}${BTN}</Link>`, '<Link href="/a/b" />']) {
      const p = first(src(link))
      expect(p.links).toEqual([])
      expect(p.notRead.length).toBeGreaterThanOrEqual(1)
      expect(JSON.stringify(p.doc)).not.toContain('goTo')
    }
  })
  it('without the next/link import, Link is just an unknown tag', () => {
    expect(first(src(`<Link href="/a/b">${BTN}</Link>`, '')).doc.root.type).toBe('Link')
  })
})
