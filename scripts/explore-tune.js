/* The fine-tuning stage (/tune), loaded by scripts/explore-server.ts on `/tune/<N>` before the overlay.
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
    .tune-btn:focus-visible { outline: 2px solid var(--explore-tile-label); outline-offset: 2px; }
    .tune-btn:disabled { opacity: .5; cursor: default; }
    .tune-zoom { display: flex; align-items: center; gap: 4px; } .tune-zoom output { min-width: 48px; text-align: center; font: 500 13px ${FONT}; font-variant-numeric: tabular-nums; }
    .tune-stage { position: fixed; top: 72px; left: var(--explore-margin); right: calc(var(--explore-panel-w) + 2 * var(--explore-margin)); bottom: var(--explore-margin); display: flex; overflow: auto; background: var(--explore-tile-bg); border-radius: var(--explore-tile-radius); }
    .tune-sizer { position: relative; flex: none; margin: auto; }
    .tune-scaler { position: absolute; left: 0; top: 0; transform-origin: 0 0; display: grid; padding: 64px; }
    .tune-scaler > .opt { grid-area: 1 / 1; justify-self: center; align-self: center; min-height: 0; padding: 0; background: none; border-radius: 0; }
    .tune-scaler .opt-label, .tune-scaler .explore-card-menu { display: none; }
    .tune-scaler .opt:focus-visible { outline: none !important; }
    .tune-notrans, .tune-notrans *, .tune-notrans *::before, .tune-notrans *::after { transition: none !important; animation: none !important; }
    .tune-badge { position: fixed; left: calc(var(--explore-margin) + 12px); top: 84px; padding: 4px 10px; border-radius: 8px; background: #000a; color: #eee; font: 500 12px ${FONT}; pointer-events: none; }
    .tune-note, .tune-judge { position: fixed; left: calc(var(--explore-margin) + 12px); bottom: calc(var(--explore-margin) + 12px); width: min(440px, 60vw); max-height: 45vh; overflow: auto; padding: 12px; border-radius: 12px; background: #181818e6; border: 1px solid var(--explore-toggle-border); color: #ddd; font: 400 13px/1.45 ${FONT}; }
    .tune-stage.testing { outline: 2px solid var(--explore-tile-label); outline-offset: -2px; }
    body > [inert] { opacity: .4; }
    .tune-ft { position: fixed; left: var(--explore-margin); right: calc(var(--explore-panel-w) + 2 * var(--explore-margin)); bottom: calc(var(--explore-margin) + 12px); display: flex; justify-content: center; pointer-events: none; }
    .tune-ft > div { display: flex; align-items: center; gap: 12px; padding: 6px 6px 6px 14px; border-radius: 10px; background: #181818e6; border: 1px solid var(--explore-toggle-border); color: #ddd; font: 500 13px ${FONT}; pointer-events: auto; }
    .tune-ft[hidden], .tune-judge[hidden], .tune-note[hidden], .tune-badge[hidden] { display: none; }
    .tune-judge h2 { margin: 0 0 6px; font-size: 13px; font-weight: 600; } .tune-judge .f { padding: 8px 0; border-top: 1px solid var(--explore-toggle-border); }
    .tune-judge code { font-size: 12px; color: #bbb; word-break: break-word; } .tune-judge .sev { font-weight: 600; } .tune-judge .HIGH { color: #eb8a8a; } .tune-judge .MEDIUM { color: #f2c94c; }`
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
  bar.innerHTML = `<a class="tune-btn" href="/">← Opções</a><span class="tune-title" title="${esc(label)}">Ajuste fino · ${esc(label)}</span>
    <div class="tune-zoom" role="group" aria-label="Zoom"><button class="tune-btn out" aria-label="Menos zoom">−</button><output aria-live="polite">100%</output><button class="tune-btn in" aria-label="Mais zoom">+</button><button class="tune-btn fit">Ajustar</button></div>
    <button class="tune-btn judge">Avaliar</button><button class="tune-btn md">Exportar .md</button><button class="tune-btn fpush">Enviar ao Figma</button><button class="tune-btn fpull" disabled title="Envie ao Figma antes de trazer">Trazer do Figma</button><a class="tune-btn flink" target="_blank" rel="noreferrer" hidden>Abrir no Figma</a>`
  $('.explore-header').prepend(bar)
  const pct = $('output', bar)

  let z = 1
  let testing = false // focus test: the option has the keyboard alone (see "Focus test")
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v))
  const layout = () => {
    sizer.style.width = scaler.offsetWidth * z + 'px'; sizer.style.height = scaler.offsetHeight * z + 'px'
    scaler.style.transform = `scale(${z})`; pct.textContent = Math.round(z * 100) + '%'
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
  $('.in', bar).onclick = () => setZoom(z * 1.25)
  $('.out', bar).onclick = () => setZoom(z / 1.25)
  const refit = () => { auto = true; z = fit(); layout(); store(`tune-zoom-${M}`) }
  $('.fit', bar).onclick = refit
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
    for (const b of ['.judge', '.md', '.fpush', '.fpull']) $(b, bar).disabled = true
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
    stage.classList.add('testing'); ft.hidden = false; focusArt()
  }
  function leaveTest() {
    if (!testing) return
    testing = false; locked.splice(0).forEach((el) => (el.inert = false))
    stage.classList.remove('testing'); ft.hidden = true; setState(before)
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
  const mdBtn = $('.md', bar)
  mdBtn.onclick = async () => {
    mdBtn.disabled = true
    try {
      const r = await api('tune-md', { option: M, label, values: current }).then((x) => x.json())
      if (!r.md) throw new Error(r.error)
      const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob([r.md], { type: 'text/markdown' })), download: r.file })
      a.click(); URL.revokeObjectURL(a.href)
      mdBtn.textContent = `Salvo: ${r.file}`
    } catch { mdBtn.textContent = 'Não consegui exportar' }
    setTimeout(() => { mdBtn.textContent = 'Exportar .md'; mdBtn.disabled = false }, 2500)
  }

  // --- Figma ---------------------------------------------------------------------------------------------------------------------
  // The buttons ask Claude (it holds the Figma connection); figma.json, written through the server, says where the file is and what was pushed.
  const fpush = $('.fpush', bar), fpull = $('.fpull', bar), flink = $('.flink', bar)
  const fmsg = Object.assign(document.createElement('div'), { className: 'tune-note', role: 'status', hidden: true })
  document.body.append(fmsg)
  const loadFigma = () => fetch('/__explore/figma', { headers: { 'x-explore-token': token } }).then((r) => (r.ok ? r.json() : null)).then((f) => {
    flink.hidden = !f?.url; if (f?.url) flink.href = f.url
    fpull.title = f?.url ? '' : 'Envie ao Figma antes de trazer'
    fpull.dataset.sent = f?.url ? '1' : ''; fpull.disabled = !f?.url || fpull.textContent === 'Trazendo…'
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
  fpush.onclick = () => { fmsg.hidden = true; ask('figma-push') }
  fpull.onclick = () => { fmsg.hidden = true; ask('figma-pull') }
  fmsg.onclick = (e) => { if (e.target === fmsg) fmsg.hidden = true }

  // --- Review ----------------------------------------------------------------------------------------------------------------
  const judge = Object.assign(document.createElement('div'), { className: 'tune-judge', hidden: true })
  document.body.append(judge)
  const show = (r) => {
    judge.hidden = false
    judge.innerHTML = `<h2>${esc(r.verdict)} · ${esc(r.summary)}</h2>${(r.findings ?? []).map((f, i) => `<div class="f"><span class="sev ${esc(f.severity)}">${esc(f.severity)}</span> · ${esc(f.domain)} · <code>${esc(f.location)}</code><br>${esc(f.why)}<br><code>${esc(f.before)}</code> → <code>${esc(f.after)}</code>${f.dial ? ` <button class="tune-btn" data-i="${i}">Aplicar sugestão</button>` : ''}</div>`).join('') || '<div class="f">Nada a corrigir.</div>'}
      <div class="f">${(r.coverage ?? []).map((c) => `${esc(c.domain)}: ${esc(c.result)}`).join(' · ')}<br><button class="tune-btn" data-close>Fechar</button></div>`
    judge.onclick = (e) => {
      if (e.target.dataset.close !== undefined) judge.hidden = true
      const d = (r.findings ?? [])[e.target.dataset.i]?.dial
      if (d && kit) kit.setValue(`${d.folder}.${d.control}`, d.value) // lands in the panel only: "Aplicar valores" is what saves
    }
  }
  const load = () => fetch(`/__explore/judge?option=${M}`, { headers: { 'x-explore-token': token } }).then((r) => (r.ok ? r.json() : null)).then((r) => r && show(r)).catch(() => {})
  load()
  const btn = $('.judge', bar)
  btn.onclick = () => { btn.disabled = true; btn.textContent = 'Avaliando…'; api('comment', { kind: 'judge', option: M }) }
  let seen = 0, seenF = Number(stored(`tune-figma-seen-${M}-${token}`))
  new EventSource(`/__explore/events?token=${token}`).addEventListener('state', (e) => {
    const mine = JSON.parse(e.data).filter((c) => c.kind === 'judge' && c.option === M), last = mine.at(-1)
    const busy = !!last && ['enviado', 'aguardando', 'aplicando'].includes(last.status)
    btn.disabled = busy; btn.textContent = busy ? 'Avaliando…' : 'Avaliar'
    if (last?.status === 'aplicado' && last.id > seen) { seen = last.id; load() }
    // Figma: one request at a time per kind; the newest answer shows as a message (it survives the reload a pull causes: the server keeps the comments).
    const fig = JSON.parse(e.data).filter((c) => c.kind?.startsWith('figma-') && c.option === M)
    const busyF = (k) => fig.filter((c) => c.kind === k).at(-1), on = (k) => ['enviado', 'aguardando', 'aplicando'].includes(busyF(k)?.status)
    fpush.disabled = on('figma-push'); fpush.textContent = on('figma-push') ? 'Enviando…' : 'Enviar ao Figma'
    fpull.disabled = on('figma-pull') || !fpull.dataset.sent; fpull.textContent = on('figma-pull') ? 'Trazendo…' : 'Trazer do Figma'
    const done = fig.filter((c) => c.status === 'aplicado' || c.status === 'falhou').at(-1)
    if (done && done.id > seenF) { seenF = done.id; store(`tune-figma-seen-${M}-${token}`, String(seenF)); loadFigma(); fmsg.firstChild?.nodeType === 3 && fmsg.firstChild.remove(); fmsg.prepend(document.createTextNode(`${done.status === 'falhou' ? 'Figma: não deu certo. ' : ''}${done.summary ?? ''}`)); fmsg.hidden = false }
  })
})()
