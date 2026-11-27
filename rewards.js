/* Récompenses : boutique (pièces), trophées (médailles, coupes), accessoires de mascotte, effets de victoire. */
(function () {
  'use strict';
  const A = window.App, E = window.Engine, M = window.Mascots;

  /* ================= Médailles et coupes (SVG) ================= */
  const TIER = {
    bronze: { a: '#B8692E', b: '#F0B07A', c: '#7A3F14', name: 'Bronze' },
    argent: { a: '#9AA6B4', b: '#F2F5F8', c: '#5B6573', name: 'Argent' },
    or: { a: '#E0A100', b: '#FFE58A', c: '#8A5A00', name: 'Or' },
    diamant: { a: '#36B9E8', b: '#E2FAFF', c: '#0F5F80', name: 'Diamant' }
  };
  let gid = 0;
  function badge(shape, tier, glyph, ribbon) {
    const t = TIER[tier] || TIER.bronze, id = 'g' + (++gid);
    const grad = '<defs><linearGradient id="' + id + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + t.b + '"/><stop offset=".55" stop-color="' + t.a + '"/><stop offset="1" stop-color="' + t.c + '"/></linearGradient></defs>';
    const g = '<text x="60" y="' + (shape === 'cup' ? 62 : 80) + '" text-anchor="middle" font-family="Bebas Neue, Impact, sans-serif" font-size="' + (glyph.length > 2 ? 22 : 34) + '" fill="' + t.c + '">' + glyph + '</text>';
    let body = '';
    if (shape === 'medal') {
      body = '<path d="M40 6h16l12 40H52z" fill="' + (ribbon || '#3D6BFF') + '"/><path d="M80 6H64L52 46h16z" fill="' + (ribbon ? shade(ribbon) : '#E2483D') + '"/>' +
        '<circle cx="60" cy="72" r="36" fill="url(#' + id + ')" stroke="' + t.c + '" stroke-width="3"/><circle cx="60" cy="72" r="27" fill="none" stroke="' + t.b + '" stroke-width="2" opacity=".8"/>' + g;
    } else if (shape === 'cup') {
      body = '<path d="M34 18h52v18c0 22-12 36-26 36S34 58 34 36z" fill="url(#' + id + ')" stroke="' + t.c + '" stroke-width="3"/>' +
        '<path d="M34 26H20c0 16 8 24 16 24M86 26h14c0 16-8 24-16 24" fill="none" stroke="' + t.c + '" stroke-width="5" stroke-linecap="round"/>' +
        '<rect x="54" y="72" width="12" height="16" fill="url(#' + id + ')"/><rect x="38" y="88" width="44" height="12" rx="3" fill="url(#' + id + ')" stroke="' + t.c + '" stroke-width="2"/>' +
        '<rect x="44" y="100" width="32" height="10" rx="2" fill="' + t.c + '"/>' + g;
    } else if (shape === 'star') {
      body = '<path d="M60 8l14.7 29.8 32.9 4.8-23.8 23.2 5.6 32.7L60 83.1 30.6 98.5l5.6-32.7L12.4 42.6l32.9-4.8z" fill="url(#' + id + ')" stroke="' + t.c + '" stroke-width="3" stroke-linejoin="round" transform="translate(0 6)"/>' +
        '<text x="60" y="78" text-anchor="middle" font-family="Bebas Neue, Impact, sans-serif" font-size="' + (glyph.length > 2 ? 18 : 26) + '" fill="' + t.c + '">' + glyph + '</text>';
    } else { /* flamme */
      body = '<path d="M60 10c8 22 32 30 32 58a32 32 0 0 1-64 0c0-14 8-24 14-30 0 12 6 18 12 18-2-18 0-30 6-46z" fill="url(#' + id + ')" stroke="' + t.c + '" stroke-width="3" stroke-linejoin="round"/>' +
        '<text x="60" y="88" text-anchor="middle" font-family="Bebas Neue, Impact, sans-serif" font-size="26" fill="' + t.c + '">' + glyph + '</text>';
    }
    return '<svg viewBox="0 0 120 120" aria-hidden="true">' + grad + body + '</svg>';
  }
  function shade(hex) { const n = parseInt(hex.slice(1), 16), r = (n >> 16) * 0.7, g = ((n >> 8) & 255) * 0.7, b = (n & 255) * 0.7; return 'rgb(' + (r | 0) + ',' + (g | 0) + ',' + (b | 0) + ')'; }

  /* ================= Trophées ================= */
  const PA = () => window.Path;
  const worldDone = (p, id) => { const w = PA() && PA().WORLDS.find((x) => x.id === id); return !!w && !w.soon && w.steps.every((s) => PA().isDone(p, s)); };
  const songsWith = (p, n) => Object.values(p.songs || {}).filter((s) => s.stars >= n).length;
  const st = (p) => p.stats || {};
  function streak(p) {
    const days = (st(p).days || []).slice().sort(); if (!days.length) return 0;
    const d = (s) => Math.round(new Date(s + 'T12:00:00').getTime() / 864e5), today = d(dayKey());
    let k = days.length - 1; if (today - d(days[k]) > 1) return 0;
    let n = 1; while (k > 0 && d(days[k]) - d(days[k - 1]) === 1) { n++; k--; }
    return n;
  }
  const TROPHIES = [
    { id: 'm1', name: 'Premiers pas', kid: 'Monde 1 : Le garage', desc: 'Terminer le Monde 1', shape: 'medal', tier: 'or', glyph: '1', ribbon: '#3D6BFF', shiny: true, coins: 50, test: (p) => worldDone(p, 'm1') },
    { id: 'm2', name: 'Lire et compter', kid: 'Monde 2 : La salle des fêtes', desc: 'Terminer le Monde 2', shape: 'medal', tier: 'or', glyph: '2', ribbon: '#1FA67A', shiny: true, coins: 50, test: (p) => worldDone(p, 'm2') },
    { id: 'm3', name: 'La main gauche', kid: 'Monde 3 : Le club', desc: 'Terminer le Monde 3', shape: 'medal', tier: 'or', glyph: '3', ribbon: '#B04DFF', shiny: true, coins: 50, test: (p) => worldDone(p, 'm3') },
    { id: 'm4', name: 'Les deux mains', kid: 'Monde 4 : La grande salle', desc: 'Terminer le Monde 4', shape: 'medal', tier: 'or', glyph: '4', ribbon: '#FF7A3D', shiny: true, coins: 60, test: (p) => worldDone(p, 'm4') },
    { id: 'm5', name: 'Plus loin', kid: 'Monde 5 : Le stade', desc: 'Terminer le Monde 5', shape: 'medal', tier: 'diamant', glyph: '5', ribbon: '#E2483D', shiny: true, coins: 80, test: (p) => worldDone(p, 'm5') },
    { id: 'noel', name: 'Concert de Noël', desc: 'Réussir 3 chants de Noël', shape: 'star', tier: 'or', glyph: '✶', shiny: true, coins: 30, test: (p) => window.Music.SONGS.filter((s) => s.pack === 'noel' && ((p.songs || {})[s.id] || {}).stars >= 1).length >= 3 },
    { id: 'cours', name: 'Bon élève', desc: 'Terminer un cours « Apprendre ce morceau »', shape: 'cup', tier: 'argent', glyph: '✓', coins: 30, test: (p) => Object.values(p.courses || {}).some((c) => c.done) },
    { id: 'oreille', name: 'Oreille d\'or', desc: 'Retrouver un air entier à l\'oreille', shape: 'medal', tier: 'or', glyph: '♪', ribbon: '#3DB4FF', coins: 30, test: (p) => !!st(p).byEar },
    { id: 'song1', name: 'Premier morceau', desc: 'Jouer un morceau jusqu\'au bout', shape: 'star', tier: 'bronze', glyph: '♪', coins: 10, test: (p) => songsWith(p, 0) >= 1 },
    { id: 'star3', name: 'Trois étoiles', desc: 'Obtenir 3 étoiles sur un morceau', shape: 'star', tier: 'argent', glyph: '★', coins: 15, test: (p) => songsWith(p, 3) >= 1 },
    { id: 'star3x5', name: 'Collection d\'étoiles', desc: '3 étoiles sur 5 morceaux', shape: 'cup', tier: 'argent', glyph: '5', coins: 30, test: (p) => songsWith(p, 3) >= 5 },
    { id: 'star3x10', name: 'Virtuose', desc: '3 étoiles sur 10 morceaux', shape: 'cup', tier: 'or', glyph: '10', shiny: true, coins: 60, test: (p) => songsWith(p, 3) >= 10 },
    { id: 'defi', name: 'Dans le rythme', desc: '2 étoiles en mode Défi', shape: 'medal', tier: 'argent', glyph: '♩', ribbon: '#E2483D', coins: 20, test: (p) => !!st(p).defi2 },
    { id: 'perfect', name: 'Sans faute', desc: '100 % en mode Défi sur un morceau entier', shape: 'star', tier: 'diamant', glyph: '100', shiny: true, coins: 60, test: (p) => !!st(p).perfect },
    { id: 'combo25', name: 'En série', desc: '25 notes justes d\'affilée', shape: 'medal', tier: 'bronze', glyph: '25', ribbon: '#FF9F1C', coins: 15, test: (p) => (st(p).bestCombo || 0) >= 25 },
    { id: 'combo50', name: 'Inarrêtable', desc: '50 notes justes d\'affilée', shape: 'medal', tier: 'argent', glyph: '50', ribbon: '#FF9F1C', coins: 30, test: (p) => (st(p).bestCombo || 0) >= 50 },
    { id: 'gauche', name: 'Main gauche', desc: 'Réussir un morceau à la main gauche', shape: 'medal', tier: 'bronze', glyph: 'G', ribbon: '#B04DFF', coins: 15, test: (p) => !!st(p).leftHand },
    { id: 'deuxmains', name: 'Deux mains', desc: 'Réussir un morceau entier à deux mains', shape: 'cup', tier: 'or', glyph: '2', shiny: true, coins: 50, test: (p) => !!st(p).twoHands },
    { id: 'boucle', name: 'Persévérant', desc: 'Travailler un passage 5 tours de suite', shape: 'medal', tier: 'bronze', glyph: '↻', ribbon: '#1FA67A', coins: 15, test: (p) => (st(p).loops || 0) >= 5 },
    { id: 'duo', name: 'En duo', desc: 'Jouer un morceau en duo', shape: 'cup', tier: 'argent', glyph: '♥', coins: 30, test: (p) => !!st(p).duo },
    { id: 'perso', name: 'Ma musique', desc: 'Importer son propre morceau', shape: 'star', tier: 'bronze', glyph: '♫', coins: 10, test: () => { try { return (JSON.parse(localStorage.getItem('octave.songs')) || []).length > 0; } catch (e) { return false; } } },
    { id: 'jours3', name: 'Trois jours', desc: 'Jouer 3 jours d\'affilée', shape: 'flame', tier: 'bronze', glyph: '3', coins: 20, test: (p) => streak(p) >= 3 || (st(p).bestStreak || 0) >= 3 },
    { id: 'jours7', name: 'Une semaine', desc: 'Jouer 7 jours d\'affilée', shape: 'flame', tier: 'or', glyph: '7', shiny: true, coins: 60, test: (p) => streak(p) >= 7 || (st(p).bestStreak || 0) >= 7 },
    { id: 'riche', name: 'Tirelire', desc: 'Gagner 500 pièces au total', shape: 'medal', tier: 'or', glyph: '500', ribbon: '#FFC23D', coins: 0, test: (p) => A.earnedOf(p) >= 500 }
  ];
  const tName = (t) => (A.isKid() && t.kid ? t.kid : t.name);
  const badgeOf = (t) => badge(t.shape, t.tier, t.glyph, t.ribbon);

  function dayKey(d) { d = d || new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  /* on note les jours où l'on a joué (pour les séries de jours) */
  function markDay(p) {
    p = p || A.prof(); if (!p) return;
    p.stats = p.stats || {}; const days = p.stats.days = p.stats.days || [], k = dayKey();
    if (days[days.length - 1] !== k) { days.push(k); if (days.length > 40) days.shift(); }
    p.stats.bestStreak = Math.max(p.stats.bestStreak || 0, streak(p));
  }

  let queue = [], showing = false;
  /* vérifie les trophées d'un profil ; montre les nouveaux (le profil en cours), crédite les pièces */
  function check(p, silent) {
    p = p || A.prof(); if (!p) return [];
    p.trophies = p.trophies || {};
    const fresh = TROPHIES.filter((t) => !p.trophies[t.id] && (() => { try { return t.test(p); } catch (e) { return false; } })());
    if (!fresh.length) return [];
    fresh.forEach((t) => { p.trophies[t.id] = Date.now(); A.addCoins(p, t.coins); });
    A.save();
    if (!silent && p === A.prof()) { queue = queue.concat(fresh); if (!showing) next(); }
    return fresh;
  }
  function next() {
    const t = queue.shift(); if (!t) { showing = false; return; }
    showing = true;
    const d = document.createElement('div'); d.className = 'trophy-pop'; d.setAttribute('role', 'dialog'); d.setAttribute('aria-label', 'Nouvelle récompense');
    d.innerHTML = '<div class="tp-card"><div class="eyebrow">' + (A.isKid() ? 'Nouvelle récompense !' : 'Récompense débloquée') + '</div>' +
      '<div class="tp-badge' + (t.shiny ? ' shiny' : '') + '">' + badgeOf(t) + '</div>' +
      '<div class="h2">' + A.esc(tName(t)) + '</div><div class="help">' + A.esc(t.desc) + ' · ' + TIER[t.tier].name + '</div>' +
      (t.coins ? '<div class="chip" style="align-self:center"><span class="coin"></span>+' + t.coins + ' pièces</div>' : '') +
      '<button class="btn" id="tpok">' + (A.isKid() ? 'Trop bien !' : 'Super') + '</button></div>';
    document.body.appendChild(d);
    fanfare(); celebrate('confetti', 1600);
    if (A.sayAuto && A.sayAuto()) A.say('Nouvelle récompense : ' + tName(t) + ' !');
    const close = () => { d.remove(); setTimeout(next, 250); };
    d.querySelector('#tpok').onclick = close;
  }
  function fanfare() {
    const c = E.audio(); if (!c) return;
    [72, 76, 79, 84].forEach((m, i) => setTimeout(() => { E.sound.enabled = true; E.sound.play(m, 80); setTimeout(() => E.sound.stop(m), 260); }, i * 110));
  }

  /* ================= Effets de victoire (canvas plein écran) ================= */
  function celebrate(kind, ms) {
    if (!kind) return;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const cv = document.createElement('canvas'); cv.className = 'fx-canvas'; document.body.appendChild(cv);
    const dpr = window.devicePixelRatio || 1, W = innerWidth, H = innerHeight; cv.width = W * dpr; cv.height = H * dpr;
    const c = cv.getContext('2d'); c.scale(dpr, dpr);
    const css = getComputedStyle(document.documentElement), acc = css.getPropertyValue('--accent').trim() || '#FFC23D';
    const COLORS = [acc, '#FF5D8F', '#3DF5D2', '#FFD23F', '#6E8BFF', '#FF8A3D'];
    const parts = [], t0 = performance.now(), dur = ms || 2400;
    const rnd = (a, b) => a + Math.random() * (b - a);
    if (kind === 'confetti') for (let i = 0; i < 140; i++) parts.push({ x: rnd(0, W), y: rnd(-H * 0.4, -10), vx: rnd(-1, 1), vy: rnd(2, 5), r: rnd(0, 6.3), vr: rnd(-0.2, 0.2), w: rnd(6, 11), h: rnd(3, 6), col: COLORS[i % COLORS.length] });
    if (kind === 'stars') for (let i = 0; i < 60; i++) parts.push({ x: rnd(0, W), y: rnd(-H * 0.5, -10), vx: rnd(-0.4, 0.4), vy: rnd(1.5, 3.5), s: rnd(6, 14), r: rnd(0, 6.3), vr: rnd(-0.05, 0.05), col: i % 3 ? '#FFD23F' : '#FFFFFF' });
    const bursts = [];
    if (kind === 'fireworks') for (let b = 0; b < 5; b++) bursts.push({ at: b * 380, x: rnd(W * 0.15, W * 0.85), y: rnd(H * 0.15, H * 0.45), col: COLORS[b % COLORS.length], done: false });
    function star(x, y, s, r) { c.save(); c.translate(x, y); c.rotate(r); c.beginPath(); for (let k = 0; k < 10; k++) { const a = k * Math.PI / 5, rr = k % 2 ? s * 0.45 : s; c.lineTo(Math.sin(a) * rr, -Math.cos(a) * rr); } c.closePath(); c.fill(); c.restore(); }
    function frame(now) {
      const el = now - t0; c.clearRect(0, 0, W, H);
      bursts.forEach((b) => { if (!b.done && el >= b.at) { b.done = true; for (let i = 0; i < 46; i++) { const a = i / 46 * Math.PI * 2, v = rnd(2, 4.5); parts.push({ x: b.x, y: b.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 1, col: b.col, fw: true }); } } });
      const fade = Math.max(0, Math.min(1, (dur - el) / 500));
      parts.forEach((q) => {
        q.x += q.vx; q.y += q.vy;
        if (q.fw) { q.vy += 0.05; q.vx *= 0.985; q.life -= 0.012; c.globalAlpha = Math.max(0, q.life) * fade; c.fillStyle = q.col; c.beginPath(); c.arc(q.x, q.y, 2.4, 0, 7); c.fill(); return; }
        c.globalAlpha = fade; c.fillStyle = q.col;
        if (kind === 'stars') { q.r += q.vr; star(q.x, q.y, q.s, q.r); return; }
        q.r += q.vr; q.vy += 0.03; c.save(); c.translate(q.x, q.y); c.rotate(q.r); c.fillRect(-q.w / 2, -q.h / 2, q.w, q.h); c.restore();
      });
      c.globalAlpha = 1;
      if (el < dur) requestAnimationFrame(frame); else cv.remove();
    }
    requestAnimationFrame(frame);
  }

  /* ================= Accessoires de mascotte ================= */
  /* points d'accroche par mascotte : haut de la tête (hx, hy, largeur hw), yeux (ex, ey, écart eg, rotation er), cou (nx, ny) */
  const ANCH = {
    volt: { hx: 100, hy: 42, hw: 96, ex: 100, ey: 81, eg: 34, er: 0, nx: 100, ny: 131 },
    croche: { hx: 80, hy: 108, hw: 68, ex: 86, ey: 135, eg: 24, er: -14, nx: 84, ny: 170 },
    boule: { hx: 100, hy: 40, hw: 92, ex: 100, ey: 96, eg: 44, er: 0, nx: 100, ny: 172 },
    tempo: { hx: 100, hy: 44, hw: 66, ex: 100, ey: 130, eg: 22, er: 0, nx: 100, ny: 160 }
  };
  const ACC = {
    couronne: { slot: 'head', draw: (a) => { const w = a.hw * 0.62, h = w * 0.55, x = a.hx - w / 2, y = a.hy - h + 4; return '<path d="M' + x + ' ' + (y + h) + 'L' + x + ' ' + (y + h * 0.25) + 'L' + (x + w * 0.25) + ' ' + (y + h * 0.6) + 'L' + (x + w / 2) + ' ' + y + 'L' + (x + w * 0.75) + ' ' + (y + h * 0.6) + 'L' + (x + w) + ' ' + (y + h * 0.25) + 'L' + (x + w) + ' ' + (y + h) + 'z" fill="#FFC928" stroke="#9A6A00" stroke-width="3" stroke-linejoin="round"/><circle cx="' + a.hx + '" cy="' + (y + h * 0.72) + '" r="' + (w * 0.07) + '" fill="#E2483D"/><circle cx="' + (x + w * 0.22) + '" cy="' + (y + h * 0.8) + '" r="' + (w * 0.05) + '" fill="#3D6BFF"/><circle cx="' + (x + w * 0.78) + '" cy="' + (y + h * 0.8) + '" r="' + (w * 0.05) + '" fill="#3D6BFF"/>'; } },
    magicien: { slot: 'head', draw: (a) => { const w = a.hw * 0.5, h = w * 0.95, x = a.hx - w / 2, y = a.hy - h + 2; return '<rect x="' + (a.hx - w * 0.85) + '" y="' + (a.hy - 6) + '" width="' + (w * 1.7) + '" height="9" rx="4.5" fill="#1B1B24"/><rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="4" fill="#1B1B24"/><rect x="' + x + '" y="' + (y + h * 0.62) + '" width="' + w + '" height="' + (h * 0.18) + '" fill="#B04DFF"/>'; } },
    fete: { slot: 'head', draw: (a) => { const w = a.hw * 0.4, h = w * 1.25, y = a.hy + 4; return '<path d="M' + (a.hx - w / 2) + ' ' + y + 'L' + a.hx + ' ' + (y - h) + 'L' + (a.hx + w / 2) + ' ' + y + 'z" fill="#FF5D8F" stroke="#B3245A" stroke-width="2.5" stroke-linejoin="round"/><path d="M' + (a.hx - w * 0.3) + ' ' + (y - h * 0.3) + 'l' + (w * 0.6) + ' ' + (-h * 0.12) + 'M' + (a.hx - w * 0.17) + ' ' + (y - h * 0.62) + 'l' + (w * 0.34) + ' ' + (-h * 0.08) + '" stroke="#FFD23F" stroke-width="4" stroke-linecap="round"/><circle cx="' + a.hx + '" cy="' + (y - h) + '" r="' + (w * 0.16) + '" fill="#FFD23F"/>'; } },
    star: { slot: 'eyes', draw: (a) => { const g = a.eg / 2, s = a.eg * 0.42; const st = (cx) => { let d = ''; for (let k = 0; k < 10; k++) { const ang = k * Math.PI / 5, r = k % 2 ? s * 0.5 : s; d += (k ? 'L' : 'M') + (cx + Math.sin(ang) * r).toFixed(1) + ' ' + (a.ey - Math.cos(ang) * r).toFixed(1); } return '<path d="' + d + 'z" fill="#FF5D8F" stroke="#FFFFFF" stroke-width="2.5" stroke-linejoin="round" opacity=".95"/>'; }; return '<g transform="rotate(' + a.er + ' ' + a.ex + ' ' + a.ey + ')">' + st(a.ex - g) + st(a.ex + g) + '<path d="M' + (a.ex - g * 0.35) + ' ' + a.ey + 'h' + (g * 0.7) + '" stroke="#FFFFFF" stroke-width="3"/></g>'; } },
    soleil: { slot: 'eyes', draw: (a) => { const g = a.eg / 2, rx = a.eg * 0.36, ry = a.eg * 0.26; return '<g transform="rotate(' + a.er + ' ' + a.ex + ' ' + a.ey + ')"><ellipse cx="' + (a.ex - g) + '" cy="' + a.ey + '" rx="' + rx + '" ry="' + ry + '" fill="#111" stroke="#FFD23F" stroke-width="2.5"/><ellipse cx="' + (a.ex + g) + '" cy="' + a.ey + '" rx="' + rx + '" ry="' + ry + '" fill="#111" stroke="#FFD23F" stroke-width="2.5"/><path d="M' + (a.ex - g + rx) + ' ' + a.ey + 'H' + (a.ex + g - rx) + '" stroke="#FFD23F" stroke-width="3"/><path d="M' + (a.ex - g - rx * 0.4) + ' ' + (a.ey - ry * 0.3) + 'l' + (rx * 0.5) + ' ' + (-ry * 0.4) + '" stroke="#fff" stroke-width="2" opacity=".7"/></g>'; } },
    noeud: { slot: 'neck', draw: (a) => { const w = 18; return '<path d="M' + a.nx + ' ' + a.ny + 'l-' + w + '-10v20zM' + a.nx + ' ' + a.ny + 'l' + w + '-10v20z" fill="#E2483D" stroke="#8E1F17" stroke-width="2" stroke-linejoin="round"/><circle cx="' + a.nx + '" cy="' + a.ny + '" r="5" fill="#B5281E"/>'; } }
  };
  function dress(svg, id, wear) {
    const a = ANCH[id] || ANCH.volt; let add = '';
    ['neck', 'eyes', 'head'].forEach((slot) => { const it = wear && wear[slot]; if (it && ACC[it]) add += ACC[it].draw(a); });
    return add ? svg.replace(/<\/svg>\s*$/, add + '</svg>') : svg;
  }
  const origSvg = M.svg.bind(M);
  M.svg = function (id, mood, wear) {
    const s = origSvg(id, mood), p = A.prof();
    const w = wear !== undefined ? wear : (p && p.mascot === id ? p.wear : null);
    return w ? dress(s, id, w) : s;
  };

  /* ================= Boutique ================= */
  const ITEMS = [
    { id: 'couronne', cat: 'mascotte', slot: 'head', name: 'Couronne', price: 180 },
    { id: 'magicien', cat: 'mascotte', slot: 'head', name: 'Chapeau de magicien', price: 120 },
    { id: 'fete', cat: 'mascotte', slot: 'head', name: 'Chapeau de fête', price: 70 },
    { id: 'star', cat: 'mascotte', slot: 'eyes', name: 'Lunettes de star', price: 100 },
    { id: 'soleil', cat: 'mascotte', slot: 'eyes', name: 'Lunettes de soleil', price: 80 },
    { id: 'noeud', cat: 'mascotte', slot: 'neck', name: 'Nœud papillon', price: 60 },
    { id: 'fx-confetti', cat: 'effet', slot: 'fx', fx: 'confetti', name: 'Confettis', price: 90 },
    { id: 'fx-stars', cat: 'effet', slot: 'fx', fx: 'stars', name: 'Pluie d\'étoiles', price: 120 },
    { id: 'fx-fireworks', cat: 'effet', slot: 'fx', fx: 'fireworks', name: 'Feu d\'artifice', price: 160 },
    { id: 'notes-rainbow', cat: 'notes', slot: 'notes', name: 'Notes arc-en-ciel', price: 140, sw: 'linear-gradient(90deg,#FF5D5D,#FFB13D,#FFE53D,#5DDB7A,#3DB4FF,#9B6BFF)' },
    { id: 'notes-gold', cat: 'notes', slot: 'notes', name: 'Notes en or', price: 120, sw: 'linear-gradient(180deg,#FFE58A,#E0A100)' },
    { id: 'notes-neon', cat: 'notes', slot: 'notes', name: 'Notes néon', price: 100, sw: 'linear-gradient(180deg,#3DF5D2,#B04DFF)' },
    { id: 'theme-jungle', cat: 'decor', slot: 'decor', theme: 'jungle', name: 'Décor Jungle', price: 200, kidOnly: true, sw: 'linear-gradient(135deg,#0F2A1D 50%,#FFD23F 50%)' },
    { id: 'theme-espace', cat: 'decor', slot: 'decor', theme: 'espace', name: 'Décor Espace', price: 200, kidOnly: true, sw: 'linear-gradient(135deg,#150F33 50%,#3DF5D2 50%)' }
  ];
  const CATS = [['mascotte', 'Pour ta mascotte', 'Pour votre mascotte'], ['effet', 'Fête de fin de morceau', 'Effet de fin de morceau'], ['notes', 'Couleur des notes', 'Couleur des notes'], ['decor', 'Décors', 'Décors']];

  function Shop() {
    const p = A.prof(), kid = A.isKid();
    p.owned = p.owned || {}; p.wear = p.wear || {};
    const worn = (it) => (it.slot === 'decor' ? (p.kidTheme || 'scene') === it.theme : p.wear[it.slot] === it.id);
    const preview = (it) => {
      if (it.cat === 'mascotte') { const w = {}; w[it.slot] = it.id; return '<div class="shop-pv" style="color:var(--text)">' + M.svg(p.mascot, 'happy', w) + '</div>'; }
      if (it.cat === 'effet') return '<div class="shop-pv shop-fx">' + ({ confetti: '🎉', stars: '⭐', fireworks: '🎆' })[it.fx] + '</div>';
      return '<div class="shop-pv shop-sw" style="background:' + it.sw + '"></div>';
    };
    const card = (it) => {
      const own = !!p.owned[it.id], on = own && worn(it);
      const btn = own ? '<button class="btn small' + (on ? '' : ' ghost') + '" data-wear="' + it.id + '">' + (on ? (it.slot === 'decor' ? 'Utilisé' : 'Enlever') : (it.slot === 'decor' ? 'Utiliser' : 'Mettre')) + '</button>'
        : '<button class="btn small' + (p.coins >= it.price ? '' : ' ghost') + '" data-buy="' + it.id + '"><span class="coin"></span> ' + it.price + '</button>';
      return '<div class="shop-item' + (on ? ' on' : '') + '">' + preview(it) + '<div class="label">' + A.esc(it.name) + '</div>' +
        (it.cat === 'effet' ? '<button class="say" data-try="' + it.fx + '" type="button">Essayer</button>' : '') + btn + '</div>';
    };
    const items = ITEMS.filter((it) => !it.kidOnly || kid);
    A.shell('accueil', A.header('<span class="chip"><span class="coin"></span>' + p.coins + '</span>') +
      '<div class="between"><h1 class="h1">Boutique</h1><a class="btn small ghost" href="#trophees">Trophées</a></div>' +
      '<div class="help">' + (kid ? 'Gagne des pièces en jouant (morceaux, exercices, quiz, trophées), puis offre-toi des surprises !' : 'Les pièces se gagnent en jouant : morceaux, exercices, quiz et trophées.') + '</div>' +
      CATS.map((c) => { const list = items.filter((it) => it.cat === c[0]); return list.length ? '<div class="h2">' + (kid ? c[1] : c[2]) + '</div><div class="shop-grid">' + list.map(card).join('') + '</div>' : ''; }).join(''));
    document.querySelectorAll('[data-buy]').forEach((b) => b.onclick = () => {
      const it = ITEMS.find((x) => x.id === b.dataset.buy);
      if (p.coins < it.price) { A.toast((kid ? 'Il te manque ' : 'Il manque ') + (it.price - p.coins) + ' pièces'); return; }
      if (!b.dataset.ok) { b.dataset.ok = '1'; b.innerHTML = 'Confirmer ?'; setTimeout(() => { if (document.body.contains(b)) { delete b.dataset.ok; b.innerHTML = '<span class="coin"></span> ' + it.price; } }, 3000); return; }
      p.coins -= it.price; p.owned[it.id] = Date.now();
      if (it.slot === 'decor') p.kidTheme = it.theme; else p.wear[it.slot] = it.id;
      A.save(); fanfare(); celebrate(it.fx || 'confetti', 1400); A.toast((kid ? 'Bravo, c\'est à toi : ' : 'Acheté : ') + it.name); A.route();
    });
    document.querySelectorAll('[data-wear]').forEach((b) => b.onclick = () => {
      const it = ITEMS.find((x) => x.id === b.dataset.wear);
      if (it.slot === 'decor') p.kidTheme = (p.kidTheme || 'scene') === it.theme ? 'scene' : it.theme;
      else p.wear[it.slot] = p.wear[it.slot] === it.id ? null : it.id;
      A.save(); A.route();
    });
    document.querySelectorAll('[data-try]').forEach((b) => b.onclick = (e) => { e.preventDefault(); celebrate(b.dataset.try); });
  }

  /* ================= Écran des trophées ================= */
  function Trophies() {
    const p = A.prof(), kid = A.isKid(); p.trophies = p.trophies || {};
    const n = TROPHIES.filter((t) => p.trophies[t.id]).length;
    A.shell('accueil', A.header() +
      '<div class="between"><h1 class="h1">' + (kid ? 'Tes trophées' : 'Trophées') + '</h1><a class="btn small ghost" href="#boutique">Boutique</a></div>' +
      '<div class="row"><div class="progress" style="flex:1"><i style="width:' + Math.round(n / TROPHIES.length * 100) + '%"></i></div><span class="label">' + n + ' / ' + TROPHIES.length + '</span></div>' +
      (streak(p) ? '<div class="help">Série en cours : ' + streak(p) + ' jour' + (streak(p) > 1 ? 's' : '') + ' d\'affilée</div>' : '') +
      '<div class="trophy-grid">' + TROPHIES.map((t) => {
        const got = p.trophies[t.id];
        return '<div class="trophy' + (got ? ' got' : '') + '"><div class="tp-badge' + (got && t.shiny ? ' shiny' : '') + '">' + badgeOf(t) + '</div>' +
          '<div class="label">' + A.esc(tName(t)) + '</div><div class="help">' + A.esc(t.desc) + '</div>' +
          (got ? '<div class="help" style="color:var(--accent-text)">' + new Date(got).toLocaleDateString('fr-FR') + '</div>' : (t.coins ? '<div class="help"><span class="coin" style="display:inline-block;width:12px;height:12px;vertical-align:-1px"></span> ' + t.coins + '</div>' : '')) + '</div>';
      }).join('') + '</div>');
  }

  /* les trophées se vérifient après chaque étape du parcours */
  if (window.Path && window.Path.report) {
    const orig = window.Path.report;
    window.Path.report = function (type, ref, res) { const r = orig.apply(this, arguments); markDay(); A.save(); if (!(res && res.concert)) setTimeout(() => check(), 900); return r; };
  }
  /* et à chaque retour à l'accueil ou au parcours */
  window.addEventListener('hashchange', () => { const h = location.hash; if (/^#(accueil|parcours)?$/.test(h)) setTimeout(() => check(), 700); });
  A.screens.boutique = Shop;
  A.screens.trophees = Trophies;
  window.Trophies = { check, markDay, celebrate, badge, TROPHIES, ITEMS, dress, streak, count: (p) => TROPHIES.filter((t) => (p.trophies || {})[t.id]).length };
})();
