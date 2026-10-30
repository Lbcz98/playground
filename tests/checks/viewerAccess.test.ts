import { describe, expect, it } from 'vitest'
import { withHarness } from '../../scripts/render-audit'

describe('viewer loading and link accessibility in the render harness', () => {
  it('keeps the last valid frame, guards pending input, retries failures, and ignores an unmounted load', async () => {
    await withHarness(async (newPage) => {
      const page = await newPage()
      const errors: string[] = []
      page.onPageError((message) => errors.push(message))
      try {
        expect(await page.open({ file: 'tests/checks/fixtures/flowFailures.tsx' })).toBeUndefined()
        await page.waitFor('window.__fixture?.flowRequests.length === 1')
        expect(await page.evaluate('document.querySelector("[role=status]")?.textContent')).toContain('Carregando')
        await page.evaluate('window.__fixture.failFlow(0)')
        await page.waitFor('!!document.querySelector("[role=alert] button")')
        expect(await page.shown()).toBeNull()
        await page.press('Enter')
        await page.waitFor('window.__fixture.flowRequests.length === 2')
        await page.evaluate('window.__fixture.acceptFlow(1)')
        await page.waitFor('window.__fixture.stateRequests.length === 3')
        await page.evaluate('window.__fixture.failState("home")')
        await page.waitFor('!!document.querySelector("[role=alert] button")')
        expect(await page.shown()).toBeNull()
        await page.click('[role=alert] button')
        await page.waitFor('window.__fixture.stateRequests.filter(r => r.name === "home").length === 2')
        await page.evaluate('window.__fixture.acceptState("home", 1)')
        expect(await page.arrives('home')).toBe(true)
        await page.evaluate('window.__frame = document.querySelector("[data-screen-layer=video]")')

        await page.press('ArrowUp')
        await page.press('Enter')
        await page.press('ArrowDown')
        expect(await page.shown()).toBe('home')
        expect(await page.evaluate('document.querySelector("[role=status]")?.textContent')).toContain('Carregando')
        await page.evaluate('window.__fixture.failState("rail")')
        await page.waitFor('!!document.querySelector("[role=alert] button")')
        expect(await page.shown()).toBe('home')
        expect(await page.evaluate('window.__frame === document.querySelector("[data-screen-layer=video]")')).toBe(true)
        await page.click('[role=alert] button')
        await page.waitFor('window.__fixture.stateRequests.filter(r => r.name === "rail").length === 2')
        await page.evaluate('window.__fixture.acceptState("rail", 1)')
        expect(await page.arrives('rail')).toBe(true)
        expect(await page.evaluate('window.__frame === document.querySelector("[data-screen-layer=video]")')).toBe(true)
        await page.press('Escape')
        expect(await page.arrives('home')).toBe(true)
        await page.press('ArrowUp')
        expect(await page.arrives('rail')).toBe(true)
        await page.press('Enter')
        expect(await page.shown()).toBe('rail')
        await page.evaluate('window.__fixture.unmount()')
        await page.waitFor('!document.querySelector("[data-screen-layer=video]")')
        await page.evaluate('window.__fixture.failState("detail")')
        expect(await page.shown()).toBeNull()
        expect(errors).toEqual([])
      } finally {
        await page.close()
      }
    })
  }, 120_000)

  it('renders navigation controls as one named anchor and one keyboard target', async () => {
    await withHarness(async (newPage) => {
      const page = await newPage()
      try {
        expect(await page.open({ file: 'tests/checks/fixtures/linkSurfaces.tsx' })).toBeUndefined()
        const dom = await page.evaluate<{ links: string[]; nested: number; buttons: string[]; spans: number }>(`({
          links: [...document.querySelectorAll('a')].map(a => a.textContent?.trim() || a.getAttribute('aria-label') || a.firstElementChild?.getAttribute('aria-label')),
          nested: document.querySelectorAll('a button, a a').length,
          buttons: [...document.querySelectorAll('button')].map(b => b.textContent?.trim() || b.getAttribute('aria-label')),
          spans: document.querySelectorAll('a > .sfs-link-surface').length
        })`)
        expect(dom.links).toEqual(['Opções de áudio', 'Assistir', 'Voltar', 'Aviso', 'Interativo', 'Detalhes'])
        expect(dom.nested).toBe(0)
        expect(dom.spans).toBe(6)
        expect(dom.buttons).toEqual(['Ação'])
        expect(await page.evaluate('document.querySelector(".sfs-content-card")?.hasAttribute("tabindex")')).toBe(false)
        for (const href of ['/ana/rail', '/ana/watch', '/ana/back', '/ana/message', '/ana/bug', '/ana/detail']) {
          await page.press('Tab')
          expect(await page.evaluate('document.activeElement?.tagName')).toBe('A')
          expect(await page.evaluate('document.activeElement?.getAttribute("href")')).toBe(href)
        }
        await page.press('Tab')
        expect(await page.evaluate('document.activeElement?.tagName')).toBe('BUTTON')
        expect(await page.open({ file: 'tests/checks/fixtures/linkSurfaces.tsx' })).toBeUndefined()
        await page.press('Tab')
        await page.press('Enter')
        await page.waitFor('location.pathname === "/ana/rail"')
      } finally {
        await page.close()
      }
    })
  }, 120_000)
})
