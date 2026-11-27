/* Outils : métronome, partition en pleine page (lecture suivie), et « Jouer d'oreille » (retrouver un air). */
(function () {
  'use strict';
  const A = window.App, E = window.Engine, MU = window.Music, M = window.Mascots;
  const T = (kid, adult) => (A.isKid() ? kid : adult);

  /* ================= Métronome ================= */
  const TEMPI = [[40, 'Grave'], [60, 'Lento'], [66, 'Adagio'], [76, 'Andante'], [108, 'Moderato'], [120, 'Allegro'], [168, 'Presto']];
  const tempoName = (b) => { let n = TEMPI[0][1]; TEMPI.forEach(([v, name]) => { if (b >= v) n = name; }); return n; };
  function Metronome() {
    const DB = A.DB, kid = A.isKid();
    const S = Object.assign({ bpm: 80, beats: 4, sub: 1, accent: true }, DB.input.metroSet || {});
    let on = false, timer = 0, nextT = 0, beat = 0, tick = 0, queue = [], raf = 0, taps = [];
    const saveS = () => { DB.input.metroSet = { bpm: S.bpm, beats: S.beats, sub: S.sub, accent: S.accent }; A.save(); };
    A.shell('morceaux', A.header() +
      '<div class="row"><a href="#morceaux" class="icon-btn" aria-label="Retour">' + A.ICON.back + '</a><div><div class="eyebrow">Outil</div><div class="h2">Métronome</div></div></div>' +
      '<div class="cols"><div class="stack"><div class="card metro">' +
        '<div class="metro-dots" id="mdots"></div>' +
        '<div class="metro-bpm"><button class="icon-btn big" id="mm5" aria-label="Moins 5">−5</button><button class="icon-btn big" id="mm1" aria-label="Moins 1">−</button>' +
          '<div><div class="metro-n" id="mbpm"></div><div class="help" id="mname"></div></div>' +
          '<button class="icon-btn big" id="mp1" aria-label="Plus 1">+</button><button class="icon-btn big" id="mp5" aria-label="Plus 5">+5</button></div>' +
        '<input type="range" id="mrange" min="30" max="220" step="1" aria-label="Tempo">' +
        '<button class="btn metro-go" id="mgo">' + A.ICON.play + ' Démarrer</button>' +
        '<button class="btn ghost" id="mtap">Taper le tempo</button>' +
      '</div></div><div class="stack"><div class="card">' +
        '<div class="label">Temps par mesure</div><div class="seg" role="group" aria-label="Temps par mesure">' + [2, 3, 4, 6].map((b) => '<button data-mb="' + b + '">' + b + '</button>').join('') + '</div>' +
        '<div class="label">Subdivision</div><div class="seg" role="group" aria-label="Subdivision">' + [[1, 'Noires'], [2, 'Croches'], [3, 'Triolets']].map(([v, l]) => '<button data-ms="' + v + '">' + l + '</button>').join('') + '</div>' +
        '<div class="item between"><div><div class="label">Premier temps plus fort</div><div class="help">' + T('Pour sentir le début de chaque mesure', 'Accentue le 1er temps de chaque mesure') + '</div></div><button class="switch" role="switch" id="macc" aria-label="Premier temps plus fort"></button></div>' +
        '<div class="help">' + T('Astuce : commence lentement, joue juste, puis monte de 5 en 5.', 'Méthode : commencez lentement, puis montez de 5 en 5 à chaque passage propre.') + '</div>' +
      '</div></div></div>');
    const $ = (id) => document.getElementById(id);
    function ui() {
      $('mbpm').textContent = S.bpm; $('mname').textContent = tempoName(S.bpm) + ' · ' + S.bpm + ' noires par minute'; $('mrange').value = S.bpm;
      document.querySelectorAll('[data-mb]').forEach((b) => b.setAttribute('aria-pressed', +b.dataset.mb === S.beats));
      document.querySelectorAll('[data-ms]').forEach((b) => b.setAttribute('aria-pressed', +b.dataset.ms === S.sub));
      $('macc').setAttribute('aria-checked', S.accent);
      $('mdots').innerHTML = Array.from({ length: S.beats }, (_, i) => '<i data-i="' + i + '"></i>').join('');
      $('mgo').innerHTML = on ? 'Arrêter' : A.ICON.play + ' Démarrer';
    }
    function click(c, t, kind) {
      const o = c.createOscillator(), g = c.createGain();
      o.frequency.value = kind === 2 ? 1760 : kind === 1 ? 1320 : 880;
      const v = kind === 2 ? 0.22 : kind === 1 ? 0.14 : 0.07;
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.002); g.gain.exponentialRampToValueAtTime(0.0001, t + (kind ? 0.06 : 0.035));
      o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + 0.08);
    }
    function sched() {
      const c = E.audio(); if (!c) return;
      while (nextT < c.currentTime + 0.12) {
        const isBeat = tick % S.sub === 0, b = Math.floor(tick / S.sub) % S.beats;
        click(c, nextT, isBeat ? (b === 0 && S.accent ? 2 : 1) : 0);
        if (isBeat) queue.push({ t: nextT, b });
        nextT += 60 / S.bpm / S.sub; tick++;
      }
    }
    function draw() {
      const c = E.audio(); raf = requestAnimationFrame(draw); if (!c) return;
      while (queue.length && queue[0].t <= c.currentTime) {
        const q = queue.shift();
        document.querySelectorAll('#mdots i').forEach((el) => el.classList.toggle('on', +el.dataset.i === q.b));
        const d = document.querySelector('#mdots i[data-i="' + q.b + '"]'); if (d) { d.classList.remove('pulse'); void d.offsetWidth; d.classList.add('pulse'); }
      }
    }
    function start() { const c = E.audio(); if (!c) { A.toast('Son indisponible'); return; } on = true; tick = 0; beat = 0; queue = []; nextT = c.currentTime + 0.08; sched(); timer = setInterval(sched, 25); draw(); ui(); }
    function stopM() { on = false; clearInterval(timer); cancelAnimationFrame(raf); queue = []; document.querySelectorAll('#mdots i').forEach((el) => el.classList.remove('on')); ui(); }
    const setB = (v) => { S.bpm = Math.max(30, Math.min(220, Math.round(v))); saveS(); ui(); };
    $('mm5').onclick = () => setB(S.bpm - 5); $('mm1').onclick = () => setB(S.bpm - 1); $('mp1').onclick = () => setB(S.bpm + 1); $('mp5').onclick = () => setB(S.bpm + 5);
    $('mrange').oninput = (e) => { S.bpm = +e.target.value; $('mbpm').textContent = S.bpm; $('mname').textContent = tempoName(S.bpm) + ' · ' + S.bpm + ' noires par minute'; };
    $('mrange').onchange = () => setB(S.bpm);
    $('mgo').onclick = () => (on ? stopM() : start());
    $('mtap').onclick = () => {
      const now = performance.now(); taps = taps.filter((t) => now - t < 2500); taps.push(now);
      if (taps.length >= 2) { const iv = []; for (let i = 1; i < taps.length; i++) iv.push(taps[i] - taps[i - 1]); setB(60000 / (iv.reduce((a, b) => a + b, 0) / iv.length)); }
      E.audio(); const c = E.audio(); if (c) click(c, c.currentTime + 0.005, 1);
    };
    document.querySelectorAll('[data-mb]').forEach((b) => b.onclick = () => { S.beats = +b.dataset.mb; saveS(); ui(); });
    document.querySelectorAll('[data-ms]').forEach((b) => b.onclick = () => { S.sub = +b.dataset.ms; saveS(); ui(); });
    $('macc').onclick = () => { S.accent = !S.accent; saveS(); ui(); };
    A.onLeave(stopM);
    ui();
  }

  /* ================= Partition en pleine page ================= */
  function layout(song, W) {
    const bar = song.bar || 4, pickup = song.pickup || 0, both = MU.hasBoth(song);
    const total = window.Course ? window.Course.bars(song) : Math.ceil(song.length / bar);
    const starts = []; for (let k = 1; k <= total; k++) starts.push(k <= 1 ? 0 : pickup + (k - 1) * bar);
    const ends = starts.map((s, i) => (i + 1 < starts.length ? starts[i + 1] : song.length));
    const small = W < 640, u = small ? 24 : 40, nw = small ? 21 : 30; /* pixels par temps, par note */
    const widths = starts.map((s, i) => {
      const n = new Set(song.notes.filter((x) => x.t >= s - 1e-6 && x.t < ends[i] - 1e-6).map((x) => x.t)).size;
      return Math.max((ends[i] - s) * u, n * nw) + (small ? 14 : 20);
    });
    const clefW = small ? 44 : 56, lines = []; let cur = { bars: [], w: clefW };
    widths.forEach((w, i) => { if (cur.bars.length && cur.w + w > W) { lines.push(cur); cur = { bars: [], w: clefW }; } cur.bars.push({ k: i + 1, s: starts[i], e: ends[i], w }); cur.w += w; });
    if (cur.bars.length) lines.push(cur);
    /* étire chaque ligne (sauf la dernière si elle est courte) à toute la largeur */
    lines.forEach((L, li) => { const extra = W - L.w; if (extra > 0 && (li < lines.length - 1 || L.w > W * 0.7)) L.bars.forEach((b) => { b.w += extra / L.bars.length; }); });
    return { lines, both, clef: MU.clefFor(song.notes), clefW };
  }
  function Score(param) {
    const song = MU.song(param) || MU.SONGS[0];
    MU.hands(song); MU.fingers(song);
    const p = A.prof(), kid = A.isKid(), DB = A.DB;
    const opt = Object.assign({ names: kid, fing: true }, DB.input.scoreOpt || {});
    const S = { mode: 'idle', gi: 0, hot: new Set(), done: new Set(), miss: 0, ok: 0, timers: [], wrongAt: 0 };
    const groups = []; song.notes.slice().sort((a, b) => a.t - b.t || a.m - b.m).forEach((n) => { const g = groups.length && Math.abs(groups[groups.length - 1].t - n.t) < 1e-6 ? groups[groups.length - 1] : null; if (g) g.notes.push(n); else groups.push({ t: n.t, notes: [n] }); });
    A.shell('morceaux', A.header() +
      '<div class="row"><a href="' + (A.prevHash && A.prevHash.indexOf('partition') !== 0 ? '#' + A.prevHash : '#morceaux') + '" class="icon-btn" aria-label="Retour">' + A.ICON.back + '</a><div style="min-width:0;flex:1"><div class="eyebrow">Partition · ' + A.esc(song.by) + '</div><div class="h2">' + A.esc(song.title) + '</div></div></div>' +
      '<div class="score-bar"><select id="ssong" aria-label="Morceau">' + MU.SONGS.map((s) => '<option value="' + s.id + '"' + (s.id === song.id ? ' selected' : '') + '>' + A.esc(s.title) + '</option>').join('') + '</select>' +
        '<button class="btn small" id="slisten">' + A.ICON.play + ' Écouter</button><button class="btn small" id="sread">' + (kid ? 'Je joue en lisant' : 'Jouer en lisant') + '</button>' +
        '<label class="row small-opt"><input type="checkbox" id="snames"' + (opt.names ? ' checked' : '') + '> Noms</label><label class="row small-opt"><input type="checkbox" id="sfing"' + (opt.fing ? ' checked' : '') + '> Doigtés</label></div>' +
      '<div class="score-msg help" id="smsg">' + T('« Je joue en lisant » : la note à jouer est entourée, la partition avance quand tu la joues.', '« Jouer en lisant » : la note à jouer est surlignée, la lecture avance quand elle est jouée.') + '</div>' +
      '<div class="card score" id="sbox"></div>');
    const box = document.getElementById('sbox');
    let L = null, sysEls = [];
    function render() {
      const W = Math.max(300, Math.min(1100, box.clientWidth - 8));
      L = layout(song, W);
      const g = L.both ? 8 : 9;
      box.innerHTML = L.lines.map((line, li) => '<div class="score-sys" data-li="' + li + '"></div>').join('');
      sysEls = Array.from(box.querySelectorAll('.score-sys'));
      L.lines.forEach((line, li) => drawLine(li, g, W));
    }
    function drawLine(li, g, W) {
      const line = L.lines[li]; let x = L.clefW;
      const notes = [], barsX = [];
      line.bars.forEach((b, bi) => {
        const inner = b.w - 20;
        song.notes.forEach((n) => {
          if (n.t < b.s - 1e-6 || n.t >= b.e - 1e-6) return;
          const gi = groups.findIndex((G) => Math.abs(G.t - n.t) < 1e-6);
          const col = S.done.has(gi) ? 'var(--good)' : S.hot.has(gi) ? 'var(--accent)' : undefined;
          notes.push({ m: n.m, d: n.d, h: n.h, fl: n.fl, x: x + 12 + (n.t - b.s) / Math.max(0.001, b.e - b.s) * inner, color: col, label: opt.names ? MU.natName(n.m, n.fl) : '', finger: opt.fing ? n.f : null });
        });
        x += b.w; barsX.push({ x: x - 2, n: bi === 0 ? null : null });
      });
      /* numéro de la première mesure de la ligne */
      barsX.unshift({ x: L.clefW - 6, n: line.bars[0].k });
      const H = L.both ? 210 : 120;
      sysEls[li].innerHTML = L.both
        ? MU.staff({ notes, grand: true, width: W, height: H, gap: g, top: g * 3.4, sep: g * 5.2, bars: barsX })
        : MU.staff({ notes, clef: L.clef, width: W, height: H, gap: g, top: g * 3.4, bars: barsX });
    }
    function lineOfGroup(gi) { const t = groups[gi].t; return L.lines.findIndex((l) => l.bars.some((b) => t >= b.s - 1e-6 && t < b.e - 1e-6)); }
    function refresh(gis) {
      const g = L.both ? 8 : 9, W = Math.max(300, Math.min(1100, box.clientWidth - 8));
      const set = new Set(gis.map(lineOfGroup)); set.forEach((li) => { if (li >= 0) drawLine(li, g, W); });
    }
    function focus(gi) { const li = lineOfGroup(gi), el = sysEls[li]; if (el) { const r = el.getBoundingClientRect(); if (r.top < 70 || r.bottom > innerHeight - 20) el.scrollIntoView({ behavior: 'smooth', block: 'center' }); } }
    function stopAll() { S.timers.forEach(clearTimeout); S.timers = []; for (let m = 21; m <= 108; m++) E.sound.stop(m); const old = [...S.hot, ...S.done]; S.hot.clear(); S.done.clear(); S.mode = 'idle'; if (L) refresh(old); lightsOff(); setBtns(); }
    const lit = new Set();
    const lightsOff = () => { lit.forEach((m) => E.midi.light(m, false)); lit.clear(); };
    function setBtns() {
      document.getElementById('slisten').innerHTML = S.mode === 'listen' ? 'Arrêter' : A.ICON.play + ' Écouter';
      document.getElementById('sread').textContent = S.mode === 'read' ? 'Arrêter' : T('Je joue en lisant', 'Jouer en lisant');
    }
    function listen() {
      stopAll(); S.mode = 'listen'; setBtns(); E.audio(); E.sound.enabled = true;
      const spb = 60 / song.tempo * 1000;
      groups.forEach((G, gi) => {
        S.timers.push(setTimeout(() => {
          const prev = [...S.hot]; S.hot.clear(); S.hot.add(gi); refresh(prev.concat([gi])); focus(gi);
          G.notes.forEach((n) => { E.sound.play(n.m, n.h === 'g' ? 70 : 90); S.timers.push(setTimeout(() => E.sound.stop(n.m), n.d * spb * 0.92)); });
        }, 300 + G.t * spb));
      });
      S.timers.push(setTimeout(() => stopAll(), 300 + song.length * spb + 300));
    }
    async function read() {
      stopAll(); await A.startInput(); S.mode = 'read'; S.gi = 0; S.ok = 0; S.miss = 0; S.pressed = new Set(); setBtns();
      document.getElementById('smsg').textContent = T('Joue la note entourée.', 'Jouez la note surlignée.');
      hotRead();
    }
    function hotRead() {
      const prev = [...S.hot]; S.hot.clear(); lightsOff();
      if (S.gi >= groups.length) { finishRead(); refresh(prev); return; }
      S.hot.add(S.gi); refresh(prev.concat([S.gi])); focus(S.gi);
      if (DB.input.lights) groups[S.gi].notes.forEach((n) => { E.midi.light(n.m, true, n.h); lit.add(n.m); });
    }
    function finishRead() {
      const acc = S.ok + S.miss ? Math.round(S.ok / (S.ok + S.miss) * 100) : 0;
      S.mode = 'idle'; setBtns();
      const coins = Math.round(acc / 10); A.addCoins(p, coins); A.save();
      document.getElementById('smsg').innerHTML = '<b>' + acc + ' %</b> · ' + S.ok + ' justes, ' + S.miss + ' fausses' + (coins ? ' · +' + coins + ' pièces' : '') + '. ' + T('Bravo, tu as lu toute la partition !', 'Lecture terminée.');
      if (window.Trophies) { window.Trophies.markDay(p); setTimeout(() => window.Trophies.check(), 600); }
      setTimeout(() => { const d = [...S.done]; S.done.clear(); refresh(d); }, 2500);
    }
    E.expect = (m) => S.mode === 'read' && groups[S.gi] && groups[S.gi].notes.some((n) => n.m === m);
    const off = E.on((ev) => {
      if (ev.type !== 'on' || S.mode !== 'read') return;
      const G = groups[S.gi]; if (!G) return;
      if (G.notes.some((n) => n.m === ev.midi)) {
        S.pressed.add(ev.midi);
        if (G.notes.every((n) => S.pressed.has(n.m) || E.held.has(n.m))) { S.ok += G.notes.length; S.done.add(S.gi); S.gi++; S.pressed = new Set(); hotRead(); }
      } else { S.miss++; const now = performance.now(); if (now - S.wrongAt > 700) { S.wrongAt = now; const el = sysEls[lineOfGroup(S.gi)]; if (el) { el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); } } }
    });
    A.onLeave(() => { off(); E.expect = null; stopAll(); A.stopInput(); });
    document.getElementById('slisten').onclick = () => (S.mode === 'listen' ? stopAll() : listen());
    document.getElementById('sread').onclick = () => (S.mode === 'read' ? stopAll() : read());
    document.getElementById('ssong').onchange = (e) => { location.hash = '#partition-' + e.target.value; };
    document.getElementById('snames').onchange = (e) => { opt.names = e.target.checked; DB.input.scoreOpt = opt; A.save(); render(); };
    document.getElementById('sfing').onchange = (e) => { opt.fing = e.target.checked; DB.input.scoreOpt = opt; A.save(); render(); };
    const ro = new ResizeObserver(() => render()); ro.observe(box); A.onLeave(() => ro.disconnect());
    render();
  }

  /* ================= Jouer d'oreille : retrouver un air ================= */
  function Ear(param) {
    const p = A.prof(), kid = A.isKid(), DB = A.DB;
    const pool = MU.SONGS.filter((s) => !s.perso && s.level <= 3 && s.kind !== 'exercice' && !s.lh && s.hand !== 'gauche');
    p.ear = p.ear || {};
    let song = MU.song(param) && pool.includes(MU.song(param)) ? MU.song(param) : pool.find((s) => !p.ear[s.id]) || pool[0];
    MU.hands(song);
    const total = window.Course.bars(song), ph = window.Course.phrases(total);
    const bar = song.bar || 4, pickup = song.pickup || 0, bs = (k) => (k <= 1 ? 0 : pickup + (k - 1) * bar);
    /* les phrases à retrouver : la mélodie (note la plus aiguë de chaque accord) */
    const phrases = ph.map(([a, b]) => {
      const t0 = bs(a), t1 = b >= total ? song.length + 1 : bs(b + 1);
      const ts = Array.from(new Set(song.notes.filter((n) => n.t >= t0 - 1e-6 && n.t < t1 - 1e-6).map((n) => n.t))).sort((x, y) => x - y);
      return ts.map((t) => { const ns = song.notes.filter((n) => Math.abs(n.t - t) < 1e-6); const top = ns.reduce((a2, b2) => (b2.m > a2.m ? b2 : a2)); return { m: top.m, t: t - t0, d: top.d }; });
    }).filter((x) => x.length);
    const S = { pi: 0, ni: 0, tries: 0, found: 0, shown: 0, said: false, playing: [], wrong: 0 };
    const ms = song.notes.map((n) => n.m); let lo = Math.min(...ms) - 2, hi = Math.max(...ms) + 2; lo = lo - (lo % 12); hi = hi + ((12 - (hi % 12)) % 12); if (hi - lo < 24) hi = lo + 24;
    A.shell('morceaux', A.header() +
      '<div class="row"><a href="#morceaux" class="icon-btn" aria-label="Retour">' + A.ICON.back + '</a><div style="min-width:0"><div class="eyebrow">' + T('Joue d\'oreille', 'Jouer d\'oreille') + '</div><div class="h2">' + T('Retrouve l\'air', 'Retrouver un air') + '</div></div></div>' +
      '<div class="ear-songs" role="group" aria-label="Choisir l\'air">' + pool.map((s) => '<a class="chip small' + (s === song ? ' on' : '') + '" href="#oreille-jeu-' + s.id + '">' + (p.ear[s.id] ? '✓ ' : '') + A.esc(s.title) + '</a>').join('') + '</div>' +
      '<div class="card exo-card" id="ecard"></div>' +
      '<div class="kbd-wrap"><div class="kbd exo-kbd" id="ekbd" aria-label="Clavier"></div></div>');
    const card = document.getElementById('ecard');
    const keys = window.Path.keyboard(document.getElementById('ekbd'), lo, hi, kid);
    const lit = new Set();
    const clear = () => { Object.values(keys).forEach((k) => k.classList.remove('target', 'found')); lit.forEach((m) => E.midi.light(m, false)); lit.clear(); };
    const show = (m) => { if (keys[m]) keys[m].classList.add('target'); if (DB.input.lights) { E.midi.light(m, true, m < 60 ? 'g' : 'd'); lit.add(m); } };
    function playPhrase(i, cb) {
      S.playing.forEach(clearTimeout); S.playing = [];
      E.audio(); const was = E.sound.enabled; E.sound.enabled = true;
      const spb = 60 / Math.min(song.tempo, 96) * 1000, ph2 = phrases[i];
      if (!ph2) { E.sound.enabled = was; return; }
      ph2.forEach((n) => { S.playing.push(setTimeout(() => E.sound.play(n.m, 85), 150 + n.t * spb)); S.playing.push(setTimeout(() => E.sound.stop(n.m), 150 + (n.t + n.d * 0.9) * spb)); });
      const end = ph2[ph2.length - 1]; S.playing.push(setTimeout(() => { E.sound.enabled = DB.input.source === 'micro' ? false : was; cb && cb(); }, 250 + (end.t + end.d) * spb));
    }
    const target = () => phrases[S.pi] && phrases[S.pi][S.ni];
    function draw(msg, mood) {
      const ph2 = phrases[S.pi];
      if (!ph2) {
        const pct = Math.round(S.found / Math.max(1, S.found + S.shown) * 100);
        card.innerHTML = '<div class="eyebrow">' + T('Bravo !', 'Terminé') + '</div><div class="challenge"><div class="mascot" style="color:var(--text)">' + M.svg(p.mascot, 'happy') + '</div><div><div class="ask">' + A.esc(song.title) + '</div><div class="help">' + S.found + ' notes trouvées seul' + (S.shown ? ', ' + S.shown + ' avec un indice' : '') + ' · ' + pct + ' %</div></div></div>' +
          '<div class="help">' + T('Tu as retrouvé tout l\'air rien qu\'en l\'écoutant. C\'est ça, jouer d\'oreille !', 'Air entièrement retrouvé à l\'oreille.') + '</div>' +
          '<div class="row" style="flex-wrap:wrap"><button class="btn" id="eagain">Recommencer</button>' + (pool.find((s) => !p.ear[s.id]) ? '<a class="btn ghost" href="#oreille-jeu-' + pool.find((s) => !p.ear[s.id]).id + '">Un autre air</a>' : '') + '</div>';
        document.getElementById('eagain').onclick = () => A.route();
        return;
      }
      const t = target();
      card.innerHTML = '<div class="between"><span class="eyebrow">Phrase ' + (S.pi + 1) + ' sur ' + phrases.length + '</span><div class="pips">' + ph2.map((_, k) => '<i class="' + (k < S.ni ? 'ok' : '') + '"></i>').join('') + '</div></div>' +
        '<div class="challenge"><div class="mascot" id="em" style="color:var(--text)">' + M.svg(p.mascot, mood || 'idle') + '</div><div>' +
          '<div class="label">' + (msg || (S.ni === 0 ? T('Écoute, puis rejoue la phrase. La première note est allumée.', 'Écoutez, puis rejouez la phrase. La première note est indiquée.') : T('Continue : quelle est la note suivante ?', 'Note suivante ?'))) + '</div>' +
          '<div class="help">' + S.ni + ' note' + (S.ni > 1 ? 's' : '') + ' sur ' + ph2.length + (S.ni === 0 ? ' · on commence par ' + MU.natName(t.m) : '') + '</div></div></div>' +
        '<div class="row" style="flex-wrap:wrap"><button class="btn" id="eplay">' + A.ICON.play + ' ' + T('Écouter la phrase', 'Écouter la phrase') + '</button><button class="btn ghost" id="ehint">' + T('Un indice', 'Indice') + '</button></div>';
      document.getElementById('eplay').onclick = () => playPhrase(S.pi);
      document.getElementById('ehint').onclick = () => { const tt = target(); if (!tt) return; clear(); show(tt.m); S.hinted = true; draw(T('La touche qui brille, c\'est la bonne.', 'La note suivante est indiquée.'), 'idle'); };
      clear(); if (S.ni === 0) show(t.m);
    }
    function nextNote() {
      S.ni++; S.tries = 0; S.hinted = false; clear();
      if (S.ni >= phrases[S.pi].length) {
        S.pi++; S.ni = 0;
        if (S.pi >= phrases.length) { p.ear[song.id] = Date.now(); p.stats = p.stats || {}; p.stats.byEar = true; A.addCoins(p, 20); A.save(); if (window.Trophies) { window.Trophies.markDay(p); setTimeout(() => window.Trophies.check(), 800); } draw(); return; }
        draw(T('Super ! Phrase suivante…', 'Phrase retrouvée. Suivante :'), 'happy');
        setTimeout(() => playPhrase(S.pi), 700);
        return;
      }
      draw(null, 'happy');
    }
    E.expect = (m) => { const t = target(); return !!t && t.m % 12 === m % 12; };
    const off = E.on((ev) => {
      const k = keys[ev.midi]; if (k) k.classList.toggle('on', ev.type === 'on');
      if (ev.type !== 'on') return;
      const t = target(); if (!t) return;
      if (ev.midi % 12 === t.m % 12) { if (S.ni > 0) { if (S.hinted || S.tries >= 3) S.shown++; else S.found++; } nextNote(); return; }
      S.tries++;
      const dir = ev.midi < t.m ? T('Plus aigu ↑ (plus à droite)', 'Plus aigu ↑') : T('Plus grave ↓ (plus à gauche)', 'Plus grave ↓');
      if (S.tries >= 3) { clear(); show(t.m); draw(T('Regarde, c\'est cette touche-là.', 'C\'est cette note.'), 'oops'); }
      else draw(dir, 'oops');
      const el = document.getElementById('em'); if (el) { el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); }
    });
    A.onLeave(() => { off(); E.expect = null; S.playing.forEach(clearTimeout); clear(); A.stopInput(); });
    card.innerHTML = '<div class="eyebrow">' + A.esc(song.title) + '</div><div class="challenge"><div class="mascot" style="color:var(--text)">' + M.svg(p.mascot, 'happy') + '</div><div><div class="label">' + T('Octave joue une phrase de l\'air. Tu la retrouves sur le clavier, note par note.', 'Octave joue une phrase ; retrouvez-la au clavier, note par note.') + '</div><div class="help">' + T('Si tu te trompes, Octave te dit si c\'est plus aigu ou plus grave.', 'En cas d\'erreur, Octave indique s\'il faut monter ou descendre.') + '</div></div></div>' +
      '<button class="btn" id="ego">' + A.ICON.play + T(' C\'est parti', ' Commencer') + '</button>';
    document.getElementById('ego').onclick = async () => { await A.startInput(); draw(); setTimeout(() => playPhrase(0), 300); };
  }

  A.screens.metronome = Metronome;
  A.screens.partition = Score;
  A.screens.oreille = (param) => Ear(String(param || '').replace(/^jeu-?/, ''));
})();
