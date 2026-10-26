/* The fine-tuning stage (/tune), loaded by scripts/explore-server.mjs on `/tune/<N>` before the overlay.
 * One option sits alone on a zoomable stage; the DialKit panel on the right is built from the option's own spec
 * (<script type="application/json" data-tune="N">, see scripts/explore-tune.mjs) and writes straight to the CSS custom properties the option reads.
 * Around the controls: the states the option declares (Estado), a replay between two of them with loop and slow motion,
 * hold O to flip to the original, click the option to test its focus (everything else goes inert; Alt+click on a piece opens its folder), and "Avaliar" to ask for a review.
 * No spec yet: the original shows while Claude makes the tunable copy (the page reloads onto it when it lands). */
(() => {
  const { token, tune } = window.__EXPLORE__ ?? {}
  if (!tune) return
  const M = tune.option
  const $ = (s, r = document) => r.querySelector(s)
  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[ch])
  const store = (k, v) => { try { v === undefined ? sessionStorage.removeItem(k) : sessionStorage.setItem(k, v) } catch {} }
  const stored = (k) => { try { return sessionStorage.getItem(k) } catch { return null } }
  const api = (path, body) => fetch(`/__explore/${path}`, { method: 'POST', headers: { 'x-explore-token': token, 'content-type': 'application/json' }, body: JSON.stringify(body) })
  const art = $(`.opt[data-option="${M}"]`)
  if (!art) return
  let spec = null
  try { spec = JSON.parse($(`script[data-tune="${M}"]`)?.textContent ?? 'null') } catch {}
  const parent = art.dataset.parent ? $(`.opt[data-option="${art.dataset.parent}"]`) : null
  const states = spec?.states ?? []
  const folders = spec?.folders ?? []
  const FONT = 'var(--explore-font)'

  // --- Layout: only this option, on a stage that scrolls and zooms ---------------------------------------------------------
  const css = document.createElement('style')
  css.textContent = `
    .explore-container { max-width: none; }
    .explore-items, .view-toggle, .explore-header h1, .explore-card-menu-line { display: none !important; }
    .tune-bar { display: flex; align-items: center; gap: 12px; min-width: 0; overflow-x: auto; scrollbar-width: none; font-family: ${FONT}; color: var(--explore-tile-label); }
    .tune-title { font-size: 14px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .tune-btn { flex: none; height: 32px; min-width: 32px; padding: 0 10px; border: 1px solid transparent; border-radius: 8px; color: #ccc; font: 500 14px ${FONT}; cursor: pointer; white-space: nowrap; text-decoration: none; display: inline-flex; align-items: center; justify-content: center;
      background: linear-gradient(180deg, var(--explore-btn-fill-from), var(--explore-btn-fill-to)) padding-box, linear-gradient(180deg, var(--explore-btn-stroke-from), var(--explore-btn-stroke-to)) border-box; }
    .tune-btn.tune-back { background: none; font-size: 18px; padding: 0 6px; } .tune-btn.tune-back:hover { color: #fff; }
    #explore-actions[data-live] { box-sizing: border-box; width: var(--explore-panel-w); justify-content: space-between; } /* the header actions span the DialKit panel below them */
    .tune-btn:focus-visible { outline: 2px solid var(--explore-tile-label); outline-offset: 2px; }
    .tune-btn:disabled { opacity: .5; cursor: default; }
        .dialkit-panel-header { border-bottom: 0 !important; }
    .dialkit-panel-toolbar { display: none !important; } /* presets and "copy parameters" are not part of this stage */
    .tune-collapse { flex: none; width: 32px; height: 32px; margin-left: auto; padding: 0; border: 0; border-radius: 8px; background: none; color: #888; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; } .tune-collapse:hover { color: #fff; background: #ffffff14; } .tune-collapse:focus-visible { outline: 2px solid var(--explore-tile-label); outline-offset: 2px; }
    .tune-collapse svg { width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; }
    .dialkit-folder-header-top { display: flex; align-items: center; }
    .tune-reopen { position: fixed; top: 84px; right: calc(var(--explore-margin) + 12px); } .tune-reopen { display: none; } body.tune-collapsed .tune-reopen { display: inline-flex; }
    #explore-panel { transition: transform 240ms cubic-bezier(.2, 0, 0, 1), opacity 160ms ease-out, visibility 0s; }
    body.tune-collapsed { --explore-panel-w: calc(-1 * var(--explore-margin)); } /* the stage, tools, zoom and banner measure from the panel: with it gone they run to the margin */
    body.tune-collapsed #explore-panel { transform: translateX(calc(100% + var(--explore-margin))); opacity: 0; visibility: hidden; pointer-events: none; transition: transform 240ms cubic-bezier(.2, 0, 0, 1), opacity 160ms ease-out, visibility 0s 240ms; }
    body.tune-collapsed #explore-actions[data-live] { width: auto; }
    body.tune-collapsed .tune-tools { right: calc(var(--explore-margin) + 12px + 40px); }
    @media (prefers-reduced-motion: reduce) { #explore-panel, body.tune-collapsed #explore-panel { transition: none; } }
    .tune-fig { position: relative; } .tune-fmenu svg { width: 16px; height: 16px; flex: none; } .tune-fmenu .chev { width: 14px; height: 14px; fill: none; stroke: currentColor; stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; transition: transform 200ms cubic-bezier(.2, 0, 0, 1); } .tune-fmenu[aria-expanded=true] .chev { transform: rotate(180deg); } .tune-fmenu { gap: 6px; }
    .tune-menu { position: absolute; right: 0; top: calc(100% + 6px); min-width: 100%; padding: 4px; display: flex; flex-direction: column; border-radius: 10px; background: #181818; border: 1px solid var(--explore-toggle-border);
      transform-origin: top right; opacity: 0; transform: translateY(-4px) scale(.97); visibility: hidden; pointer-events: none; transition: opacity 160ms ease-out, transform 200ms cubic-bezier(.2, 0, 0, 1), visibility 0s 200ms; }
    .tune-menu.open { opacity: 1; transform: none; visibility: visible; pointer-events: auto; transition-delay: 0s; }
    @media (prefers-reduced-motion: reduce) { .tune-menu { transform: none; transition: opacity 120ms linear, visibility 0s 120ms; } .tune-fmenu .chev { transition: none; } }
    .tune-menu button { height: 32px; padding: 0 10px; border: 0; border-radius: 6px; background: none; color: #ccc; font: 500 14px ${FONT}; text-align: left; white-space: nowrap; cursor: pointer; } .tune-menu button:hover:not(:disabled) { background: #2a2a2a; color: #fff; } .tune-menu button:disabled { opacity: .5; cursor: default; }
    .tune-note a { color: #9cf; } .tune-note .ftext + .undo { margin-top: 8px; } .tune-note .ftext { display: block; word-break: break-word; }
    .tune-tools { position: fixed; top: 84px; right: calc(var(--explore-panel-w) + 2 * var(--explore-margin) + 12px); display: flex; align-items: center; gap: 8px; }
    .tune-zoom { position: fixed; left: var(--explore-margin); right: calc(var(--explore-panel-w) + 2 * var(--explore-margin)); bottom: calc(var(--explore-margin) + 12px); justify-content: center; pointer-events: none; display: flex; align-items: center; gap: 4px; } .tune-zoom > * { pointer-events: auto; } .tune-zoom .fit[hidden] { display: none; } .tune-zoom .fit svg { width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; } .tune-zoom output { min-width: 48px; text-align: center; font: 500 13px ${FONT}; font-variant-numeric: tabular-nums; }
    .tune-stage { position: fixed; top: 72px; left: var(--explore-margin); right: calc(var(--explore-panel-w) + 2 * var(--explore-margin)); bottom: var(--explore-margin); display: flex; overflow: auto; --dot-a: .03; --dot-r: 1.25px; --dot-gap: 23px; /* the "Palco" folder moves these */
      background: radial-gradient(circle, rgba(255, 255, 255, var(--dot-a)) var(--dot-r), transparent calc(var(--dot-r) + .5px)) 0 0 / var(--dot-gap) var(--dot-gap), var(--explore-tile-bg); border-radius: var(--explore-tile-radius); }
    .tune-sizer { position: relative; flex: none; margin: auto; }
    .tune-scaler { position: absolute; left: 0; top: 0; transform-origin: 0 0; display: grid; padding: 64px; }
    .tune-scaler > .opt { grid-area: 1 / 1; justify-self: center; align-self: center; min-height: 0; padding: 0; background: none; border-radius: 0; }
    .tune-scaler .opt-label, .tune-scaler .explore-card-menu { display: none; }
    .tune-scaler .opt:focus-visible { outline: none !important; }
    .tune-notrans, .tune-notrans *, .tune-notrans *::before, .tune-notrans *::after { transition: none !important; animation: none !important; }
    .tune-badge { position: fixed; left: calc(var(--explore-margin) + 12px); top: 84px; padding: 4px 10px; border-radius: 8px; background: #000a; color: #eee; font: 500 12px ${FONT}; pointer-events: none; }
    .tune-note, .tune-judge { position: fixed; left: calc(var(--explore-margin) + 12px); bottom: calc(var(--explore-margin) + 56px); width: min(440px, 60vw); max-height: 45vh; overflow: auto; padding: 12px; border-radius: 12px; background: #181818e6; border: 1px solid var(--explore-toggle-border); color: #ddd; font: 400 13px/1.45 ${FONT}; }
    .tune-stage.testing { outline: 4px solid #fff; outline-offset: -4px; }
    body > [inert] { opacity: .4; } body.tune-testing .tune-note, body.tune-testing .tune-judge { visibility: hidden; } /* the banner takes their place */
    .tune-ft { position: fixed; left: var(--explore-margin); right: calc(var(--explore-panel-w) + 2 * var(--explore-margin)); bottom: calc(var(--explore-margin) + 56px); display: flex; justify-content: center; pointer-events: none; }
    .tune-ft > div { display: flex; align-items: center; gap: 12px; padding: 6px 6px 6px 14px; border-radius: 10px; background: #181818e6; border: 1px solid var(--explore-toggle-border); color: #ddd; font: 500 13px ${FONT}; pointer-events: auto; }
    .tune-ft[hidden], .tune-judge[hidden], .tune-note[hidden], .tune-badge[hidden] { display: none; }
    .tune-judge h2 { margin: 0 0 6px; font-size: 13px; font-weight: 600; } .tune-judge .f { padding: 8px 0; border-top: 1px solid var(--explore-toggle-border); }
    .tune-judge code { font-size: 12px; color: #bbb; word-break: break-word; } .tune-judge .sev { font-weight: 600; } .tune-judge .HIGH { color: #eb8a8a; } .tune-judge .MEDIUM { color: #f2c94c; } .tune-judge .LOW { color: #aaa; } .tune-judge .sum { margin-bottom: 4px; }`
  document.head.appendChild(css)

  const stage = Object.assign(document.createElement('div'), { className: 'tune-stage', tabIndex: -1 })
  stage.setAttribute('aria-label', 'Palco de ajuste')
  const sizer = Object.assign(document.createElement('div'), { className: 'tune-sizer' })
  const scaler = Object.assign(document.createElement('div'), { className: 'tune-scaler' })
  sizer.append(scaler); stage.append(sizer)
  document.body.append(stage)
  if (parent) { parent.style.visibility = 'hidden'; scaler.append(parent) }
  scaler.append(art)

  // --- Toolbar -------------------------------------------------------------------------------------------------------------
  const label = $('.opt-label', art)?.textContent.trim() ?? `Opção ${M}`
  const bar = document.createElement('div')
  bar.className = 'tune-bar'
  bar.innerHTML = `<a class="tune-btn tune-back" href="/" aria-label="Voltar às opções" title="Opções">←</a><span class="tune-title" title="${esc(label)}">Ajuste fino · ${esc(label)}</span>`
  // Over the canvas: review and Figma at the top right, zoom centred at the bottom (position: fixed, see the css above).
  const tools = Object.assign(document.createElement('div'), { className: 'tune-tools' })
  const FIGMA = '<svg viewBox="0 0 24 24" aria-hidden="true"><g fill="none" stroke="#888888" stroke-linejoin="round" stroke-width="1.5"><circle cx="15" cy="12" r="3"/><path d="M9 21a3 3 0 0 0 3-3v-3H9a3 3 0 1 0 0 6Z"/><path stroke-linecap="round" d="M12 9v6H9a3 3 0 1 1 0-6zm0-6v6H9a3 3 0 0 1 0-6zm0 0v6h3a3 3 0 1 0 0-6z"/></g></svg>' // hugeicons:figma
  const CHEV = '<svg class="chev" viewBox="0 0 16 16" aria-hidden="true"><path d="M4 6l4 4 4-4"/></svg>'
  tools.innerHTML = `<div class="tune-fig"><button class="tune-btn tune-fmenu jmenu" aria-haspopup="menu" aria-expanded="false"><span>Avaliar</span>${CHEV}</button>
      <div class="tune-menu" role="menu"><button role="menuitem" class="jgeral">Revisão geral</button><button role="menuitem" class="jkit" title="Quais regras, tokens e comportamentos do kit a opção quebra">Auditoria do kit</button></div></div>
    <div class="tune-fig"><button class="tune-btn tune-fmenu fmenu" aria-haspopup="menu" aria-expanded="false">${FIGMA}<span>Figma</span><svg class="chev" viewBox="0 0 16 16" aria-hidden="true"><path d="M4 6l4 4 4-4"/></svg></button>
      <div class="tune-menu" role="menu"><button role="menuitem" class="fpush">Enviar ao Figma</button><button role="menuitem" class="fpull" disabled title="Envie ao Figma antes de trazer">Trazer do Figma</button></div></div>`
  const zoomBox = Object.assign(document.createElement('div'), { className: 'tune-zoom' })
  zoomBox.setAttribute('role', 'group'); zoomBox.setAttribute('aria-label', 'Zoom')
  zoomBox.innerHTML = `<button class="tune-btn out" aria-label="Menos zoom">−</button><output aria-live="polite">100%</output><button class="tune-btn in" aria-label="Mais zoom">+</button><button class="tune-btn fit" aria-label="Ajustar ao palco" title="Ajustar ao palco (F)" hidden></button>`
  document.body.append(tools, zoomBox)
  $('.explore-header').prepend(bar)
  const pct = $('output', zoomBox), fitBtn = $('.fit', zoomBox)

  let z = 1
  let testing = false // focus test: the option has the keyboard alone (see "Focus test")
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v))
  const layout = () => {
    sizer.style.width = scaler.offsetWidth * z + 'px'; sizer.style.height = scaler.offsetHeight * z + 'px'
    scaler.style.transform = `scale(${z})`; pct.textContent = Math.round(z * 100) + '%'
    // "Ajustar" shows only once the zoom has left the fitted size, and its arrows say which way it goes back: in when zoomed in, out when zoomed out.
    const f = fit(), off = Math.abs(z - f) > 0.005, bigger = z > f
    fitBtn.hidden = !off
    if (off && fitBtn.dataset.dir !== String(bigger)) {
      fitBtn.dataset.dir = String(bigger)
      fitBtn.innerHTML = `<svg viewBox="0 0 16 16" aria-hidden="true"><path d="${bigger ? 'M13 7H9V3M3 9h4v4M9 7l4-4M7 9l-4 4' : 'M9 3h4v4M7 13H3V9M13 3L9.5 6.5M3 13l3.5-3.5'}"/></svg>`
    }
  }
  // Zooms about a point of the stage (its centre by default), keeping what is under it where it is.
  let auto = true // until the designer zooms, the option is kept as large as the stage allows
  const setZoom = (next, ox = stage.clientWidth / 2, oy = stage.clientHeight / 2) => {
    auto = false; next = clamp(next, 0.25, 8)
    const k = next / z, [sl, st] = [stage.scrollLeft, stage.scrollTop]
    z = next; layout()
    stage.scrollLeft = (sl + ox) * k - ox; stage.scrollTop = (st + oy) * k - oy
    store(`tune-zoom-${M}`, String(z))
  }
  const fit = () => clamp(Math.min(stage.clientWidth / scaler.offsetWidth, stage.clientHeight / scaler.offsetHeight), 1, 4)
  new ResizeObserver(() => { if (auto) z = fit(); layout() }).observe(stage)
  new ResizeObserver(layout).observe(scaler)
  $('.in', zoomBox).onclick = () => setZoom(z * 1.25)
  $('.out', zoomBox).onclick = () => setZoom(z / 1.25)
  const refit = () => { auto = true; z = fit(); layout(); store(`tune-zoom-${M}`) }
  $('.fit', zoomBox).onclick = refit
  stage.addEventListener('wheel', (e) => {
    if (!(e.ctrlKey || e.metaKey)) return // plain wheel scrolls (pans) the stage; a trackpad pinch arrives as ctrl+wheel
    e.preventDefault(); if (testing) return; const r = stage.getBoundingClientRect(); setZoom(z * Math.exp(-e.deltaY * 0.01), e.clientX - r.left, e.clientY - r.top)
  }, { passive: false })
  const saved = Number(stored(`tune-zoom-${M}`))
  if (saved) (z = saved, auto = false)
  else z = fit()
  layout()

  // --- Keys: the option keeps arrows, Enter and Back; the stage takes + - 0 and O ----------------------------------------------
  const focusArt = () => art.focus({ preventScroll: true })
  stage.addEventListener('pointerdown', (e) => { if (!e.target.closest('.opt')) focusArt() })
  focusArt()
  const typing = (e) => e.target.closest?.('input, textarea, select, [contenteditable]') || e.metaKey || e.ctrlKey || e.altKey
  const badge = Object.assign(document.createElement('div'), { className: 'tune-badge', hidden: true, textContent: 'Original (solte O para voltar)' })
  document.body.append(badge)
  const compare = (on) => { if (!parent) return; art.style.visibility = on ? 'hidden' : ''; parent.style.visibility = on ? '' : 'hidden'; badge.hidden = !on }
  document.addEventListener('keydown', (e) => {
    if (testing || typing(e)) return
    if (e.key === '+' || e.key === '=') setZoom(z * 1.25)
    else if (e.key === '-') setZoom(z / 1.25)
    else if (e.key === '0') setZoom(1)
    else if (e.key === 'f') refit()
    else if (e.key.toLowerCase() === 'o' && !e.repeat) compare(true)
  })
  document.addEventListener('keyup', (e) => { if (e.key.toLowerCase() === 'o') compare(false) })
  addEventListener('blur', () => compare(false))

  // --- No spec yet: the original shows while the copy is made -----------------------------------------------------------------
  const note = Object.assign(document.createElement('div'), { className: 'tune-note', role: 'status' })
  document.body.append(note)
  note.hidden = !!spec
  if (!spec) {
    note.textContent = 'Preparando os controles: o Claude está lendo esta opção e criando uma cópia ajustável. A página abre nela sozinha. Acompanhe no Histórico.'
    for (const b of ['.jmenu', '.fmenu']) $(b, tools).disabled = true
    store('explore-history', '1')
    if (!stored(`tune-asked-${M}`)) { store(`tune-asked-${M}`, '1'); api('comment', { kind: 'tune', option: M }) }
    return
  }
  store(`tune-asked-${M}`)

  // --- Controls ------------------------------------------------------------------------------------------------------------
  const SIM = 'Simulador'
  const pick = (c) => c.type === 'slider' ? [c.value, c.min, c.max, c.step ?? 1]
    : c.type === 'color' ? { type: 'color', default: c.value }
    : c.type === 'select' ? { type: 'select', options: c.options, default: c.value }
    : { type: 'easing', duration: c.value.duration, ease: c.value.ease }
  const config = {}
  if (states.length > 1) config[SIM] = {
    Estado: { type: 'select', options: states, default: states[0] },
    De: { type: 'select', options: states, default: states[0] }, Para: { type: 'select', options: states, default: states.at(-1) },
    Replay: { type: 'action', label: 'Replay' }, Repetir: false, Velocidade: [1, 0.1, 1, 0.05],
  }
  config.Palco = { _collapsed: true, 'Opacidade dos pontos': [3, 0, 100, 1], 'Tamanho dos pontos': [1.25, 0.5, 4, 0.25], 'Espaçamento dos pontos': [23, 8, 64, 1] } // the stage's own dials: never written to the option
  for (const f of folders) config[f.name] = { _collapsed: true, ...Object.fromEntries((f.controls ?? []).map((c) => [c.label, pick(c)])) }

  const hash = [...JSON.stringify(spec)].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) | 0, 7) // new defaults (Aplicar valores, an edit) start from them, not from an old session
  let kit, vals = { Velocidade: 1 }
  const current = {}
  const setState = (v) => { if (v && art.dataset.state !== v) art.dataset.state = v }
  const drive = (c, v) => {
    if (c.type === 'easing') { art.style.setProperty(c.durVar, `${Math.round(v.duration * 1000)}ms`); art.style.setProperty(c.easeVar, `cubic-bezier(${v.ease.join(', ')})`) }
    else art.style.setProperty(c.var, c.type === 'slider' ? `${v}${c.unit ?? ''}` : v)
  }

  // Slow motion: every transition and animation that starts inside the option runs at the chosen speed (delays included).
  const slow = () => art.getAnimations({ subtree: true }).forEach((a) => a.updatePlaybackRate?.(vals.Velocidade ?? 1))
  art.addEventListener('transitionrun', slow); art.addEventListener('animationstart', slow)
  const frames = (n) => new Promise((ok) => { const go = () => (--n ? requestAnimationFrame(go) : ok()); requestAnimationFrame(go) })
  const wait = (ms) => new Promise((ok) => setTimeout(ok, ms))
  let run = 0
  async function replay() {
    const id = ++run
    art.classList.add('tune-notrans'); setState(vals.De); void art.offsetWidth
    await frames(2); art.classList.remove('tune-notrans')
    await wait(400 / (vals.Velocidade || 1)); if (id !== run) return
    setState(vals.Para); await frames(2); slow()
    // A looping animation never finishes: wait only for the ones that do.
    await Promise.allSettled(art.getAnimations({ subtree: true }).filter((a) => a.effect?.getComputedTiming().iterations !== Infinity).map((a) => a.finished))
    if (id === run && vals.Repetir) { await wait(800); if (id === run && vals.Repetir) replay() }
  }

  window.exploreDials = (DialKit) => {
    kit = DialKit.createDialKit(`Opção ${M}`, config, { persist: { key: `tune-${M}-${hash}`, presets: true }, onAction: (path) => { if (path.endsWith('Replay')) replay() } })
    kit.subscribe((v) => {
      Object.assign(vals, v[SIM] ?? {})
      setState(vals.Estado); slow()
      const pal = v.Palco
      if (pal) { stage.style.setProperty('--dot-a', pal['Opacidade dos pontos'] / 100); stage.style.setProperty('--dot-r', `${pal['Tamanho dos pontos']}px`); stage.style.setProperty('--dot-gap', `${pal['Espaçamento dos pontos']}px`) }
      folders.forEach((f, i) => (f.controls ?? []).forEach((c) => {
        const x = v[f.name]?.[c.label]
        if (x === undefined) return
        current[`${i}.${c.id}`] = c.type === 'easing' ? { duration: x.duration, ease: x.ease } : x
        drive(c, x)
      }))
    })
    // The option moves its own state with the remote keys: keep the Estado dial on it.
    new MutationObserver(() => { const s = art.dataset.state; if (s && states.includes(s) && vals.Estado !== s) kit.setValue(`${SIM}.Estado`, s) }).observe(art, { attributes: true, attributeFilter: ['data-state'] })
    return { [`Opção ${M}`]: kit }
  }
  window.exploreTune = { apply: () => api('tune-apply', { option: M, values: current }), get kit() { return kit } }

  // --- Focus test ------------------------------------------------------------------------------------------------------------
  // A click on the option hands it the keyboard alone: everything else on the page goes inert, zoom stays as it is, the option starts at its first
  // state (and gets its own state back on exit). Esc is the remote's Back, so it never leaves; "Sair" or a click outside does.
  const ft = Object.assign(document.createElement('div'), { className: 'tune-ft', hidden: true })
  ft.innerHTML = '<div role="status"><span>Teste de foco ativo · ← → move · Enter age · Esc ou Backspace volta · ↑ ↓ passam</span><button class="tune-btn">Sair</button></div>'
  document.body.append(ft)
  const locked = []
  let before
  function enterTest() {
    if (testing) return
    testing = true; run++; art.classList.remove('tune-notrans')
    before = art.dataset.state; setState(states[0])
    for (const el of document.body.children) if (el !== stage && el !== ft && !el.inert && !/^(SCRIPT|STYLE)$/.test(el.tagName)) (el.inert = true, locked.push(el))
    stage.classList.add('testing'); document.body.classList.add('tune-testing'); ft.hidden = false; focusArt()
  }
  function leaveTest() {
    if (!testing) return
    testing = false; locked.splice(0).forEach((el) => (el.inert = false))
    stage.classList.remove('testing'); document.body.classList.remove('tune-testing'); ft.hidden = true; setState(before)
  }
  $('button', ft).onclick = leaveTest
  document.addEventListener('pointerdown', (e) => { if (testing && !e.target.closest?.('.opt, .tune-ft')) leaveTest() }, true)
  document.addEventListener('keydown', (e) => { if (testing && e.key === 'Tab') { e.preventDefault(); focusArt() } })
  window.exploreTune.test = { enter: enterTest, leave: leaveTest, get on() { return testing } }

  // Click the option: the focus test. Alt+click on a piece: its folder opens in the panel.
  scaler.addEventListener('click', (e) => {
    if (testing || !art.contains(e.target)) return
    if (!e.altKey) return enterTest()
    for (let el = e.target.closest('[data-part]'); el; el = el.parentElement?.closest('[data-part]')) {
      const f = folders.find((x) => x.part === el.dataset.part); if (!f) continue
      const box = [...document.querySelectorAll('.dialkit-folder')].find((n) => $('.dialkit-folder-title', n)?.textContent.trim() === f.name)
      if (!box) return
      const head = $('.dialkit-folder-header-top', box)
      if (head?.getAttribute('aria-expanded') === 'false') head.click()
      return box.scrollIntoView({ block: 'nearest' })
    }
  })

  // --- Export: the option's contract as spec-<M>.md (the server writes it next to the page; the browser also downloads it) ---------------------
  // The button lives in the panel's footer beside "Aplicar valores": the overlay builds that footer and takes it from window.exploreTune.extra.
  const mdBtn = Object.assign(document.createElement('button'), { textContent: 'Exportar .md' })
  window.exploreTune.extra = mdBtn
  mdBtn.onclick = async () => {
    mdBtn.disabled = true; mdBtn.style.opacity = '.5'
    try {
      const r = await api('tune-md', { option: M, label, values: current }).then((x) => x.json())
      if (!r.md) throw new Error(r.error)
      const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob([r.md], { type: 'text/markdown' })), download: r.file })
      a.click(); URL.revokeObjectURL(a.href)
      mdBtn.textContent = `Salvo: ${r.file}`
    } catch { mdBtn.textContent = 'Não consegui exportar' }
    setTimeout(() => { mdBtn.textContent = 'Exportar .md'; mdBtn.disabled = false; mdBtn.style.opacity = '' }, 2500)
  }

  // --- Figma ---------------------------------------------------------------------------------------------------------------------
  // The buttons ask Claude (it holds the Figma connection); figma.json, written through the server, says where the file is and what was pushed.
  const fpush = $('.fpush', tools), fpull = $('.fpull', tools), fmenu = $('.fmenu', tools), fmenuLabel = $('span', fmenu)
  // Both toolbar menus (Avaliar, Figma) open and close the same way.
  const dropdown = (wrap) => {
    const trigger = $('.tune-fmenu', wrap), menu = $('.tune-menu', wrap)
    const isOpen = () => menu.classList.contains('open')
    const open = (on) => { menu.classList.toggle('open', on); trigger.setAttribute('aria-expanded', String(on)) }
    trigger.onclick = () => open(!isOpen())
    document.addEventListener('pointerdown', (e) => { if (isOpen() && !wrap.contains(e.target)) open(false) })
    document.addEventListener('keydown', (e) => { if (isOpen() && e.key === 'Escape') (open(false), trigger.focus()) })
    return open
  }
  const [openJudgeMenu, openMenu] = [...tools.querySelectorAll('.tune-fig')].map(dropdown)
  const fmsg = Object.assign(document.createElement('div'), { className: 'tune-note', role: 'status', hidden: true })
  document.body.append(fmsg)
  const loadFigma = () => fetch('/__explore/figma', { headers: { 'x-explore-token': token } }).then((r) => (r.ok ? r.json() : null)).then((f) => {
    fpull.title = f?.url ? '' : 'Envie ao Figma antes de trazer'
    fpull.dataset.sent = f?.url ? '1' : ''; fpull.disabled = !f?.url || fmenuLabel.textContent === 'Trazendo…'
    fmsg.querySelector('.undo')?.remove()
    if (f?.undo) {
      const undo = Object.assign(document.createElement('button'), { className: 'tune-btn undo', textContent: 'Voltar ao antes do Figma' })
      undo.onclick = () => { // lands in the panel only, like a review suggestion: "Aplicar valores" is what saves
        for (const [k, v] of Object.entries(f.undo)) { const [i, id] = [k.slice(0, k.indexOf('.')), k.slice(k.indexOf('.') + 1)], fo = folders[i], c = fo?.controls?.find((x) => x.id === id); if (c && kit) kit.setValue(`${fo.name}.${c.label}`, v) }
        fmsg.hidden = true
      }
      fmsg.append(undo); fmsg.hidden = false
    }
  }).catch(() => {})
  loadFigma()
  const ask = (kind) => api('comment', { kind, option: M, values: current })
  fpush.onclick = () => { openMenu(false); fmsg.hidden = true; ask('figma-push') }
  fpull.onclick = () => { openMenu(false); fmsg.hidden = true; ask('figma-pull') }
  const say = (txt) => { // the file's address in a message is a link: "Abrir no Figma" lives there now
    let t = $('.ftext', fmsg); if (!t) (t = Object.assign(document.createElement('span'), { className: 'ftext' }), fmsg.prepend(t))
    t.innerHTML = esc(txt).replace(/https:\/\/[^\s<]+/g, (u) => `<a href="${u}" target="_blank" rel="noreferrer">${u}</a>`); fmsg.hidden = false
  }
  fmsg.onclick = (e) => { if (e.target === fmsg) fmsg.hidden = true }

  // --- Collapse the panel -------------------------------------------------------------------------------------------------------
  // A ghost button beside the panel's title folds the whole right column away (the stage widens); a twin at the stage's corner brings it back.
  const PANEL_ICON = '<svg viewBox="0 0 16 16" aria-hidden="true"><rect x="2" y="3" width="12" height="10" rx="2"/><path d="M10 3v10"/></svg>'
  const collapse = (on) => { document.body.classList.toggle('tune-collapsed', on); store('tune-collapsed', on ? '1' : undefined) }
  const mkBtn = (cls, label, to) => { const b = Object.assign(document.createElement('button'), { className: `tune-collapse ${cls}`, type: 'button', innerHTML: PANEL_ICON, title: label }); b.setAttribute('aria-label', label); b.onclick = (e) => { e.stopPropagation(); collapse(to) }; return b }
  const reopen = mkBtn('tune-reopen', 'Mostrar painel', false)
  document.body.append(reopen)
  const hook = () => { // DialKit draws the panel after the overlay loads it, and may redraw the header: keep the button there
    const top = $('.dialkit-folder-title-root')?.closest('.dialkit-folder-header-top')
    if (top && !$('.tune-collapse', top)) top.append(mkBtn('', 'Recolher painel', true))
  }
  new MutationObserver(hook).observe(document.body, { childList: true, subtree: true }); hook()
  if (stored('tune-collapsed')) collapse(true)
  window.exploreTune.expand = () => collapse(false) // the overlay calls it when Histórico opens, which lives in the same column

  // --- Review ----------------------------------------------------------------------------------------------------------------
  const judge = Object.assign(document.createElement('div'), { className: 'tune-judge', hidden: true })
  document.body.append(judge)
  // Two reports share the panel: the general review (judge) and the kit audit (kit). Each is a file the agent leaves next to the page.
  const REPORTS = { judge: { title: 'Revisão geral', busy: 'Avaliando…', btn: $('.jgeral', tools) }, kit: { title: 'Auditoria do kit', busy: 'Auditando…', btn: $('.jkit', tools) } }
  const DOMAIN = { rules: 'regra', tokens: 'token', behavior: 'comportamento' }
  const SEV = { HIGH: 'Alta', MEDIUM: 'Média', LOW: 'Baixa' }
  const show = (r, kind) => {
    judge.hidden = false
    store(`tune-report-${M}`, kind)
    const count = (r.findings ?? []).reduce((n, f) => ({ ...n, [f.severity]: (n[f.severity] ?? 0) + 1 }), {})
    const tally = ['HIGH', 'MEDIUM', 'LOW'].filter((k) => count[k]).map((k) => `${count[k]} ${SEV[k].toLowerCase()}${count[k] > 1 ? 's' : ''}`).join(' · ')
    judge.innerHTML = `<h2>${esc(REPORTS[kind].title)} · ${esc(r.verdict)}${tally ? ` · ${tally}` : ''}</h2><div class="sum">${esc(r.summary ?? '')}</div>${(r.findings ?? []).map((f, i) => `<div class="f"><span class="sev ${esc(f.severity)}">${esc(SEV[f.severity] ?? f.severity)}</span> · ${esc(DOMAIN[f.domain] ?? f.domain)}${f.rule ? ` · <code>${esc(f.rule)}</code>` : ''} · <code>${esc(f.location)}</code><br>${esc(f.why)}<br><code>${esc(f.before)}</code> → <code>${esc(f.after)}</code>${f.dial ? ` <button class="tune-btn" data-i="${i}">Aplicar sugestão</button>` : ''}</div>`).join('') || '<div class="f">Nada a corrigir.</div>'}
      <div class="f">${(r.coverage ?? []).map((c) => `${esc(DOMAIN[c.domain] ?? c.domain)}: ${esc(c.result)}`).join(' · ')}${(r.notVerified ?? []).length ? `<br>Não verificado: ${r.notVerified.map(esc).join('; ')}` : ''}<br><button class="tune-btn" data-close>Fechar</button></div>`
    judge.onclick = (e) => {
      if (e.target.dataset.close !== undefined) judge.hidden = true
      const d = (r.findings ?? [])[e.target.dataset.i]?.dial
      if (d && kit) kit.setValue(`${d.folder}.${d.control}`, d.value) // lands in the panel only: "Aplicar valores" is what saves
    }
  }
  const load = (kind) => fetch(`/__explore/judge?option=${M}${kind === 'kit' ? '&kit=1' : ''}`, { headers: { 'x-explore-token': token } }).then((r) => (r.ok ? r.json() : null)).then((r) => r && show(r, kind)).catch(() => {})
  // On load the report the designer last looked at comes back; a fresh answer replaces it.
  const last = stored(`tune-report-${M}`) === 'kit' ? 'kit' : 'judge'
  load(last)
  const jmenu = $('.jmenu', tools), jmenuLabel = $('span', jmenu)
  for (const [kind, { btn }] of Object.entries(REPORTS)) btn.onclick = () => { openJudgeMenu(false); btn.disabled = true; api('comment', { kind, option: M }) }
  const seen = { judge: 0, kit: 0 }
  let started = false
  let seenF = Number(stored(`tune-figma-seen-${M}-${token}`))
  new EventSource(`/__explore/events?token=${token}`).addEventListener('state', (e) => {
    const all = JSON.parse(e.data), first = !started
    started = true
    let running = ''
    const latest = {}
    for (const kind of Object.keys(REPORTS)) {
      latest[kind] = all.filter((c) => c.kind === kind && c.option === M).at(-1)
      if (['enviado', 'aguardando', 'aplicando'].includes(latest[kind]?.status)) running = REPORTS[kind].busy
    }
    for (const [kind, c] of Object.entries(latest)) {
      REPORTS[kind].btn.disabled = !!running // one agent at a time: the second run would race the first one's panel
      if ((c?.status !== 'aplicado' && c?.status !== 'falhou') || c.id <= seen[kind]) continue
      seen[kind] = c.id
      if (first) continue // answers from before the page opened: the report loaded above already shows them
      if (c.status === 'aplicado') load(kind)
      else say(`${REPORTS[kind].title}: não deu certo. ${c.summary ?? ''}`)
    }
    jmenuLabel.textContent = running || 'Avaliar'
    // Figma: one request at a time per kind; the newest answer shows as a message (it survives the reload a pull causes: the server keeps the comments).
    const fig = all.filter((c) => c.kind?.startsWith('figma-') && c.option === M)
    const busyF = (k) => fig.filter((c) => c.kind === k).at(-1), on = (k) => ['enviado', 'aguardando', 'aplicando'].includes(busyF(k)?.status)
    fpush.disabled = on('figma-push'); fpull.disabled = on('figma-pull') || !fpull.dataset.sent
    fmenuLabel.textContent = on('figma-push') ? 'Enviando…' : on('figma-pull') ? 'Trazendo…' : 'Figma'
    const done = fig.filter((c) => c.status === 'aplicado' || c.status === 'falhou').at(-1)
    if (done && done.id > seenF) { seenF = done.id; store(`tune-figma-seen-${M}-${token}`, String(seenF)); loadFigma(); say(`${done.status === 'falhou' ? 'Figma: não deu certo. ' : ''}${done.summary ?? ''}`) }
  })
})()
