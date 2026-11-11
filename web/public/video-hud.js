/* Painel de diagnóstico do vídeo da tela (ES5, para o Chrome 68). Escreve no canto da tela o que o primeiro <video>
   está fazendo, duas vezes por segundo: caminho (data-caminho, posto por VideoAoVivo), estado, erro e quadros. */
(function () {
  var old = document.getElementById('video-hud');
  if (old) old.parentNode.removeChild(old);
  var hud = document.createElement('div');
  hud.id = 'video-hud';
  hud.style.cssText = 'position:fixed;left:16px;top:16px;z-index:2147483647;padding:10px 14px;background:rgba(0,0,0,.75);color:#fff;font:20px/1.35 monospace;white-space:pre;pointer-events:none';
  document.body.appendChild(hud);
  var events = [];
  var watched = null;
  function watch(v) {
    if (watched === v) return;
    watched = v;
    events = [];
    ['error', 'stalled', 'waiting', 'playing', 'loadedmetadata', 'canplay', 'emptied'].forEach(function (t) {
      v.addEventListener(t, function () {
        events.push(t === 'error' && v.error ? 'error ' + v.error.code : t);
        if (events.length > 6) events.shift();
      });
    });
  }
  function show() {
    var v = document.querySelector('video');
    if (!v) { hud.textContent = 'sem <video> na página'; return; }
    watch(v);
    hud.textContent = [
      'caminho: ' + (v.getAttribute('data-caminho') || '?') + '   hls.js carregou: ' + (window.Hls ? 'sim' : 'nao'),
      'readyState ' + v.readyState + '  networkState ' + v.networkState + '  paused ' + v.paused,
      'tempo ' + v.currentTime.toFixed(1) + 's  tamanho ' + v.videoWidth + 'x' + v.videoHeight + '  loop ' + v.loop,
      'quadros ' + v.webkitDecodedFrameCount + '  descartados ' + v.webkitDroppedFrameCount,
      'erro ' + (v.error ? v.error.code : 'nenhum') + '  fonte ' + (v.currentSrc ? v.currentSrc.slice(0, 48) : '(vazia)'),
      'eventos: ' + events.join(', ')
    ].join('\n');
  }
  setInterval(show, 500);
})();
