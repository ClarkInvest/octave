/* Écran de jeu : notes qui tombent + partition, modes Tranquille et Défi. */
(function () {
  'use strict';
  const A = window.App, E = window.Engine, M = window.Mascots, MU = window.Music;

  function Game(param) {
    const parts = String(param || '').split('-'), concert = parts[1] === 'concert';
    const song = MU.song(parts[0]) || MU.SONGS[0];
    const p = A.prof(), kid = A.isKid(), DB = A.DB;
    const st = { mode: concert ? 'defi' : (DB.input.gameMode || 'tranquille'), speed: DB.input.gameSpeed || 1, metro: DB.input.metro !== false };
    const back = A.prevHash && A.prevHash.indexOf('jeu') !== 0 ? '#' + A.prevHash : '#morceaux';

    /* tessiture du clavier : octaves entières autour du morceau */
    const ms = song.notes.map((n) => n.m);
    let lo = Math.min(...ms) - 2, hi = Math.max(...ms) + 2;
    lo = lo - (lo % 12); hi = hi + ((12 - (hi % 12)) % 12);
    if (hi - lo < 24) hi = lo + 24;
    const whites = []; for (let m = lo; m <= hi; m++) if (!E.isBlack(m)) whites.push(m);
    const ww = 100 / whites.length;
    const geo = {};
    whites.forEach((m, i) => { geo[m] = { x: i * ww, w: ww, black: false }; });
    for (let m = lo; m <= hi; m++) if (E.isBlack(m)) { const i = whites.indexOf(m - 1); geo[m] = { x: (i + 1) * ww - ww * 0.32, w: ww * 0.64, black: true }; }

    const groups = [];
    song.notes.forEach((n) => { const g = groups.length && groups[groups.length - 1].t === n.t ? groups[groups.length - 1] : null; if (g) g.notes.push(n); else groups.push({ t: n.t, notes: [n] }); });
    const clef = MU.clefFor(song.notes);

    A.shell('morceaux',
      '<div class="game">' +
      '<div class="g-top"><a href="' + back + '" class="icon-btn" aria-label="Retour">' + A.ICON.back + '</a>' +
        '<div class="g-title"><div class="eyebrow">' + (concert ? (kid ? 'Concert de fin de monde' : 'Concert · fin du monde') : A.esc(song.by) + ' · Niveau ' + song.level) + '</div><div class="h2">' + A.esc(song.title) + '</div></div>' +
        '<div class="g-ctrl"><div class="seg" role="group" aria-label="Mode de jeu"><button data-gm="tranquille">Tranquille</button><button data-gm="defi">Défi</button></div>' +
        '<div class="chip g-speed"><button class="icon-btn" id="slower" aria-label="Ralentir">−</button><span id="speed"></span><button class="icon-btn" id="faster" aria-label="Accélérer">+</button></div>' +
        '<button class="btn small ghost" id="listen">Écouter</button></div></div>' +
      '<div class="g-staff card" id="gstaff"></div>' +
      '<div class="g-area" id="garea"><canvas id="gcv"></canvas>' +
        '<div class="g-hud"><div class="g-prog"><i id="gprog"></i></div><div class="g-stats"><div><span class="eyebrow">Précision</span><b id="gacc">—</b></div><div><span class="eyebrow">Série</span><b id="gcombo" class="accent-text">0</b></div></div></div>' +
        '<div class="g-mascot" id="gmascot" style="color:var(--text)">' + M.svg(p.mascot) + '</div>' +
        '<div class="g-bubble" id="gbubble" hidden></div>' +
        '<button class="icon-btn g-pause" id="gpause" aria-label="Pause" hidden><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg></button>' +
        '<div class="g-overlay" id="gover"></div></div>' +
      '<div class="kbd-wrap g-kbd"><div class="kbd" id="gkbd" aria-label="Clavier"></div></div>' +
      '</div>');
    document.querySelector('.main').classList.add('main-game');

    /* clavier */
    const kbd = document.getElementById('gkbd'), keyEls = {};
    kbd.innerHTML = Object.keys(geo).map((m) => {
      const g = geo[m];
      return '<div class="' + (g.black ? 'b' : 'w') + '" data-m="' + m + '" style="left:calc(' + g.x + '% + ' + (g.black ? 0 : 1) + 'px);width:calc(' + g.w + '% - ' + (g.black ? 0 : 2) + 'px)">' + (!g.black && m % 12 === 0 ? E.name(m) : '') + '</div>';
    }).join('');
    kbd.querySelectorAll('[data-m]').forEach((el) => { keyEls[el.dataset.m] = el; });
    const ptr = new Map();
    kbd.addEventListener('pointerdown', (e) => {
      const el = e.target.closest('[data-m]'); if (!el) return;
      e.preventDefault(); try { kbd.setPointerCapture(e.pointerId); } catch (x) { /* ignoré */ }
      const m = +el.dataset.m; ptr.set(e.pointerId, m); E.sound.enabled = DB.input.source !== 'micro'; E.screen.down(m);
    });
    const up = (e) => { const m = ptr.get(e.pointerId); if (m !== undefined) { E.screen.up(m); ptr.delete(e.pointerId); } };
    kbd.addEventListener('pointerup', up); kbd.addEventListener('pointercancel', up);

    /* état du jeu */
    const cv = document.getElementById('gcv'), area = document.getElementById('garea'), ctx2 = cv.getContext('2d');
    const over = document.getElementById('gover');
    let run = null; /* { kind:'play'|'demo', beat, gi, ... } */
    let raf = 0, last = 0;
    const css = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
    const COL = { accent: css('--accent'), text: css('--text'), muted: css('--muted'), line: css('--line'), surf: css('--surf'), surf2: css('--surf2'), alt: css('--alt'), good: css('--good'), bad: css('--bad'), bg: css('--bg') };
    const spb = () => 60 / (song.tempo * st.speed);

    function fit() {
      const r = area.getBoundingClientRect(), dpr = window.devicePixelRatio || 1;
      cv.width = Math.round(r.width * dpr); cv.height = Math.round(r.height * dpr);
      cv.style.width = r.width + 'px'; cv.style.height = r.height + 'px';
      ctx2.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw();
    }
    const ro = new ResizeObserver(fit); ro.observe(area);
    A.onLeave(() => { ro.disconnect(); cancelAnimationFrame(raf); lightsOff(); A.stopInput(); E.sound.enabled = true; for (const m in keyEls) keyEls[m].classList.remove('on', 'target'); });

    function setControls() {
      document.querySelectorAll('[data-gm]').forEach((b) => b.setAttribute('aria-pressed', b.dataset.gm === st.mode));
      document.getElementById('speed').textContent = Math.round(st.speed * 100) + ' %';
    }
    document.querySelectorAll('[data-gm]').forEach((b) => b.onclick = () => { if (run && run.kind === 'play') return; st.mode = b.dataset.gm; DB.input.gameMode = st.mode; A.save(); setControls(); ready(); });
    document.getElementById('slower').onclick = () => { st.speed = Math.max(0.4, Math.round((st.speed - 0.1) * 10) / 10); DB.input.gameSpeed = st.speed; A.save(); setControls(); };
    document.getElementById('faster').onclick = () => { st.speed = Math.min(1.5, Math.round((st.speed + 0.1) * 10) / 10); DB.input.gameSpeed = st.speed; A.save(); setControls(); };
    document.getElementById('listen').onclick = () => { if (run && run.kind === 'demo') { stop(); ready(); } else startDemo(); };
    document.getElementById('gpause').onclick = () => { if (!run) return; run.paused = !run.paused; if (!run.paused) { last = performance.now(); over.innerHTML = ''; over.hidden = true; } else overlayPause(); };
    setControls();

    /* lumières du Casio */
    const lit = new Set();
    function lights(set) {
      if (!DB.input.lights) return;
      lit.forEach((m) => { if (!set.has(m)) { E.midi.light(m, false); lit.delete(m); } });
      set.forEach((m) => { if (!lit.has(m)) { E.midi.light(m, true); lit.add(m); } });
    }
    function lightsOff() { lit.forEach((m) => E.midi.light(m, false)); lit.clear(); }

    /* partition */
    let staffKey = '';
    function drawStaff(cur) {
      const k = cur + '|' + (run ? run.kind : '');
      if (k === staffKey) return; staffKey = k;
      const box = document.getElementById('gstaff'); if (!box) return;
      const H0 = 128, W0 = Math.max(420, Math.round(H0 * (box.clientWidth - 28) / Math.max(60, box.clientHeight - 12))), dx = 56, x0 = 90;
      const from = Math.max(0, cur - 1), to = Math.min(groups.length, from + Math.floor((W0 - x0) / dx));
      const notes = [];
      for (let gi = from; gi < to; gi++) groups[gi].notes.forEach((n) => notes.push({ m: n.m, d: n.d, x: x0 + (gi - from) * dx, color: gi < cur ? COL.muted : gi === cur ? COL.accent : COL.text, label: gi >= cur && gi < cur + 6 ? MU.natName(n.m) : '' }));
      box.innerHTML = MU.staff({ notes, clef, width: W0, height: H0, gap: 11, top: 34, cursorX: cur < groups.length ? x0 + (cur - from) * dx : 0, label: 'Partition' });
    }

    /* dessin des notes qui tombent */
    function draw() {
      const W = cv.clientWidth, H = cv.clientHeight; if (!W) return;
      ctx2.clearRect(0, 0, W, H);
      const kw = W * (100 / whites.length) / 100;
      ctx2.fillStyle = COL.line; ctx2.globalAlpha = 0.35;
      whites.forEach((m, i) => ctx2.fillRect(Math.round(i * kw), 0, 1, H));
      ctx2.globalAlpha = 1;
      const hitY = H - 6, ppb = Math.max(70, H / 4.2), beat = run ? run.beat : -1.5;
      ctx2.fillStyle = COL.accent; ctx2.fillRect(0, hitY, W, 3);
      const cur = run && run.kind === 'play' && st.mode === 'tranquille' ? run.gi : -1;
      song.notes.forEach((n) => {
        const yBottom = hitY - (n.t - beat) * ppb, h = Math.max(14, n.d * ppb - 6), y = yBottom - h;
        if (yBottom < -10 || y > H) return;
        const g = geo[n.m], x = g.x / 100 * W + (g.black ? 1 : 4), w = g.w / 100 * W - (g.black ? 2 : 8);
        let fill = kid ? COL.alt : COL.surf2, ink = kid ? '#FFFFFF' : COL.text, alpha = 1;
        if (n.hit) { fill = COL.good; alpha = 0.35; } else if (n.miss) { fill = COL.bad; alpha = 0.35; }
        else if ((cur >= 0 && groups[cur] && groups[cur].t === n.t) || (st.mode === 'defi' && run && Math.abs(n.t - beat) < 0.5)) { fill = COL.accent; ink = css('--on-accent'); }
        ctx2.globalAlpha = alpha; ctx2.fillStyle = fill;
        roundRect(ctx2, x, y, w, h, Math.min(12, w / 2.5)); ctx2.fill();
        if (!n.hit && !n.miss && fill !== COL.accent && !kid) { ctx2.strokeStyle = COL.line; ctx2.lineWidth = 1; ctx2.stroke(); }
        ctx2.globalAlpha = 1;
        if (h > 22 && w > 18 && !n.hit) { ctx2.fillStyle = ink; ctx2.font = '600 ' + (w > 34 ? 12 : 10) + 'px ' + (kid ? 'Rubik' : 'Inter') + ', sans-serif'; ctx2.textAlign = 'center'; ctx2.fillText(MU.natName(n.m), x + w / 2, yBottom - 8); }
      });
    }
    function roundRect(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }

    /* HUD et mascotte */
    function hud() {
      if (!run) return;
      document.getElementById('gprog').style.width = Math.min(100, Math.max(0, run.beat / song.length * 100)) + '%';
      const acc = accuracy(); document.getElementById('gacc').textContent = acc === null ? '—' : Math.round(acc * 100) + ' %';
      const c = document.getElementById('gcombo'); c.textContent = kid ? '×' + run.combo : run.combo;
    }
    let mascotT = 0;
    function react(mood, text) {
      const el = document.getElementById('gmascot'), b = document.getElementById('gbubble');
      if (!el) return;
      el.innerHTML = M.svg(p.mascot, mood); el.classList.remove('bounce', 'shake'); void el.offsetWidth; el.classList.add(mood === 'oops' ? 'shake' : 'bounce');
      if (text) { b.textContent = text; b.hidden = false; }
      clearTimeout(mascotT); mascotT = setTimeout(() => { el.innerHTML = M.svg(p.mascot); b.hidden = true; }, 1400);
    }
    const CHEERS = kid ? ['Énorme !', 'Trop fort !', 'Ça groove !', 'En feu !'] : ['Très bien', 'Bien joué', 'Régulier, continue', 'Joli'];

    function accuracy() {
      if (!run) return null;
      if (st.mode === 'tranquille') { const t = run.good + run.wrong; return t ? run.good / t : null; }
      const judged = song.notes.filter((n) => n.hit || n.miss); return judged.length ? judged.reduce((s, n) => s + (n.q || 0), 0) / judged.length : null;
    }

    /* déroulement */
    function reset() { song.notes.forEach((n) => { n.hit = false; n.miss = false; n.q = 0; }); }
    function ready() {
      stop(); reset(); staffKey = ''; drawStaff(0); draw();
      document.getElementById('gpause').hidden = true;
      const best = (p.songs || {})[song.id];
      over.hidden = false;
      over.innerHTML = '<div class="g-card"><div class="eyebrow">' + (st.mode === 'tranquille' ? 'Mode Tranquille' : 'Mode Défi') + '</div>' +
        '<div class="h2" style="margin:4px 0 8px">' + (st.mode === 'tranquille' ? 'La musique attend la bonne note' : 'Joue en rythme, avec le métronome') + '</div>' +
        '<div class="help">' + A.esc(song.desc) + (best ? ' Record : ' + stars(best.stars) + ' ' + best.acc + ' %.' : '') + '</div>' +
        (concert ? '<div class="help step-rule">Pour valider le concert : au moins 1 étoile en mode Défi. Tu peux ralentir le tempo avec − .</div>' : '') +
        (st.mode === 'defi' ? '<label class="row" style="margin-top:10px;font-size:14px"><input type="checkbox" id="gmetro"' + (st.metro ? ' checked' : '') + ' style="width:20px;height:20px;accent-color:var(--accent)"> Métronome</label>' : '') +
        '<button class="btn" id="ggo" style="margin-top:14px">' + A.ICON.play + (kid ? ' C\'est parti' : ' Jouer') + '</button>' +
        (DB.input.source !== 'ecran' && !A.inputOn() ? '<div class="help" style="margin-top:10px">Votre clavier n\'est pas connecté : <a href="#clavier">le connecter</a>, ou touchez le clavier à l\'écran.</div>' : '') + '</div>';
      const mt = document.getElementById('gmetro'); if (mt) mt.onchange = () => { st.metro = mt.checked; DB.input.metro = st.metro; A.save(); };
      document.getElementById('ggo').onclick = start;
    }
    function stop() { cancelAnimationFrame(raf); run = null; lightsOff(); for (const m in keyEls) keyEls[m].classList.remove('target', 'demo'); }
    async function start() {
      document.getElementById('ggo').disabled = true; await A.startInput(); if (!document.getElementById('gover')) return;
      reset(); over.hidden = true; over.innerHTML = '';
      run = { kind: 'play', beat: st.mode === 'defi' ? -4 : -1.5, gi: 0, good: 0, wrong: 0, combo: 0, best: 0, perfect: 0, okay: 0, missN: 0, paused: false, pressed: new Set(), lastTick: -5 };
      document.getElementById('gpause').hidden = false;
      last = performance.now(); loop(last);
    }
    function startDemo() {
      stop(); reset(); over.hidden = true; over.innerHTML = '';
      run = { kind: 'demo', beat: -1, gi: 0, combo: 0, good: 0, wrong: 0, paused: false, playing: new Set() };
      document.getElementById('listen').textContent = 'Arrêter';
      last = performance.now(); loop(last);
    }
    function loop(now) {
      raf = requestAnimationFrame(loop);
      if (!run || run.paused) return;
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      const db = dt / spb();
      if (run.kind === 'demo') stepDemo(db);
      else if (st.mode === 'tranquille') stepWait(db); else stepDefi(db);
      draw(); hud();
    }
    function stepDemo(db) {
      const prev = run.beat; run.beat += db;
      song.notes.forEach((n) => {
        if (n.t >= prev && n.t < run.beat) { E.sound.enabled = true; E.sound.play(n.m, 90); if (keyEls[n.m]) keyEls[n.m].classList.add('demo'); }
        const end = n.t + n.d * 0.9;
        if (end >= prev && end < run.beat) { E.sound.stop(n.m); if (keyEls[n.m]) keyEls[n.m].classList.remove('demo'); }
      });
      const gi = groups.findIndex((g) => g.t >= run.beat); drawStaff(gi < 0 ? groups.length : gi);
      if (run.beat > song.length + 1) { stop(); document.getElementById('listen').textContent = 'Écouter'; ready(); }
    }
    function stepWait(db) {
      const g = groups[run.gi];
      if (!g) { if ((run.beat += db) > song.length + 0.5) finish(); return; }
      run.beat = Math.min(g.t, run.beat + db);
      const near = g.t - run.beat < 0.6;
      lights(near ? new Set(g.notes.map((n) => n.m)) : new Set());
      for (const m in keyEls) keyEls[m].classList.toggle('target', near && g.notes.some((n) => n.m === +m));
      drawStaff(run.gi);
    }
    function stepDefi(db) {
      const prev = run.beat; run.beat += db;
      if (st.metro) { const tick = Math.floor(run.beat); if (tick > run.lastTick && run.beat >= 0 - 4) { run.lastTick = tick; if (run.beat < song.length) click(tick % 4 === 0); } }
      const win = 0.22 / spb();
      song.notes.forEach((n) => { if (!n.hit && !n.miss && run.beat > n.t + win) { n.miss = true; n.q = 0; run.missN++; if (run.combo >= 5) react('oops'); run.combo = 0; } });
      const soon = new Set(song.notes.filter((n) => !n.hit && !n.miss && n.t - run.beat < 1 && n.t - run.beat > -win).map((n) => n.m));
      lights(soon);
      for (const m in keyEls) keyEls[m].classList.toggle('target', soon.has(+m));
      const gi = groups.findIndex((gg) => gg.notes.some((n) => !n.hit && !n.miss)); drawStaff(gi < 0 ? groups.length : gi);
      if (run.beat > song.length + 1 && prev <= song.length + 1) finish();
    }
    function click(strong) {
      const c = E.audio(); if (!c) return;
      const t = c.currentTime, o = c.createOscillator(), g = c.createGain();
      o.frequency.value = strong ? 1600 : 1100; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(strong ? 0.12 : 0.07, t + 0.002); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
      o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + 0.06);
    }

    /* entrée des notes */
    const offInput = E.on((ev) => {
      if (ev.type === 'pedal') return;
      const el = keyEls[ev.midi]; if (el) el.classList.toggle('on', ev.type === 'on');
      if (ev.type !== 'on' || !run || run.kind !== 'play' || run.paused) return;
      if (st.mode === 'tranquille') {
        const g = groups[run.gi]; if (!g) return;
        if (g.t - run.beat > 0.6) return;
        if (g.notes.some((n) => n.m === ev.midi)) {
          run.pressed.add(ev.midi);
          if (g.notes.every((n) => run.pressed.has(n.m) || E.held.has(n.m))) {
            g.notes.forEach((n) => { n.hit = true; n.q = 1; });
            run.good += g.notes.length; run.combo++; run.best = Math.max(run.best, run.combo);
            run.gi++; run.pressed = new Set();
            if (run.combo % (kid ? 5 : 10) === 0) react('happy', CHEERS[Math.floor(Math.random() * CHEERS.length)]);
          }
        } else { run.wrong++; run.combo = 0; react('oops', kid ? 'Presque ! Regarde la touche qui brille' : null); }
      } else {
        const win = 0.22 / spb();
        let best = null, bd = 1e9;
        song.notes.forEach((n) => { if (!n.hit && !n.miss && n.m === ev.midi) { const d = Math.abs(n.t - run.beat); if (d < bd) { bd = d; best = n; } } });
        if (best && bd <= win) {
          const sec = bd * spb(); best.hit = true; best.q = sec < 0.08 ? 1 : 0.6;
          if (best.q === 1) run.perfect++; else run.okay++;
          run.combo++; run.best = Math.max(run.best, run.combo);
          if (run.combo % (kid ? 5 : 10) === 0) react('happy', CHEERS[Math.floor(Math.random() * CHEERS.length)]);
        } else { run.wrong++; run.combo = 0; }
      }
    });
    A.onLeave(offInput);

    const stars = (n) => '★★★'.slice(0, n) + '☆☆☆'.slice(0, 3 - n);
    function overlayPause() {
      over.hidden = false;
      over.innerHTML = '<div class="g-card"><div class="h2">Pause</div><div class="row" style="margin-top:14px"><button class="btn" id="gres">' + A.ICON.play + ' Reprendre</button><button class="btn ghost" id="grst">Recommencer</button></div></div>';
      document.getElementById('gres').onclick = () => { run.paused = false; last = performance.now(); over.hidden = true; over.innerHTML = ''; };
      document.getElementById('grst').onclick = ready;
    }
    function finish() {
      const r = run; stop();
      document.getElementById('gpause').hidden = true;
      const acc = Math.round((st.mode === 'tranquille' ? (r.good + r.wrong ? r.good / (r.good + r.wrong) : 0) : song.notes.reduce((s, n) => s + (n.q || 0), 0) / song.notes.length) * 100);
      const nStars = acc >= 95 ? 3 : acc >= 80 ? 2 : acc >= 60 ? 1 : 0;
      p.songs = p.songs || {};
      const prev = p.songs[song.id], record = !prev || nStars > prev.stars || (nStars === prev.stars && acc > prev.acc);
      if (record) p.songs[song.id] = { stars: nStars, acc, mode: st.mode };
      let coins = 0; if (kid) { coins = nStars * 10 + (st.mode === 'defi' ? 5 : 0); p.coins += coins; }
      A.save();
      const res = window.Path ? window.Path.report('morceau', song.id, { stars: nStars, mode: st.mode }) : null;
      const detail = st.mode === 'tranquille' ? r.good + ' notes justes · ' + r.wrong + ' fausses · meilleure série ' + r.best
        : r.perfect + ' parfaites · ' + r.okay + ' bien · ' + r.missN + ' ratées · meilleure série ' + r.best;
      over.hidden = false;
      over.innerHTML = '<div class="g-card"><div class="g-res-mascot" style="color:var(--text)">' + M.svg(p.mascot, nStars >= 2 ? 'happy' : 'idle') + '</div>' +
        '<div class="g-stars" aria-label="' + nStars + ' étoiles sur 3">' + stars(nStars) + '</div>' +
        '<div class="h1" style="font-size:44px">' + acc + ' %</div><div class="help">' + detail + (coins ? ' · +' + coins + ' pièces' : '') + (record ? ' · nouveau record' : '') + '</div>' +
        (res ? '<div class="g-next">' + window.Path.resultHtml(res) + '</div>' : '') +
        '<div class="row" style="margin-top:12px;justify-content:center;flex-wrap:wrap"><button class="btn' + (res && res.passed ? ' ghost' : '') + '" id="gagain">Rejouer</button><a class="btn ghost" href="' + back + '">' + (back === '#morceaux' ? 'Autres morceaux' : 'Retour') + '</a></div></div>';
      document.getElementById('gagain').onclick = ready;
      if (nStars >= 2) react('happy', kid ? 'Quelle star !' : 'Belle interprétation');
    }

    ready();
  }

  /* ---------- Écran : morceaux ---------- */
  function Songs() {
    const p = A.prof(), kid = A.isKid(), mine = p.songs || {};
    const kinds = { exercice: 'Exercice', chanson: 'Chanson', classique: 'Classique', groove: 'Groove' };
    const card = (s) => {
      const b = mine[s.id];
      return '<a class="song" href="#jeu-' + s.id + '"><div class="song-art" data-kind="' + s.kind + '">' + MU.staff({ notes: s.notes.slice(0, 6).map((n, i) => ({ m: n.m, d: n.d, x: 46 + i * 28 })), clef: MU.clefFor(s.notes), width: 220, height: 92, gap: 7, top: 30, clefShown: true, label: 'Début de ' + s.title }) + '</div>' +
        '<div class="song-body"><div class="between"><span class="eyebrow">' + kinds[s.kind] + ' · Niv. ' + s.level + '</span><span class="song-stars" aria-label="' + (b ? b.stars : 0) + ' étoiles">' + (b ? '★★★'.slice(0, b.stars) + '☆☆☆'.slice(0, 3 - b.stars) : '☆☆☆') + '</span></div>' +
        '<div class="label" style="font-size:16px">' + A.esc(s.title) + '</div><div class="help">' + A.esc(s.by) + '</div></div></a>';
    };
    A.shell('morceaux', A.header() + '<h1 class="h1">Morceaux</h1>' +
      '<div class="help">' + (kid ? 'Choisis un morceau. Commence en Tranquille, puis tente le Défi !' : 'Commencez en mode Tranquille : la musique attend la bonne note. Passez en Défi pour jouer en rythme.') + '</div>' +
      '<div class="songs">' + MU.SONGS.map(card).join('') + '</div>' +
      '<div class="soon">Bientôt : l\'import de vos propres fichiers MIDI, et la main gauche.</div>');
  }

  A.screens.jeu = Game;
  A.screens.morceaux = Songs;
})();
