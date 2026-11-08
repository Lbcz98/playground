/**
 * Runs inline in <head>, before any Next or React chunk. ES5 on purpose: it is not compiled, and it has to run on
 * the TV build's floor (Chrome 68, Safari 16). Three jobs:
 *
 * 1. Polyfills, each guarded, non-enumerable like the native ones: what the runtime path calls that Chrome 68 lacks.
 * 2. Feature classes on <html> for the CSS fallbacks that no `@supports` can detect: `no-flexgap` (flex `gap`,
 *    Chrome 84), `no-focus-visible` (Chrome 86), `no-has` (`:has()`, Chrome 105, Safari 15.4), `no-round-outline`
 *    (an outline that ignores border-radius: Chrome < 94, Safari < 16.4; read from features that shipped with it).
 * 3. TV mode (`?tv=1`, kept in sessionStorage; `?tv=0` ends it): a 1280px-wide viewport, so the 1280×720 stage
 *    draws at scale 1 like a 720p TV browser, and fullscreen on the first key press, which hides the browser's
 *    URL bar. `isTvMode()` (./tv.ts) reads the same flag.
 */
export const TV_FLAG = 'tv'

export const EARLY_SCRIPT = `(function () {
  var w = window, d = document, root = d.documentElement;
  function def(o, k, v) { if (!(k in o)) Object.defineProperty(o, k, { value: v, writable: true, configurable: true }); }

  /* 1. Polyfills */
  if (typeof globalThis === 'undefined') def(w, 'globalThis', w); /* Chrome 71 */
  def(Object, 'fromEntries', function (entries) { /* Chrome 73 */
    var o = {};
    Array.from(entries, function (e) { o[e[0]] = e[1]; });
    return o;
  });
  def(Array.prototype, 'flat', function (depth) { /* Chrome 69 */
    var out = [];
    (function walk(list, level) {
      for (var i = 0; i < list.length; i++) {
        if (!(i in list)) continue;
        if (level > 0 && Array.isArray(list[i])) walk(list[i], level - 1); else out.push(list[i]);
      }
    })(this, depth === undefined ? 1 : Number(depth));
    return out;
  });
  def(Array.prototype, 'flatMap', function (fn, self) { return Array.prototype.map.call(this, fn, self).flat(1); }); /* Chrome 69 */
  function at(i) { i = Math.trunc(i) || 0; if (i < 0) i += this.length; return i < 0 || i >= this.length ? undefined : this[i]; }
  def(Array.prototype, 'at', at); /* Chrome 92 */
  def(String.prototype, 'at', function (i) { return at.call(String(this), i); });
  def(w, 'structuredClone', function clone(v) { /* Chrome 98; plain data only, which is what the runtime clones */
    if (v === null || typeof v !== 'object') return v;
    if (v instanceof Date) return new Date(v.getTime());
    if (v instanceof Map) { var m = new Map(); v.forEach(function (x, k) { m.set(clone(k), clone(x)); }); return m; }
    if (v instanceof Set) { var s = new Set(); v.forEach(function (x) { s.add(clone(x)); }); return s; }
    var out = Array.isArray(v) ? [] : {};
    for (var k in v) if (Object.prototype.hasOwnProperty.call(v, k)) out[k] = clone(v[k]);
    return out;
  });

  /* 2. Feature classes */
  var missing = [];
  var flex = d.createElement('div');
  flex.style.cssText = 'display:flex;flex-direction:column;row-gap:1px;position:absolute;visibility:hidden';
  flex.appendChild(d.createElement('div'));
  flex.appendChild(d.createElement('div'));
  root.appendChild(flex);
  if (flex.scrollHeight !== 1) missing.push('no-flexgap');
  root.removeChild(flex);
  function selector(s) { try { d.querySelector(s); return true; } catch (e) { return false; } }
  if (!selector(':focus-visible')) missing.push('no-focus-visible');
  if (!selector(':has(*)')) missing.push('no-has');
  /* Paint cannot be asked about: scrollbar-gutter came with Chrome 94, CSS.registerProperty with Safari 16.4. */
  var css = w.CSS || {};
  if (!((css.supports && css.supports('scrollbar-gutter', 'stable')) || typeof css.registerProperty === 'function')) missing.push('no-round-outline');
  if (missing.length) root.className = (root.className ? root.className + ' ' : '') + missing.join(' ');

  /* 3. TV mode */
  var tv = false;
  try {
    var asked = /[?&]${TV_FLAG}=([^&]*)/.exec(location.search);
    if (asked) { if (asked[1] === '0') sessionStorage.removeItem('${TV_FLAG}'); else sessionStorage.setItem('${TV_FLAG}', '1'); }
    tv = sessionStorage.getItem('${TV_FLAG}') === '1';
  } catch (e) {}
  if (!tv) return;
  /* A viewport meta of its own, after Next's: the last one read wins. Next's is left as it is, or hydration would
     put a fresh copy back after this one; if anything adds a viewport meta later, this one moves after it again. */
  var viewport = d.createElement('meta');
  viewport.name = 'viewport';
  viewport.content = 'width=1280';
  d.head.appendChild(viewport);
  new MutationObserver(function (changes) {
    for (var i = 0; i < changes.length; i++) for (var j = 0; j < changes[i].addedNodes.length; j++) {
      var node = changes[i].addedNodes[j];
      if (node !== viewport && node.nodeName === 'META' && node.name === 'viewport') return d.head.appendChild(viewport);
    }
  }).observe(d.head, { childList: true });
  w.addEventListener('keydown', function () {
    if (d.fullscreenElement || d.webkitFullscreenElement) return;
    var go = root.requestFullscreen || root.webkitRequestFullscreen; /* Chrome 68 has only the prefixed one */
    if (!go) return;
    var pending = go.call(root);
    if (pending && pending.catch) pending.catch(function () {});
  }, true);
  /* The arrows move focus to the nearest link or control in their direction, as a TV browser's own navigation
     does. Chrome 68 has no spatial navigation of its own: the arrows only scrolled, so the index and screens
     made of <Link>s could not be reached. A flow (data-flow-state) reads the keys itself and is left alone. */
  var DIRS = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0], Up: [0, -1], Down: [0, 1], Left: [-1, 0], Right: [1, 0] };
  w.addEventListener('keydown', function (e) {
    var dir = DIRS[e.key];
    if (!dir || e.defaultPrevented || d.querySelector('[data-flow-state]')) return;
    var all = d.querySelectorAll('a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])');
    var items = [];
    for (var i = 0; i < all.length; i++) {
      var r = all[i].getBoundingClientRect();
      if (r.width > 0 && r.height > 0) items.push({ el: all[i], r: r });
    }
    if (!items.length) return;
    var here = d.activeElement, from = null;
    for (var k = 0; k < items.length; k++) if (items[k].el === here) from = items[k].r;
    var best = null, bestCost = Infinity;
    if (!from) best = items[0].el;
    else {
      var fx = from.left + from.width / 2, fy = from.top + from.height / 2;
      for (var m = 0; m < items.length; m++) {
        var c = items[m];
        if (c.el === here) continue;
        var dx = c.r.left + c.r.width / 2 - fx, dy = c.r.top + c.r.height / 2 - fy;
        var along = dx * dir[0] + dy * dir[1], across = Math.abs(dx * dir[1] + dy * dir[0]);
        if (along <= 1) continue;
        var cost = along + across * 2;
        if (cost < bestCost) { bestCost = cost; best = c.el; }
      }
    }
    e.preventDefault();
    if (best) best.focus();
  });
})();`
