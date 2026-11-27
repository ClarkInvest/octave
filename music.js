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
      if (n !== 'r') n.split('+').forEach((x) => { const o = { m: parseNote(x), t, d, h: h || 'd' }; if (/^[A-G]b/.test(x)) o.fl = true; out.push(o); });
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
      desc: 'Le refrain de la chanson de Noël, celle qu\'on chante sur « Vive le vent ».', key: { tonic: 0, mode: 'maj' },
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
  const natName = (m, fl) => (fl && SHARP[m % 12] ? FR_NAT[STEP[(m + 1) % 12]] + '♭' : FR_NAT[STEP[m % 12]] + (SHARP[m % 12] ? '♯' : ''));
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
    const dm = n.fl ? diat(n.m + 1) : diat(n.m); /* un bémol s'écrit sur la note du dessus */
    const x = n.x, d = dm - BOTTOM[clef], y = bottomY - d * g / 2;
    const col = n.color || 'currentColor', rx = g * 0.68, ry = g * 0.5;
    for (let k = -2; k >= d; k -= 2) out += '<line x1="' + (x - g * 1.1) + '" x2="' + (x + g * 1.1) + '" y1="' + (bottomY - k * g / 2) + '" y2="' + (bottomY - k * g / 2) + '" stroke="' + col + '" stroke-width="1.2"/>';
    for (let k = 10; k <= d; k += 2) out += '<line x1="' + (x - g * 1.1) + '" x2="' + (x + g * 1.1) + '" y1="' + (bottomY - k * g / 2) + '" y2="' + (bottomY - k * g / 2) + '" stroke="' + col + '" stroke-width="1.2"/>';
    const hollow = n.d >= 2;
    out += '<ellipse cx="' + x + '" cy="' + y + '" rx="' + rx + '" ry="' + ry + '" transform="rotate(-20 ' + x + ' ' + y + ')" fill="' + (hollow ? 'none' : col) + '" stroke="' + col + '" stroke-width="' + (hollow ? g * 0.18 : 1) + '"/>';
    if (n.d < 4) {
      const up = dm < MIDDLE[clef], sx = up ? x + rx - 0.6 : x - rx + 0.6, sy2 = up ? y - g * 3.4 : y + g * 3.4;
      out += '<line x1="' + sx + '" x2="' + sx + '" y1="' + y + '" y2="' + sy2 + '" stroke="' + col + '" stroke-width="' + (g * 0.13) + '"/>';
      if (n.d <= 0.5) out += '<path d="M' + sx + ' ' + sy2 + 'q' + (g * 0.9) + ' ' + (up ? g * 1.1 : -g * 1.1) + ' ' + (g * 0.7) + ' ' + (up ? g * 2.4 : -g * 2.4) + '" fill="none" stroke="' + col + '" stroke-width="' + (g * 0.18) + '"/>';
    }
    if (n.d === 1.5 || n.d === 3 || n.d === 0.75) out += '<circle cx="' + (x + g * 1.2) + '" cy="' + (y - (d % 2 === 0 ? g / 2 : 0)) + '" r="' + (g * 0.18) + '" fill="' + col + '"/>';
    if (n.fl) {
      const ax = x - g * 1.8;
      out += '<path d="M' + (ax - g * 0.3) + ' ' + (y - g * 2) + 'V' + (y + g * 0.55) + 'c' + (g * 0.9) + ' -' + (g * 0.35) + ' ' + (g * 1.05) + ' -' + (g * 1.25) + ' ' + (g * 0.1) + ' -' + (g * 1.05) + 'c-' + (g * 0.35) + ' ' + (g * 0.05) + ' -' + (g * 0.7) + ' ' + (g * 0.3) + ' -' + (g * 0.9) + ' ' + (g * 0.55) + '" fill="none" stroke="' + col + '" stroke-width="' + (g * 0.16) + '" stroke-linecap="round"/>';
    } else if (SHARP[n.m % 12]) {
      const ax = x - g * 1.9;
      out += '<g stroke="' + col + '" stroke-width="' + (g * 0.12) + '"><line x1="' + (ax - g * 0.25) + '" x2="' + (ax - g * 0.25) + '" y1="' + (y - g * 1.1) + '" y2="' + (y + g * 1.2) + '"/><line x1="' + (ax + g * 0.25) + '" x2="' + (ax + g * 0.25) + '" y1="' + (y - g * 1.2) + '" y2="' + (y + g * 1.1) + '"/></g>' +
        '<g stroke="' + col + '" stroke-width="' + (g * 0.28) + '"><line x1="' + (ax - g * 0.6) + '" x2="' + (ax + g * 0.6) + '" y1="' + (y - g * 0.25) + '" y2="' + (y - g * 0.5) + '"/><line x1="' + (ax - g * 0.6) + '" x2="' + (ax + g * 0.6) + '" y1="' + (y + g * 0.5) + '" y2="' + (y + g * 0.25) + '"/></g>';
    }
    if (n.label) out += '<text x="' + x + '" y="' + labelY + '" text-anchor="middle" font-size="' + (g * 1.15) + '" font-weight="600" fill="' + col + '">' + n.label + '</text>';
    if (n.finger && n.fingerY) out += '<text x="' + x + '" y="' + n.fingerY + '" text-anchor="middle" font-size="' + (g * 1.05) + '" font-weight="700" font-style="italic" fill="' + col + '" opacity=".85">' + n.finger + '</text>';
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
      notes.forEach((n) => { if (n.finger) n.fingerY = n.h === 'g' ? topB - g * 0.5 : top - g * 1.9; out += n.h === 'g' ? noteSvg(n, 'fa', topB + 4 * g, g, H - g * 0.4) : noteSvg(n, 'sol', top + 4 * g, g, midLabel); });
      return out + '</svg>';
    }
    const clef = opts.clef || 'sol', H = opts.height || top + 4 * g + 3 * g, bottomY = top + 4 * g;
    let out = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" height="100%" preserveAspectRatio="xMinYMid meet" role="img" aria-label="' + (opts.label || 'Portée') + '" style="color:' + ink + '">';
    out += fiveLines(top, W, g);
    if (opts.clefShown !== false) out += clefPath(clef, 4, top, g);
    out += barLines(opts.bars, top, bottomY, g);
    if (opts.cursorX) out += '<rect x="' + (opts.cursorX - 1.5) + '" y="' + (top - g * 1.6) + '" width="3" height="' + (g * 7.2) + '" rx="1.5" fill="var(--accent)"/>';
    notes.forEach((n) => { if (n.finger) n.fingerY = top - g * 1.9; out += noteSvg(n, clef, bottomY, g, H - g * 0.4); });
    return out + '</svg>';
  }
  const clefFor = (notes) => { const ms = notes.map((n) => n.m).sort((a, b) => a - b); return ms.length && ms[Math.floor(ms.length / 2)] < 57 ? 'fa' : 'sol'; };

  /* ---------- Doigtés calculés (positions à cinq doigts) ----------
     Pour chaque main, on cherche une position qui couvre les notes à venir sur cinq touches blanches,
     et on ne la déplace que quand une note sort de la main. Main droite : pouce sur la note la plus grave
     de la position ; main gauche : petit doigt sur la plus grave. */
  function fingers(song) {
    if (song._fing) return song;
    hands(song);
    ['d', 'g'].forEach((h) => {
      const ns = song.notes.filter((n) => n.h === h).slice().sort((a, b) => a.t - b.t || a.m - b.m);
      const grs = []; ns.forEach((n) => { const g = grs.length && Math.abs(grs[grs.length - 1].t - n.t) < 1e-6 ? grs[grs.length - 1] : null; if (g) g.push(n); else grs.push([n]); });
      let pos = null;
      const lo = (g) => Math.min.apply(null, g.map((n) => diat(n.m))), hi = (g) => Math.max.apply(null, g.map((n) => diat(n.m)));
      grs.forEach((g, i) => {
        if (pos === null || lo(g) < pos || hi(g) > pos + 4) {
          let wlo = lo(g), whi = hi(g);
          for (let k = i + 1; k < grs.length; k++) { const a = Math.min(wlo, lo(grs[k])), b = Math.max(whi, hi(grs[k])); if (b - a > 4) break; wlo = a; whi = b; }
          pos = Math.max(whi - 4, Math.min(wlo, whi - 4 < wlo ? wlo : whi - 4));
          if (whi - wlo > 4) pos = wlo;
        }
        g.forEach((n) => { const k = Math.max(0, Math.min(4, diat(n.m) - pos)); n.f = h === 'd' ? k + 1 : 5 - k; });
        if (g.length > 1) { g.sort((a, b) => a.m - b.m); if (h === 'd') { g[0].f = Math.min(g[0].f, 1 + 0); } }
      });
    });
    /* doigtés écrits à la main (gammes avec passage du pouce) : ils remplacent le calcul pour la main droite */
    if (song.fing) { const fs = String(song.fing).trim().split(/\s+/).map(Number), rh = song.notes.filter((n) => n.h === 'd').sort((a, b) => a.t - b.t || a.m - b.m); rh.forEach((n, i) => { if (fs[i]) n.f = fs[i]; }); }
    song._fing = true;
    return song;
  }

  /* ---------- Accompagnement : une basse et un accord par mesure, choisis d'après la mélodie ---------- */
  const PROF_MAJ = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88];
  const PROF_MIN = [6.33, 2.68, 3.52, 5.38, 2.6, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17];
  function keyOf(notes) {
    const w = new Array(12).fill(0); notes.forEach((n) => { w[n.m % 12] += n.d; });
    let best = { score: -1e9 };
    for (let k = 0; k < 12; k++) [['maj', PROF_MAJ], ['min', PROF_MIN]].forEach(([mode, pr]) => {
      let sc = 0; for (let i = 0; i < 12; i++) sc += w[(i + k) % 12] * pr[i];
      if (sc > best.score) best = { score: sc, tonic: k, mode };
    });
    return best;
  }
  function accomp(song) {
    if (song._acc) return song._acc;
    const mel = song.notes, bar = song.bar || 4, pickup = song.pickup || 0, key = song.key || keyOf(mel), T = key.tonic;
    /* accords de la tonalité : [degré, notes (classes), préférence] */
    const deg = key.mode === 'maj'
      ? [[0, [0, 4, 7], 0.35], [5, [5, 9, 0], 0.25], [7, [7, 11, 2], 0.3], [9, [9, 0, 4], 0.1], [2, [2, 5, 9], 0.05]]
      : [[0, [0, 3, 7], 0.35], [5, [5, 8, 0], 0.25], [7, [7, 11, 2], 0.3], [8, [8, 0, 3], 0.1], [3, [3, 7, 10], 0.05]];
    const out = []; let prev = null;
    const nBars = Math.ceil((song.length - pickup) / bar);
    for (let b = 0; b < nBars; b++) {
      const t0 = pickup + b * bar, t1 = t0 + bar, inBar = mel.filter((n) => n.t < t1 - 1e-6 && n.t + n.d > t0 + 1e-6);
      if (!inBar.length) continue;
      let best = null;
      deg.forEach(([root, pcs, pref]) => {
        const set = pcs.map((x) => (x + T) % 12); let sc = pref + (prev && prev.root === root ? 0.15 : 0);
        inBar.forEach((n) => { const d = Math.min(n.t + n.d, t1) - Math.max(n.t, t0); if (set.includes(n.m % 12)) sc += d * (Math.abs(n.t - t0) < 1e-6 ? 1.5 : 1); else sc -= d * 0.5; });
        if (!best || sc > best.sc) best = { sc, root, set };
      });
      prev = best;
      /* basse entre Sol1 et Fa♯2 (audible sur un haut-parleur de téléphone), accord juste au-dessus, sous la mélodie */
      const rootPc = (best.root + T) % 12, bass = 43 + ((rootPc - 7 + 12) % 12);
      let chord = best.set.map((pc) => { let m = 48 + pc; while (m <= bass + 2) m += 12; return m; }).sort((a, c) => a - c);
      const low = Math.min.apply(null, inBar.map((n) => n.m));
      if (low <= Math.max.apply(null, chord) + 1) chord = []; /* la mélodie descend trop bas : la basse seule suffit */
      out.push({ m: bass, t: t0, d: bar * 0.95, vel: 52, acc: true });
      const half = bar === 3 ? [[1, 1], [2, 0.9]] : bar >= 4 ? [[0, 1.9], [2, 1.9]] : [[0, bar * 0.9]];
      half.forEach(([o, d]) => { if (t0 + o < t1) chord.forEach((m) => out.push({ m, t: t0 + o, d, vel: 36, acc: true })); });
    }
    song._acc = out;
    return out;
  }

  /* aperçu des premières notes d'un morceau (cartes, import) : double portée si les deux mains jouent */
  function preview(song, o) {
    hands(song);
    const both = hasBoth(song), ts = [...new Set(song.notes.map((n) => n.t))].slice(0, o.count || 6);
    const notes = song.notes.filter((n) => ts.includes(n.t)).map((n) => ({ m: n.m, d: n.d, h: n.h, x: o.x0 + ts.indexOf(n.t) * o.dx }));
    if (both) return staff({ notes, grand: true, width: o.width, height: o.height, gap: o.gapG || o.gap * 0.62, top: o.topG || o.gap * 1.3, sep: (o.gapG || o.gap * 0.62) * 3.2, label: o.label });
    return staff({ notes, clef: clefFor(song.notes), width: o.width, height: o.height, gap: o.gap, top: o.top, label: o.label });
  }

  return { SONGS, song: (id) => SONGS.find((s) => s.id === id), parse, parseNote, build, hands, hasBoth, fingers, accomp, keyOf, staff, preview, clefFor, natName, diat, FR_NAT };
})();
