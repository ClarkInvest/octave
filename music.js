/* Musique : morceaux, lecture des notes, dessin de portées. Convention française : Do3 = Do du milieu (MIDI 60). */
window.Music = (function () {
  const PC = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  const STEP = [0, 0, 1, 1, 2, 3, 3, 4, 4, 5, 5, 6]; /* degré de la note naturelle (ou de la note sous le dièse) */
  const SHARP = [0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 1, 0];
  const FR_NAT = ['Do', 'Ré', 'Mi', 'Fa', 'Sol', 'La', 'Si'];

  function parseNote(s) {
    const m = /^([A-G])([#b]?)(-?\d)$/.exec(s.trim());
    if (!m) throw new Error('Note illisible : ' + s);
    return 12 * (+m[3] + 1) + PC[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
  }
  /* "C4 D4:2 C4+E4:1 r:1" → [{m, t, d}] ; durée en temps (noire = 1) */
  function parse(str, h) {
    const out = []; let t = 0;
    str.trim().split(/\s+/).forEach((tok) => {
      const [n, dd] = tok.split(':'); const d = dd ? parseFloat(dd) : 1;
      if (n !== 'r') n.split('+').forEach((x) => out.push({ m: parseNote(x), t, d, h: h || 'd' }));
      t += d;
    });
    return { notes: out, length: t };
  }

  const SONGS = [
    { id: 'gamme', title: 'La gamme de Do', by: 'Exercice', level: 1, tempo: 80, kind: 'exercice',
      desc: 'Do, ré, mi, fa, sol, la, si, do : on monte puis on redescend.',
      rh: 'C4 D4 E4 F4 G4 A4 B4 C5:2 C5 B4 A4 G4 F4 E4 D4 C4:2' },
    { id: 'lune', title: 'Au clair de la lune', by: 'Chanson traditionnelle', level: 1, tempo: 90, kind: 'chanson',
      desc: 'Trois notes seulement pour commencer : do, ré, mi.',
      rh: 'C4 C4 C4 D4 E4:2 D4:2 C4 E4 D4 D4 C4:4 C4 C4 C4 D4 E4:2 D4:2 C4 E4 D4 D4 C4:4' },
    { id: 'cinq', title: 'Les cinq doigts', by: 'Exercice', level: 1, tempo: 84, kind: 'exercice',
      desc: 'Do, ré, mi, fa, sol avec les doigts 1 à 5, à l\'aller puis au retour.',
      rh: 'C4 D4 E4 F4 G4:2 G4 F4 E4 D4 C4:2 C4 E4 G4:2 F4 D4 C4:2' },
    { id: 'marche', title: 'La marche des notes', by: 'Création Octave', level: 1, tempo: 92, kind: 'groove',
      desc: 'Une petite marche sur les cinq notes de la main droite, avec des blanches pour respirer.',
      rh: 'C4 E4 G4:2 E4 C4 D4:2 E4 F4 G4 E4 D4:2 C4:2 G4 F4 E4 D4 C4 E4 D4:2 E4 F4 G4 F4 E4 D4 C4:4' },
    { id: 'riff', title: 'Le riff du concert', by: 'Création Octave', level: 1, tempo: 96, kind: 'groove',
      desc: 'Un riff de scène, à répéter jusqu\'à le jouer les yeux fermés.',
      rh: 'A3 C4 D4 E4 D4 C4 A3 G3 A3 C4 D4 E4 G4 E4 D4:2' },
    { id: 'jacques', title: 'Frère Jacques', by: 'Chanson traditionnelle', level: 1, tempo: 100, kind: 'chanson',
      desc: 'Le grand classique en canon, sur cinq notes puis un peu plus.',
      rh: 'C4 D4 E4 C4 C4 D4 E4 C4 E4 F4 G4:2 E4 F4 G4:2 G4:0.5 A4:0.5 G4:0.5 F4:0.5 E4 C4 G4:0.5 A4:0.5 G4:0.5 F4:0.5 E4 C4 C4 G3 C4:2 C4 G3 C4:2' },
    { id: 'lune2', title: 'Au clair de la lune à deux mains', by: 'Chanson traditionnelle', level: 2, tempo: 84, kind: 'chanson',
      desc: 'La mélodie à droite, une basse toute simple à gauche (Do et Sol). Travaillez chaque main seule, puis les deux.',
      rh: 'C4 C4 C4 D4 E4:2 D4:2 C4 E4 D4 D4 C4:4 C4 C4 C4 D4 E4:2 D4:2 C4 E4 D4 D4 C4:4',
      lh: 'C3:4 C3:2 G2:2 C3:2 G2:2 C3:4 C3:4 C3:2 G2:2 C3:2 G2:2 C3:4' },
    { id: 'joie', title: 'Ode à la joie', by: 'Beethoven', level: 2, tempo: 100, kind: 'classique',
      desc: 'Le thème de la 9e symphonie, sur cinq notes de la main droite.',
      rh: 'E4 E4 F4 G4 G4 F4 E4 D4 C4 C4 D4 E4 E4:1.5 D4:0.5 D4:2 E4 E4 F4 G4 G4 F4 E4 D4 C4 C4 D4 E4 D4:1.5 C4:0.5 C4:2' },
    { id: 'jingle', title: 'Jingle Bells', by: 'J. Pierpont (1857)', level: 2, tempo: 110, kind: 'chanson',
      desc: 'Le refrain de la chanson de Noël, celle qu\'on chante sur « Vive le vent ».',
      rh: 'E4 E4 E4:2 E4 E4 E4:2 E4 G4 C4:1.5 D4:0.5 E4:4 F4 F4 F4:1.5 F4:0.5 F4 E4 E4 E4:0.5 E4:0.5 E4 D4 D4 E4 D4:2 G4:2' },
    { id: 'joie2', title: 'Ode à la joie à deux mains', by: 'Beethoven', level: 3, tempo: 92, kind: 'classique',
      desc: 'Le thème à droite, les basses Do et Sol à gauche. Un vrai premier morceau à deux mains.',
      rh: 'E4 E4 F4 G4 G4 F4 E4 D4 C4 C4 D4 E4 E4:1.5 D4:0.5 D4:2 E4 E4 F4 G4 G4 F4 E4 D4 C4 C4 D4 E4 D4:1.5 C4:0.5 C4:2',
      lh: 'C3:4 G2:4 C3:4 C3:2 G2:2 C3:4 G2:4 C3:4 G2:2 C3:2' },
    { id: 'nuit', title: 'Nuit électrique', by: 'Création Octave', level: 2, tempo: 112, kind: 'groove',
      desc: 'Un motif électro en la mineur, en croches régulières.',
      rh: 'A3:0.5 C4:0.5 E4:0.5 A4:0.5 G4:0.5 E4:0.5 C4:0.5 E4:0.5 F3:0.5 A3:0.5 C4:0.5 F4:0.5 E4:0.5 C4:0.5 A3:0.5 C4:0.5 G3:0.5 B3:0.5 D4:0.5 G4:0.5 F4:0.5 D4:0.5 B3:0.5 D4:0.5 E4:0.5 G#4:0.5 B4:0.5 E5:0.5 D5:0.5 B4:0.5 G#4:0.5 E4:0.5 A4:2' },
    { id: 'elise', title: 'Lettre à Élise', by: 'Beethoven', level: 3, tempo: 66, kind: 'classique',
      desc: 'Le début célèbre, à la main droite. Prenez votre temps.', bar: 3, pickup: 1,
      rh: 'E5:0.5 D#5:0.5 E5:0.5 D#5:0.5 E5:0.5 B4:0.5 D5:0.5 C5:0.5 A4:1 r:0.5 C4:0.5 E4:0.5 A4:0.5 B4:1 r:0.5 E4:0.5 G#4:0.5 B4:0.5 C5:1 r:0.5 E4:0.5 E5:0.5 D#5:0.5 E5:0.5 D#5:0.5 E5:0.5 B4:0.5 D5:0.5 C5:0.5 A4:1 r:0.5 C4:0.5 E4:0.5 A4:0.5 B4:1 r:0.5 E4:0.5 C5:0.5 B4:0.5 A4:2' }
  ];
  /* prépare un morceau : notes de la main droite (rh) et de la main gauche (lh), triées */
  function build(s) {
    const r = parse(s.rh, s.hand === 'gauche' ? 'g' : 'd'), l = s.lh ? parse(s.lh, 'g') : { notes: [], length: 0 };
    s.notes = r.notes.concat(l.notes).sort((a, b) => a.t - b.t || a.m - b.m); s.length = Math.max(r.length, l.length);
    return s;
  }
  SONGS.forEach(build);
  /* main de chaque note : celle indiquée, sinon d'après la hauteur (sous le Do du milieu = main gauche) */
  function hands(song) { song.notes.forEach((n) => { if (n.h !== 'd' && n.h !== 'g') n.h = n.m < 60 ? 'g' : 'd'; }); return song; }
  const hasBoth = (song) => { hands(song); return song.notes.some((n) => n.h === 'g') && song.notes.some((n) => n.h === 'd'); };

  /* ---------- Portée ---------- */
  const diat = (m) => (Math.floor(m / 12) - 1) * 7 + STEP[m % 12];
  const natName = (m) => FR_NAT[STEP[m % 12]] + (SHARP[m % 12] ? '♯' : '');
  const BOTTOM = { sol: 30, fa: 18 }; /* Mi3 (E4) et Sol1 (G2) sur la ligne du bas */
  const MIDDLE = { sol: 34, fa: 22 };

  function clefPath(clef, x, top, g) {
    if (clef === 'fa') {
      const y = top + g; /* ligne du fa = 2e ligne en partant du haut */
      return '<g fill="currentColor"><circle cx="' + (x + 4) + '" cy="' + y + '" r="' + (g * 0.38) + '"/>' +
        '<path d="M' + (x + 2) + ' ' + y + 'c0-' + (g * 1.1) + ' ' + (g * 1.9) + '-' + (g * 1.3) + ' ' + (g * 2) + ' ' + (g * 0.2) + 'c' + (g * 0.1) + ' ' + (g * 1.4) + '-' + (g * 0.9) + ' ' + (g * 2.4) + '-' + (g * 2.1) + ' ' + (g * 3) + '" fill="none" stroke="currentColor" stroke-width="' + (g * 0.32) + '" stroke-linecap="round"/>' +
        '<circle cx="' + (x + g * 2.7) + '" cy="' + (y - g * 0.5) + '" r="' + (g * 0.2) + '"/><circle cx="' + (x + g * 2.7) + '" cy="' + (y + g * 0.5) + '" r="' + (g * 0.2) + '"/></g>';
    }
    /* clé de sol stylisée, enroulée autour de la 2e ligne (le sol) */
    const s = g / 10, X = (v) => (x + v * s).toFixed(1), Y = (v) => (top + v * s).toFixed(1);
    return '<path d="M' + X(13) + ' ' + Y(54) + 'C' + X(8) + ' ' + Y(57) + ' ' + X(4) + ' ' + Y(52) + ' ' + X(8) + ' ' + Y(49) + 'C' + X(11) + ' ' + Y(47) + ' ' + X(15) + ' ' + Y(50) + ' ' + X(13) + ' ' + Y(54) + 'C' + X(11) + ' ' + Y(58) + ' ' + X(17) + ' ' + Y(60) + ' ' + X(18) + ' ' + Y(54) +
      'L' + X(14) + ' ' + Y(-6) + 'C' + X(13) + ' ' + Y(-14) + ' ' + X(22) + ' ' + Y(-14) + ' ' + X(21) + ' ' + Y(-4) + 'C' + X(20) + ' ' + Y(6) + ' ' + X(4) + ' ' + Y(14) + ' ' + X(3) + ' ' + Y(28) +
      'C' + X(2) + ' ' + Y(40) + ' ' + X(22) + ' ' + Y(42) + ' ' + X(24) + ' ' + Y(32) + 'C' + X(25) + ' ' + Y(23) + ' ' + X(13) + ' ' + Y(21) + ' ' + X(11) + ' ' + Y(29) + 'C' + X(10) + ' ' + Y(34) + ' ' + X(14) + ' ' + Y(36) + ' ' + X(16) + ' ' + Y(34) + '" fill="none" stroke="currentColor" stroke-width="' + (2.2 * s).toFixed(1) + '" stroke-linecap="round" stroke-linejoin="round"/>';
  }

  /* une note (tête, hampe, crochet, point, dièse, lignes supplémentaires, nom) sur une portée dont la ligne du bas est à bottomY */
  function noteSvg(n, clef, bottomY, g, labelY) {
    let out = '';
    const x = n.x, d = diat(n.m) - BOTTOM[clef], y = bottomY - d * g / 2;
    const col = n.color || 'currentColor', rx = g * 0.68, ry = g * 0.5;
    for (let k = -2; k >= d; k -= 2) out += '<line x1="' + (x - g * 1.1) + '" x2="' + (x + g * 1.1) + '" y1="' + (bottomY - k * g / 2) + '" y2="' + (bottomY - k * g / 2) + '" stroke="' + col + '" stroke-width="1.2"/>';
    for (let k = 10; k <= d; k += 2) out += '<line x1="' + (x - g * 1.1) + '" x2="' + (x + g * 1.1) + '" y1="' + (bottomY - k * g / 2) + '" y2="' + (bottomY - k * g / 2) + '" stroke="' + col + '" stroke-width="1.2"/>';
    const hollow = n.d >= 2;
    out += '<ellipse cx="' + x + '" cy="' + y + '" rx="' + rx + '" ry="' + ry + '" transform="rotate(-20 ' + x + ' ' + y + ')" fill="' + (hollow ? 'none' : col) + '" stroke="' + col + '" stroke-width="' + (hollow ? g * 0.18 : 1) + '"/>';
    if (n.d < 4) {
      const up = diat(n.m) < MIDDLE[clef], sx = up ? x + rx - 0.6 : x - rx + 0.6, sy2 = up ? y - g * 3.4 : y + g * 3.4;
      out += '<line x1="' + sx + '" x2="' + sx + '" y1="' + y + '" y2="' + sy2 + '" stroke="' + col + '" stroke-width="' + (g * 0.13) + '"/>';
      if (n.d <= 0.5) out += '<path d="M' + sx + ' ' + sy2 + 'q' + (g * 0.9) + ' ' + (up ? g * 1.1 : -g * 1.1) + ' ' + (g * 0.7) + ' ' + (up ? g * 2.4 : -g * 2.4) + '" fill="none" stroke="' + col + '" stroke-width="' + (g * 0.18) + '"/>';
    }
    if (n.d === 1.5 || n.d === 3 || n.d === 0.75) out += '<circle cx="' + (x + g * 1.2) + '" cy="' + (y - (d % 2 === 0 ? g / 2 : 0)) + '" r="' + (g * 0.18) + '" fill="' + col + '"/>';
    if (SHARP[n.m % 12]) {
      const ax = x - g * 1.9;
      out += '<g stroke="' + col + '" stroke-width="' + (g * 0.12) + '"><line x1="' + (ax - g * 0.25) + '" x2="' + (ax - g * 0.25) + '" y1="' + (y - g * 1.1) + '" y2="' + (y + g * 1.2) + '"/><line x1="' + (ax + g * 0.25) + '" x2="' + (ax + g * 0.25) + '" y1="' + (y - g * 1.2) + '" y2="' + (y + g * 1.1) + '"/></g>' +
        '<g stroke="' + col + '" stroke-width="' + (g * 0.28) + '"><line x1="' + (ax - g * 0.6) + '" x2="' + (ax + g * 0.6) + '" y1="' + (y - g * 0.25) + '" y2="' + (y - g * 0.5) + '"/><line x1="' + (ax - g * 0.6) + '" x2="' + (ax + g * 0.6) + '" y1="' + (y + g * 0.5) + '" y2="' + (y + g * 0.25) + '"/></g>';
    }
    if (n.label) out += '<text x="' + x + '" y="' + labelY + '" text-anchor="middle" font-size="' + (g * 1.15) + '" font-weight="600" fill="' + col + '">' + n.label + '</text>';
    return out;
  }
  const fiveLines = (top, W, g, x0) => { let o = ''; for (let i = 0; i < 5; i++) o += '<line x1="' + (x0 || 0) + '" x2="' + W + '" y1="' + (top + i * g) + '" y2="' + (top + i * g) + '" stroke="currentColor" stroke-width="1" opacity=".55"/>'; return o; };
  const barLines = (bars, y1, y2, g) => (bars || []).map((b) => '<line x1="' + b.x + '" x2="' + b.x + '" y1="' + y1 + '" y2="' + y2 + '" stroke="currentColor" stroke-width="1.2" opacity=".5"/>' +
    (b.n ? '<text x="' + (b.x + 3) + '" y="' + (y1 - g * 0.5) + '" font-size="' + (g * 0.95) + '" fill="currentColor" opacity=".6">' + b.n + '</text>' : '')).join('');

  /* notes : [{m, d, h?, color, x?, label?}] ; renvoie un SVG.
     opts.grand : double portée (clé de sol pour la main droite h:'d', clé de fa pour la main gauche h:'g') */
  function staff(opts) {
    const g = opts.gap || 10, W = opts.width || 320, top = opts.top || 3 * g;
    const notes = (opts.notes || []).map((n, i) => Object.assign({}, n, { x: n.x !== undefined ? n.x : (opts.startX || g * 4.5) + i * (opts.dx || g * 4) }));
    const ink = opts.ink || 'currentColor';
    if (opts.grand) {
      const sep = opts.sep || g * 5.5, topB = top + 4 * g + sep, H = opts.height || topB + 4 * g + 3 * g;
      const x0 = g * 1.4;
      let out = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" height="100%" preserveAspectRatio="xMinYMid meet" role="img" aria-label="' + (opts.label || 'Partition à deux mains') + '" style="color:' + ink + '">';
      out += fiveLines(top, W, g, x0) + fiveLines(topB, W, g, x0);
      /* accolade et barre de début */
      out += '<line x1="' + x0 + '" x2="' + x0 + '" y1="' + top + '" y2="' + (topB + 4 * g) + '" stroke="currentColor" stroke-width="1.4"/>' +
        '<path d="M' + (x0 - 3) + ' ' + top + 'q-' + g * 0.9 + ' ' + g * 0.4 + ' -' + g * 0.5 + ' ' + ((topB + 4 * g - top) / 4) + 't-' + g * 0.6 + ' ' + ((topB + 4 * g - top) / 4) + 't' + g * 0.6 + ' ' + ((topB + 4 * g - top) / 4) + 't' + g * 0.5 + ' ' + ((topB + 4 * g - top) / 4) + '" fill="none" stroke="currentColor" stroke-width="' + g * 0.25 + '" stroke-linecap="round"/>';
      if (opts.clefShown !== false) out += clefPath('sol', x0 + 4, top, g) + clefPath('fa', x0 + 4, topB, g);
      out += barLines(opts.bars, top, topB + 4 * g, g);
      if (opts.cursorX) out += '<rect x="' + (opts.cursorX - 1.5) + '" y="' + (top - g * 1.6) + '" width="3" height="' + (topB + 5.6 * g - top) + '" rx="1.5" fill="var(--accent)"/>';
      const midLabel = top + 4 * g + sep / 2 + g * 0.45;
      notes.forEach((n) => { out += n.h === 'g' ? noteSvg(n, 'fa', topB + 4 * g, g, H - g * 0.4) : noteSvg(n, 'sol', top + 4 * g, g, midLabel); });
      return out + '</svg>';
    }
    const clef = opts.clef || 'sol', H = opts.height || top + 4 * g + 3 * g, bottomY = top + 4 * g;
    let out = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" height="100%" preserveAspectRatio="xMinYMid meet" role="img" aria-label="' + (opts.label || 'Portée') + '" style="color:' + ink + '">';
    out += fiveLines(top, W, g);
    if (opts.clefShown !== false) out += clefPath(clef, 4, top, g);
    out += barLines(opts.bars, top, bottomY, g);
    if (opts.cursorX) out += '<rect x="' + (opts.cursorX - 1.5) + '" y="' + (top - g * 1.6) + '" width="3" height="' + (g * 7.2) + '" rx="1.5" fill="var(--accent)"/>';
    notes.forEach((n) => { out += noteSvg(n, clef, bottomY, g, H - g * 0.4); });
    return out + '</svg>';
  }
  const clefFor = (notes) => { const ms = notes.map((n) => n.m).sort((a, b) => a - b); return ms.length && ms[Math.floor(ms.length / 2)] < 57 ? 'fa' : 'sol'; };

  /* aperçu des premières notes d'un morceau (cartes, import) : double portée si les deux mains jouent */
  function preview(song, o) {
    hands(song);
    const both = hasBoth(song), ts = [...new Set(song.notes.map((n) => n.t))].slice(0, o.count || 6);
    const notes = song.notes.filter((n) => ts.includes(n.t)).map((n) => ({ m: n.m, d: n.d, h: n.h, x: o.x0 + ts.indexOf(n.t) * o.dx }));
    if (both) return staff({ notes, grand: true, width: o.width, height: o.height, gap: o.gapG || o.gap * 0.62, top: o.topG || o.gap * 1.3, sep: (o.gapG || o.gap * 0.62) * 3.2, label: o.label });
    return staff({ notes, clef: clefFor(song.notes), width: o.width, height: o.height, gap: o.gap, top: o.top, label: o.label });
  }

  return { SONGS, song: (id) => SONGS.find((s) => s.id === id), parse, parseNote, build, hands, hasBoth, staff, preview, clefFor, natName, diat, FR_NAT };
})();
