/* Entraînements d'oreille et de rythme, adaptatifs comme les exercices au clavier. */
(function () {
  'use strict';
  const A = window.App, E = window.Engine, M = window.Mascots, MU = window.Music;
  const PA = () => window.Path;

  /* niveau : +1 à 90 %, -1 sous 60 % */
  function levelUp(p, key, acc) {
    const sk = PA().skill(p), lvl = PA().lvlOf(p, key);
    let after = lvl;
    if (acc >= 0.9 && lvl < 5) after = lvl + 1; else if (acc < 0.6 && lvl > 1) after = lvl - 1;
    sk.lvl[key] = after;
    return { before: lvl, after };
  }
  function context(p, type, ref, fallback) {
    const cur = PA().current(p), step = cur && cur.type === type && cur.ref === ref ? cur : null;
    return { step, label: step ? 'Monde ' + step.world.n + ' · étape ' + step.n + ' sur ' + step.world.steps.length : fallback };
  }
  function playNote(m, dur, when) {
    const c = E.audio(); if (!c) return;
    setTimeout(() => { E.sound.enabled = true; E.sound.play(m, 90); setTimeout(() => E.sound.stop(m), dur * 1000); }, (when || 0) * 1000);
  }
  function resultCard(p, kid, pct, detail, lv, hints, res, coins) {
    const msg = lv.after > lv.before ? (kid ? 'Niveau ' + lv.after + ' débloqué ! ' : 'Niveau ' + lv.after + ' : ') + hints[lv.after - 1] + '.'
      : lv.after < lv.before ? 'On revient au niveau ' + lv.after + ' pour consolider : ' + hints[lv.after - 1] + '.'
      : 'Niveau ' + lv.after + ' : ' + hints[lv.after - 1] + '. Réussis à 90 % pour monter.';
    return '<div class="eyebrow">' + (pct >= 70 ? (kid ? 'Bravo !' : 'Terminé') : 'Presque') + '</div>' +
      '<div class="challenge"><div class="mascot" style="color:var(--text)">' + M.svg(p.mascot, pct >= 70 ? 'happy' : 'idle') + '</div><div><div class="ask">' + pct + ' %</div><div class="help">' + detail + (coins ? ' · +' + coins + ' pièces' : '') + '</div></div></div>' +
      '<div class="lvl-msg"><span class="chip lvl">Niveau ' + lv.after + '</span><span class="help">' + msg + '</span></div>' +
      PA().resultHtml(res) +
      '<div class="row" style="flex-wrap:wrap"><button class="btn ghost" id="tagain">Rejouer</button>' + (res && res.passed ? '' : '<a class="btn ghost" href="#parcours">Parcours</a>') + '</div>';
  }
  const back = () => (A.prevHash && !/^(ecoute|tape)/.test(A.prevHash) ? '#' + A.prevHash : '#parcours');

  /* ========== Oreille ========== */
  const EAR_HINTS = {
    aigu: ['notes très éloignées', 'notes éloignées', 'notes plus proches', 'notes voisines, ou pareilles', 'notes voisines, sans réécouter'],
    repete: ['2 notes, les touches s\'allument après une erreur', '3 notes, avec le nom des touches', '4 notes', '5 notes, à la bonne octave', '6 notes, à la bonne octave']
  };
  function Ecoute(param) {
    const mode = param === 'repete' ? 'repete' : 'aigu';
    const p = A.prof(), kid = A.isKid(), DB = A.DB, lvl = PA().lvlOf(p, mode);
    const ctx = context(p, 'oreille', mode, kid ? 'Entraînement de l\'oreille' : 'Oreille');
    const title = mode === 'aigu' ? 'Aigu ou grave ?' : 'Rejoue ce que tu entends';
    const ROUNDS = mode === 'aigu' ? (kid ? 6 : 8) : (kid ? 4 : 5);
    A.shell('parcours', A.header() +
      '<div class="row"><a href="' + back() + '" class="icon-btn" aria-label="Retour">' + A.ICON.back + '</a><div style="min-width:0"><div class="eyebrow">' + ctx.label + '</div><div class="h2">' + title + '</div></div></div>' +
      '<div class="card exo-card" id="tcard"></div>' +
      (mode === 'repete' ? '<div class="kbd-wrap"><div class="kbd exo-kbd" id="tkbd" aria-label="Clavier"></div></div>' : ''));
    const card = document.getElementById('tcard');
    const S = { phase: 'start', round: 0, ok: 0, miss: 0, mood: 'idle', a: 0, b: 0, seq: [], si: 0, busy: false, t0: 0 };
    let timers = [];
    const later = (fn, ms) => timers.push(setTimeout(fn, ms));
    A.onLeave(() => { timers.forEach(clearTimeout); S.phase = 'gone'; A.stopInput(); });

    /* pour « Rejoue » : notes apprises dans l'octave du milieu */
    let pool = PA().learned(p).filter((m) => m >= 60 && m <= 72 && !E.isBlack(m));
    if (pool.length < 3) pool = [60, 62, 64, 65, 67];
    const exact = lvl >= 4;
    let keys = null;
    if (mode === 'repete') {
      const lo = pool[0] - (E.isBlack(pool[0] - 1) ? 2 : 1), hi = pool[pool.length - 1] + (E.isBlack(pool[pool.length - 1] + 1) ? 2 : 1);
      keys = PA().keyboard(document.getElementById('tkbd'), lo, hi, lvl <= 2);
    }

    const mascot = () => '<div class="mascot" id="tm" style="color:var(--text)">' + M.svg(p.mascot, S.mood) + '</div>';
    const pips = () => '<div class="pips">' + Array.from({ length: ROUNDS }, (_, k) => '<i class="' + (k < S.round - 1 ? 'ok' : '') + '"></i>').join('') + '</div>';
    function react(mood) { S.mood = mood; const el = document.getElementById('tm'); if (!el) return; el.innerHTML = M.svg(p.mascot, mood); el.classList.remove('bounce', 'shake'); void el.offsetWidth; el.classList.add(mood === 'oops' ? 'shake' : 'bounce'); }

    function listen() {
      S.busy = true; draw();
      if (mode === 'aigu') { playNote(S.a, 0.7, 0); playNote(S.b, 0.7, 0.9); later(() => { S.busy = false; draw(); }, 1700); }
      else { S.seq.forEach((m, i) => playNote(m, 0.45, i * 0.6)); later(() => { S.busy = false; draw(); }, S.seq.length * 600 + 300); }
    }
    function next() {
      if (S.round >= ROUNDS) { finish(); return; }
      S.round++; S.cur = false; S.replays = 0;
      if (mode === 'aigu') {
        const minI = [7, 4, 2, 1, 1][lvl - 1], maxI = lvl === 1 ? 12 : minI + 5;
        S.a = 55 + Math.floor(Math.random() * 20);
        const same = lvl >= 4 && Math.random() < 0.2;
        const iv = same ? 0 : (minI + Math.floor(Math.random() * (maxI - minI + 1))) * (Math.random() < 0.5 ? -1 : 1);
        S.b = S.a + iv;
      } else {
        const len = Math.min(lvl + 1, 6);
        let i = Math.floor(Math.random() * pool.length); S.seq = [pool[i]];
        while (S.seq.length < len) {
          const steps = lvl <= 2 ? [-1, 1, -2, 2] : [-3, -2, -1, 1, 2, 3];
          const o = steps.map((d) => i + d).filter((j) => j >= 0 && j < pool.length);
          i = o[Math.floor(Math.random() * o.length)]; S.seq.push(pool[i]);
        }
        S.si = 0;
      }
      listen();
    }
    function draw() {
      if (S.phase === 'start') {
        card.innerHTML = '<div class="between"><span class="eyebrow">' + title + '</span><span class="chip lvl">Niveau ' + lvl + '</span></div>' +
          '<div class="challenge">' + mascot() + '<div><div class="label">' + (mode === 'aigu' ? 'Tu vas entendre deux notes. La deuxième est-elle plus aiguë ou plus grave que la première ?' : 'L\'appli joue quelques notes. Rejoue-les dans le même ordre sur le clavier.') + '</div>' +
          '<div class="help" style="margin-top:4px">Ton niveau : ' + EAR_HINTS[mode][lvl - 1] + '.</div></div></div>' +
          '<div class="help">Monte le son. ' + (mode === 'repete' && DB.input.source === 'micro' ? 'Le micro écoute seulement quand l\'appli a fini de jouer.' : '') + '</div>' +
          '<button class="btn" id="tgo">' + A.ICON.play + (kid ? ' C\'est parti' : ' Commencer') + '</button>';
        document.getElementById('tgo').onclick = async (e) => { e.target.disabled = true; E.audio(); if (mode === 'repete') await A.startInput(); S.phase = 'play'; S.t0 = performance.now(); next(); };
        return;
      }
      if (S.phase !== 'play' && S.phase !== 'wait') return;
      const canReplay = !(mode === 'aigu' && lvl >= 5);
      let body = '';
      if (mode === 'aigu') {
        body = '<div><div class="help">' + (S.busy ? 'Écoute…' : 'La 2e note est…') + '</div><div class="ear-opts">' +
          '<button class="q-opt ear" data-a="up"' + (S.busy || S.phase === 'wait' ? ' disabled' : '') + '>↑ Plus aiguë</button><button class="q-opt ear" data-a="down"' + (S.busy || S.phase === 'wait' ? ' disabled' : '') + '>↓ Plus grave</button>' +
          (lvl >= 4 ? '<button class="q-opt ear" data-a="same"' + (S.busy || S.phase === 'wait' ? ' disabled' : '') + '>= Pareille</button>' : '') + '</div></div>';
      } else {
        body = '<div><div class="help">' + (S.busy ? 'Écoute…' : 'À toi : rejoue les ' + S.seq.length + ' notes') + '</div><div class="pips big">' + S.seq.map((_, k) => '<i class="' + (k < S.si ? 'ok' : '') + '"></i>').join('') + '</div></div>';
      }
      card.innerHTML = '<div class="between"><span class="eyebrow">Tour ' + S.round + ' sur ' + ROUNDS + '</span>' + pips() + '</div>' +
        '<div class="challenge">' + mascot() + body + '</div>' +
        (canReplay ? '<button class="btn small ghost" id="treplay"' + (S.busy ? ' disabled' : '') + '>Réécouter</button>' : '');
      const r = document.getElementById('treplay'); if (r) r.onclick = () => { S.replays++; listen(); };
      card.querySelectorAll('[data-a]').forEach((b) => b.onclick = () => answer(b));
    }
    function answer(b) {
      if (S.busy || S.phase !== 'play') return;
      const want = S.b > S.a ? 'up' : S.b < S.a ? 'down' : 'same', ok = b.dataset.a === want;
      if (ok) S.ok++; else S.miss++;
      S.phase = 'wait'; draw();
      const btns = card.querySelectorAll('[data-a]');
      btns.forEach((x) => { if (x.dataset.a === want) x.classList.add('good'); else if (x === b || x.dataset.a === b.dataset.a) x.classList.add('bad'); });
      react(ok ? 'happy' : 'oops');
      later(() => { if (S.phase !== 'wait') return; S.phase = 'play'; next(); }, ok ? 800 : 1500);
    }
    /* entrée clavier pour « Rejoue » */
    const lit = new Set();
    function hint(m) { if (keys && keys[m]) keys[m].classList.add('target'); if (DB.input.lights) { E.midi.light(m, true, m < 60 ? 'g' : 'd'); lit.add(m); } }
    function clearHints() { if (keys) Object.values(keys).forEach((k) => k.classList.remove('target')); lit.forEach((m) => E.midi.light(m, false)); lit.clear(); }
    A.onLeave(clearHints);
    if (mode === 'repete') {
      const off = E.on((ev) => {
        if (ev.type === 'pedal') return;
        const k = keys[ev.midi]; if (k) k.classList.toggle('on', ev.type === 'on');
        if (ev.type !== 'on' || S.phase !== 'play' || S.busy) return;
        const t = S.seq[S.si], good = exact ? ev.midi === t : ev.midi % 12 === t % 12;
        if (good) {
          S.ok++; S.si++; clearHints();
          if (S.si >= S.seq.length) { react('happy'); if (DB.input.source !== 'micro') E.sound.blip(true); S.phase = 'wait'; draw(); later(() => { if (S.phase !== 'wait') return; S.phase = 'play'; next(); }, 800); }
          else draw();
        } else {
          S.miss++; react('oops');
          if (lvl <= 2) hint(t);
        }
      });
      A.onLeave(off);
    }
    function finish() {
      S.phase = 'end'; clearHints();
      const acc = S.ok + S.miss ? S.ok / (S.ok + S.miss) : 0, pct = Math.round(acc * 100);
      const lv = levelUp(p, mode, acc);
      let coins = 0;
      const res = ctx.step ? PA().report('oreille', mode, { acc }) : null;
      if (!ctx.step) { coins = Math.round(acc * 8); A.addCoins(p, coins); }
      A.save();
      card.innerHTML = resultCard(p, kid, pct, S.ok + ' juste' + (S.ok > 1 ? 's' : '') + ' · ' + S.miss + ' erreur' + (S.miss > 1 ? 's' : ''), lv, EAR_HINTS[mode], res, coins);
      document.getElementById('tagain').onclick = () => A.route();
    }
    draw();
  }

  /* ========== Rythme ========== */
  const RHY_HINTS = ['noires et blanches, lent', 'avec la ronde et le soupir', 'avec les croches', 'deux mesures, avec la noire pointée', 'deux mesures, plus rapide, avec les contretemps'];
  const SYL = { 1: 'ta', 2: 'ta-a', 4: 'ta-a-a-a', 0.5: 'ti', 1.5: 'ta-i' };
  function makeRhythm(lvl) {
    const groups = [[{ d: 1 }], [{ d: 2 }]];
    if (lvl >= 2) groups.push([{ d: 4 }], [{ d: 1, rest: true }]);
    if (lvl >= 3) groups.push([{ d: 0.5 }, { d: 0.5 }], [{ d: 0.5 }, { d: 0.5 }]);
    if (lvl >= 4) groups.push([{ d: 1.5 }, { d: 0.5 }]);
    if (lvl >= 5) groups.push([{ d: 0.5, rest: true }, { d: 0.5 }]);
    const bars = lvl >= 4 ? 2 : 1, out = [];
    for (let b = 0; b < bars; b++) {
      let left = 4, guard = 0;
      while (left > 0 && guard++ < 50) {
        const g = groups[Math.floor(Math.random() * groups.length)], len = g.reduce((s, t) => s + t.d, 0);
        if (len > left) continue;
        if (left === 4 && b === 0 && g[0].rest) continue; /* on commence par une note */
        g.forEach((t) => out.push(Object.assign({}, t)));
        left -= len;
      }
    }
    if (out.filter((t) => !t.rest).length < 2) return makeRhythm(lvl);
    let t = 0; out.forEach((x) => { x.t = t; t += x.d; });
    return { tokens: out, beats: bars * 4, tempo: [70, 74, 80, 84, 96][lvl - 1] };
  }
  /* notation rythmique sur une ligne */
  function rhythmSvg(r, states, showSyl) {
    const unit = 46, pad = 30, W = pad * 2 + r.beats * unit + (r.beats > 4 ? 16 : 0), H = 120, y = 62;
    let s = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" role="img" aria-label="Rythme à taper" style="max-width:' + W * 1.6 + 'px">';
    s += '<line x1="10" x2="' + (W - 10) + '" y1="' + y + '" y2="' + y + '" stroke="currentColor" stroke-width="1.5" opacity=".5"/>';
    const xOf = (t) => pad + t * unit + (t >= 4 ? 16 : 0);
    if (r.beats > 4) s += '<line x1="' + (xOf(4) - 10) + '" x2="' + (xOf(4) - 10) + '" y1="' + (y - 20) + '" y2="' + (y + 20) + '" stroke="currentColor" stroke-width="1.5" opacity=".6"/>';
    s += '<line x1="' + (W - 12) + '" x2="' + (W - 12) + '" y1="' + (y - 20) + '" y2="' + (y + 20) + '" stroke="currentColor" stroke-width="2.5"/>';
    let ni = 0;
    r.tokens.forEach((tk, i) => {
      const x = xOf(tk.t) + 6;
      if (tk.rest) {
        if (tk.d === 1) s += '<path d="M' + x + ' ' + (y - 16) + 'l6 8-5 6 6 8-4 0q-4 2 0 6" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linejoin="round"/>';
        else s += '<path d="M' + (x - 2) + ' ' + (y - 8) + 'q3 4 8 0l-6 18" fill="none" stroke="currentColor" stroke-width="2.4"/><circle cx="' + (x - 1) + '" cy="' + (y - 7) + '" r="2.6" fill="currentColor"/>';
        return;
      }
      const st = states ? states[ni] : null, col = st === true ? 'var(--good)' : st === false ? 'var(--bad)' : 'currentColor';
      ni++;
      const hollow = tk.d >= 2;
      s += '<ellipse cx="' + x + '" cy="' + y + '" rx="8" ry="6" transform="rotate(-20 ' + x + ' ' + y + ')" fill="' + (hollow ? 'none' : col) + '" stroke="' + col + '" stroke-width="' + (hollow ? 2.4 : 1) + '"/>';
      if (tk.d < 4) s += '<line x1="' + (x + 7) + '" x2="' + (x + 7) + '" y1="' + y + '" y2="' + (y - 38) + '" stroke="' + col + '" stroke-width="1.8"/>';
      if (tk.d === 1.5) s += '<circle cx="' + (x + 14) + '" cy="' + (y - 3) + '" r="2.4" fill="' + col + '"/>';
      if (tk.d === 0.5) {
        const nx = r.tokens[i + 1], pv = r.tokens[i - 1];
        const pairNext = nx && !nx.rest && nx.d === 0.5 && tk.t % 1 === 0;
        const pairPrev = pv && !pv.rest && pv.d === 0.5 && pv.t % 1 === 0 && tk.t % 1 !== 0;
        if (pairNext) s += '<line x1="' + (x + 7) + '" x2="' + (xOf(nx.t) + 13) + '" y1="' + (y - 38) + '" y2="' + (y - 38) + '" stroke="currentColor" stroke-width="5"/>';
        else if (!pairPrev) s += '<path d="M' + (x + 7) + ' ' + (y - 38) + 'q9 10 6 22" fill="none" stroke="' + col + '" stroke-width="2.4"/>';
      }
      if (showSyl) s += '<text x="' + x + '" y="' + (H - 12) + '" text-anchor="middle" font-size="12" font-weight="600" fill="' + col + '">' + (SYL[tk.d] || '') + '</text>';
    });
    return s + '</svg>';
  }
  function Tape() {
    const p = A.prof(), kid = A.isKid(), lvl = PA().lvlOf(p, 'rythme');
    const ctx = context(p, 'rythme', 'tape', kid ? 'Entraînement du rythme' : 'Rythme');
    const ROUNDS = kid ? 4 : 5, tol = [0.2, 0.18, 0.14, 0.12, 0.1][lvl - 1];
    A.shell('parcours', A.header() +
      '<div class="row"><a href="' + back() + '" class="icon-btn" aria-label="Retour">' + A.ICON.back + '</a><div style="min-width:0"><div class="eyebrow">' + ctx.label + '</div><div class="h2">Tape le rythme</div></div></div>' +
      '<div class="card exo-card" id="tcard"></div>');
    const card = document.getElementById('tcard');
    const S = { phase: 'start', round: 0, hit: 0, exp: 0, extra: 0, mood: 'idle', r: null, states: null, taps: [], t0: 0, end: 0 };
    let timers = [];
    const later = (fn, ms) => timers.push(setTimeout(fn, ms));
    const c = () => E.audio();
    function tick(t, strong, freq) {
      const ac = c(); if (!ac) return;
      const o = ac.createOscillator(), g = ac.createGain();
      o.type = freq ? 'triangle' : 'sine'; o.frequency.value = freq || (strong ? 1600 : 1100);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(freq ? 0.25 : (strong ? 0.14 : 0.08), t + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t + (freq ? 0.12 : 0.05));
      o.connect(g); g.connect(ac.destination); o.start(t); o.stop(t + 0.15);
    }
    const spb = () => 60 / S.r.tempo;
    function demo() {
      const ac = c(); if (!ac) return;
      S.phase = 'demo'; draw();
      const t0 = ac.currentTime + 0.3;
      for (let b = 0; b < 4; b++) tick(t0 + b * spb(), b === 0);
      S.r.tokens.forEach((tk) => { if (!tk.rest) tick(t0 + (4 + tk.t) * spb(), false, 880); });
      for (let b = 0; b < S.r.beats; b++) tick(t0 + (4 + b) * spb(), b % 4 === 0);
      later(() => { if (S.phase === 'demo') { S.phase = 'ready'; draw(); } }, (0.3 + (4 + S.r.beats) * spb()) * 1000 + 200);
    }
    function go() {
      const ac = c(); if (!ac) return;
      S.phase = 'count'; S.taps = []; S.states = null; draw();
      S.t0 = ac.currentTime + 0.3 + 4 * spb(); S.end = S.t0 + S.r.beats * spb();
      for (let b = 0; b < 4 + S.r.beats; b++) tick(ac.currentTime + 0.3 + b * spb(), b % 4 === 0);
      for (let b = 1; b <= 4; b++) later(() => { const el = document.getElementById('tcount'); if (el) el.textContent = b; }, (0.3 + (b - 1) * spb()) * 1000);
      later(() => { if (S.phase === 'count') { S.phase = 'tap'; draw(); } }, (0.3 + 4 * spb()) * 1000 - 120);
      later(() => { if (S.phase === 'tap' || S.phase === 'count') judge(); }, (S.end - ac.currentTime + 0.45) * 1000);
    }
    function tap() {
      if (S.phase !== 'tap' && S.phase !== 'count') return;
      const ac = c(); if (!ac) return;
      S.taps.push(ac.currentTime);
      const pad = document.getElementById('tpad'); if (pad) { pad.classList.remove('pulse'); void pad.offsetWidth; pad.classList.add('pulse'); }
    }
    function judge() {
      const exp = S.r.tokens.filter((t) => !t.rest).map((t) => S.t0 + t.t * spb());
      const used = new Set(); const states = exp.map((et) => {
        let best = -1, bd = 1e9;
        S.taps.forEach((tt, i) => { if (used.has(i)) return; const d = Math.abs(tt - et); if (d < bd) { bd = d; best = i; } });
        if (best >= 0 && bd <= tol) { used.add(best); return true; }
        return false;
      });
      const extra = S.taps.filter((tt, i) => !used.has(i) && tt > S.t0 - tol).length;
      const hit = states.filter(Boolean).length;
      S.hit += hit; S.exp += exp.length; S.extra += extra; S.states = states;
      const ok = hit === exp.length && extra === 0;
      S.mood = ok ? 'happy' : 'oops'; S.phase = 'judged'; S.last = { hit, n: exp.length, extra };
      draw();
    }
    function next() {
      if (S.round >= ROUNDS) { finish(); return; }
      S.round++; S.r = makeRhythm(lvl); S.states = null; S.phase = 'ready'; S.mood = 'idle'; draw();
    }
    const mascot = () => '<div class="mascot" style="color:var(--text)">' + M.svg(p.mascot, S.mood) + '</div>';
    function draw() {
      if (S.phase === 'start') {
        card.innerHTML = '<div class="between"><span class="eyebrow">Tape le rythme</span><span class="chip lvl">Niveau ' + lvl + '</span></div>' +
          '<div class="challenge">' + mascot() + '<div><div class="label">Un rythme s\'affiche. Écoute-le, puis tape-le après le décompte « 1, 2, 3, 4 ».</div><div class="help" style="margin-top:4px">Tape sur le grand bouton, sur une touche du piano ou sur la barre d\'espace. Ton niveau : ' + RHY_HINTS[lvl - 1] + '.</div></div></div>' +
          '<button class="btn" id="tgo">' + A.ICON.play + (kid ? ' C\'est parti' : ' Commencer') + '</button>';
        document.getElementById('tgo').onclick = async (e) => { e.target.disabled = true; E.audio(); if (A.DB.input.source === 'midi') await A.startInput(); next(); };
        return;
      }
      if (S.phase === 'end' || S.phase === 'gone') return;
      const showSyl = lvl <= 2;
      let foot = '';
      if (S.phase === 'ready') foot = '<div class="row" style="flex-wrap:wrap"><button class="btn ghost" id="tdemo">Écouter</button><button class="btn" id="tstart">À toi !</button></div>';
      else if (S.phase === 'demo') foot = '<div class="help">Écoute…</div>';
      else if (S.phase === 'count' || S.phase === 'tap') foot = '<button class="tap-pad" id="tpad" aria-label="Taper"><span id="tcount">' + (S.phase === 'tap' ? 'Tape !' : '…') + '</span></button>';
      else if (S.phase === 'judged') {
        const l = S.last;
        foot = '<div class="help">' + l.hit + ' sur ' + l.n + ' bien placée' + (l.hit > 1 ? 's' : '') + (l.extra ? ' · ' + l.extra + ' en trop' : '') + '</div>' +
          '<div class="row" style="flex-wrap:wrap"><button class="btn ghost" id="tdemo">Réécouter</button><button class="btn" id="tnext">' + (S.round >= ROUNDS ? 'Voir mon score' : 'Rythme suivant') + '</button></div>';
      }
      card.innerHTML = '<div class="between"><span class="eyebrow">Rythme ' + S.round + ' sur ' + ROUNDS + ' · ' + S.r.tempo + ' à la noire</span><div class="pips">' + Array.from({ length: ROUNDS }, (_, k) => '<i class="' + (k < S.round - 1 ? 'ok' : '') + '"></i>').join('') + '</div></div>' +
        '<div class="challenge">' + mascot() + '<div class="rhy-box">' + rhythmSvg(S.r, S.states, showSyl) + '</div></div>' + foot;
      const d = document.getElementById('tdemo'); if (d) d.onclick = demo;
      const st = document.getElementById('tstart'); if (st) st.onclick = go;
      const n = document.getElementById('tnext'); if (n) n.onclick = next;
      const pad = document.getElementById('tpad'); if (pad) pad.addEventListener('pointerdown', (e) => { e.preventDefault(); tap(); });
    }
    const key = (e) => { if ((e.code === 'Space' || e.key === 'Enter') && (S.phase === 'tap' || S.phase === 'count')) { e.preventDefault(); tap(); } };
    document.addEventListener('keydown', key);
    const off = E.on((ev) => { if (ev.type === 'on' && ev.src === 'midi') tap(); }); /* le micro entendrait le métronome : on tape à l'écran */
    A.onLeave(() => { document.removeEventListener('keydown', key); off(); timers.forEach(clearTimeout); S.phase = 'gone'; A.stopInput(); });
    function finish() {
      S.phase = 'end';
      const acc = S.exp ? Math.max(0, S.hit - S.extra * 0.5) / S.exp : 0, pct = Math.round(acc * 100);
      const lv = levelUp(p, 'rythme', acc);
      const res = ctx.step ? PA().report('rythme', 'tape', { acc }) : null;
      let coins = 0; if (!ctx.step) { coins = Math.round(acc * 8); A.addCoins(p, coins); }
      A.save();
      card.innerHTML = resultCard(p, kid, pct, S.hit + ' notes bien placées sur ' + S.exp + (S.extra ? ' · ' + S.extra + ' en trop' : ''), lv, RHY_HINTS, res, coins);
      document.getElementById('tagain').onclick = () => A.route();
    }
    draw();
  }

  A.screens.ecoute = Ecoute;
  A.screens.tape = Tape;
})();
