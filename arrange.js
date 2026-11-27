/* Arrangeur : transforme un fichier MIDI quelconque (chanson complète, orchestre…) en versions jouables au piano.
   1. On devine le rôle de chaque piste (mélodie, basse, accompagnement, batterie).
   2. On fabrique plusieurs versions : mélodie facile, mélodie + basse, piano avec accords, refrain, début.
   Principes : une main droite qui chante la mélodie, une main gauche simple et régulière, un rythme lisible,
   des notes dans une tessiture confortable, et le passage le plus connu (le refrain) mis en avant. */
window.Arrange = (function () {
  'use strict';

  /* ---------- Rôle des pistes ---------- */
  const NAME_MEL = /(melod|mélod|vocal|voice|voix|chant|sing|lead|solo|tune|theme|thème|soprano|righthand|right hand|main droite|\brh\b)/i;
  const NAME_BASS = /(bass|basse|\bbs\b|left hand|lefthand|main gauche|\blh\b)/i;
  const NAME_SKIP = /(drum|batter|perc|kit|fx|click|metro)/i;
  /* familles d'instruments General MIDI */
  const fam = (p) => (p === null || p === undefined ? 'piano' : p < 8 ? 'piano' : p < 16 ? 'perc' : p < 24 ? 'orgue' : p < 32 ? 'guitare' : p < 40 ? 'basse' : p < 52 ? 'cordes' : p < 56 ? 'voix' : p < 64 ? 'cuivres' : p < 72 ? 'anches' : p < 80 ? 'flute' : p < 88 ? 'lead' : p < 96 ? 'nappe' : 'fx');

  function stats(tr) {
    const ns = tr.notes, n = ns.length;
    const mean = ns.reduce((a, x) => a + x.m, 0) / n;
    let together = 0, overlap = 0;
    for (let i = 1; i < n; i++) {
      if (Math.abs(ns[i].t - ns[i - 1].t) < 0.06) together++;
      else if (ns[i - 1].t + ns[i - 1].d > ns[i].t + 0.1) overlap++;
    }
    const first = ns[0].t, last = ns[n - 1].t + ns[n - 1].d;
    return { n, mean, chords: together / n, overlap: overlap / n, span: last - first, density: n / Math.max(1, last - first), first, last, fam: fam(tr.program) };
  }

  function analyze(file) {
    const tracks = file.tracks.filter((t) => t.notes.length).map((t) => Object.assign({ tr: t, s: stats(t) }, {}));
    const total = Math.max(...tracks.map((x) => x.s.last));
    tracks.forEach((x) => {
      const s = x.s, nm = x.tr.name || '';
      x.drums = x.tr.drums || NAME_SKIP.test(nm) || s.fam === 'perc' && s.mean < 50;
      const cover = s.span / Math.max(1, total);
      x.mel = (x.drums ? -99 : 0) + (1 - Math.min(1, s.chords * 2)) * 3 - s.overlap * 2 +
        (s.mean >= 60 && s.mean <= 82 ? 2.5 : s.mean >= 55 ? 1 : -3) +
        (NAME_MEL.test(nm) ? 5 : 0) + (NAME_BASS.test(nm) ? -4 : 0) +
        ({ voix: 2.5, lead: 2, anches: 1.5, flute: 1.5, cuivres: 1, piano: 0.5, cordes: 0, guitare: -0.5, orgue: 0, nappe: -2, basse: -5 }[s.fam] || 0) +
        cover * 1.5 + Math.min(s.density, 3) * 0.3;
      x.bass = (x.drums ? -99 : 0) + (s.fam === 'basse' ? 5 : 0) + (NAME_BASS.test(nm) ? 4 : 0) + (s.mean < 48 ? 3 : s.mean < 55 ? 1 : -3) + (1 - Math.min(1, s.chords * 2)) + cover;
    });
    const pitched = tracks.filter((x) => !x.drums);
    const melody = pitched.slice().sort((a, b) => b.mel - a.mel)[0] || null;
    const bassC = pitched.filter((x) => x !== melody).sort((a, b) => b.bass - a.bass)[0];
    const bass = bassC && bassC.bass > 3 ? bassC : null;
    const harmony = pitched.filter((x) => x !== melody && x !== bass);
    /* fichier « piano » à une seule piste (ou mélodie dans la même piste que l'accompagnement) : on séparera par la hauteur */
    const single = pitched.length === 1 || (melody && melody.s.chords > 0.35);
    return { tracks, melody, bass, harmony, single, total };
  }

  /* ---------- Outils ---------- */
  const q = (x, g) => Math.round(x / g) * g;
  /* la ligne du dessus : à chaque instant, la note la plus aiguë (ce que l'oreille retient) */
  function skyline(notes, g, minPitch) {
    const at = new Map();
    notes.forEach((n) => { if (minPitch && n.m < minPitch) return; const t = q(n.t, g); const c = at.get(t); if (!c || n.m > c.m) at.set(t, { m: n.m, t, d: n.d, od: n.d }); });
    const line = [...at.values()].sort((a, b) => a.t - b.t);
    /* chaque note dure jusqu'à la suivante (legato), au plus 4 temps, au moins la grille */
    for (let i = 0; i < line.length; i++) {
      const nx = line[i + 1], max = nx ? nx.t - line[i].t : 4;
      line[i].d = Math.max(g, Math.min(max, q(line[i].d, g) || g, 4));
    }
    return line;
  }
  /* rythme lisible : on retire les notes très brèves qui encombrent (ornements, notes répétées en rafale) */
  function tidy(line, g) {
    const out = [];
    line.forEach((n) => {
      const p = out[out.length - 1];
      if (g >= 0.5 && n.od !== undefined && n.od < 0.2 && p) return; /* petite note d'ornement : on la laisse de côté dans les versions faciles */
      if (p && n.t - p.t < g - 1e-6) return;
      if (p && p.m === n.m && n.t - p.t <= g + 1e-6 && n.d <= g) { p.d = n.t + n.d - p.t; return; } /* rafale de la même note */
      out.push(Object.assign({}, n));
    });
    for (let i = 0; i < out.length - 1; i++) out[i].d = Math.min(out[i].d, out[i + 1].t - out[i].t);
    return out;
  }
  /* tessiture : on déplace toute la ligne d'octave en octave pour qu'elle tienne au mieux, puis on replie les notes isolées */
  function fit(line, lo, hi) {
    if (!line.length) return line;
    let best = 0, bestIn = -1;
    for (let k = -4; k <= 4; k++) { const inR = line.filter((n) => n.m + 12 * k >= lo && n.m + 12 * k <= hi).length; if (inR > bestIn || (inR === bestIn && Math.abs(k) < Math.abs(best))) { bestIn = inR; best = k; } }
    return line.map((n) => { let m = n.m + 12 * best; while (m < lo) m += 12; while (m > hi) m -= 12; return Object.assign({}, n, { m }); });
  }
  /* une basse simple : la note la plus grave entendue au début de chaque tranche (mesure ou demi-mesure) */
  function bassLine(src, bar, slot, from, to) {
    const out = [];
    for (let t = from; t < to - 1e-6; t += slot) {
      const sounding = src.filter((n) => n.t < t + slot * 0.5 && n.t + n.d > t + 0.05);
      if (!sounding.length) continue;
      const m = Math.min(...sounding.map((n) => n.m));
      out.push({ m, t, d: slot * 0.95, h: 'g' });
    }
    return out;
  }
  /* accords : pour chaque tranche, l'accord parfait (majeur ou mineur) qui couvre le mieux les notes de l'accompagnement */
  function chordLine(src, mel, slot, from, to) {
    const out = []; let prev = null;
    for (let t = from; t < to - 1e-6; t += slot) {
      const w = new Array(12).fill(0);
      src.forEach((n) => { const a = Math.max(t, n.t), b = Math.min(t + slot, n.t + n.d); if (b > a) w[n.m % 12] += (b - a) * (n.m < 55 ? 1.5 : 1); });
      mel.forEach((n) => { const a = Math.max(t, n.t), b = Math.min(t + slot, n.t + n.d); if (b > a) w[n.m % 12] += (b - a) * 0.5; });
      const tot = w.reduce((a, b) => a + b, 0); if (tot < 0.2) { prev = null; continue; }
      let best = null;
      for (let r = 0; r < 12; r++) [[0, 4, 7], [0, 3, 7]].forEach((iv) => {
        const set = iv.map((x) => (x + r) % 12), sc = set.reduce((a, pc, i) => a + w[pc] * (i === 0 ? 1.3 : 1), 0) - (tot - set.reduce((a, pc) => a + w[pc], 0)) * 0.6 + (prev && prev.root === r ? 0.3 : 0);
        if (!best || sc > best.sc) best = { sc, root: r, set };
      });
      /* renversement le plus proche de l'accord précédent, autour du Do du milieu bas (Do2–Sol2) */
      let voic = best.set.map((pc) => 48 + ((pc - 0 + 12) % 12)).sort((a, b) => a - b);
      const cand = [voic, [voic[1], voic[2], voic[0] + 12], [voic[2] - 12, voic[0], voic[1]]].map((v) => v.slice().sort((a, b) => a - b));
      const center = prev ? prev.v.reduce((a, b) => a + b, 0) / 3 : 53;
      voic = cand.sort((a, b) => Math.abs(a.reduce((x, y) => x + y, 0) / 3 - center) - Math.abs(b.reduce((x, y) => x + y, 0) / 3 - center))[0];
      prev = { root: best.root, v: voic };
      voic.forEach((m) => out.push({ m, t, d: slot * 0.95, h: 'g' }));
    }
    return out;
  }

  /* ---------- Repérage du refrain : le groupe de mesures de la mélodie qui revient le plus ---------- */
  function findChorus(line, bar, total) {
    const nb = Math.ceil(total / bar); if (nb < 12) return null;
    const sig = [];
    for (let b = 0; b < nb; b++) sig.push(line.filter((n) => n.t >= b * bar - 1e-6 && n.t < (b + 1) * bar - 1e-6).map((n) => Math.round((n.t - b * bar) * 2) + ':' + n.m).join(','));
    const sim = (a, b) => { if (!a && !b) return 0; const A = new Set(a.split(',')), B = new Set(b.split(',')); let k = 0; A.forEach((x) => { if (B.has(x)) k++; }); return k / Math.max(A.size, B.size); };
    let best = null;
    [8, 4].forEach((L) => {
      for (let s = 0; s + L <= nb; s++) {
        if (sig.slice(s, s + L).filter(Boolean).length < L * 0.75) continue;
        let reps = 1, lastEnd = s + L, quality = L;
        for (let o = s + L; o + L <= nb; o++) {
          if (o < lastEnd) continue;
          let m = 0; for (let k = 0; k < L; k++) m += sim(sig[s + k], sig[o + k]);
          if (m / L >= 0.7) { reps++; lastEnd = o + L; quality += m; }
        }
        if (reps < 2) continue;
        const ns = line.filter((n) => n.t >= s * bar && n.t < (s + L) * bar), pitch = ns.reduce((a, n) => a + n.m, 0) / Math.max(1, ns.length);
        /* une phrase musicale commence presque toujours sur une mesure multiple de 4 */
        const score = quality * (L === 8 ? 1.15 : 1) + pitch * 0.08 + (s % 4 === 0 ? 3 : 0) + (s > 0 ? 1 : 0);
        if (!best || score > best.score) best = { from: s + 1, to: s + L, reps, score };
      }
    });
    return best;
  }

  /* ---------- Versions proposées ---------- */
  function versions(file) {
    const A = analyze(file), bar = file.beatsPerBar || 4;
    if (!A.melody) return { analysis: A, list: [] };
    const melSrc = A.single ? A.melody.tr.notes.filter((n) => n.m >= 57) : A.melody.tr.notes;
    let bassSrc = A.bass ? A.bass.tr.notes : A.single ? A.melody.tr.notes.filter((n) => n.m < 57) : [];
    const harmSrc = [].concat(...A.harmony.map((x) => x.tr.notes), A.single ? A.melody.tr.notes.filter((n) => n.m < 60) : []);
    if (!bassSrc.length) bassSrc = harmSrc;
    const melFirst = melSrc.length ? Math.min(...melSrc.map((n) => n.t)) : 0, end = Math.max(...melSrc.map((n) => n.t + n.d));
    const start = Math.floor((melFirst + 0.3) / bar) * bar; /* on commence à la mesure où la mélodie entre (pas d'introduction de 30 secondes) */
    const easy = fit(tidy(skyline(melSrc, 0.5), 0.5), 60, 79).map((n) => Object.assign(n, { h: 'd' }));
    const fine = fit(tidy(skyline(melSrc, 0.25), 0.25), 60, 81).map((n) => Object.assign(n, { h: 'd' }));
    const bass1 = fit(bassLine(bassSrc, bar, bar, start, end), 40, 55).map((n) => Object.assign(n, { h: 'g' }));
    const chords = chordLine(harmSrc.concat(bassSrc), fine, bar >= 4 ? bar / 2 : bar, start, end);
    const chorus = findChorus(easy.filter((n) => n.t >= start).map((n) => Object.assign({}, n, { t: n.t - start })), bar, end - start);
    const cut = (notes, b0, b1) => notes.filter((n) => n.t >= start + (b0 - 1) * bar - 1e-6 && n.t < start + b1 * bar - 1e-6);
    const pack = (id, label, kidLabel, desc, notes, extra) => {
      notes = notes.slice().sort((a, b) => a.t - b.t || a.m - b.m);
      const t0 = notes.length ? Math.floor((notes[0].t) / bar) * bar : 0;
      const out = notes.map((n) => ({ m: n.m, t: +(n.t - t0).toFixed(3), d: +Math.max(0.25, n.d).toFixed(3), h: n.h }));
      return Object.assign({ id, label, kidLabel, desc, notes: out, length: Math.ceil(out.reduce((a, n) => Math.max(a, n.t + n.d), 0)), bar }, extra || {});
    };
    const list = [];
    const bars = Math.ceil((end - start) / bar);
    if (chorus) list.push(pack('refrain', 'Le refrain', 'Le refrain', 'Le passage qui revient ' + chorus.reps + ' fois (mesures ' + chorus.from + ' à ' + chorus.to + ') : mélodie à droite, une note de basse par mesure à gauche.', cut(easy, chorus.from, chorus.to + 1).concat(cut(bass1, chorus.from, chorus.to + 1)), { tag: 'refrain', recommended: true }));
    list.push(pack('facile', 'Mélodie facile', 'La mélodie', 'Seulement l\'air que l\'on chante, à la main droite, rythme simplifié. Idéal pour commencer et au micro.', easy, { tag: 'facile', mono: true }));
    list.push(pack('basse', 'Mélodie + basse', 'Mélodie et basse', 'L\'air à droite, une note de basse par mesure à gauche : le premier pas vers les deux mains.', easy.concat(bass1), { tag: 'deux' }));
    list.push(pack('piano', 'Version piano', 'Version piano', 'La mélodie avec son rythme d\'origine à droite, des accords à gauche (deux par mesure). Pour jouer plus « comme le morceau ».', fine.concat(chords), { tag: 'piano' }));
    if (bars > 12) list.push(pack('court', 'Version courte', 'Le début', 'Les 8 premières mesures de la mélodie, avec la basse : un morceau en moins d\'une minute.', cut(easy, 1, 9).concat(cut(bass1, 1, 9)), { tag: 'court' }));
    if (!chorus) list[0].recommended = true;
    return { analysis: A, list, chorus };
  }

  return { analyze, versions, findChorus, skyline };
})();
