import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const html = readFileSync(new URL('../docs/explorations/_template/index.html', import.meta.url), 'utf8')

describe('exploration template', () => {
  it('has the hooks the live panel, the toggle and the agent rely on', () => {
    for (const marker of ['<h1>Explorações</h1>', 'id="explore-actions"', 'class="explore-container"', 'data-view="grid"', 'data-view="list"', 'data-option="1"', 'data-part="label"', 'class="opt-content"'])
      expect(html).toContain(marker)
  })

  it('keeps literal colors in :root, apart from the toggle icons', () => {
    const outside = html.replace(/<svg[\s\S]*?<\/svg>/g, '').replace(/:root \{[\s\S]*?\n\}/, '').replace(/<!--[\s\S]*?-->/g, '')
    expect(outside.match(/#[0-9a-fA-F]{3,8}\b/g) ?? []).toEqual([])
  })
})
