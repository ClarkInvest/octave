/* Diagnostic : ce que l'appli reçoit du câble MIDI et du micro, pour les tests et le dépannage. */
(function () {
  'use strict';
  const A = window.App, E = window.Engine, MU = window.Music;
  const BUILD = '0.6';
  const LOG_MAX = 200;
  const log = []; /* journal gardé tant que l'appli est ouverte */

  const hex = (b) => b.toString(16).toUpperCase().padStart(2, '0');
  const stamp = () => { const d = new Date(); return d.toTimeString().slice(0, 8) + '.' + String(d.getMilliseconds()).padStart(3, '0'); };
  function midiText(data) {
    const st = data[0], cmd = st & 0xf0, ch = (st & 0x0f) + 1, d1 = data[1], d2 = data[2];
    if (cmd === 0x90 && d2 > 0) return 'Note enfoncée · ' + E.name(d1) + ' (' + d1 + ') · force ' + d2 + ' · canal ' + ch;
    if (cmd === 0x80 || cmd === 0x90) return 'Note relâchée · ' + E.name(d1) + ' (' + d1 + ') · canal ' + ch;
    if (cmd === 0xb0) return (d1 === 64 ? 'Pédale · ' + (d2 >= 64 ? 'enfoncée' : 'relâchée') : 'Contrôle ' + d1 + ' = ' + d2) + ' · canal ' + ch;
    if (cmd === 0xc0) return 'Changement de son · n° ' + (d1 + 1) + ' · canal ' + ch;
    if (cmd === 0xe0) return 'Pitch bend · ' + (((d2 << 7) | d1) - 8192) + ' · canal ' + ch;
    return 'Message ' + Array.from(data).map(hex).join(' ');
  }

  function Diag() {
    const DB = A.DB;
    const standalone = window.matchMedia && window.matchMedia('(display-mode: standalone)').matches;
    let storeKo = 0; try { storeKo = Math.round((localStorage.getItem('octave.v1') || '').length / 1024 * 10) / 10; } catch (e) { /* ignoré */ }
    const ua = navigator.userAgent, chrome = /Chrome\/(\d+)/.exec(ua), android = /Android ([\d.]+)/.exec(ua);
    const info = [
      ['Version d\'Octave', BUILD],
      ['Navigateur', (chrome ? 'Chrome ' + chrome[1] : 'Autre navigateur') + (android ? ' · Android ' + android[1] : '')],
      ['Ouverture', standalone ? 'En application installée' : 'Dans un onglet du navigateur'],
      ['Écran', window.innerWidth + ' × ' + window.innerHeight + ' · densité ' + (window.devicePixelRatio || 1)],
      ['Câble MIDI pris en charge', E.midi.supported ? 'Oui' : 'Non'],
      ['Micro pris en charge', E.mic.supported ? 'Oui' : 'Non'],
      ['Disponible sans internet', navigator.serviceWorker && navigator.serviceWorker.controller ? 'Oui' : 'Pas encore'],
      ['Progression enregistrée', storeKo + ' Ko']
    ];
    A.shell('reglages', A.header() +
      '<div class="row"><a href="#reglages" class="icon-btn" aria-label="Retour aux réglages">' + A.ICON.back + '</a><h1 class="h1">Diagnostic</h1></div>' +
      '<div class="help">Branche le clavier ou active le micro, puis joue quelques notes. Si quelque chose ne marche pas, fais une capture de cet écran.</div>' +
      '<div class="cols"><div class="stack">' +
        '<div class="card"><div class="h2">Câble MIDI</div><div id="dmidi"></div></div>' +
        '<div class="card"><div class="h2">Micro</div><div id="dmic"></div></div>' +
        '<div class="card"><div class="h2">Appareil</div><div class="list" style="background:var(--surf2)">' + info.map((r) => '<div class="item"><span class="help">' + r[0] + '</span><span class="label" style="text-align:right">' + A.esc(r[1]) + '</span></div>').join('') + '</div></div>' +
      '</div><div class="stack">' +
        '<div class="card"><div class="between"><div class="h2">Journal en direct</div><div class="row" style="gap:6px"><button class="btn small ghost" id="dcopy">Copier</button><button class="btn small ghost" id="dclear">Effacer</button></div></div>' +
          '<div class="help">Tout ce que l\'appli reçoit : touches, pédale, notes entendues par le micro.</div><div class="dlog" id="dlog" aria-live="polite"></div></div>' +
        '<div class="card"><div class="h2">Sauvegarde de la progression</div><div class="help">Copie ta progression et tes morceaux importés pour les garder ou les mettre sur un autre appareil (téléphone vers tablette par exemple).</div>' +
          '<div class="row" style="flex-wrap:wrap"><button class="btn small" id="dexport">Copier ma progression</button><button class="btn small ghost" id="dimport">Restaurer…</button></div><div id="dimp" hidden><textarea id="dimptxt" class="dtext" rows="4" placeholder="Colle ici la progression copiée"></textarea><button class="btn small" id="dimpgo">Restaurer cette progression</button></div></div>' +
      '</div></div>');

    /* ---- journal ---- */
    const box = document.getElementById('dlog');
    function render() { box.innerHTML = log.length ? log.slice().reverse().map((l) => '<div><b>' + l.t + '</b> <i>' + l.s + '</i> ' + A.esc(l.m) + '</div>').join('') : '<div class="help">Rien reçu pour l\'instant.</div>'; }
    function add(s, m) { log.push({ t: stamp(), s, m }); if (log.length > LOG_MAX) log.shift(); render(); }
    render();
    document.getElementById('dclear').onclick = () => { log.length = 0; render(); };
    document.getElementById('dcopy').onclick = () => {
      const txt = 'Octave ' + BUILD + '\n' + info.map((r) => r[0] + ' : ' + r[1]).join('\n') + '\nMIDI : ' + E.midi.status + ' · entrées ' + E.midi.inputs.map((i) => i.name).join(', ') + ' · sorties ' + E.midi.outputs.map((o) => o.name).join(', ') + ' · canal lumières ' + DB.input.channel + '\n\n' + log.map((l) => l.t + ' ' + l.s + ' ' + l.m).join('\n');
      copy(txt, 'Journal copié');
    };
    function copy(txt, ok) {
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(() => A.toast(ok), () => fallback(txt, ok));
      else fallback(txt, ok);
    }
    function fallback(txt, ok) {
      const t = document.createElement('textarea'); t.value = txt; document.body.appendChild(t); t.select();
      try { document.execCommand('copy'); A.toast(ok); } catch (e) { A.toast('Copie impossible'); }
      t.remove();
    }

    /* événements de l'appli (micro, écran) */
    const off = E.on((ev) => {
      if (ev.src === 'midi') return; /* déjà affiché en brut */
      if (ev.type === 'on') add(ev.src === 'micro' ? 'micro' : 'écran', 'Note ' + E.name(ev.midi) + ' (' + ev.midi + ')' + (ev.src === 'micro' ? ' · ' + (E.mic.cents > 0 ? '+' : '') + E.mic.cents + ' centièmes' : ''));
    });
    A.onLeave(off);

    /* messages MIDI bruts */
    const attached = [];
    let sense = 0;
    function raw(e) {
      const d = e.data; if (!d || !d.length) return;
      if (d[0] === 0xfe || d[0] === 0xf8) { sense++; return; } /* signal de présence et horloge : comptés, pas affichés */
      add('MIDI', midiText(d) + '  [' + Array.from(d).map(hex).join(' ') + ']');
    }
    function attach() {
      attached.forEach((i) => i.removeEventListener('midimessage', raw)); attached.length = 0;
      if (!E.midi.access) return;
      E.midi.access.inputs.forEach((inp) => { inp.addEventListener('midimessage', raw); attached.push(inp); });
    }
    A.onLeave(() => { attached.forEach((i) => i.removeEventListener('midimessage', raw)); });

    /* ---- panneau MIDI ---- */
    const mbox = document.getElementById('dmidi');
    let finder = null;
    function midiPanel() {
      const m = E.midi;
      const status = { off: 'Pas encore connecté', unsupported: 'Non pris en charge par ce navigateur', denied: 'Accès refusé (réglages du site dans Chrome)', nodevice: 'Aucun clavier détecté', ready: 'Clavier connecté' }[m.status];
      const ports = (list, kind) => {
        const real = [];
        if (m.access) m.access[kind].forEach((x) => real.push(x));
        return real.length ? real.map((x) => '<div class="item"><span class="label">' + A.esc(x.name || '?') + '</span><span class="help">' + A.esc(x.manufacturer || '') + ' · ' + (x.state === 'connected' ? 'branché' : x.state) + '</span></div>').join('') : '<div class="item"><span class="help">Aucune</span></div>';
      };
      mbox.innerHTML = '<div class="row" style="margin-bottom:10px"><span class="dot' + (m.status === 'ready' ? ' on' : '') + '"></span><span class="label">' + status + '</span></div>' +
        (m.access ? '<div class="eyebrow" style="margin:6px 0">Entrées (le Casio vers l\'appli)</div><div class="list" style="background:var(--surf2)">' + ports(null, 'inputs') + '</div>' +
          '<div class="eyebrow" style="margin:10px 0 6px">Sorties (l\'appli vers le Casio)</div><div class="list" style="background:var(--surf2)">' + ports(null, 'outputs') + '</div>' +
          '<div class="help" style="margin-top:8px">Signal de présence reçu : <b id="dsense">' + sense + '</b> fois' + (sense ? ' (le câble transmet bien).' : '.') + '</div>' : '') +
        '<div class="row" style="flex-wrap:wrap;margin-top:12px">' +
          (m.supported ? '<button class="btn small" id="dmconnect">' + (m.access ? 'Rafraîchir' : 'Connecter le clavier') + '</button>' : '') +
          (m.outputs.length ? '<button class="btn small ghost" id="dfind">Trouver le canal des lumières</button>' : '') + '</div>' +
        '<div id="dfinder"></div>' +
        (m.outputs.length ? '<div class="help" style="margin-top:8px">Canal des lumières actuel : <b>' + DB.input.channel + '</b></div>' : '');
      const c = document.getElementById('dmconnect');
      if (c) c.onclick = async () => { c.disabled = true; if (m.access) m.refresh(); else await m.init(); m.onchange = () => { attach(); midiPanel(); }; attach(); midiPanel(); add('appli', 'MIDI : ' + status + ' → ' + m.status); };
      const f = document.getElementById('dfind'); if (f) f.onclick = startFinder;
    }
    const senseT = setInterval(() => { const s = document.getElementById('dsense'); if (s) s.textContent = sense; }, 1000);
    A.onLeave(() => clearInterval(senseT));

    /* essaie les 16 canaux un par un : on garde celui qui allume les touches */
    function send(ch, on) {
      const o = E.midi.out(); if (!o) return;
      [60, 64, 67].forEach((n) => { try { o.send(on ? [0x90 | (ch - 1), n, 40] : [0x80 | (ch - 1), n, 0]); } catch (e) { /* ignoré */ } });
    }
    function startFinder() {
      stopFinder();
      const fb = document.getElementById('dfinder');
      finder = { ch: 1, t: 0 };
      const step = () => {
        if (!finder) return;
        if (finder.ch > 1) send(finder.ch - 1, false);
        if (finder.ch > 16) { fb.innerHTML = '<div class="help step-rule">Aucun canal n\'a allumé les touches ? Vérifiez que la prise IN du Casio est bien reliée à la sortie du câble.</div>'; finder = null; return; }
        send(finder.ch, true);
        fb.innerHTML = '<div class="finder"><div><div class="help">Essai du canal</div><div class="ask">' + finder.ch + '</div></div><div class="stack" style="gap:8px"><div class="help">Les touches Do, Mi, Sol du Casio s\'allument ?</div><div class="row" style="flex-wrap:wrap"><button class="btn small" id="dyes">Oui, celui-là</button><button class="btn small ghost" id="dstop">Arrêter</button></div></div></div>';
        document.getElementById('dyes').onclick = () => { const ch = finder.ch; stopFinder(); DB.input.channel = ch; E.midi.channel = ch; A.save(); A.toast('Canal ' + ch + ' enregistré'); add('appli', 'Canal des lumières réglé sur ' + ch); midiPanel(); };
        document.getElementById('dstop').onclick = () => { stopFinder(); fb.innerHTML = ''; };
        finder.ch++;
        finder.t = setTimeout(step, 1600);
      };
      step();
    }
    function stopFinder() { if (!finder) return; clearTimeout(finder.t); for (let ch = 1; ch <= 16; ch++) send(ch, false); finder = null; }
    A.onLeave(stopFinder);

    /* ---- panneau micro ---- */
    const kbox = document.getElementById('dmic');
    let raf = 0;
    function micPanel() {
      const m = E.mic;
      if (!m.running) {
        kbox.innerHTML = '<div class="help">' + (m.status === 'denied' ? 'L\'accès au micro a été refusé : autorisez-le dans les réglages du site de Chrome.' : m.supported ? 'Active le micro puis joue une note à la fois, assez fort.' : 'Ce navigateur ne permet pas d\'utiliser le micro.') + '</div>' +
          (m.supported ? '<button class="btn small" id="dmicgo" style="margin-top:10px">Activer le micro</button>' : '');
        const g = document.getElementById('dmicgo');
        if (g) g.onclick = async () => { g.disabled = true; E.sound.enabled = false; await m.start(); add('appli', 'Micro : ' + m.status); micPanel(); };
        return;
      }
      kbox.innerHTML = '<div class="readout"><div class="note" id="dnote">—</div><div><div class="label" id="dfreq">—</div><div class="sub" id="dcents">Joue une note</div></div></div>' +
        '<div style="margin-top:12px"><div class="between" style="margin-bottom:6px"><span class="label">Volume entendu</span><span class="help" id="dlvl"></span></div><div class="meter"><i id="dlvlbar"></i><b id="dfloor"></b></div></div>' +
        '<div class="row" style="flex-wrap:wrap;margin-top:12px"><button class="btn small ghost" id="dcal">Calibrer (2 s de silence)</button><button class="btn small ghost" id="dmicstop">Couper le micro</button></div>';
      document.getElementById('dcal').onclick = async (e) => { e.target.disabled = true; e.target.textContent = 'Silence…'; const f = await m.calibrate(2000); e.target.disabled = false; e.target.textContent = 'Calibrer (2 s de silence)'; add('appli', 'Micro calibré · seuil ' + f.toFixed(4)); };
      document.getElementById('dmicstop').onclick = () => { m.stop(); E.sound.enabled = true; cancelAnimationFrame(raf); micPanel(); };
      const note = document.getElementById('dnote'), freq = document.getElementById('dfreq'), cents = document.getElementById('dcents'), lvl = document.getElementById('dlvl'), bar = document.getElementById('dlvlbar'), fl = document.getElementById('dfloor');
      const scale = (v) => Math.min(100, Math.sqrt(v / 0.25) * 100);
      const tick = () => {
        if (!m.running) return;
        bar.style.width = scale(m.level) + '%'; fl.style.left = scale(m.floor) + '%';
        lvl.textContent = m.level > m.floor ? 'au-dessus du seuil' : 'sous le seuil (silence)';
        if (m.cur !== null) { note.textContent = E.name(m.cur); freq.textContent = Math.round(m.freq) + ' Hz · ' + MU.natName(m.cur); cents.textContent = (m.cents > 0 ? '+' : '') + m.cents + ' centièmes'; }
        raf = requestAnimationFrame(tick);
      };
      tick();
    }
    A.onLeave(() => { cancelAnimationFrame(raf); if (E.mic.running) E.mic.stop(); E.sound.enabled = true; });

    /* ---- sauvegarde ---- */
    document.getElementById('dexport').onclick = () => copy(JSON.stringify({ octave: BUILD, date: new Date().toISOString(), data: JSON.parse(localStorage.getItem('octave.v1') || '{}'), songs: JSON.parse(localStorage.getItem('octave.songs') || '[]') }), 'Progression copiée (avec tes morceaux) : colle-la dans une note ou un message');
    document.getElementById('dimport').onclick = () => { document.getElementById('dimp').hidden = false; };
    document.getElementById('dimpgo').onclick = () => A.gate(() => {
      try {
        const obj = JSON.parse(document.getElementById('dimptxt').value), data = obj.data || obj;
        if (!data || !Array.isArray(data.profiles)) throw new Error('format');
        localStorage.setItem('octave.v1', JSON.stringify(data));
        if (Array.isArray(obj.songs)) localStorage.setItem('octave.songs', JSON.stringify(obj.songs));
        A.toast('Progression restaurée'); setTimeout(() => location.reload(), 800);
      } catch (e) { A.toast('Ce texte n\'est pas une progression Octave'); }
    });

    if (E.midi.access) { attach(); E.midi.onchange = () => { attach(); midiPanel(); }; }
    midiPanel(); micPanel();
  }

  /* entrée « Diagnostic » ajoutée en bas des réglages */
  const settings = A.screens.reglages;
  A.screens.reglages = function () {
    settings.apply(this, arguments);
    const col = document.querySelector('.main .cols > .stack:last-child');
    if (!col) return;
    const card = document.createElement('div');
    card.innerHTML = '<div class="eyebrow">Tests et dépannage</div><div class="list"><a class="item" href="#diag" style="text-decoration:none"><span><span class="label">Diagnostic</span><br><span class="help">Câble MIDI, micro, lumières du Casio, sauvegarde</span></span>' + A.ICON.play + '</a></div>';
    const last = col.querySelector('.help:last-child');
    while (card.firstChild) col.insertBefore(card.firstChild, last);
    if (last) last.textContent = 'Octave · version ' + BUILD;
  };
  A.screens.diag = Diag;
  window.OctaveBuild = BUILD;
})();
