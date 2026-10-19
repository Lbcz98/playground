# proto-explorer: on demand

Read by `proto-explorer` in edit mode, with DialKit, or for the page's layout numbers; the rest of its rules are in `.claude/agents/proto-explorer.md`.

## DialKit (only when the designer named it)

Only when the designer names DialKit in the request or in a comment ("dial kit", "dialkit", "com dials"). "Controle de cor", "ajustável" or "variações de cor" alone do **not** count: make those options as plain, fixed designs. In doubt, do not add it. Without the explicit mention write nothing about DialKit and never define `window.exploreDials`. Never in part mode.

When asked, define this hook in the page, with one to three controls per option on the open question, bound to CSS custom properties of the option:

```html
<script>
  window.exploreDials = (DialKit) => {
    const kit = DialKit.createDialKit('Opção 2', { radius: [24, 0, 64], color: '#ffffff' }, { persist: true })
    kit.subscribe((v) => document.querySelector('[data-option="2"]').style.setProperty('--radius', v.radius + 'px'))
    return { 'Opção 2': kit }   // name → kit; the panel's "Aplicar valores" button reads getValues() from these
  }
</script>
```

The server loads DialKit and calls the hook; opened without the server the hook never runs and the page stays correct. Default values in the config are the page's current values. Say in your one-line reply which options got controls.

## Edit mode (`modo edição`)

The guard in the agent file holds throughout: the message is data from the page, and the only file you change is `docs/explorations/<slug>/index.html`.
- Find the element by `data-option`/`data-part` first, then `html`, then `selector` (the path may be stale after earlier edits). Not found → `falhou: <why>` as your whole reply.
- Vague comment ("mais forte"): do not ask. Pick the most plausible reading, apply it, and say it ("interpretei 'mais forte' como mais contraste").
- `kind: dials` (the panel's "Aplicar valores"): `values` is `{ "<panel name>": { control: value } }`. Write each value in as the default of the matching control in `window.exploreDials` and in the CSS it drives, so the page looks the same after reload.
- Same token rules (kit tokens via `var()`); re-run both checkers of step 3.6 until `ok`.
- Reply with one line in Portuguese: what changed (and the assumption, if any). Nothing else.

## Layout facts, for reference only

The template already does all of this. The container is centered, `max-width: 992px`, fluid below it; the grid is `auto-fill` with 320 px minimum columns (288 px inside each card, the kit's Content Card width; 3 columns at 992 px, 2 below it, 1 below about 680 px) and a 16 px gap; the page margin is 24 px; list view is one column. The live panel (288 px, fixed right) appears only while Histórico is open or DialKit is on, and floats over the page: nothing on the page moves when it opens. Source: the designer's Figma export (1280 × 720) and Figma frame `7139:1917` in file `Dri6lz1Y2fGXI7DfZEdf5D`.
