/* Live layer injected by scripts/explore-server.ts into an exploration's index.html.
 *  - Header buttons "Adicionar comentário" (element picker) and a history toggle, mounted in the page's #explore-actions slot.
 *  - A fixed 288 px panel on the right with the "Histórico" card and, only when the page defines window.exploreDials,
 *    a DialKit card under it. The panel opens when either exists and floats over the page below the header row
 *    (top 72 px, where the cards start), so the page never moves and the header buttons stay reachable.
 *  - The picker outline and the note box live in a separate fixed layer. Shadow roots keep the page's CSS out. */
(() => {
  const { token } = window.__EXPLORE__
  const api = (path, init) => fetch(`/__explore/${path}`, { ...init, headers: { 'x-explore-token': token, 'content-type': 'application/json' } })
  const FONT = `"SF Pro", -apple-system, BlinkMacSystemFont, system-ui, sans-serif`
  const COLORS = { enviado: '#d9d9d9', aguardando: '#888', aplicando: '#f2c94c', aplicado: '#6fcf97', falhou: '#eb5757' }
  const esc = (s) => String(s).replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[ch])
  const BTN = `.btn { position: relative; height: 32px; min-width: 32px; display: flex; align-items: center; justify-content: center; gap: 6px; padding: 0 10px; border: 1px solid transparent; border-radius: 8px;
      background: linear-gradient(180deg, #3C3C3C 0%, #2F2F2F 100%) padding-box, linear-gradient(180deg, #6A6A6A 0%, #484848 100%) border-box; box-shadow: inset 0 0 8px rgba(14,14,14,.19); color: #ccc; font-size: 14px; font-weight: 500; cursor: pointer; white-space: nowrap; }
    .btn.on { background: linear-gradient(180deg, #3C3C3C 0%, #2F2F2F 100%) padding-box, linear-gradient(#fff, #fff) border-box; }
    /* States. Gradients cannot be transitioned, so hover/pressed lift or sink the whole button with filter: it moves fill, stroke and label together. */
    .btn { transition: filter 120ms ease-out, transform 120ms cubic-bezier(.2, .8, .2, 1), box-shadow 120ms ease-out; }
    @media (hover: hover) { .btn:hover { filter: brightness(1.18); } }
    .btn:active { filter: brightness(.88); transform: scale(.97); box-shadow: inset 0 1px 6px rgba(14,14,14,.45); transition-duration: 60ms; }
    .btn:focus-visible { outline: 2px solid #ccc; outline-offset: 2px; }
    @media (prefers-reduced-motion: reduce) { .btn { transition: none; } .btn:active { transform: none; } }
    .ico { width: 14px; height: 14px; flex: none; background: currentColor; -webkit-mask: var(--src) center / contain no-repeat; mask: var(--src) center / contain no-repeat; }`

  const hasDials = typeof window.exploreDials === 'function'
  const syncPanel = (historyOpen) => { panel.style.display = historyOpen || hasDials ? 'flex' : 'none' }
  const EDGE = 'border:1px solid #3f3a3a;box-shadow:0 8px 24px rgba(0,0,0,.5)' // the cards float over page cards of the same colour

  // Panel: fixed column on the right.
  const panel = document.createElement('aside')
  panel.id = 'explore-panel'
  panel.style.cssText = 'position:fixed;top:72px;right:24px;bottom:24px;width:288px;display:none;flex-direction:column;gap:8px;min-height:0;z-index:2147483646'
  document.body.appendChild(panel)
  const hist = document.createElement('div')
  hist.style.cssText = 'flex:0 1 auto;min-height:0;display:none;flex-direction:column'
  panel.appendChild(hist)
  const hroot = hist.attachShadow({ mode: 'open' })
  hroot.innerHTML = `
    <style>
      * { box-sizing: border-box; margin: 0; font-family: ${FONT}; }
      :host { display: contents; }
      .card { background: #232323; border: 1px solid #3f3a3a; box-shadow: 0 8px 24px rgba(0,0,0,.5); border-radius: 12px; display: flex; flex-direction: column; gap: 12px; padding: 12px; min-height: 0; max-height: 100%; }
      .hh { display: flex; align-items: center; justify-content: space-between; padding: 4px; flex: none; }
      .title { font-size: 16px; font-weight: 600; color: #ccc; }
      .close { width: 14px; height: 14px; border: 0; background: none; padding: 0; cursor: pointer; color: #ccc; }
      .ico { display: block; width: 14px; height: 14px; background: currentColor; -webkit-mask: var(--src) center / contain no-repeat; mask: var(--src) center / contain no-repeat; }
      .body { overflow: auto; min-height: 0; display: flex; flex-direction: column; gap: 12px; }
      .c { display: flex; flex-direction: column; gap: 7px; }
      .st { display: flex; align-items: center; gap: 4px; font-size: 12px; color: #ccc; }
      .sq { width: 14px; height: 14px; flex: none; }
      .tx { font-size: 14px; font-weight: 400; color: #eee; word-break: break-word; }
      .sm { font-size: 14px; font-weight: 400; color: #ccc; word-break: break-word; }
      .empty { font-size: 12px; color: #888; }
    </style>
    <div class="card"><div class="hh"><span class="title">Histórico</span><button class="close" title="Fechar"><span class="ico" style="--src:url(/__explore/icons/close.svg)"></span></button></div><div class="body"></div></div>`
  const body = hroot.querySelector('.body')

  // Header buttons, in the page's slot (a fixed cluster at the top right on pages without one).
  let slot = document.getElementById('explore-actions')
  if (!slot) {
    slot = document.createElement('div')
    slot.style.cssText = 'position:fixed;top:24px;right:24px;z-index:2147483646'
    document.body.appendChild(slot)
  }
  slot.dataset.live = ''
  const actions = slot.attachShadow({ mode: 'open' })
  actions.innerHTML = `
    <style>* { box-sizing: border-box; margin: 0; font-family: ${FONT}; } :host { display: flex; gap: 8px; } ${BTN} .btn.icon { padding: 0; width: 32px; }</style>
    <button class="btn add"><span class="ico" style="--src:url(/__explore/icons/add.svg)"></span>Adicionar comentário</button>
    <button class="btn icon toggle" title="Histórico"><span class="ico" style="--src:url(/__explore/icons/comments.svg)"></span></button>`
  const [add, toggle] = ['.add', '.toggle'].map((s) => actions.querySelector(s))

  // Picker + note box: a fixed layer above the page.
  const layer = document.createElement('div')
  layer.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:2147483647'
  const lroot = layer.attachShadow({ mode: 'open' })
  lroot.innerHTML = `
    <style>
      * { box-sizing: border-box; font-family: ${FONT}; font-size: 13px; }
      .box { position: fixed; border: 2px solid #ccc; background: #ffffff22; pointer-events: none; display: none; }
      .note { position: fixed; width: 280px; padding: 12px; border-radius: 12px; background: #232323; color: #eee; box-shadow: 0 4px 20px #0008; pointer-events: auto; display: none; }
      small { display: block; margin-bottom: 8px; color: #ccc; word-break: break-all; }
      textarea { width: 100%; height: 70px; resize: vertical; background: #181818; color: #eee; border: .7px solid #888; border-radius: 8px; padding: 6px; }
      .row { display: flex; gap: 8px; justify-content: flex-end; margin-top: 8px; }
      button { height: 24px; padding: 0 10px; border: .7px solid #888; border-radius: 8px; background: linear-gradient(#3c3c3c, #2f2f2f); color: #ccc; cursor: pointer; }
    </style>
    <div class="box"></div>
    <div class="note"><small></small><textarea placeholder="O que mudar aqui?"></textarea>
      <div class="row"><button class="cancel">Cancelar</button><button class="send">Enviar</button></div></div>`
  document.body.appendChild(layer)
  const L = (s) => lroot.querySelector(s)
  const [box, note, text] = ['.box', '.note', 'textarea'].map(L)

  let picking = false, target = null
  const path = (el) => {
    const parts = []
    for (; el && el.nodeType === 1 && el !== document.documentElement; el = el.parentElement) {
      if (el.id) { parts.unshift(`#${CSS.escape(el.id)}`); break }
      const same = [...el.parentElement.children].filter((c) => c.tagName === el.tagName)
      parts.unshift(el.tagName.toLowerCase() + (same.length > 1 ? `:nth-of-type(${same.indexOf(el) + 1})` : ''))
    }
    return parts.join(' > ')
  }
  // The panel, the header buttons and the note are ours: never pickable.
  const ours = (el) => el === layer || panel.contains(el) || el === slot || slot.contains(el)
  const at = (e) => { const el = document.elementFromPoint(e.clientX, e.clientY); return !el || ours(el) ? null : el }
  const stop = () => { picking = false; add.classList.remove('on'); box.style.display = 'none'; document.body.style.cursor = '' }

  add.onclick = () => { note.style.display = 'none'; if (picking) return stop(); picking = true; add.classList.add('on'); document.body.style.cursor = 'crosshair' }
  document.addEventListener('mousemove', (e) => {
    if (!picking) return
    const el = at(e); if (!el) return void (box.style.display = 'none')
    const r = el.getBoundingClientRect()
    Object.assign(box.style, { display: 'block', left: r.left + 'px', top: r.top + 'px', width: r.width + 'px', height: r.height + 'px' })
  }, true)
  document.addEventListener('click', (e) => {
    if (!picking) return
    const el = at(e); if (!el) return
    e.preventDefault(); e.stopPropagation()
    target = el; stop()
    const opt = el.closest('[data-option]'), part = el.closest('[data-part]')
    note.querySelector('small').textContent = [opt && `opção ${opt.dataset.option}`, part && part.dataset.part, path(el)].filter(Boolean).join(' · ')
    const r = el.getBoundingClientRect()
    note.style.left = Math.min(innerWidth - 300, Math.max(8, r.left)) + 'px'
    note.style.top = Math.min(innerHeight - 190, Math.max(8, r.bottom + 8)) + 'px'
    note.style.display = 'block'; text.value = ''; text.focus()
  }, true)
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape' || !(picking || note.style.display === 'block')) return
    e.preventDefault(); stop(); note.style.display = 'none'
  }, true)
  L('.cancel').onclick = () => (note.style.display = 'none')
  L('.send').onclick = async () => {
    if (!text.value.trim() || !target) return
    const opt = target.closest('[data-option]'), part = target.closest('[data-part]')
    await api('comment', { method: 'POST', body: JSON.stringify({
      comment: text.value, selector: path(target), option: opt?.dataset.option, part: part?.dataset.part,
      tag: target.tagName.toLowerCase(), text: target.textContent.trim().replace(/\s+/g, ' '), html: target.outerHTML,
    }) })
    note.style.display = 'none'; setHistory(true)
  }

  const setHistory = (open) => {
    hist.style.display = open ? 'flex' : 'none'
    toggle.classList.toggle('on', open)
    syncPanel(open)
    try { sessionStorage.setItem('explore-history', open ? '1' : '') } catch {}
  }
  toggle.onclick = () => setHistory(hist.style.display !== 'flex')
  hroot.querySelector('.close').onclick = () => setHistory(false)

  const render = (items) => {
    body.innerHTML = items.length ? items.map((c) => `<div class="c"><div class="st"><span class="sq" style="background:${COLORS[c.status] ?? '#d9d9d9'}"></span>#${c.id} · ${c.status}</div>
      <div class="tx">${esc(c.comment)}</div>${c.summary ? `<div class="sm">${esc(c.summary)}</div>` : ''}</div>`).join('') : '<div class="empty">Nenhum comentário ainda.</div>'
    body.scrollTop = body.scrollHeight
  }

  // DialKit: only when the exploration asks for it (it defines window.exploreDials).
  if (hasDials) {
    const card = document.createElement('div')
    card.style.cssText = `flex:1 1 0;min-height:0;display:flex;flex-direction:column;background:#232323;border-radius:12px;overflow:hidden;${EDGE}`
    const host = document.createElement('div')
    host.style.cssText = 'flex:1 1 0;min-height:0;overflow:auto;position:relative'
    const foot = document.createElement('div')
    foot.style.cssText = 'flex:none;padding:8px 12px;display:flex;justify-content:flex-end'
    const apply = document.createElement('button')
    apply.textContent = 'Aplicar valores'
    apply.style.cssText = `height:24px;padding:0 10px;border:.7px solid #888;border-radius:8px;background:linear-gradient(#3c3c3c,#2f2f2f);box-shadow:inset 0 0 8px rgba(14,14,14,.19);color:#ccc;font:500 14px ${FONT};cursor:pointer`
    foot.appendChild(apply); card.append(host, foot); panel.appendChild(card)

    const css = document.createElement('link'); css.rel = 'stylesheet'; css.href = '/__explore/dialkit.css'; document.head.appendChild(css)
    const js = document.createElement('script'); js.src = '/__explore/dialkit.js'
    js.onload = () => {
      window.DialKit.createDialRoot({ mode: 'inline', target: host, theme: 'dark' })
      const kits = window.exploreDials(window.DialKit) ?? {}
      apply.onclick = async () => {
        const values = Object.fromEntries(Object.entries(kits).map(([name, kit]) => [name, kit.getValues()]))
        await api('comment', { method: 'POST', body: JSON.stringify({ kind: 'dials', values }) })
        setHistory(true)
      }
    }
    document.head.appendChild(js)
  }

  const es = new EventSource(`/__explore/events?token=${token}`)
  es.addEventListener('state', (e) => render(JSON.parse(e.data)))
  es.addEventListener('reload', () => { try { sessionStorage.setItem('explore-scroll', scrollY) } catch {} location.reload() })
  let wasOpen = false
  try {
    const y = sessionStorage.getItem('explore-scroll')
    if (y) { sessionStorage.removeItem('explore-scroll'); scrollTo(0, Number(y)) }
    wasOpen = !!sessionStorage.getItem('explore-history')
  } catch {}
  setHistory(wasOpen)
})()
