/* Écran de jeu : notes qui tombent + partition, modes Tranquille et Défi. */
(function () {
  'use strict';
  const A = window.App, E = window.Engine, M = window.Mascots, MU = window.Music;

  function Game(param) {
    const parts = String(param || '').split('-'), concert = parts[1] === 'concert';
    const song = MU.hands(MU.song(parts[0]) || MU.SONGS[0]);
    const p = A.prof(), kid = A.isKid(), DB = A.DB;
    const st = { mode: concert ? 'defi' : (DB.input.gameMode || 'tranquille'), speed: DB.input.gameSpeed || 1, metro: DB.input.metro !== false };
    const back = A.prevHash && A.prevHash.indexOf('jeu') !== 0 ? '#' + A.prevHash : '#morceaux';
    const micro = () => DB.input.source === 'micro';

    /* mesures */
    const both = MU.hasBoth(song), bar = song.bar || 4, pickup = song.pickup || 0;
    const measureOf = (t) => (t < pickup - 1e-6 ? 0 : Math.floor((t - pickup) / bar + 1e-6) + 1);
    const totalBars = Math.max(1, measureOf(Math.max(0, song.length - 0.001)));
    const barStart = (k) => (k <= 1 ? 0 : pickup + (k - 1) * bar);

    /* réglages de travail, gardés par joueur et par morceau */
    p.practice = p.practice || {};
    const pr = Object.assign({ hand: 'tout', from: 1, to: totalBars, loop: false, ramp: false }, concert ? {} : p.practice[song.id] || {});
    if (!both) pr.hand = 'tout';
    pr.from = Math.max(1, Math.min(totalBars, pr.from)); pr.to = Math.max(pr.from, Math.min(totalBars, pr.to || totalBars));
    const practicing = () => pr.from > 1 || pr.to < totalBars || pr.hand !== 'tout';
    const savePr = () => { p.practice[song.id] = { hand: pr.hand, from: pr.from, to: pr.to, loop: pr.loop, ramp: pr.ramp }; A.save(); };

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

    /* passage joué : notes du passage, celles de l'autre main sont jouées par l'appli (auto) */
    let view = [], groups = [], sgroups = [], vlen = 0, t0 = 0;
    function build() {
      t0 = barStart(pr.from); const t1 = pickup + pr.to * bar;
      const mine = pr.hand === 'droite' ? 'd' : pr.hand === 'gauche' ? 'g' : null;
      view = song.notes.filter((n) => n.t >= t0 - 1e-6 && n.t < t1 - 1e-6).map((n) => ({ m: n.m, t: +(n.t - t0).toFixed(4), d: n.d, h: n.h, auto: !!mine && n.h !== mine }));
      vlen = view.reduce((a, n) => Math.max(a, n.t + n.d), 0);
      const group = (list) => { const out = []; list.forEach((n) => { const g = out.length && Math.abs(out[out.length - 1].t - n.t) < 1e-6 ? out[out.length - 1] : null; if (g) g.notes.push(n); else out.push({ t: n.t, notes: [n] }); }); return out; };
      groups = group(view.filter((n) => !n.auto)); sgroups = group(view);
    }
    build();

    A.shell('morceaux',
      '<div class="game">' +
      '<div class="g-top"><a href="' + back + '" class="icon-btn" aria-label="Retour">' + A.ICON.back + '</a>' +
        '<div class="g-title"><div class="eyebrow">' + (concert ? (kid ? 'Concert de fin de monde' : 'Concert · fin du monde') : A.esc(song.by) + ' · Niveau ' + song.level) + '</div><div class="h2">' + A.esc(song.title) + '</div><div class="g-work" id="gwork" hidden></div></div>' +
        '<div class="g-ctrl"><div class="seg" role="group" aria-label="Mode de jeu"><button data-gm="tranquille">Tranquille</button><button data-gm="defi">Défi</button></div>' +
        '<div class="chip g-speed"><button class="icon-btn" id="slower" aria-label="Ralentir">−</button><span id="speed"></span><button class="icon-btn" id="faster" aria-label="Accélérer">+</button></div>' +
        '<button class="btn small ghost" id="listen">Écouter</button></div></div>' +
      '<div class="g-staff card' + (both ? ' grand' : '') + '" id="gstaff"></div>' +
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
      const m = +el.dataset.m; ptr.set(e.pointerId, m); E.sound.enabled = !micro(); E.screen.down(m);
    });
    const up = (e) => { const m = ptr.get(e.pointerId); if (m !== undefined) { E.screen.up(m); ptr.delete(e.pointerId); } };
    kbd.addEventListener('pointerup', up); kbd.addEventListener('pointercancel', up);

    /* état du jeu */
    const cv = document.getElementById('gcv'), area = document.getElementById('garea'), ctx2 = cv.getContext('2d');
    const over = document.getElementById('gover');
    /* les cartes (départ, pause, résultat) couvrent le jeu, mais laissent visibles le titre, le mode, la vitesse et « Écouter » */
    function placeOver() {
      const top = document.querySelector('.g-top'), game = document.querySelector('.game'); if (!top || !game) return;
      const r = top.getBoundingClientRect(), g = game.getBoundingClientRect();
      over.style.top = Math.max(0, Math.round(r.bottom + 8)) + 'px'; over.style.left = Math.round(g.left) + 'px'; over.style.right = Math.max(0, Math.round(window.innerWidth - g.right)) + 'px';
    }
    window.addEventListener('resize', placeOver); A.onLeave(() => window.removeEventListener('resize', placeOver));
    let run = null; /* { kind:'play'|'demo', beat, gi, ... } */
    let raf = 0, last = 0;
    const css = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
    const COL = { accent: css('--accent'), text: css('--text'), muted: css('--muted'), line: css('--line'), surf: css('--surf'), surf2: css('--surf2'), alt: css('--alt'), good: css('--good'), bad: css('--bad'), bg: css('--bg') };
    const spb = () => 60 / (song.tempo * st.speed);
    /* Défi : fenêtres de justesse rythmique (secondes) et retard propre à chaque entrée.
       Le micro entend la note un peu après qu'on l'a jouée (analyse du son) : on le compense,
       et ce retard se règle tout seul d'une partie à l'autre. */
    const WIN = { perfect: 0.075, good: 0.15, ok: kid ? 0.32 : 0.27, late: 0.5 };
    const LAT0 = { micro: 0.13, midi: 0.02, ecran: 0.04 };
    const lat = () => { const l = DB.input.lat || {}; return typeof l[DB.input.source] === 'number' ? l[DB.input.source] : LAT0[DB.input.source] || 0; };

    function fit() {
      const r = area.getBoundingClientRect(), dpr = window.devicePixelRatio || 1;
      cv.width = Math.round(r.width * dpr); cv.height = Math.round(r.height * dpr);
      cv.style.width = r.width + 'px'; cv.style.height = r.height + 'px';
      ctx2.setTransform(dpr, 0, 0, dpr, 0, 0);
      staffKey = ''; drawStaff(staffCur); draw(); placeOver();
    }
    const ro = new ResizeObserver(fit); ro.observe(area);
    A.onLeave(() => { ro.disconnect(); cancelAnimationFrame(raf); lightsOff(); autoOff(); A.stopInput(); E.sound.enabled = true; for (const m in keyEls) keyEls[m].classList.remove('on', 'target', 'demo'); });

    function setControls() {
      document.querySelectorAll('[data-gm]').forEach((b) => b.setAttribute('aria-pressed', b.dataset.gm === st.mode));
      document.getElementById('speed').textContent = Math.round(st.speed * 100) + ' %';
      const w = document.getElementById('gwork');
      const bits = [];
      if (pr.hand !== 'tout') bits.push(pr.hand === 'droite' ? 'Main droite' : 'Main gauche');
      if (pr.from > 1 || pr.to < totalBars) bits.push(pr.from === pr.to ? 'mesure ' + pr.from : 'mesures ' + pr.from + ' à ' + pr.to);
      if (pr.loop) bits.push(pr.ramp ? 'en boucle, vitesse qui monte' : 'en boucle');
      w.hidden = !bits.length; w.textContent = bits.join(' · ');
    }
    const setSpeed = (v) => { st.speed = Math.max(0.4, Math.min(1.5, Math.round(v * 100) / 100)); DB.input.gameSpeed = st.speed; A.save(); setControls(); };
    document.querySelectorAll('[data-gm]').forEach((b) => b.onclick = () => { if (run && run.kind === 'play') return; st.mode = b.dataset.gm; DB.input.gameMode = st.mode; A.save(); setControls(); ready(); });
    document.getElementById('slower').onclick = () => setSpeed(st.speed - 0.1);
    document.getElementById('faster').onclick = () => setSpeed(st.speed + 0.1);
    document.getElementById('listen').onclick = () => { if (run && run.kind === 'demo') { stop(); ready(); } else startDemo(); };
    document.getElementById('gpause').onclick = () => { if (!run) return; run.paused = !run.paused; if (!run.paused) { last = performance.now(); over.innerHTML = ''; over.hidden = true; } else { autoOff(); overlayPause(); } };
    setControls();

    /* lumières du Casio */
    const lit = new Set();
    function lights(set) {
      if (!DB.input.lights) return;
      lit.forEach((m) => { if (!set.has(m)) { E.midi.light(m, false); lit.delete(m); } });
      set.forEach((m) => { if (!lit.has(m)) { E.midi.light(m, true); lit.add(m); } });
    }
    function lightsOff() { lit.forEach((m) => E.midi.light(m, false)); lit.clear(); }

    /* l'autre main, jouée par l'appli (muette avec le micro, pour ne pas fausser l'écoute) */
    const sounding = new Set();
    function autoPlay(from, to) {
      if (to <= from) return;
      view.forEach((n) => {
        if (!n.auto) return;
        if (n.t >= from && n.t < to) { if (!micro()) { E.sound.enabled = true; E.sound.play(n.m, 70); sounding.add(n.m); } if (keyEls[n.m]) keyEls[n.m].classList.add('demo'); }
        const end = n.t + n.d * 0.92;
        if (end >= from && end < to) { if (sounding.has(n.m)) { E.sound.stop(n.m); sounding.delete(n.m); } if (keyEls[n.m]) keyEls[n.m].classList.remove('demo'); }
      });
    }
    function autoOff() { sounding.forEach((m) => E.sound.stop(m)); sounding.clear(); for (const m in keyEls) keyEls[m].classList.remove('demo'); }

    /* partition : toutes les notes du passage (celles de l'autre main en gris), barres de mesure numérotées */
    let staffKey = '', staffCur = 0;
    function drawStaff(curT) {
      const ci = sgroups.findIndex((g) => g.t >= curT - 1e-6), cur = ci < 0 ? sgroups.length : ci;
      staffCur = curT;
      const k = cur + '|' + (run ? run.kind : '');
      if (k === staffKey) return; staffKey = k;
      const box = document.getElementById('gstaff'); if (!box) return;
      const H0 = both ? 196 : 128, W0 = Math.max(420, Math.round(H0 * (box.clientWidth - 28) / Math.max(60, box.clientHeight - 12))), dx = 56, x0 = both ? 104 : 90;
      const from = Math.max(0, cur - 1), to = Math.min(sgroups.length, from + Math.floor((W0 - x0) / dx));
      const notes = [], bars = [];
      for (let gi = from; gi < to; gi++) {
        const g = sgroups[gi], x = x0 + (gi - from) * dx;
        /* un nom par main et par accord : la note la plus grave */
        const lowOf = (h) => { const ns = g.notes.filter((n) => !n.auto && (!both || n.h === h)); return ns.length ? Math.min.apply(null, ns.map((n) => n.m)) : null; };
        const low = { d: lowOf('d'), g: lowOf('g') };
        g.notes.forEach((n) => notes.push({ m: n.m, d: n.d, h: n.h, x,
          color: gi < cur || n.auto ? COL.muted : gi === cur ? COL.accent : COL.text,
          label: !n.auto && gi >= cur && gi < cur + 6 && n.m === (both ? low[n.h] : low.d) ? MU.natName(n.m) : '' }));
        if (gi > 0) { const a = measureOf(sgroups[gi - 1].t + t0), b = measureOf(g.t + t0); if (b !== a) bars.push({ x: x - dx / 2, n: b }); }
      }
      const cursorX = cur < sgroups.length ? x0 + (cur - from) * dx : 0;
      box.innerHTML = both
        ? MU.staff({ notes, grand: true, width: W0, height: H0, gap: 10, top: 30, sep: 52, bars, cursorX, label: 'Partition à deux mains' })
        : MU.staff({ notes, clef: MU.clefFor(song.notes), width: W0, height: H0, gap: 11, top: 34, bars, cursorX, label: 'Partition' });
    }

    /* dessin des notes qui tombent */
    function draw() {
      const W = cv.clientWidth, H = cv.clientHeight; if (!W) return;
      ctx2.clearRect(0, 0, W, H);
      const kw = W * (100 / whites.length) / 100;
      ctx2.fillStyle = COL.line; ctx2.globalAlpha = 0.35;
      whites.forEach((m, i) => ctx2.fillRect(Math.round(i * kw), 0, 1, H));
      const hitY = H - 6, ppb = Math.max(70, H / 4.2), beat = run ? run.beat : -1.5;
      /* débuts de mesure */
      ctx2.font = '600 10px Inter, sans-serif'; ctx2.textAlign = 'left';
      for (let k = pr.from; k <= pr.to + 1; k++) {
        const y = hitY - (barStart(k) - t0 - beat) * ppb; if (y < 0 || y > hitY - 4) continue;
        ctx2.globalAlpha = 0.28; ctx2.fillStyle = COL.muted; ctx2.fillRect(0, Math.round(y), W, 1);
        if (k <= pr.to) { ctx2.globalAlpha = 0.7; ctx2.fillText(String(k), 4, y - 3); }
      }
      ctx2.globalAlpha = 1;
      ctx2.fillStyle = COL.accent; ctx2.fillRect(0, hitY, W, 3);
      if (run && run.fxs) {
        const now = performance.now();
        run.fxs = run.fxs.filter((f) => now - f.t < 700);
        ctx2.textAlign = 'center'; ctx2.font = '700 13px ' + (kid ? 'Rubik' : 'Inter') + ', sans-serif';
        run.fxs.forEach((f) => {
          const g = geo[f.m]; if (!g) return;
          const k = (now - f.t) / 700, x = (g.x + g.w / 2) / 100 * W;
          ctx2.globalAlpha = 1 - k; ctx2.fillStyle = f.kind === 'good' ? COL.good : f.kind === 'bad' ? COL.bad : COL.muted;
          ctx2.fillText(f.text, Math.max(40, Math.min(W - 40, x)), hitY - 26 - k * 22);
        });
        ctx2.globalAlpha = 1;
      }
      const cur = run && run.kind === 'play' && st.mode === 'tranquille' ? run.gi : -1;
      const curT = cur >= 0 && groups[cur] ? groups[cur].t : null;
      view.forEach((n) => {
        const sit = curT !== null && !n.auto && !n.hit && n.t <= beat && Math.abs(curT - n.t) < 1e-6; /* note attendue : posée sur la ligne */
        const yBottom = sit ? hitY : hitY - (n.t - beat) * ppb, h = Math.max(14, n.d * ppb - 6), y = yBottom - h;
        if (yBottom < -10 || y > H) return;
        const g = geo[n.m], x = g.x / 100 * W + (g.black ? 1 : 4), w = g.w / 100 * W - (g.black ? 2 : 8);
        if (n.auto) {
          ctx2.globalAlpha = 0.45; ctx2.strokeStyle = COL.muted; ctx2.lineWidth = 1.5; ctx2.setLineDash([4, 3]);
          roundRect(ctx2, x, y, w, h, Math.min(12, w / 2.5)); ctx2.stroke(); ctx2.setLineDash([]); ctx2.globalAlpha = 1;
          return;
        }
        let fill = kid ? COL.alt : COL.surf2, ink = kid ? '#FFFFFF' : COL.text, alpha = 1;
        if (n.hit) { fill = COL.good; alpha = 0.35; } else if (n.miss) { fill = COL.bad; alpha = 0.35; }
        else if ((curT !== null && Math.abs(curT - n.t) < 1e-6) || (st.mode === 'defi' && run && Math.abs(n.t - beat) < 0.5)) { fill = COL.accent; ink = css('--on-accent'); }
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
      document.getElementById('gprog').style.width = Math.min(100, Math.max(0, run.beat / Math.max(0.1, vlen) * 100)) + '%';
      const acc = accuracy(); document.getElementById('gacc').textContent = acc === null ? '—' : Math.round(acc * 100) + ' %';
      const c = document.getElementById('gcombo'); c.textContent = kid ? '×' + run.combo : run.combo;
    }
    let mascotT = 0;
    function react(mood, text) {
      const el = document.getElementById('gmascot'), b = document.getElementById('gbubble');
      if (!el) return;
      el.innerHTML = M.svg(p.mascot, mood); el.classList.remove('bounce', 'shake'); void el.offsetWidth; el.classList.add(mood === 'oops' ? 'shake' : 'bounce');
      if (text) { b.textContent = text; b.hidden = false; }
      clearTimeout(mascotT); mascotT = setTimeout(() => { el.innerHTML = M.svg(p.mascot); b.hidden = true; }, text && text.length > 18 ? 2400 : 1400);
    }
    const CHEERS = kid ? ['Énorme !', 'Trop fort !', 'Ça groove !', 'En feu !'] : ['Très bien', 'Bien joué', 'Régulier, continue', 'Joli'];

    const own = () => view.filter((n) => !n.auto);
    function passAcc(r) {
      if (st.mode === 'tranquille') { const t = r.good + r.wrong; return t ? r.good / t : 0; }
      const ns = own(); return ns.length ? ns.reduce((s, n) => s + (n.q || 0), 0) / ns.length : 0;
    }
    function accuracy() {
      if (!run) return null;
      if (st.mode === 'tranquille') { const t = run.good + run.wrong; return t ? run.good / t : null; }
      const judged = own().filter((n) => n.hit || n.miss); return judged.length ? judged.reduce((s, n) => s + (n.q || 0), 0) / judged.length : null;
    }

    /* panneau « Travailler » : main, passage, boucle */
    function workPanel() {
      const open = practicing() || pr.loop;
      const seg = (key, val, label) => '<button data-' + key + '="' + val + '" aria-pressed="' + (pr[key === 'ph' ? 'hand' : key] === val) + '">' + label + '</button>';
      return '<details class="g-workbox"' + (open ? ' open' : '') + '><summary><span class="label">' + (kid ? 'S\'entraîner sur un bout' : 'Travailler') + '</span><span class="help">' + (both ? 'main par main, ' : '') + 'un passage, en boucle</span></summary>' +
        (both ? '<div class="label">Main</div><div class="seg" role="group" aria-label="Main à jouer">' + seg('ph', 'tout', 'Les deux') + seg('ph', 'droite', 'Droite') + seg('ph', 'gauche', 'Gauche') + '</div>' +
          (pr.hand !== 'tout' ? '<div class="help">' + (micro() ? 'L\'autre main s\'affiche en pointillés. Avec le micro, l\'appli ne la joue pas, pour ne pas fausser l\'écoute.' : 'L\'appli joue l\'autre main pour vous (en pointillés).') + '</div>' : '') : '') +
        '<div class="label">Passage</div><div class="row g-bars"><span class="help">Mesures</span><button class="icon-btn" data-bar="from:-1" aria-label="Commencer une mesure plus tôt">−</button><b id="gfrom">' + pr.from + '</b><button class="icon-btn" data-bar="from:1" aria-label="Commencer une mesure plus tard">+</button>' +
          '<span class="help">à</span><button class="icon-btn" data-bar="to:-1" aria-label="Finir une mesure plus tôt">−</button><b id="gto">' + pr.to + '</b><button class="icon-btn" data-bar="to:1" aria-label="Finir une mesure plus tard">+</button><span class="help">sur ' + totalBars + '</span></div>' +
        '<div class="between"><div><div class="label">En boucle</div><div class="help">Le passage recommence tout seul. Pause, puis « Terminer » pour arrêter.</div></div><button class="switch" role="switch" id="gloop" aria-label="En boucle" aria-checked="' + pr.loop + '"></button></div>' +
        (pr.loop ? '<div class="between"><div><div class="label">Vitesse qui monte</div><div class="help">+5 % à chaque tour réussi à 90 %, jusqu\'à 100 %. Pensez à baisser la vitesse avant de commencer.</div></div><button class="switch" role="switch" id="gramp" aria-label="Vitesse qui monte" aria-checked="' + pr.ramp + '"></button></div>' : '') +
        (practicing() || pr.loop ? '<button class="btn small ghost" id="gall" style="align-self:flex-start">Revenir au morceau entier</button>' : '') +
        (practicing() ? '<div class="help">En mode travail, les records et le parcours ne sont pas mis à jour : jouez le morceau entier pour ça.</div>' : '') +
        '</details>';
    }
    function bindWork() {
      const changed = () => { savePr(); build(); setControls(); ready(true); };
      over.querySelectorAll('[data-ph]').forEach((b) => b.onclick = () => { pr.hand = b.dataset.ph; changed(); });
      over.querySelectorAll('[data-bar]').forEach((b) => b.onclick = () => {
        const [k, d] = b.dataset.bar.split(':'); pr[k] = Math.max(1, Math.min(totalBars, pr[k] + +d));
        if (k === 'from' && pr.to < pr.from) pr.to = pr.from; if (k === 'to' && pr.from > pr.to) pr.from = pr.to;
        changed();
      });
      const lp = document.getElementById('gloop'); if (lp) lp.onclick = () => { pr.loop = !pr.loop; changed(); };
      const rp = document.getElementById('gramp'); if (rp) rp.onclick = () => { pr.ramp = !pr.ramp; if (pr.ramp && st.speed >= 1) setSpeed(0.7); changed(); };
      const all = document.getElementById('gall'); if (all) all.onclick = () => { pr.hand = 'tout'; pr.from = 1; pr.to = totalBars; pr.loop = false; pr.ramp = false; changed(); };
    }

    /* déroulement */
    function reset() { view.forEach((n) => { n.hit = false; n.miss = false; n.q = 0; }); }
    function ready(keepScroll) {
      const sc = keepScroll ? over.scrollTop : 0;
      stop(); reset(); staffKey = ''; drawStaff(0); draw();
      document.getElementById('gpause').hidden = true;
      const best = (p.songs || {})[song.id];
      const empty = !groups.length;
      over.hidden = false; placeOver();
      over.innerHTML = '<div class="g-card"><div class="eyebrow">' + (st.mode === 'tranquille' ? 'Mode Tranquille' : 'Mode Défi') + '</div>' +
        '<div class="h2" style="margin:4px 0 8px">' + (st.mode === 'tranquille' ? 'La musique attend la bonne note' : 'Joue en rythme, avec le métronome') + '</div>' +
        '<div class="help">' + A.esc(song.desc) + (best ? ' Record : ' + stars(best.stars) + ' ' + best.acc + ' %.' : '') + '</div>' +
        (concert ? '<div class="help step-rule">Pour valider le concert : au moins 1 étoile en mode Défi. Tu peux ralentir le tempo avec − .</div>' : '') +
        (st.mode === 'defi' ? '<label class="row" style="margin-top:10px;font-size:14px"><input type="checkbox" id="gmetro"' + (st.metro ? ' checked' : '') + ' style="width:20px;height:20px;accent-color:var(--accent)"> Métronome</label>' : '') +
        (empty ? '<div class="help step-rule">Rien à jouer pour cette main dans ce passage : choisissez l\'autre main ou d\'autres mesures.</div>' : '') +
        '<button class="btn" id="ggo" style="margin-top:14px"' + (empty ? ' disabled' : '') + '>' + A.ICON.play + (kid ? ' C\'est parti' : ' Jouer') + '</button>' +
        (DB.input.source !== 'ecran' && !A.inputOn() ? '<div class="help" style="margin-top:10px">Votre clavier n\'est pas connecté : <a href="#clavier">le connecter</a>, ou touchez le clavier à l\'écran.</div>' : '') +
        (concert ? '' : workPanel()) + '</div>';
      const mt = document.getElementById('gmetro'); if (mt) mt.onchange = () => { st.metro = mt.checked; DB.input.metro = st.metro; A.save(); };
      document.getElementById('ggo').onclick = start;
      bindWork();
      if (sc) over.scrollTop = sc;
    }
    function stop() { cancelAnimationFrame(raf); run = null; lightsOff(); autoOff(); for (const m in keyEls) keyEls[m].classList.remove('target', 'demo'); }
    const startBeat = () => (st.mode === 'defi' ? -Math.max(4, bar) : -1.5);
    async function start() {
      document.getElementById('ggo').disabled = true; await A.startInput(); if (!document.getElementById('gover')) return;
      reset(); over.hidden = true; over.innerHTML = '';
      run = { kind: 'play', beat: startBeat(), autoBeat: startBeat(), gi: 0, good: 0, wrong: 0, combo: 0, best: 0, perfect: 0, okay: 0, close: 0, lateN: 0, missN: 0, offs: [], fxs: [], paused: false, pressed: new Set(), lastTick: -99, pass: 1, passes: [] };
      document.getElementById('gpause').hidden = false;
      last = performance.now(); loop(last);
    }
    function startDemo() {
      stop(); reset(); over.hidden = true; over.innerHTML = '';
      run = { kind: 'demo', beat: -1, gi: 0, combo: 0, good: 0, wrong: 0, paused: false };
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
      if (run) { draw(); hud(); }
    }
    function stepDemo(db) {
      const prev = run.beat; run.beat += db;
      view.forEach((n) => {
        if (n.t >= prev && n.t < run.beat) { E.sound.enabled = true; E.sound.play(n.m, n.auto ? 70 : 90); if (keyEls[n.m]) keyEls[n.m].classList.add('demo'); }
        const end = n.t + n.d * 0.9;
        if (end >= prev && end < run.beat) { E.sound.stop(n.m); if (keyEls[n.m]) keyEls[n.m].classList.remove('demo'); }
      });
      drawStaff(run.beat);
      if (run.beat > vlen + 1) { stop(); document.getElementById('listen').textContent = 'Écouter'; ready(); }
    }
    /* tolérance : la note peut dépasser un peu la ligne avant que la musique s'arrête,
       pour qu'une note jouée pile à temps (ou captée avec le léger retard du micro) ne casse pas le tempo */
    function grace(gi) {
      const g = groups[gi], nx = groups[gi + 1];
      const sec = micro() ? 0.35 : 0.2;
      return Math.min(sec / spb(), 0.5, nx ? (nx.t - g.t) * 0.5 : 0.5);
    }
    function stepWait(db) {
      const g = groups[run.gi];
      if (!g) {
        run.beat += db; autoPlay(run.autoBeat, run.beat); run.autoBeat = run.beat;
        if (run.beat > vlen + 0.5) endPass();
        return;
      }
      run.beat = Math.min(g.t + grace(run.gi), run.beat + db);
      /* l'autre main avance avec la musique, mais attend elle aussi la note à jouer */
      const upto = Math.min(run.beat, g.t - 1e-4); autoPlay(run.autoBeat, upto); run.autoBeat = Math.max(run.autoBeat, upto);
      const near = g.t - run.beat < 0.6;
      lights(near ? new Set(g.notes.map((n) => n.m)) : new Set());
      for (const m in keyEls) keyEls[m].classList.toggle('target', near && g.notes.some((n) => n.m === +m));
      drawStaff(g.t);
    }
    function stepDefi(db) {
      const prev = run.beat; run.beat += db;
      autoPlay(prev, run.beat);
      if (st.metro) { const tick = Math.floor(run.beat); if (tick > run.lastTick) { run.lastTick = tick; if (run.beat < vlen) click(((tick - (pickup && pr.from <= 1 ? pickup : 0)) % bar + bar) % bar === 0); } }
      const win = WIN.ok / spb(), wait = (WIN.ok + lat()) / spb();
      view.forEach((n) => { if (!n.auto && !n.hit && !n.miss && run.beat > n.t + wait) { n.miss = true; n.missAt = run.beat; n.q = 0; run.missN++; if (run.combo >= 5) react('oops'); run.combo = 0; } });
      const soon = new Set(view.filter((n) => !n.auto && !n.hit && !n.miss && n.t - run.beat < 1 && n.t - run.beat > -win).map((n) => n.m));
      lights(soon);
      for (const m in keyEls) keyEls[m].classList.toggle('target', soon.has(+m));
      const g = groups.find((gg) => gg.notes.some((n) => !n.hit && !n.miss)); drawStaff(g ? g.t : vlen + 1);
      if (run.beat > vlen + 1 && prev <= vlen + 1) endPass();
    }
    function click(strong) {
      const c = E.audio(); if (!c) return;
      const t = c.currentTime, o = c.createOscillator(), g = c.createGain();
      o.frequency.value = strong ? 1600 : 1100; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(strong ? 0.12 : 0.07, t + 0.002); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
      o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + 0.06);
    }

    /* fin d'un passage : en boucle on repart (et on accélère si c'est réussi), sinon résultat */
    /* petits mots au-dessus de la touche : Parfait, Bien, Un peu tôt… */
    function fx(m, text, kind) { if (run && run.fxs) { run.fxs.push({ m, text, kind, t: performance.now() }); if (run.fxs.length > 12) run.fxs.shift(); } }
    /* retard de l'entrée ajusté d'après les notes jouées (médiane des écarts) */
    function tune(r) {
      if (st.mode !== 'defi' || !r || !r.offs || r.offs.length < 6) return 0;
      const o = r.offs.slice().sort((a, b) => a - b), med = o[Math.floor(o.length / 2)];
      if (Math.abs(med) < 0.025) return 0;
      const now = lat(), next = Math.max(0, Math.min(0.35, now + med * 0.6));
      DB.input.lat = DB.input.lat || {}; DB.input.lat[DB.input.source] = Math.round(next * 1000) / 1000; A.save();
      return Math.round((next - now) * 1000);
    }
    function endPass() {
      if (!pr.loop) { finish(); return; }
      const acc = passAcc(run), pct = Math.round(acc * 100);
      run.passes.push(pct);
      let msg = (kid ? 'Tour ' : 'Tour ') + run.pass + ' : ' + pct + ' %';
      if (pr.ramp && acc >= 0.9 && st.speed < 1) { setSpeed(Math.min(1, st.speed + 0.05)); msg += ' · vitesse ' + Math.round(st.speed * 100) + ' %'; }
      else if (pr.ramp && acc >= 0.9 && st.speed >= 1) msg += kid ? ' · à fond !' : ' · vitesse normale atteinte';
      react(acc >= 0.9 ? 'happy' : 'idle', msg);
      autoOff(); reset();
      tune(run); Object.assign(run, { beat: startBeat(), autoBeat: startBeat(), gi: 0, good: 0, wrong: 0, perfect: 0, okay: 0, close: 0, lateN: 0, missN: 0, offs: [], pressed: new Set(), lastTick: -99, pass: run.pass + 1 });
    }

    /* entrée des notes */
    /* notes attendues (pour le filtre anti-voix du micro) */
    E.expect = (m) => {
      if (!run || run.kind !== 'play') return false;
      if (st.mode === 'tranquille') { const g = groups[run.gi]; return !!g && g.notes.some((n) => n.m === m); }
      const b = run.beat - lat() / spb(), win = 0.6 / spb();
      return view.some((n) => !n.auto && !n.hit && n.m === m && Math.abs(n.t - b) <= win);
    };
    A.onLeave(() => { E.expect = null; });
    window.OctaveGame = { get beat() { return run ? run.beat : null; }, get view() { return view; }, get spb() { return spb(); } }; /* pour le diagnostic et les tests */
    A.onLeave(() => { window.OctaveGame = null; });
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
        } else if (!view.some((n) => n.auto && n.m === ev.midi && Math.abs(n.t - run.beat) < 1)) { run.wrong++; run.combo = 0; react('oops', kid ? 'Presque ! Regarde la touche qui brille' : null); }
      } else {
        /* moment où la touche a vraiment été jouée, retard de l'entrée déduit */
        const b = run.beat - lat() / spb(), S = spb();
        let best = null, bd = 1e9;
        view.forEach((n) => { if (!n.auto && !n.hit && !n.miss && n.m === ev.midi) { const d = Math.abs(n.t - b); if (d < bd) { bd = d; best = n; } } });
        if (best && bd * S <= WIN.ok) {
          const off = (b - best.t) * S, a = Math.abs(off); /* négatif : en avance */
          best.hit = true; run.offs.push(off);
          if (a <= WIN.perfect) { best.q = 1; run.perfect++; fx(best.m, kid ? 'Parfait !' : 'Parfait', 'good'); }
          else if (a <= WIN.good) { best.q = 0.9; run.okay++; fx(best.m, 'Bien', 'good'); }
          else { best.q = 0.7; run.close++; fx(best.m, off < 0 ? 'Un peu tôt' : 'Un peu tard', 'soft'); }
          run.combo++; run.best = Math.max(run.best, run.combo);
          if (run.combo % (kid ? 5 : 10) === 0) react('happy', CHEERS[Math.floor(Math.random() * CHEERS.length)]);
          return;
        }
        /* la bonne note, mais jouée trop tard : elle compte quand même (un peu), jamais comme une fausse note */
        const late = view.filter((n) => !n.auto && n.miss && !n.late && n.m === ev.midi && (b - n.t) * S <= WIN.late + 0.15).sort((x, y) => y.t - x.t)[0];
        if (late) { late.miss = false; late.hit = true; late.late = true; late.q = 0.4; run.missN--; run.lateN++; fx(late.m, 'En retard', 'soft'); return; }
        /* même touche qu'une note toute proche (doublon du micro, touche rejouée) : on ignore */
        if (view.some((n) => n.m === ev.midi && Math.abs(n.t - b) * S < 0.7)) return;
        run.wrong++; run.combo = 0; fx(ev.midi, 'Fausse note', 'bad');
      }
    });
    A.onLeave(offInput);

    const stars = (n) => '★★★'.slice(0, n) + '☆☆☆'.slice(0, 3 - n);
    function overlayPause() {
      over.hidden = false; placeOver();
      const looping = pr.loop && run && run.passes.length;
      over.innerHTML = '<div class="g-card"><div class="h2">Pause</div>' +
        (looping ? '<div class="help">' + run.passes.length + ' tour' + (run.passes.length > 1 ? 's' : '') + ' : ' + run.passes.map((x) => x + ' %').join(' · ') + '</div>' : '') +
        '<div class="row" style="margin-top:14px;flex-wrap:wrap;justify-content:center"><button class="btn" id="gres">' + A.ICON.play + ' Reprendre</button>' +
        (pr.loop ? '<button class="btn ghost" id="gend">Terminer</button>' : '') + '<button class="btn ghost" id="grst">Recommencer</button></div></div>';
      document.getElementById('gres').onclick = () => { run.paused = false; last = performance.now(); over.hidden = true; over.innerHTML = ''; };
      document.getElementById('grst').onclick = () => ready();
      const ge = document.getElementById('gend'); if (ge) ge.onclick = () => finish(true);
    }
    function finish(fromLoop) {
      const r = run; stop();
      const tuned = tune(r);
      document.getElementById('gpause').hidden = true;
      /* en boucle : on garde le meilleur tour terminé */
      let acc = Math.round(passAcc(r) * 100);
      if (fromLoop && r.passes.length) acc = Math.max.apply(null, r.passes);
      const nStars = acc >= 95 ? 3 : acc >= 80 ? 2 : acc >= 60 ? 1 : 0;
      const work = practicing();
      p.songs = p.songs || {};
      const prev = p.songs[song.id];
      const record = !work && (!prev || nStars > prev.stars || (nStars === prev.stars && acc > prev.acc));
      if (record) p.songs[song.id] = { stars: nStars, acc, mode: st.mode };
      let coins = 0; if (kid && !work) { coins = nStars * 10 + (st.mode === 'defi' ? 5 : 0); p.coins += coins; }
      A.save();
      const res = !work && window.Path ? window.Path.report('morceau', song.id, { stars: nStars, mode: st.mode }) : null;
      const detail = fromLoop && r.passes.length ? r.passes.length + ' tour' + (r.passes.length > 1 ? 's' : '') + ' : ' + r.passes.map((x) => x + ' %').join(' · ') + ' · vitesse ' + Math.round(st.speed * 100) + ' %'
        : st.mode === 'tranquille' ? r.good + ' notes justes · ' + r.wrong + ' fausses · meilleure série ' + r.best
        : r.perfect + ' parfaites · ' + r.okay + ' bien' + (r.close ? ' · ' + r.close + ' un peu tôt ou tard' : '') + (r.lateN ? ' · ' + r.lateN + ' en retard' : '') + ' · ' + r.missN + ' ratées · meilleure série ' + r.best;
      over.hidden = false; placeOver();
      over.innerHTML = '<div class="g-card"><div class="g-res-mascot" style="color:var(--text)">' + M.svg(p.mascot, nStars >= 2 ? 'happy' : 'idle') + '</div>' +
        '<div class="g-stars" aria-label="' + nStars + ' étoiles sur 3">' + stars(nStars) + '</div>' +
        '<div class="h1" style="font-size:44px">' + acc + ' %</div><div class="help">' + detail + (coins ? ' · +' + coins + ' pièces' : '') + (record ? ' · nouveau record' : '') + '</div>' +
        (tuned ? '<div class="help step-rule">' + (kid ? 'Octave s\'est réglé sur ton jeu (' + (tuned > 0 ? '+' : '') + tuned + ' ms) pour mieux suivre ton rythme.' : 'Octave a ajusté le délai de ' + (DB.input.source === 'micro' ? 'votre micro' : 'votre clavier') + ' (' + (tuned > 0 ? '+' : '') + tuned + ' ms) pour mieux suivre votre rythme.') + '</div>' : '') +
        (work ? '<div class="help step-rule">' + A.esc(document.getElementById('gwork').textContent) + '. Quand c\'est au point, jouez le morceau entier pour le record.</div>' : '') +
        (res ? '<div class="g-next">' + window.Path.resultHtml(res) + '</div>' : '') +
        '<div class="row" style="margin-top:12px;justify-content:center;flex-wrap:wrap"><button class="btn' + (res && res.passed ? ' ghost' : '') + '" id="gagain">Rejouer</button><a class="btn ghost" href="' + back + '">' + (back === '#morceaux' ? 'Autres morceaux' : 'Retour') + '</a></div></div>';
      document.getElementById('gagain').onclick = () => ready();
      if (nStars >= 2) react('happy', kid ? 'Quelle star !' : 'Belle interprétation');
    }

    ready();
  }

  /* ---------- Écran : morceaux ---------- */
  function Songs() {
    const p = A.prof(), kid = A.isKid(), mine = p.songs || {};
    const perso = MU.SONGS.filter((s) => s.perso).reverse();
    const kinds = { exercice: 'Exercice', chanson: 'Chanson', classique: 'Classique', groove: 'Groove', perso: 'Perso' };
    const card = (s) => {
      const b = mine[s.id];
      return '<a class="song' + (s.perso ? ' perso' : '') + '" href="#jeu-' + s.id + '"><div class="song-art" data-kind="' + s.kind + '">' + MU.preview(s, { x0: 50, dx: 28, width: 220, height: 92, gap: 7, top: 30, gapG: 5.4, topG: 14, label: 'Début de ' + s.title }) + '</div>' +
        '<div class="song-body"><div class="between"><span class="eyebrow">' + kinds[s.kind] + ' · Niv. ' + s.level + '</span><span class="song-stars" aria-label="' + (b ? b.stars : 0) + ' étoiles">' + (b ? '★★★'.slice(0, b.stars) + '☆☆☆'.slice(0, 3 - b.stars) : '☆☆☆') + '</span></div>' +
        '<div class="label" style="font-size:16px">' + A.esc(s.title) + '</div><div class="help">' + A.esc(s.by) + '</div></div></a>';
    };
    A.shell('morceaux', A.header() + '<h1 class="h1">Morceaux</h1>' +
      '<div class="help">' + (kid ? 'Choisis un morceau. Commence en Tranquille, puis tente le Défi !' : 'Commencez en mode Tranquille : la musique attend la bonne note. Passez en Défi pour jouer en rythme.') + '</div>' +
      '<div class="between"><div class="h2">' + (kid ? 'Tes morceaux à toi' : 'Mes morceaux') + '</div><a class="btn small" href="#importer">+ Importer un fichier MIDI</a></div>' +
      (perso.length ? '<div class="songs">' + perso.map((s) => '<div class="song-wrap">' + card(s) + '<a class="song-edit" href="#importer-' + s.id + '" aria-label="Modifier ' + A.esc(s.title) + '">Modifier</a></div>').join('') + '</div>'
        : '<div class="soon">' + (kid ? 'Ajoute la musique que tu aimes depuis un fichier MIDI : elle tombera sur l\'écran comme les autres morceaux.' : 'Ajoutez vos propres morceaux depuis un fichier MIDI (.mid) : choisissez les pistes, la main et le passage à travailler. Ils restent sur cet appareil, utilisables sans internet.') + '</div>') +
      '<div class="h2">' + (kid ? 'Les morceaux d\'Octave' : 'Morceaux d\'Octave') + '</div>' +
      '<div class="songs">' + MU.SONGS.filter((s) => !s.perso).map(card).join('') + '</div>');
  }

  A.screens.jeu = Game;
  A.screens.morceaux = Songs;
})();
