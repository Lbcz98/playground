import { createHash } from 'node:crypto'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { chromium } from 'playwright'
import { describe, expect, it } from 'vitest'
// @ts-expect-error plain .mjs, so node runs it without a build
import { startServer } from './explore-server.mjs'
// @ts-expect-error plain .mjs, so node runs it without a build
import { tuneSpec, varsBlock } from './explore-tune.mjs'

describe('built-in fork of DialKit', () => {
  it('records intact artifacts from the pinned fork', () => {
    const root = new URL('./explore-dialkit/', import.meta.url)
    const source = JSON.parse(readFileSync(new URL('source.json', root), 'utf8'))
    expect(source.repository).toBe('https://github.com/Lbcz98/dialkit.git')
    expect(source.revision).toMatch(/^[a-f0-9]{40}$/)
    expect(readFileSync(new URL('./sync-dialkit.mjs', import.meta.url), 'utf8')).toContain(`const revision = '${source.revision}'`)
    for (const [name, hash] of Object.entries(source.sha256)) {
      expect(createHash('sha256').update(readFileSync(new URL(name, root))).digest('hex')).toBe(hash)
    }
    expect(readFileSync(new URL('styles.css', root), 'utf8')).not.toContain('@import')
  })

  it('edits, persists and exports a real stage without remote requests or preparation', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'explore-dialkit-test-'))
    const spec = { states: ['idle', 'focus'], folders: [{ name: 'Card', part: 'card', controls: [
      { id: 'radius', label: 'Radius', type: 'slider', var: '--radius', value: 20, base: 20, min: 0, max: 64, step: 1, unit: 'px' },
      { id: 'color', label: 'Color', type: 'color', var: '--color', value: '#333333', base: '#333333' },
      { id: 'display', label: 'Display', type: 'select', var: '--display', value: 'block', base: 'block', options: ['block', 'flex'] },
      { id: 'easing', label: 'Easing', type: 'easing', durVar: '--duration', easeVar: '--ease', value: { duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }, base: { duration: 0.2, ease: [0.25, 0.1, 0.25, 1] } },
    ] }] }
    writeFileSync(join(dir, 'index.html'), `<html><head><style>
      :root { --explore-margin: 16px; --explore-panel-w: 320px; --explore-font: sans-serif; }
      ${varsBlock(spec, 2)}
      [data-part="card"] { width: 160px; height: 100px; border-radius: var(--radius); background: var(--color); display: var(--display); }
      </style></head><body><header class="explore-header"><h1>Test</h1><div id="explore-actions"></div></header>
      <article class="opt" data-option="1"></article>
      <article class="opt" data-option="2" data-tuned data-parent="1" data-state="idle"><div data-part="card">Card</div>
      <script type="application/json" data-tune="2">${JSON.stringify(spec)}</script></article></body></html>`)
    const server = await startServer({ dir })
    let browser: Awaited<ReturnType<typeof chromium.launch>> | undefined
    const remote: string[] = []
    const errors: string[] = []
    try {
      browser = await chromium.launch({ headless: true })
      const page = await browser.newPage()
      page.setDefaultTimeout(5_000)
      page.setDefaultNavigationTimeout(5_000)
      page.on('pageerror', error => errors.push(error.message))
      await page.route('**/*', route => {
        if (route.request().url().startsWith(server.url)) return route.continue()
        remote.push(route.request().url())
        return route.abort()
      })
      await page.goto(server.url + 'tune/1')
      await page.waitForFunction(() => Boolean((window as any).exploreTune?.kit))
      expect(page.url()).toBe(server.url + 'tune/2')
      expect(server.comments).toHaveLength(0)
      await page.locator('[data-part="card"]').dispatchEvent('click', { altKey: true })
      expect(await page.locator('.dialkit-folder-header-top[aria-label="Card"]').getAttribute('aria-expanded')).toBe('true')
      const slider = page.getByRole('slider', { name: 'Radius', exact: true })
      await slider.focus()
      await page.keyboard.press('ArrowRight')
      await page.waitForFunction(() => getComputedStyle(document.querySelector('[data-part="card"]')!).borderRadius === '21px')
      await page.evaluate(() => {
        const kit = (window as any).exploreTune.kit
        kit.setValue('Card.Color', '#112233')
        kit.setValue('Card.Display', 'flex')
        kit.setValue('Card.Easing', { type: 'easing', duration: 0.4, ease: [0, 0, 1, 1] })
        kit.setValue('Simulador.Estado', 'focus')
      })
      expect(await page.locator('[data-option="2"]').getAttribute('data-state')).toBe('focus')
      expect(await page.locator('[data-part="card"]').evaluate(node => getComputedStyle(node).backgroundColor)).toBe('rgb(17, 34, 51)')
      await page.reload()
      await page.waitForFunction(() => Boolean((window as any).exploreTune?.kit))
      expect(tuneSpec(readFileSync(join(dir, 'index.html'), 'utf8'), 2).folders[0].controls[0].value).toBe(20)
      expect(await page.locator('[data-part="card"]').evaluate(node => getComputedStyle(node).borderRadius)).toBe('21px')
      await page.getByRole('button', { name: 'Recolher painel', exact: true }).click()
      expect(await page.locator('body').evaluate(node => node.classList.contains('tune-collapsed'))).toBe(true)
      await page.getByRole('button', { name: 'Mostrar painel', exact: true }).click()
      const response = page.waitForResponse(response => response.url().endsWith('/__explore/tune-apply'))
      await page.getByRole('button', { name: 'Aplicar valores', exact: true }).click()
      expect((await response).ok()).toBe(true)
      await page.waitForFunction(() => Boolean((window as any).exploreTune?.kit))
      const saved = tuneSpec(readFileSync(join(dir, 'index.html'), 'utf8'), 2)
      expect(saved.folders[0].controls.map((control: any) => control.value)).toEqual([21, '#112233', 'flex', { duration: 0.4, ease: [0, 0, 1, 1] }])
      await page.reload()
      await page.waitForFunction(() => Boolean((window as any).exploreTune?.kit))
      expect(await page.locator('[data-part="card"]').evaluate(node => getComputedStyle(node).borderRadius)).toBe('21px')
      const download = page.waitForEvent('download')
      await page.getByRole('button', { name: 'Exportar .md', exact: true }).click()
      expect((await download).suggestedFilename()).toBe('spec-2.md')
      expect(readFileSync(join(dir, 'spec-2.md'), 'utf8')).toContain('#112233')
      expect(remote).toEqual([])
      expect(errors).toEqual([])
    } finally {
      await browser?.close()
      await server.close()
      rmSync(dir, { recursive: true, force: true })
    }
  }, 30_000)
})
