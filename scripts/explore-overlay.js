/* Live layer injected by scripts/explore-server.ts into an exploration's index.html.
 *  - Header buttons "Mais opções" (a fresh batch), "Adicionar comentário" (element picker) and a history toggle, mounted in the page's #explore-actions slot.
 *  - A "Variar" menu on each card: four kinds of variation of that option, or discard it. Placeholder cards stand in while a batch is made.
 *  - A fixed 288 px panel on the right with the "Histórico" card and, only when the page defines window.exploreDials,
 *    a DialKit card under it. The panel opens when either exists and floats over the page below the header row
 *    (top 72 px, where the cards start), so the page never moves and the header buttons stay reachable.
 *  - The picker outline and the note box live in a separate fixed layer. Shadow roots keep the page's CSS out.
 *  - On the /tune stage: no card menus and no "Mais opções"; "Aplicar valores" is written by the server (window.exploreTune). */
(() => {
  const { token, tune } = window.__EXPLORE__ // `tune`: the page is the /tune stage (scripts/explore-tune.js ran first)
  // A click that cannot reach the session must say so: a silent failure looks like "nothing happens".
  const alertBar = document.createElement('div')
  alertBar.setAttribute('role', 'alert')
  alertBar.style.cssText = 'position:fixed;top:12px;left:50%;transform:translateX(-50%);z-index:2147483647;display:none;max-width:min(560px,calc(100vw - 32px));padding:10px 14px;border-radius:10px;background:#3a1f1f;border:1px solid #eb5757;color:#eee;font:500 13px/1.4 "SF Pro",-apple-system,BlinkMacSystemFont,system-ui,sans-serif;box-shadow:0 8px 24px rgba(0,0,0,.5)'
  document.body.appendChild(alertBar)
  const DEAD = 'Esta página perdeu a conexão com a conversa do Claude, então os pedidos não chegam. Na conversa, rode /explore com a pasta desta exploração para reabrir, e use a aba nova.'
  const warn = (msg) => { alertBar.textContent = msg; alertBar.style.display = msg ? 'block' : 'none' }
  const api = async (path, init) => {
    let res
    try { res = await fetch(`/__explore/${path}`, { ...init, headers: { 'x-explore-token': token, 'content-type': 'application/json' } }) }
    catch { warn(DEAD); throw new Error('explore: servidor fora do ar') }
    // 401: another server took this address (new token); anything else is a request this server refused.
    if (!res.ok) warn(res.status === 401 ? DEAD : `O pedido não foi aceito (erro ${res.status}). Recarregue a página e tente de novo.`)
    return res
  }
  const FONT = `"SF Pro", -apple-system, BlinkMacSystemFont, system-ui, sans-serif`
  const COLORS = { enviado: '#d9d9d9', aguardando: '#888', aplicando: '#f2c94c', aplicado: '#6fcf97', falhou: '#eb5757', cancelado: '#555' }
  const isBatch = (c) => c.kind === 'vary' || c.kind === 'more'
  const isOpen = (c) => ['enviado', 'aguardando', 'aplicando'].includes(c.status)
  // Any queued request can be taken back, and a batch of options while it is made; an edit under way cannot.
  const canCancel = (c) => c.status === 'enviado' || c.status === 'aguardando' || (c.status === 'aplicando' && isBatch(c))
  const cancel = (id) => api('cancel', { method: 'POST', body: JSON.stringify({ id: Number(id) }) })
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
      .x { align-self: flex-start; height: 24px; padding: 0 10px; border: .7px solid #888; border-radius: 8px; background: linear-gradient(#3c3c3c, #2f2f2f); color: #ccc; font-size: 12px; cursor: pointer; }
      .x:focus-visible { outline: 2px solid #ccc; outline-offset: 2px; }
    </style>
    <div class="card"><div class="hh"><span class="title">Histórico</span><button class="close" title="Fechar"><span class="ico" style="--src:url(/__explore/icons/close.svg)"></span></button></div><div class="body"></div></div>`
  const body = hroot.querySelector('.body')
  body.onclick = (e) => { const x = e.target.closest('.x'); if (x) cancel(x.dataset.id) }

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
    <style>* { box-sizing: border-box; margin: 0; font-family: ${FONT}; } :host { display: flex; gap: 8px; } ${BTN} .btn.icon { padding: 0; width: 32px; } .btn:disabled { opacity: .5; cursor: default; filter: none; transform: none; }</style>
    <button class="btn more">Mais opções</button>
    <button class="btn add"><span class="ico" style="--src:url(/__explore/icons/add.svg)"></span>Adicionar comentário</button>
    <button class="btn icon toggle" title="Histórico"><span class="ico" style="--src:url(/__explore/icons/comments.svg)"></span></button>`
  const [add, toggle] = ['.add', '.toggle'].map((s) => actions.querySelector(s))
  const more = actions.querySelector('.more')
  // One batch of new ideas at a time: the button waits for the one it asked for (cancel it on its placeholder or in Histórico).
  if (tune) more.style.display = 'none'
  more.onclick = () => { more.disabled = true; api('comment', { method: 'POST', body: JSON.stringify({ kind: 'more' }) }) }

  // Per-card menu: variations of an option the designer liked, or discard it. Lives inside the card so Tab reaches it right after the card.
  const items = document.querySelector('.explore-items')
  const BATCH = 4 // cards per request; .claude/commands/explore.md asks the agents for the same number
  const VARY = [['sutil', 'Variar sutil'], ['forte', 'Variar forte'], ['layout', 'Embaralhar layout'], ['estilo', 'Mudar estilo']]
  const pageCss = document.createElement('style')
  pageCss.textContent = `.opt { position: relative; } .opt-label { padding-right: 76px; } .explore-card-menu { position: absolute; top: 12px; right: 12px; z-index: 2; }
    .opt-group.explore-pending { display: flex; align-items: center; gap: 12px; }
    .explore-pending button { height: 24px; padding: 0 10px; border: .7px solid #888; border-radius: 8px; background: linear-gradient(#3c3c3c, #2f2f2f); color: #ccc; font: 500 12px ${FONT}; cursor: pointer; }
    .explore-pending button:focus-visible { outline: 2px solid #ccc; outline-offset: 2px; }
    .opt.explore-pending { align-items: center; justify-content: center; color: #888; font: 500 14px ${FONT}; overflow: hidden; }
    .opt.explore-pending canvas { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; }
    .opt.explore-pending span { position: relative; padding: 2px 8px; border-radius: 6px; background: var(--explore-tile-bg); }`
  document.head.appendChild(pageCss)
  const discard = (option, discarded) => api('discard', { method: 'POST', body: JSON.stringify({ option, discarded }) })
  for (const card of tune ? [] : document.querySelectorAll('.opt[data-option]')) {
    const n = card.dataset.option, gone = card.hasAttribute('data-discarded')
    const host = document.createElement('div')
    host.className = 'explore-card-menu'
    // The option's own arrow, Enter and Back keys must not swallow the menu's.
    host.addEventListener('keydown', (e) => e.stopPropagation())
    const r = host.attachShadow({ mode: 'open' })
    r.innerHTML = `
      <style>* { box-sizing: border-box; margin: 0; font-family: ${FONT}; } ${BTN} .btn { height: 28px; font-size: 13px; }
        .menu { position: absolute; top: 34px; right: 0; width: 208px; display: none; flex-direction: column; gap: 2px; padding: 8px; border-radius: 12px; background: #232323; ${EDGE}; }
        .menu.open { display: flex; }
        input { height: 28px; margin-bottom: 6px; padding: 0 8px; background: #181818; color: #eee; border: .7px solid #888; border-radius: 8px; font-size: 13px; }
        .item { height: 28px; padding: 0 8px; border: 0; border-radius: 6px; background: none; color: #eee; font-size: 13px; text-align: left; cursor: pointer; }
        .item:hover { background: #ffffff14; } .item:focus-visible, input:focus-visible { outline: 2px solid #ccc; outline-offset: 1px; }
        .sep { height: 1px; margin: 4px 0; background: #3f3a3a; } .del { color: #eb8a8a; }</style>
      ${gone ? '<button class="btn restore">Restaurar</button>' : `<button class="btn open" aria-haspopup="true" aria-expanded="false" aria-label="Variar opção ${esc(n)}">Variar</button>
      <div class="menu" role="group" aria-label="Variar opção ${esc(n)}">
        <input placeholder="O que mudar? Enter envia" aria-label="O que mudar nesta opção. Enter envia; ou escolha um tipo de variação abaixo" maxlength="300">
        ${VARY.map(([a, label]) => `<button class="item" data-action="${a}">${label}</button>`).join('')}
        <button class="item tune">Ajustar (ajuste fino)</button><div class="sep"></div><button class="item del">Descartar</button>
      </div>`}`
    card.appendChild(host)
    if (gone) { r.querySelector('.restore').onclick = () => discard(n, false); continue }
    const open = r.querySelector('.open'), menu = r.querySelector('.menu'), note = r.querySelector('input')
    const show = (on) => { menu.classList.toggle('open', on); open.setAttribute('aria-expanded', String(on)); if (on) note.focus() }
    open.onclick = () => show(!menu.classList.contains('open'))
    host.addEventListener('keydown', (e) => { if (e.key === 'Escape' && menu.classList.contains('open')) { show(false); open.focus() } })
    // Closes when the focus or a click goes elsewhere. Safari does not focus a clicked button, so a null relatedTarget is not "elsewhere".
    host.addEventListener('focusout', (e) => { if (e.relatedTarget && !host.contains(e.relatedTarget)) show(false) })
    document.addEventListener('pointerdown', (e) => { if (!e.composedPath().includes(host)) show(false) })
    const send = (action) => {
      show(false); open.focus()
      api('comment', { method: 'POST', body: JSON.stringify({ kind: 'vary', option: n, action, note: note.value }) })
      note.value = ''
    }
    // Enter in the field asks for variations in the designer's own words; without words, the field has nothing to send.
    note.addEventListener('keydown', (e) => { if (e.key === 'Enter' && note.value.trim()) { e.preventDefault(); send('livre') } }) // preventDefault: send() focuses the Variar button, and this same Enter would press it
    menu.onclick = (e) => {
      const b = e.target.closest('.item'); if (!b) return
      if (b.classList.contains('tune')) return void (location.href = `/tune/${n}`)
      if (b.classList.contains('del')) return show(false), discard(n, true)
      send(b.dataset.action)
    }
  }
  // Discarded cards are hidden by the template; this line counts them and shows them again, dimmed, to restore one.
  const goneCount = document.querySelectorAll('.opt[data-discarded]').length
  if (items && goneCount) {
    const line = document.createElement('div')
    line.className = 'explore-card-menu-line'
    const lr = line.attachShadow({ mode: 'open' })
    lr.innerHTML = `<style>* { box-sizing: border-box; margin: 0; font-family: ${FONT}; } ${BTN}</style><button class="btn" aria-pressed="false">Descartadas (${goneCount})</button>`
    lr.querySelector('button').onclick = (e) => { const on = items.toggleAttribute('data-show-discarded'); e.currentTarget.setAttribute('aria-pressed', String(on)); e.currentTarget.classList.toggle('on', on) }
    items.after(line)
  }
  // Placeholder cards: an ASCII dot matrix while the agent writes the options (prototype: docs/explorations/ascii-thinking).
  // A batch can take minutes, so it is cheap on purpose: one loop for every card at 24 fps, only for cards on screen,
  // and a still dot field with reduced motion. About 1.4 ms per frame for four cards.
  const matrix = (() => {
    const CW = 12, CH = 16, RAMP = ' .·:+*o●', SPEED = 8, RANDOM = 0.5, TRAIL = 10, FPS = 24
    const still = matchMedia('(prefers-reduced-motion: reduce)')
    const hash = (a, b, s) => { const x = Math.sin(a * 127.1 + b * 311.7 + s * 74.7) * 43758.5453; return x - Math.floor(x) }
    const draw = (cv, t) => { // t null: the still field
      const d = Math.min(devicePixelRatio || 1, 2), w = cv.clientWidth, h = cv.clientHeight
      if (cv.width !== w * d || cv.height !== h * d) { cv.width = w * d; cv.height = h * d }
      const x = cv.getContext('2d'), seed = +cv.dataset.seed
      x.setTransform(d, 0, 0, d, 0, 0); x.clearRect(0, 0, w, h)
      x.font = '12px ui-monospace, Menlo, monospace'; x.textAlign = 'center'; x.textBaseline = 'middle'
      const cols = Math.floor(w / CW), rows = Math.floor(h / CH), span = rows + TRAIL
      for (let c = 0; c < cols; c++) {
        // RANDOM 0 would be one diagonal sweep; 1, every column on its own speed and phase.
        const head = t === null ? -1 : (t * SPEED * (1 + (hash(c, 1, seed) - 0.5) * 1.6 * RANDOM) + c * 0.6 * (1 - RANDOM) + hash(c, 2, seed) * span * RANDOM) % span
        for (let r = 0; r < rows; r++) {
          const k = 1 - (head - r) / TRAIL, lit = head >= r && k > 0
          const flick = lit ? (hash(c, r, seed + Math.floor(t * 12)) - 0.5) * RANDOM * 4 : 0
          x.globalAlpha = lit ? 0.12 + 0.48 * k : 0.15
          x.fillStyle = lit ? '#a3a3a3' : '#6f6f6f'
          x.fillText(lit ? RAMP[Math.max(1, Math.min(RAMP.length - 1, Math.round(k * (RAMP.length - 1) + flick)))] : '·', c * CW + CW / 2, r * CH + CH / 2)
        }
      }
    }
    const shown = new Set()
    let raf = 0, last = 0
    const tick = (now) => {
      raf = 0
      for (const cv of shown) if (!cv.isConnected) { io.unobserve(cv); shown.delete(cv) }
      if (!shown.size) return // the observer starts it again
      raf = requestAnimationFrame(tick)
      if (now - last < 1000 / FPS) return
      last = now
      for (const cv of shown) draw(cv, now / 1000)
    }
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) e.isIntersecting ? shown.add(e.target) : shown.delete(e.target)
      if (shown.size && !raf) raf = requestAnimationFrame(tick)
    })
    return (cv) => (still.matches ? draw(cv, null) : io.observe(cv))
  })()

  // While a batch is being made: its group title and placeholder cards at the end of the page. The reload after "aplicado" brings the real ones.
  let seen = null // ids already shown; null until the first state, so a reload does not jump the page
  const pending = (list) => {
    const open = list.filter((c) => isBatch(c) && isOpen(c))
    more.disabled = open.some((c) => c.kind === 'more')
    if (!items) return
    items.querySelectorAll('.explore-pending').forEach((el) => el.remove())
    let fresh = null
    for (const c of open) {
      const h = Object.assign(document.createElement('h2'), { className: 'opt-group explore-pending', textContent: c.comment })
      const x = Object.assign(document.createElement('button'), { type: 'button', textContent: 'Cancelar', onclick: () => cancel(c.id) })
      x.setAttribute('aria-label', `Cancelar: ${c.comment}`)
      h.append(x)
      if (seen && !seen.has(c.id)) fresh = h
      items.append(h, ...Array.from({ length: BATCH }, (_, i) => {
        const card = Object.assign(document.createElement('article'), { className: 'opt explore-pending', ariaBusy: 'true' })
        const cv = Object.assign(document.createElement('canvas'), { ariaHidden: 'true' })
        cv.dataset.seed = i // per slot, so a re-render on the next state keeps each card's pattern
        card.append(cv, Object.assign(document.createElement('span'), { textContent: c.status === 'aplicando' ? 'Criando…' : 'Na fila…' }))
        return card
      }))
    }
    items.querySelectorAll('.opt.explore-pending canvas').forEach(matrix)
    seen = new Set(list.map((c) => c.id))
    // The answer to a click is at the end of the page: bring it into view, or the click looks like it did nothing.
    fresh?.scrollIntoView({ block: 'center', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })
  }

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
  const ours = (el) => el === layer || el === alertBar || panel.contains(el) || el === slot || slot.contains(el) || !!el.closest('.explore-card-menu, .explore-card-menu-line, .explore-pending')
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
    pending(items)
    body.innerHTML = items.length ? items.map((c) => `<div class="c"><div class="st"><span class="sq" style="background:${COLORS[c.status] ?? '#d9d9d9'}"></span>#${c.id} · ${c.status}</div>
      <div class="tx">${esc(c.comment)}</div>${c.summary ? `<div class="sm">${esc(c.summary)}</div>` : ''}${canCancel(c) ? `<button class="x" data-id="${c.id}">Cancelar</button>` : ''}</div>`).join('') : '<div class="empty">Nenhum pedido ainda.</div>'
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
        if (tune) return void (await window.exploreTune.apply())
        const values = Object.fromEntries(Object.entries(kits).map(([name, kit]) => [name, kit.getValues()]))
        await api('comment', { method: 'POST', body: JSON.stringify({ kind: 'dials', values }) })
        setHistory(true)
      }
    }
    document.head.appendChild(js)
  }

  const es = new EventSource(`/__explore/events?token=${token}`)
  es.addEventListener('state', (e) => { warn(''); render(JSON.parse(e.data)) })
  // The stream retries by itself; two failures in a row mean the server is gone, not a blip.
  let drops = 0
  es.addEventListener('open', () => (drops = 0))
  es.addEventListener('error', () => { if (++drops >= 2) warn(DEAD) })
  es.addEventListener('reload', () => { try { sessionStorage.setItem('explore-scroll', scrollY) } catch {} location.reload() })
  let wasOpen = false
  try {
    const y = sessionStorage.getItem('explore-scroll')
    if (y) { sessionStorage.removeItem('explore-scroll'); scrollTo(0, Number(y)) }
    wasOpen = !!sessionStorage.getItem('explore-history')
  } catch {}
  setHistory(wasOpen)
})()
