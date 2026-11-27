/* Mes morceaux : import de fichiers MIDI personnels, stockés sur l'appareil. */
(function () {
  'use strict';
  const A = window.App, E = window.Engine, MU = window.Music, MF = window.MidiFile;
  const KEY = 'octave.songs';

  /* ---------- Stockage ---------- */
  function read() { try { const a = JSON.parse(localStorage.getItem(KEY)); return Array.isArray(a) ? a : []; } catch (e) { return []; } }
  function write(list) {
    try { localStorage.setItem(KEY, JSON.stringify(list)); return true; } catch (e) { A.toast('Plus assez de place sur l\'appareil pour ce morceau'); return false; }
  }
  function hydrate(r) {
    return { id: r.id, title: r.title, by: r.by || 'Mon fichier MIDI', level: r.level || 1, tempo: r.tempo, kind: 'perso', desc: r.desc || 'Un morceau importé depuis un fichier MIDI.',
      notes: r.n.map((x) => ({ m: x[0], t: x[1], d: x[2], h: x[3] === 1 ? 'g' : x[3] === 0 ? 'd' : (x[0] < 60 ? 'g' : 'd') })), length: r.length, bar: r.bar || 4, perso: true, info: r.info || '' };
  }
  function sync() {
    for (let k = MU.SONGS.length - 1; k >= 0; k--) if (MU.SONGS[k].perso) MU.SONGS.splice(k, 1);
    read().forEach((r) => MU.SONGS.push(hydrate(r)));
  }
  function add(rec) { const list = read(); list.push(rec); if (!write(list)) return false; sync(); return true; }
  function update(id, patch) { const list = read(), r = list.find((x) => x.id === id); if (!r) return; Object.assign(r, patch); write(list); sync(); }
  function remove(id) {
    write(read().filter((x) => x.id !== id)); sync();
    A.DB.profiles.forEach((p) => { if (p.songs) delete p.songs[id]; }); A.save();
  }
  sync();

  const fmtTime = (beats, bpm) => { const s = Math.round(beats * 60 / bpm); return Math.floor(s / 60) + ' min ' + String(s % 60).padStart(2, '0'); };
  const range = (ns) => { if (!ns.length) return ''; let lo = 127, hi = 0; ns.forEach((n) => { lo = Math.min(lo, n.m); hi = Math.max(hi, n.m); }); return E.name(lo) + ' à ' + E.name(hi); };

  /* ---------- Écran : importer un fichier MIDI (ou modifier un morceau perso) ---------- */
  function Importer(param) {
    if (param) return Edit(param);
    const kid = A.isKid(), DB = A.DB;
    let file = null, fname = '', opts = null, built = null, preview = null;

    A.shell('morceaux', A.header() +
      '<div class="row"><a href="#morceaux" class="icon-btn" aria-label="Retour aux morceaux">' + A.ICON.back + '</a><h1 class="h1">' + (kid ? 'Ajoute ton morceau' : 'Importer un morceau') + '</h1></div>' +
      '<div id="imp"></div>');
    const box = document.getElementById('imp');
    A.onLeave(stopPreview);

    function pickScreen(err) {
      box.innerHTML = '<div class="cols"><div class="stack"><div class="card">' +
        '<div class="h2">Un fichier MIDI</div>' +
        '<div class="help">Un fichier <b>.mid</b> enregistré sur l\'appareil (dans Téléchargements par exemple). Octave en garde une copie : le morceau restera disponible sans internet.</div>' +
        (err ? '<div class="help step-rule" style="color:var(--bad)">' + A.esc(err) + '</div>' : '') +
        '<label class="btn" style="align-self:flex-start;cursor:pointer">' + A.ICON.songs.replace('<svg ', '<svg width="18" height="18" ') + ' Choisir un fichier<input type="file" id="impfile" accept=".mid,.midi,.kar,audio/midi,audio/x-midi,audio/mid" class="sr"></label></div></div>' +
        '<div class="stack"><div class="card line"><div class="label">Où trouver des fichiers MIDI ?</div>' +
        '<div class="help">Beaucoup de sites proposent des morceaux au format MIDI, souvent gratuits pour les œuvres anciennes et les chansons traditionnelles. Cherchez le titre suivi de « midi piano ». Les versions « piano » ou « facile » donnent les meilleurs résultats.</div>' +
        '<div class="help">Après l\'import, vous choisissez les pistes, la main, et éventuellement un passage du morceau.</div></div></div></div>';
      const inp = document.getElementById('impfile');
      inp.onchange = () => {
        const f = inp.files && inp.files[0]; if (!f) return;
        if (f.size > 2 * 1024 * 1024) { pickScreen('Ce fichier est trop gros pour un fichier MIDI (plus de 2 Mo).'); return; }
        const rd = new FileReader();
        rd.onload = () => {
          try { file = MF.parse(rd.result); } catch (e) { pickScreen(e.message || 'Fichier illisible.'); return; }
          fname = f.name.replace(/\.(mid|midi|kar)$/i, '').replace(/[_-]+/g, ' ').trim();
          setup();
        };
        rd.onerror = () => pickScreen('Impossible de lire ce fichier.');
        rd.readAsArrayBuffer(f);
      };
    }

    function setup() {
      const playable = file.tracks.filter((t) => !t.drums);
      const lastBeat = file.tracks.reduce((a, t) => t.notes.reduce((b, n) => Math.max(b, n.t + n.d), a), 0);
      const bars = Math.max(1, Math.ceil(lastBeat / file.beatsPerBar));
      const mono = DB.input.source === 'micro';
      opts = { title: (file.title && file.title.length > 2 && !/untitled|^track|tempo|sans titre|^(piano|melody|mélodie)$/i.test(file.title) ? file.title : fname).slice(0, 60),
        tracks: (playable.length ? playable : file.tracks).map((t) => t.index), part: 'tout', melody: mono || kid, grid: 0.25, from: 1, to: bars, bars, tempo: file.bpm };
      box.innerHTML = '<div class="cols"><div class="stack">' +
        '<div class="card"><label class="label" for="ititle">Titre</label><input id="ititle" class="pfield" maxlength="60" value="' + A.esc(opts.title) + '"></div>' +
        '<div class="card"><div class="label">Pistes à jouer</div><div class="list" style="background:var(--surf2)">' +
          file.tracks.map((t) => '<label class="item" style="cursor:pointer"><span><span class="label">' + A.esc(t.name || 'Piste ' + (t.index + 1)) + (t.drums ? ' · batterie' : '') + '</span><br><span class="help">' + t.notes.length + ' notes · ' + range(t.notes) + '</span></span>' +
            '<input type="checkbox" data-tr="' + t.index + '"' + (opts.tracks.includes(t.index) ? ' checked' : '') + ' style="width:22px;height:22px;accent-color:var(--accent);flex-shrink:0"></label>').join('') + '</div>' +
          '<div class="help">Décochez l\'accompagnement ou la batterie pour ne garder que ce que vous voulez jouer.</div></div>' +
        '<div class="card"><div class="label">Quelle main ?</div><div class="seg" role="group" aria-label="Main"><button data-part="tout">Les deux</button><button data-part="droite">Main droite</button><button data-part="gauche">Main gauche</button></div>' +
          '<div class="help">Si le fichier a deux pistes de piano, la plus grave devient la main gauche ; sinon, la main gauche joue sous le Do du milieu (Do3). Vous pourrez aussi travailler chaque main séparément dans le jeu.</div>' +
          '<div class="item between" style="margin-top:4px"><div><div class="label">Une note à la fois</div><div class="help">Garde la mélodie (la note la plus aiguë). Conseillé avec le micro, qui n\'entend qu\'une note à la fois.</div></div><button class="switch" role="switch" id="imelody" aria-label="Une note à la fois"></button></div></div>' +
      '</div><div class="stack">' +
        '<div class="card"><div class="label">Passage à jouer</div><div class="row" style="flex-wrap:wrap"><span class="help">De la mesure</span><input id="ifrom" class="pfield num" type="number" inputmode="numeric" min="1" max="' + bars + '" value="1"><span class="help">à la mesure</span><input id="ito" class="pfield num" type="number" inputmode="numeric" min="1" max="' + bars + '" value="' + bars + '"><span class="help">sur ' + bars + '</span></div>' +
          '<div class="label" style="margin-top:6px">Rythme</div><div class="seg" role="group" aria-label="Précision du rythme"><button data-grid="0.5">Simplifié</button><button data-grid="0.25">Précis</button></div>' +
          '<div class="row" style="margin-top:6px"><label class="label" for="itempo">Tempo</label><input id="itempo" class="pfield num" type="number" inputmode="numeric" min="30" max="240" value="' + opts.tempo + '"><span class="help">noires par minute (vitesse d\'origine : ' + file.bpm + ')</span></div></div>' +
        '<div class="card" id="isum"></div>' +
      '</div></div>';

      box.querySelectorAll('[data-tr]').forEach((c) => c.onchange = () => { const k = +c.dataset.tr; opts.tracks = c.checked ? opts.tracks.concat(k) : opts.tracks.filter((x) => x !== k); refresh(); });
      box.querySelectorAll('[data-part]').forEach((b) => b.onclick = () => { opts.part = b.dataset.part; refresh(); });
      box.querySelectorAll('[data-grid]').forEach((b) => b.onclick = () => { opts.grid = +b.dataset.grid; refresh(); });
      const mel = document.getElementById('imelody'); mel.onclick = () => { opts.melody = !opts.melody; refresh(); };
      const t = document.getElementById('ititle'); t.oninput = () => { opts.title = t.value; };
      const num = (id, lo, hi, key) => { const el = document.getElementById(id); el.onchange = () => { let v = Math.round(+el.value) || lo; v = Math.max(lo, Math.min(hi, v)); el.value = v; opts[key] = v; if (opts.from > opts.to) { opts.to = opts.from; document.getElementById('ito').value = opts.to; } refresh(); }; };
      num('ifrom', 1, bars, 'from'); num('ito', 1, bars, 'to'); num('itempo', 30, 240, 'tempo');
      refresh();
    }

    function refresh() {
      stopPreview();
      box.querySelectorAll('[data-part]').forEach((b) => b.setAttribute('aria-pressed', b.dataset.part === opts.part));
      box.querySelectorAll('[data-grid]').forEach((b) => b.setAttribute('aria-pressed', +b.dataset.grid === opts.grid));
      document.getElementById('imelody').setAttribute('aria-checked', opts.melody);
      built = MF.build(file, opts);
      const sum = document.getElementById('isum');
      if (!built.notes.length) {
        sum.innerHTML = '<div class="h2">Aucune note</div><div class="help">Avec ces réglages, il ne reste rien à jouer. Cochez une autre piste ou choisissez l\'autre main.</div>';
        return;
      }
      const lv = MF.level({ notes: built.notes, length: built.length, tempo: opts.tempo });
      const chords = built.notes.length / new Set(built.notes.map((n) => n.t)).size > 1.05;
      sum.innerHTML = '<div class="between"><div class="h2">Aperçu</div><span class="chip lvl">Niveau ' + lv + '</span></div>' +
        '<div class="staff-box" style="height:130px;background:var(--surf2)">' + MU.preview({ notes: built.notes }, { x0: 70, dx: 40, count: 9, width: 440, height: 130, gap: 9, top: 40, gapG: 7, topG: 18, label: 'Début du morceau' }) + '</div>' +
        '<div class="help">' + built.notes.length + ' notes · ' + range(built.notes) + ' · environ ' + fmtTime(built.length, opts.tempo) + (chords ? ' · avec des accords' : '') + '</div>' +
        (built.notes.length > 1500 ? '<div class="help step-rule">C\'est un long morceau : choisir un passage le rendra plus agréable à travailler.</div>' : '') +
        (chords && DB.input.source === 'micro' ? '<div class="help step-rule">Le micro n\'entend qu\'une note à la fois : activez « Une note à la fois » pour jouer ce morceau au micro.</div>' : '') +
        '<div class="row" style="flex-wrap:wrap"><button class="btn" id="isave">' + A.ICON.play + ' Enregistrer et jouer</button><button class="btn ghost" id="iplay">Écouter le début</button></div>' +
        '<button class="btn small ghost" id="iother" style="align-self:flex-start">Choisir un autre fichier</button>';
      document.getElementById('isave').onclick = save;
      document.getElementById('iplay').onclick = () => { if (preview) stopPreview(); else playPreview(); };
      document.getElementById('iother').onclick = () => { file = null; pickScreen(); };
    }

    function playPreview() {
      E.audio(); E.sound.enabled = true;
      const spb = 60 / opts.tempo, ns = built.notes.filter((n) => n.t * spb < 15);
      preview = [];
      ns.forEach((n) => {
        preview.push(setTimeout(() => E.sound.play(n.m, 80), n.t * spb * 1000));
        preview.push(setTimeout(() => E.sound.stop(n.m), (n.t + n.d * 0.9) * spb * 1000));
      });
      preview.push(setTimeout(stopPreview, ((ns.length ? Math.max(...ns.map((n) => n.t + n.d)) : 0) * spb + 0.3) * 1000));
      const b = document.getElementById('iplay'); if (b) b.textContent = 'Arrêter';
    }
    function stopPreview() {
      if (!preview) return;
      preview.forEach(clearTimeout); preview = null;
      for (let m = 21; m <= 108; m++) E.sound.stop(m);
      const b = document.getElementById('iplay'); if (b) b.textContent = 'Écouter le début';
    }

    function save() {
      const title = (opts.title || '').trim().replace(/\s+/g, ' ') || fname || 'Mon morceau';
      const hand = { tout: 'deux mains', droite: 'main droite', gauche: 'main gauche' }[opts.part];
      const passage = opts.from > 1 || opts.to < opts.bars ? 'mesures ' + opts.from + ' à ' + opts.to : 'morceau entier';
      const rec = { id: 'u' + Date.now().toString(36), title, by: 'Mon fichier MIDI', tempo: opts.tempo,
        level: MF.level({ notes: built.notes, length: built.length, tempo: opts.tempo }),
        desc: 'Importé depuis un fichier MIDI : ' + hand + (opts.melody ? ', une note à la fois' : '') + ', ' + passage + '.',
        n: built.notes.map((n) => [n.m, n.t, n.d, n.h === 'g' ? 1 : 0]), length: built.length, bar: file.beatsPerBar || 4, added: Date.now() };
      if (!add(rec)) return;
      A.toast((A.isKid() ? 'Morceau ajouté : ' : 'Morceau enregistré : ') + title);
      A.go('jeu-' + rec.id);
    }

    pickScreen();
  }

  /* ---------- Modifier un morceau perso : titre, tempo, suppression ---------- */
  function Edit(id) {
    const r = read().find((x) => x.id === id);
    if (!r) { A.go('morceaux'); return; }
    A.shell('morceaux', A.header() +
      '<div class="row"><a href="#morceaux" class="icon-btn" aria-label="Retour aux morceaux">' + A.ICON.back + '</a><h1 class="h1">' + A.esc(r.title) + '</h1></div>' +
      '<div class="cols"><div class="stack">' +
        '<div class="card"><label class="label" for="etitle">Titre</label><input id="etitle" class="pfield" maxlength="60" value="' + A.esc(r.title) + '">' +
          '<div class="row"><label class="label" for="etempo">Tempo</label><input id="etempo" class="pfield num" type="number" inputmode="numeric" min="30" max="240" value="' + r.tempo + '"><span class="help">noires par minute</span></div>' +
          '<div class="help">' + A.esc(r.desc || '') + ' ' + r.n.length + ' notes.</div>' +
          '<div class="row" style="flex-wrap:wrap"><button class="btn" id="esave">Enregistrer</button><a class="btn ghost" href="#jeu-' + r.id + '">' + A.ICON.play + ' Jouer</a></div></div>' +
      '</div><div class="stack">' +
        '<div class="card line"><div class="label">Changer les pistes, la main ou le passage</div><div class="help">Importez de nouveau le fichier avec d\'autres réglages : vous aurez deux versions, puis vous pourrez supprimer celle-ci.</div><a class="btn small ghost" href="#importer" style="align-self:flex-start">Importer de nouveau</a></div>' +
        '<div class="card line"><div class="label">Supprimer ce morceau</div><div class="help">Il disparaîtra de cet appareil, avec les records de tous les joueurs.</div><button class="btn small ghost danger" id="edel">Supprimer</button></div>' +
      '</div></div>');
    document.getElementById('esave').onclick = () => {
      const title = document.getElementById('etitle').value.trim().replace(/\s+/g, ' ');
      const tempo = Math.max(30, Math.min(240, Math.round(+document.getElementById('etempo').value) || r.tempo));
      if (!title) { A.toast('Écris un titre'); return; }
      update(r.id, { title, tempo }); A.toast('Morceau enregistré'); A.go('morceaux');
    };
    const del = document.getElementById('edel');
    del.onclick = () => A.gate(() => {
      if (!del.dataset.ok) { del.dataset.ok = '1'; del.textContent = 'Sûr ? Touche encore pour supprimer'; return; }
      remove(r.id); A.toast('Morceau supprimé'); A.go('morceaux');
    });
  }

  A.screens.importer = Importer;
  window.MySongs = { list: read, sync, add, update, remove, KEY };
})();
