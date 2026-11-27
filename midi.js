/* Lecture des fichiers MIDI (.mid) et conversion en morceau Octave. */
window.MidiFile = (function () {
  'use strict';

  /* ---------- Lecture du fichier (format 0 ou 1) ---------- */
  function parse(buf) {
    const b = new Uint8Array(buf);
    let i = 0;
    const str = (n) => { let s = ''; for (let k = 0; k < n; k++) s += String.fromCharCode(b[i + k]); return s; };
    const u32 = () => { const v = (b[i] << 24 | b[i + 1] << 16 | b[i + 2] << 8 | b[i + 3]) >>> 0; i += 4; return v; };
    const u16 = () => { const v = b[i] << 8 | b[i + 1]; i += 2; return v; };
    const vlq = () => { let v = 0, c; do { c = b[i++]; v = (v << 7) | (c & 0x7f); } while (c & 0x80 && i < b.length); return v; };

    if (b.length < 14 || str(4) !== 'MThd') throw new Error('Ce fichier n\'est pas un fichier MIDI.');
    i = 4; const hl = u32(), format = u16(), ntrk = u16(), div = u16(); i = 8 + hl;
    if (div & 0x8000) throw new Error('Ce fichier MIDI utilise un format de temps non pris en charge.');
    if (format > 1) throw new Error('Ce type de fichier MIDI (format 2) n\'est pas pris en charge.');
    const tpq = div;
    const tracks = [], tempos = [], sigs = [];
    let title = '';

    for (let t = 0; t < ntrk && i < b.length - 8; t++) {
      while (i < b.length - 8 && str(4) !== 'MTrk') { i += 4; const skip = u32(); i += skip; }
      if (i >= b.length - 8) break;
      i += 4; const len = u32(), end = Math.min(b.length, i + len);
      const tr = { name: '', notes: [], channels: new Set(), program: null };
      const open = {}; /* clé canal-note → [début, vélocité] */
      let tick = 0, status = 0;
      while (i < end) {
        tick += vlq();
        let s = b[i];
        if (s & 0x80) { status = s; i++; } else s = status; /* statut courant (running status) */
        if (s === 0xff) {
          const type = b[i++], l = vlq(), d = b.subarray(i, i + l); i += l;
          if (type === 0x03 && !tr.name) tr.name = text(d);
          else if (type === 0x01 && !title && t === 0) title = text(d);
          else if (type === 0x51 && l === 3) tempos.push({ tick, us: d[0] << 16 | d[1] << 8 | d[2] });
          else if (type === 0x58 && l >= 2) sigs.push({ tick, num: d[0], den: Math.pow(2, d[1]) });
          else if (type === 0x2f) break;
          status = 0;
        } else if (s === 0xf0 || s === 0xf7) { const l = vlq(); i += l; status = 0; }
        else {
          const cmd = s & 0xf0, ch = s & 0x0f;
          const d1 = b[i++], d2 = (cmd === 0xc0 || cmd === 0xd0) ? 0 : b[i++];
          if (cmd === 0x90 && d2 > 0) {
            const k = ch * 128 + d1;
            if (open[k]) close(tr, open[k], d1, ch, tick);
            open[k] = [tick, d2]; tr.channels.add(ch);
          } else if (cmd === 0x80 || cmd === 0x90) {
            const k = ch * 128 + d1;
            if (open[k]) { close(tr, open[k], d1, ch, tick); delete open[k]; }
          } else if (cmd === 0xc0 && tr.program === null) tr.program = d1;
        }
      }
      Object.keys(open).forEach((k) => close(tr, open[k], k % 128, Math.floor(k / 128), tick));
      i = end;
      tracks.push(tr);
    }
    function close(tr, o, m, ch, tick) { tr.notes.push({ m: +m, ch, t: o[0] / tpq, d: Math.max(1, tick - o[0]) / tpq, v: o[1] }); }

    if (!title && tracks[0] && !tracks[0].notes.length && tracks[0].name) title = tracks[0].name;
    const firstNote = tracks.reduce((mn, tr) => tr.notes.reduce((a, n) => Math.min(a, n.t), mn), Infinity);
    tempos.sort((a, c) => a.tick - c.tick);
    const tAt = tempos.filter((x) => x.tick / tpq <= firstNote + 0.001).pop() || tempos[0];
    const bpm = tAt ? Math.round(60000000 / tAt.us) : 120;
    const sig = sigs[0] || { num: 4, den: 4 };
    const list = tracks.map((tr, k) => ({
      index: k, name: tr.name.trim(), notes: tr.notes.sort((a, c) => a.t - c.t || a.m - c.m),
      drums: tr.channels.size > 0 && [...tr.channels].every((c) => c === 9), program: tr.program
    })).filter((tr) => tr.notes.length);
    if (!list.length) throw new Error('Ce fichier MIDI ne contient aucune note.');
    return { title: title.trim(), bpm: Math.max(30, Math.min(240, bpm)), beatsPerBar: sig.num * 4 / sig.den, tracks: list };
  }
  function text(d) {
    let s = ''; for (let k = 0; k < d.length; k++) s += String.fromCharCode(d[k]);
    try { return decodeURIComponent(escape(s)).replace(/[\u0000-\u001f]/g, ''); } catch (e) { return s.replace(/[^\x20-\x7eÀ-ÿ]/g, ''); }
  }

  /* ---------- Conversion : pistes choisies → notes jouables ---------- */
  /* opts : { tracks:[index], part:'tout'|'droite'|'gauche', melody:bool, grid:0.25|0.5, from:mesure, to:mesure } */
  function build(file, opts) {
    const grid = opts.grid || 0.25, bar = file.beatsPerBar || 4;
    let notes = [];
    const chosen = file.tracks.filter((tr) => opts.tracks.includes(tr.index) && tr.notes.length);
    /* main de chaque note : avec deux pistes (cas courant des fichiers de piano), la plus grave est la main gauche ;
       sinon, on coupe au Do du milieu */
    const avg = (tr) => tr.notes.reduce((a, n) => a + n.m, 0) / tr.notes.length;
    const lowTrack = chosen.length === 2 ? (avg(chosen[0]) < avg(chosen[1]) ? chosen[0].index : chosen[1].index) : null;
    const spread = chosen.length === 2 && Math.abs(avg(chosen[0]) - avg(chosen[1])) >= 5;
    chosen.forEach((tr) => { notes = notes.concat(tr.notes.map((n) => Object.assign({}, n, { h: spread ? (tr.index === lowTrack ? 'g' : 'd') : (n.m < 60 ? 'g' : 'd') }))); });
    /* extrait : de la mesure « from » à la mesure « to » (incluses) */
    const t0 = ((opts.from || 1) - 1) * bar, t1 = opts.to ? opts.to * bar : Infinity;
    notes = notes.filter((n) => n.t >= t0 - grid / 2 && n.t < t1 - grid / 2);
    /* alignement sur la grille, pour que les accords tombent ensemble */
    const q = (x) => Math.round(x / grid) * grid;
    notes = notes.map((n) => ({ m: n.m, t: q(n.t - t0), d: Math.max(grid, q(n.d)), h: n.h }));
    /* clavier de 61 touches (Do1 à Do6) : on ramène les notes trop graves ou aiguës d'une octave */
    notes.forEach((n) => { while (n.m < 36) n.m += 12; while (n.m > 96) n.m -= 12; });
    if (opts.part === 'droite') notes = notes.filter((n) => n.h === 'd');
    else if (opts.part === 'gauche') notes = notes.filter((n) => n.h === 'g');
    /* doublons (même note au même moment) */
    const seen = new Set();
    notes = notes.filter((n) => { const k = n.t + '|' + n.m; if (seen.has(k)) return false; seen.add(k); return true; });
    notes.sort((a, b) => a.t - b.t || a.m - b.m);
    if (opts.melody) {
      /* une note à la fois : la plus aiguë de chaque instant (indispensable avec le micro) */
      const top = new Map(); notes.forEach((n) => { const c = top.get(n.t); if (!c || n.m > c.m) top.set(n.t, n); });
      notes = [...top.values()].sort((a, b) => a.t - b.t);
    }
    /* une note ne déborde pas sur la suivante de même hauteur */
    const nextSame = {};
    for (let k = notes.length - 1; k >= 0; k--) { const n = notes[k], nx = nextSame[n.m]; if (nx !== undefined && n.t + n.d > nx) n.d = Math.max(grid, nx - n.t); nextSame[n.m] = n.t; }
    if (opts.melody) for (let k = 0; k < notes.length - 1; k++) { const n = notes[k], gap = notes[k + 1].t - n.t; if (n.d > gap) n.d = gap; }
    /* on démarre sur la première note */
    const first = notes.length ? notes[0].t : 0, shift = Math.floor(first / bar) * bar;
    notes.forEach((n) => { n.t = +(n.t - shift).toFixed(3); n.d = +n.d.toFixed(3); });
    const length = notes.reduce((a, n) => Math.max(a, n.t + n.d), 0);
    return { notes, length: Math.ceil(length) };
  }

  /* niveau estimé : densité, accords, étendue */
  function level(song) {
    const ns = song.notes; if (!ns.length) return 1;
    const times = new Set(ns.map((n) => n.t)), chords = ns.length / times.size;
    const ms = ns.map((n) => n.m), span = Math.max(...ms) - Math.min(...ms);
    const density = times.size / Math.max(1, song.length) * (song.tempo / 90);
    const black = ns.filter((n) => [1, 3, 6, 8, 10].includes(n.m % 12)).length / ns.length;
    let lv = 1;
    if (density > 1.2 || span > 12 || black > 0.1) lv = 2;
    if (density > 2 || span > 24 || chords > 1.4 || black > 0.25) lv = 3;
    if (density > 3 || chords > 2.2) lv = 4;
    return lv;
  }

  return { parse, build, level };
})();
