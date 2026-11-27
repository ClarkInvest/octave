/* Parcours guidé : Mondes, étapes, progression, et exercices au clavier adaptatifs. */
(function () {
  'use strict';
  const A = window.App, E = window.Engine, M = window.Mascots, MU = window.Music;
  const lessonOf = (id) => window.Learn.LESSONS.find((l) => l.id === id);

  /* ---------- Icônes des types d'étape ---------- */
  const sv = (d) => '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + d + '</svg>';
  const TICON = {
    lire: sv('<path d="M4 5c3-1 6-1 8 1 2-2 5-2 8-1v14c-3-1-6-1-8 1-2-2-5-2-8-1z"/><path d="M12 6v14"/>'),
    quiz: sv('<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6v.4"/><path d="M12 17.5v.01"/>'),
    clavier: sv('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M8 5v8M12 5v8M16 5v8"/>'),
    morceau: sv('<path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/>'),
    concert: sv('<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>'),
    oreille: sv('<path d="M7 10a5 5 0 0 1 10 0c0 3-3 4-3 7a3 3 0 0 1-5 2"/><path d="M10 10a2 2 0 0 1 4 0"/>'),
    rythme: sv('<path d="M8 18V6l10-2v12"/><path d="M8 10l10-2"/><circle cx="6" cy="18" r="2"/><circle cx="16" cy="16" r="2"/>'),
    lock: sv('<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>')
  };
  const TLABEL = { lire: 'Lire', quiz: 'Quiz', clavier: 'Au clavier', morceau: 'Morceau', concert: 'Concert', oreille: 'Oreille', rythme: 'Rythme' };
  const CHORDS = { do: { name: 'Do', notes: [48, 52, 55] }, fa: { name: 'Fa', notes: [41, 45, 48] }, sol: { name: 'Sol', notes: [43, 47, 50] },
    /* Monde 4 : une note dans chaque main */
    'p-do-do': { name: 'Do + Do', notes: [48, 60], pair: true }, 'p-do-mi': { name: 'Do + Mi', notes: [48, 64], pair: true },
    'p-sol-re': { name: 'Sol + Ré', notes: [55, 62], pair: true }, 'p-mi-sol': { name: 'Mi + Sol', notes: [52, 67], pair: true }, 'p-re-fa': { name: 'Ré + Fa', notes: [50, 65], pair: true } };

  /* ---------- Les Mondes ---------- */
  const WORLDS = [
    { id: 'm1', title: 'Premiers pas', kid: 'Le garage', sum: 'Le clavier, les doigts, Do-Ré-Mi-Fa-Sol, la noire et la blanche.', steps: [
      /* une petite notion, tout de suite les mains sur le clavier, et le quiz après la pratique */
      { type: 'lire', ref: 'clavier' },
      { type: 'clavier', ex: { kind: 'trouve', pcs: [0] }, title: 'Trouve tous les Do', teach: [60], key: 'trouve-do' },
      { type: 'quiz', ref: 'clavier' },
      { type: 'lire', ref: 'doigts' },
      { type: 'lire', ref: 'do-re-mi', teach: [60, 62, 64] },
      { type: 'clavier', ex: { kind: 'suite' }, title: 'Do, Ré, Mi avec les bons doigts', key: 'suite-do-re-mi' },
      { type: 'quiz', ref: 'doigts' },
      { type: 'clavier', ex: { kind: 'joue' }, title: 'Joue la note demandée', key: 'joue-notes' },
      { type: 'morceau', ref: 'lune' },
      { type: 'lire', ref: 'fa-sol', teach: [65, 67] },
      { type: 'clavier', ex: { kind: 'suite' }, title: 'Les cinq doigts', key: 'suite-cinq-doigts' },
      { type: 'morceau', ref: 'cinq' },
      { type: 'lire', ref: 'noire-blanche' },
      { type: 'clavier', ex: { kind: 'trouve' }, title: 'Retrouve tes notes partout', key: 'trouve-partout' },
      { type: 'quiz', ref: 'noire-blanche' },
      { type: 'morceau', ref: 'marche' },
      { type: 'concert', ref: 'joie' }
    ] },
    { id: 'm2', title: 'Lire et compter', kid: 'La salle des fêtes', sum: 'La portée, les notes de Do3 à Do4, les durées, la mesure, les silences.', steps: [
      { type: 'lire', ref: 'portee' },
      { type: 'quiz', ref: 'portee' },
      { type: 'lire', ref: 'notes-sol', teach: [60, 62, 64, 65, 67, 69, 71, 72] },
      { type: 'quiz', ref: 'notes-sol' },
      { type: 'clavier', ex: { kind: 'lis' }, title: 'Lis la note et joue-la', key: 'lis-notes' },
      { type: 'morceau', ref: 'gamme' },
      { type: 'lire', ref: 'durees' },
      { type: 'quiz', ref: 'durees' },
      { type: 'clavier', ex: { kind: 'trouve' }, title: 'Retrouve tes notes partout', key: 'trouve-partout' },
      { type: 'morceau', ref: 'jacques', teach: [55] },
      { type: 'lire', ref: 'mesure' },
      { type: 'quiz', ref: 'mesure' },
      { type: 'lire', ref: 'silences' },
      { type: 'quiz', ref: 'silences' },
      { type: 'clavier', ex: { kind: 'suite' }, title: 'Des suites plus longues', key: 'suite-longue' },
      { type: 'clavier', ex: { kind: 'lis' }, title: 'Lecture rapide', key: 'lis-rapide' },
      { type: 'concert', ref: 'jingle' }
    ] },
    { id: 'm3', title: 'La main gauche', kid: 'Le club', sum: 'La clé de fa, la main gauche en position de Do, les accords Do, Fa et Sol.', steps: [
      { type: 'lire', ref: 'cle-fa' },
      { type: 'quiz', ref: 'cle-fa' },
      { type: 'lire', ref: 'main-gauche', teach: [48, 50, 52, 53, 55] },
      { type: 'clavier', ex: { kind: 'trouve', zone: 'grave' }, title: 'Trouve tes notes dans les graves', key: 'trouve-graves' },
      { type: 'clavier', ex: { kind: 'suite', zone: 'grave', hand: 'g' }, title: 'Les cinq doigts de la main gauche', key: 'suite-main-gauche' },
      { type: 'quiz', ref: 'main-gauche' },
      { type: 'clavier', ex: { kind: 'lis', zone: 'grave' }, title: 'Lis en clé de fa', key: 'lis-cle-fa' },
      { type: 'morceau', ref: 'ours' },
      { type: 'oreille', ref: 'aigu', title: 'Aigu ou grave ?' },
      { type: 'lire', ref: 'accords', teach: [41, 43, 45, 47] },
      { type: 'quiz', ref: 'accords' },
      { type: 'clavier', ex: { kind: 'accord', chords: ['do'] }, title: 'Ton premier accord : Do', key: 'accord-do' },
      { type: 'clavier', ex: { kind: 'accord', chords: ['do', 'fa', 'sol'] }, title: 'Do, Fa, Sol', key: 'accord-do-fa-sol' },
      { type: 'rythme', ref: 'tape', title: 'Tape le rythme' },
      { type: 'morceau', ref: 'valse' },
      { type: 'oreille', ref: 'repete', title: 'Rejoue ce que tu entends' },
      { type: 'concert', ref: 'blues' }
    ] },
    { id: 'm4', title: 'Les deux mains', kid: 'La grande salle', sum: 'Les deux mains ensemble, la partition à deux portées, les croches.', steps: [
      { type: 'lire', ref: 'deux-mains' },
      { type: 'morceau', ref: 'alterne' },
      { type: 'quiz', ref: 'deux-mains' },
      { type: 'clavier', ex: { kind: 'accord', chords: ['p-do-do', 'p-do-mi', 'p-sol-re', 'p-mi-sol'] }, title: 'Une note dans chaque main', key: 'deux-notes' },
      { type: 'morceau', ref: 'miroir' },
      { type: 'morceau', ref: 'ensemble' },
      { type: 'morceau', ref: 'lune2' },
      { type: 'lire', ref: 'croches' },
      { type: 'quiz', ref: 'croches' },
      { type: 'rythme', ref: 'tape', title: 'Tape le rythme avec des croches', key: 'tape-croches' },
      { type: 'morceau', ref: 'wish' },
      { type: 'morceau', ref: 'joie2' },
      { type: 'clavier', ex: { kind: 'accord', chords: ['p-do-mi', 'p-re-fa', 'p-mi-sol', 'p-sol-re', 'p-do-do'] }, title: 'Les deux mains, plus vite', key: 'deux-notes-vite' },
      { type: 'morceau', ref: 'canon' },
      { type: 'oreille', ref: 'repete', title: 'Rejoue ce que tu entends', key: 'oreille-repete-m4' },
      { type: 'concert', ref: 'vent2' }
    ] },
    { id: 'm5', title: 'Plus loin', kid: 'Le stade', sum: 'Dièses et bémols, notes pointées, la gamme de Sol, et la Lettre à Élise.', steps: [
      { type: 'lire', ref: 'dieses', teach: [66, 70] },
      { type: 'clavier', ex: { kind: 'trouve', pcs: [6] }, title: 'Trouve tous les Fa♯', key: 'trouve-fa-diese' },
      { type: 'quiz', ref: 'dieses' },
      { type: 'lire', ref: 'pointee' },
      { type: 'quiz', ref: 'pointee' },
      { type: 'morceau', ref: 'sapin' },
      { type: 'lire', ref: 'gamme-sol', teach: [57, 59, 69, 71] },
      { type: 'morceau', ref: 'gammesol' },
      { type: 'quiz', ref: 'gamme-sol' },
      { type: 'clavier', ex: { kind: 'lis' }, title: 'Lis les notes, dièses compris', key: 'lis-dieses' },
      { type: 'morceau', ref: 'doucenuit' },
      { type: 'morceau', ref: 'green' },
      { type: 'oreille', ref: 'aigu', title: 'Aigu ou grave ?', key: 'oreille-aigu-m5' },
      { type: 'concert', ref: 'elise' }
    ] }
  ];
  /* Chaque étape a un nom fixe (« m1-lire-clavier », « m1-trouve-do »…) : on peut ajouter ou déplacer
     des étapes plus tard sans décaler la progression déjà enregistrée. */
  const STEPS = [];
  WORLDS.forEach((w, wi) => {
    w.n = wi + 1;
    (w.steps || []).forEach((s, si) => {
      s.id = w.id + '-' + (s.key || s.type + '-' + s.ref); s.n = si + 1; s.world = w;
      if (s.type === 'clavier') s.ref = s.id;
      if (STEPS.some((x) => x.id === s.id)) console.error('Étape en double : ' + s.id);
      STEPS.push(s);
    });
  });

  /* Conversion des progressions enregistrées avant la v0.5 (étapes numérotées « m1-3 »).
     Cette liste fige l'ordre de l'époque : elle ne doit plus jamais changer. */
  const LEGACY = {
    m1: ['lire-clavier', 'quiz-clavier', 'trouve-do', 'lire-doigts', 'quiz-doigts', 'lire-do-re-mi', 'suite-do-re-mi', 'joue-notes', 'morceau-lune', 'lire-fa-sol', 'suite-cinq-doigts', 'morceau-cinq', 'lire-noire-blanche', 'quiz-noire-blanche', 'trouve-partout', 'morceau-marche', 'concert-joie'],
    m2: ['lire-portee', 'quiz-portee', 'lire-notes-sol', 'quiz-notes-sol', 'lis-notes', 'morceau-gamme', 'lire-durees', 'quiz-durees', 'trouve-partout', 'morceau-jacques', 'lire-mesure', 'quiz-mesure', 'lire-silences', 'quiz-silences', 'suite-longue', 'lis-rapide', 'concert-jingle'],
    m3: ['lire-cle-fa', 'quiz-cle-fa', 'lire-main-gauche', 'trouve-graves', 'suite-main-gauche', 'quiz-main-gauche', 'lis-cle-fa', 'morceau-ours', 'oreille-aigu', 'lire-accords', 'quiz-accords', 'accord-do', 'accord-do-fa-sol', 'rythme-tape', 'morceau-valse', 'oreille-repete', 'concert-blues']
  };
  function migrate() {
    let changed = false;
    A.DB.profiles.forEach((p) => {
      if (!p.path || p.pathV === 2) return;
      const out = {};
      Object.keys(p.path).forEach((k) => {
        const m = /^(m\d)-(\d+)$/.exec(k), list = m && LEGACY[m[1]];
        out[list && list[+m[2] - 1] ? m[1] + '-' + list[+m[2] - 1] : k] = p.path[k];
      });
      p.path = out; p.pathV = 2; changed = true;
    });
    if (changed) A.save();
  }
  migrate();
  const worldName = (w) => (A.isKid() ? w.kid : w.title);

  function stepTitle(s) {
    if (s.title) return s.title;
    if (s.type === 'lire') return lessonOf(s.ref).title;
    if (s.type === 'quiz') return 'Quiz · ' + lessonOf(s.ref).title;
    const song = MU.song(s.ref);
    return s.type === 'concert' ? 'Concert : ' + song.title : song.title;
  }
  function stepMeta(s) {
    const min = s.type === 'lire' ? lessonOf(s.ref).min : s.type === 'quiz' || s.type === 'oreille' || s.type === 'rythme' ? 2 : s.type === 'concert' ? 4 : 3;
    const free = s.type === 'lire' || s.type === 'quiz' || s.type === 'rythme' || (s.type === 'oreille' && s.ref === 'aigu');
    return TLABEL[s.type] + ' · ' + min + ' min' + (free ? ' · sans piano' : '');
  }
  function href(s) {
    if (s.type === 'rythme') return '#tape';
    return { lire: '#cours-', quiz: '#quiz-', clavier: '#exo-', morceau: '#jeu-', concert: '#jeu-', oreille: '#ecoute-' }[s.type] + s.ref + (s.type === 'concert' ? '-concert' : '');
  }

  /* ---------- Progression ---------- */
  const isDone = (p, s) => !!(p.path && p.path[s.id]);
  const current = (p) => STEPS.find((s) => !isDone(p, s)) || null;
  const unlocked = (p, s) => isDone(p, s) || s === current(p);
  function learned(p) {
    const c = current(p), lim = c ? STEPS.indexOf(c) : STEPS.length - 1, set = new Set();
    STEPS.forEach((s, i) => { if (i <= lim && s.teach) s.teach.forEach((m) => set.add(m)); });
    if (!set.size) [60, 62, 64].forEach((m) => set.add(m));
    return Array.from(set).sort((a, b) => a - b);
  }
  const stepFor = (p, type, ref) => STEPS.find((s) => s.type === type && s.ref === ref && unlocked(p, s)) || null;
  const PASS = {
    lire: () => true,
    quiz: (r) => r.score >= r.total * 0.75,
    clavier: (r) => r.acc >= 0.7,
    morceau: (r) => r.stars >= 1,
    concert: (r) => r.mode === 'defi' && r.stars >= 1 && !!r.concert,
    oreille: (r) => r.acc >= 0.7,
    rythme: (r) => r.acc >= 0.7
  };
  const RULE = {
    quiz: 'Pour valider l\'étape : 3 bonnes réponses sur 4.',
    clavier: 'Pour valider l\'étape : 70 % de réussite.',
    morceau: 'Pour valider l\'étape : au moins 1 étoile.',
    concert: 'Pour valider le concert : au moins 1 étoile en mode Défi. Tu peux ralentir le tempo.',
    oreille: 'Pour valider l\'étape : 70 % de bonnes réponses.',
    rythme: 'Pour valider l\'étape : 70 % de réussite.'
  };
  /* appelé par les écrans à la fin d'une activité ; valide l'étape en cours si elle correspond */
  function report(type, ref, r) {
    const p = A.prof(); if (!p) return null;
    const types = type === 'morceau' ? ['morceau', 'concert'] : [type];
    const cur = current(p);
    let s = cur && types.includes(cur.type) && cur.ref === ref ? cur : null;
    if (s) {
      if (s.type === 'concert' && !r.concert) return { step: s, passed: false, hint: true };
      if (!PASS[s.type](r)) return { step: s, passed: false };
      p.path = p.path || {}; p.pathV = 2; p.path[s.id] = { at: Date.now() };
      A.addCoins(p, 10);
      A.save();
      const next = current(p);
      A.toast(A.isKid() ? 'Étape validée ! +10 pièces' : 'Étape validée');
      return { step: s, passed: true, first: true, next, worldDone: !next || next.world !== s.world };
    }
    /* si le morceau est celui d'un concert à venir, joué hors concert : on rappelle comment le valider */
    if (cur && cur.type === 'concert' && cur.ref === ref && !r.concert) return { step: cur, passed: false, hint: true };
    s = STEPS.find((x) => types.includes(x.type) && x.ref === ref && isDone(p, x));
    if (!s || !PASS[s.type](r)) return null;
    return { step: s, passed: true, first: false, next: current(p) };
  }
  function resultHtml(res) {
    if (!res) return '';
    if (res.hint) return '<div class="help step-rule">' + (A.isKid() ? 'Ce morceau est ton concert : lance-le depuis ta tournée pour monter sur scène !' : 'Ce morceau est le concert du monde : lancez-le depuis le parcours pour le valider.') + '</div><a class="btn" href="' + href(res.step) + '">' + (A.isKid() ? 'Aller au concert' : 'Lancer le concert') + '</a>';
    if (!res.passed) return '<div class="help step-rule">' + RULE[res.step.type] + '</div>';
    if (!res.next) return '<a class="btn" href="#parcours">' + (A.isKid() ? 'Tournée terminée !' : 'Parcours terminé') + '</a>';
    const label = res.worldDone ? (A.isKid() ? 'Nouveau monde débloqué !' : 'Monde suivant') : 'Étape suivante';
    return '<a class="btn" href="' + href(res.next) + '">' + label + ' ' + A.ICON.play + '</a>';
  }

  /* ---------- Compétences : niveau par type d'exercice et maîtrise de chaque note ---------- */
  function skill(p) { p.skill = p.skill || {}; p.skill.lvl = p.skill.lvl || {}; p.skill.notes = p.skill.notes || {}; return p.skill; }
  const lvlOf = (p, k) => skill(p).lvl[k] || (p.mode === 'enfant' ? 1 : 2);
  function mastery(p, m, ok) {
    const n = skill(p).notes; const s = n[m] || (n[m] = { ok: 0, miss: 0 });
    /* les essais récents comptent plus que les anciens : une note ratée au début puis maîtrisée cesse d'être surreprésentée */
    s.ok = +(s.ok * 0.88 + (ok ? 1 : 0)).toFixed(3); s.miss = +(s.miss * 0.88 + (ok ? 0 : 1)).toFixed(3);
  }
  function pick(p, pool, prev) {
    const sk = skill(p).notes;
    const w = pool.map((m) => {
      if (m === prev && pool.length > 1) return 0;
      const s = sk[m] || { ok: 0, miss: 0 }, n = s.ok + s.miss;
      return 1 + 4 * s.miss / (n + 1) + (n === 0 ? 1 : 0) + (n > 0 && s.ok / n > 0.9 && n > 5 ? -0.5 : 0);
    });
    let r = Math.random() * w.reduce((a, b) => a + b, 0);
    for (let i = 0; i < pool.length; i++) { r -= w[i]; if (r <= 0) return pool[i]; }
    return pool[pool.length - 1];
  }
  const KINDS = {
    trouve: { title: 'Trouve les notes', how: 'Une note est demandée : trouve-la partout sur le clavier.', kid: 'Trouve cette note partout sur le clavier !' },
    joue: { title: 'Joue la note demandée', how: 'Le nom d\'une note s\'affiche : joue-la.', kid: 'Joue la note que tu vois.' },
    lis: { title: 'Lis et joue', how: 'Une note s\'affiche sur la portée : trouve laquelle et joue-la.', kid: 'Regarde la note et joue-la.' },
    suite: { title: 'Joue la suite', how: 'Joue les notes dans l\'ordre, avec les doigts indiqués.', kid: 'Joue les notes dans l\'ordre.' },
    accord: { title: 'Joue l\'accord', how: 'Un accord s\'affiche : joue ses trois notes.', kid: 'Joue les trois notes ensemble.' }
  };
  const HINTS = {
    trouve: ['sur 2 octaves, sans chrono', 'sur 2 octaves', 'sur 3 octaves', 'sur 4 octaves', 'sur 4 octaves, toutes tes notes'],
    joue: ['la touche s\'allume tout de suite', 'la touche s\'allume au bout de 4 secondes', 'indice seulement après une erreur, octave exacte', 'sans indice, octave exacte', 'sans indice, octave exacte, sur 2 octaves'],
    lis: ['le nom de la note est écrit', 'le nom apparaît après une erreur', 'sans le nom', 'sans le nom, octave exacte', 'sans le nom, octave exacte, sur 2 octaves'],
    suite: ['3 notes, noms, doigts et touches montrés', '4 notes, noms et doigts', '5 notes, noms seulement', '6 notes, sur la portée', '7 notes, sur la portée'],
    accord: ['les touches s\'allument, une note après l\'autre', 'les noms sont écrits, une note après l\'autre', 'les noms sont écrits, les trois ensemble', 'sans les noms, les trois ensemble', 'sans les noms, ensemble, à la bonne octave']
  };
  function freeEx(p) {
    const sk = skill(p), c = current(p), ci = c ? STEPS.indexOf(c) : STEPS.length;
    const readIdx = STEPS.findIndex((s) => s.type === 'lire' && s.ref === 'notes-sol');
    const chordIdx = STEPS.findIndex((s) => s.type === 'lire' && s.ref === 'accords');
    const kinds = ['trouve', 'joue', 'suite'].concat(ci > readIdx ? ['lis'] : [], ci > chordIdx ? ['accord'] : []);
    const min = Math.min.apply(null, kinds.map((k) => lvlOf(p, k)));
    let pool = kinds.filter((k) => lvlOf(p, k) === min && k !== sk.lastFree);
    if (!pool.length) pool = kinds.filter((k) => k !== sk.lastFree);
    const kind = pool[Math.floor(Math.random() * pool.length)];
    sk.lastFree = kind;
    return kind === 'accord' ? { kind, chords: ['do', 'fa', 'sol'] } : { kind };
  }
  const whiteStep = (m, dir) => { do { m += dir; } while (E.isBlack(m)); return m; };

  /* clavier tactile réutilisable */
  function keyboard(el, lo, hi, labels) {
    const whites = []; for (let m = lo; m <= hi; m++) if (!E.isBlack(m)) whites.push(m);
    const ww = 100 / whites.length, keys = {};
    let h = '';
    whites.forEach((m, i) => { h += '<div class="w" data-m="' + m + '" style="left:calc(' + (i * ww) + '% + 1px);width:calc(' + ww + '% - 2px)">' + (labels ? MU.natName(m) : '') + '</div>'; });
    for (let m = lo; m <= hi; m++) if (E.isBlack(m) && whites.includes(m - 1) && m < hi) { const i = whites.indexOf(m - 1); h += '<div class="b" data-m="' + m + '" style="left:' + ((i + 1) * ww - ww * 0.32) + '%;width:' + (ww * 0.64) + '%"></div>'; }
    el.innerHTML = h; el.style.minWidth = whites.length * 26 + 'px';
    el.querySelectorAll('[data-m]').forEach((k) => { keys[k.dataset.m] = k; });
    const ptr = new Map();
    el.addEventListener('pointerdown', (e) => {
      const k = e.target.closest('[data-m]'); if (!k) return;
      e.preventDefault(); try { el.setPointerCapture(e.pointerId); } catch (x) { /* ignoré */ }
      const m = +k.dataset.m; ptr.set(e.pointerId, m); E.sound.enabled = A.DB.input.source !== 'micro'; E.screen.down(m);
    });
    const up = (e) => { const m = ptr.get(e.pointerId); if (m !== undefined) { E.screen.up(m); ptr.delete(e.pointerId); } };
    el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
    return keys;
  }

  /* ---------- Écran : exercice au clavier ---------- */
  function Exo(param) {
    const p = A.prof(), kid = A.isKid(), DB = A.DB, sk = skill(p);
    const step = STEPS.find((s) => s.type === 'clavier' && s.id === param) || null;
    if (param !== 'libre' && !step) { A.go('parcours'); return; }
    if (step && !unlocked(p, step)) { A.toast('Termine d\'abord les étapes précédentes'); A.go('parcours'); return; }
    const ex = step ? step.ex : freeEx(p);
    const kind = ex.kind, lvl = lvlOf(p, kind);
    let notes = learned(p);
    if (ex.zone === 'grave') { notes = notes.filter((m) => m < 60); if (notes.length < 3) notes = [48, 50, 52, 53, 55]; }
    const chords = (ex.chords || []).map((id) => CHORDS[id]);
    const pcs = ex.pcs || Array.from(new Set(notes.map((m) => m % 12)));
    const clefOf = (m) => (m < 60 ? 'fa' : 'sol');
    const exact = (kind === 'joue' && lvl >= 3) || (kind === 'lis' && lvl >= 4);
    if (lvl >= 5 && (kind === 'joue' || kind === 'lis')) notes = notes.concat(notes.map((m) => m + 12).filter((m) => m <= 84 && notes.indexOf(m) < 0 && notes.indexOf(m + 12) < 0));

    /* fenêtre de 5 notes pour les suites (position de la main) */
    let win = null;
    if (kind === 'suite') {
      const nat = notes.filter((m) => !E.isBlack(m)), runs = []; let run = [];
      nat.forEach((m) => { if (run.length && MU.diat(m) - MU.diat(run[run.length - 1]) !== 1) { runs.push(run); run = []; } run.push(m); });
      if (run.length) runs.push(run);
      runs.sort((a, b) => b.length - a.length);
      const r0 = runs[0];
      let start = Math.floor(Math.random() * Math.max(1, r0.length - 4));
      const c0 = r0.findIndex((m) => m % 12 === 0);
      if (c0 >= 0 && (lvl <= 2 || Math.random() < 0.5)) start = Math.min(c0, Math.max(0, r0.length - 5));
      win = r0.slice(start, start + 5);
    }
    const hand = ex.hand || (win && win[win.length - 1] < 60 ? 'g' : 'd');

    /* étendue du clavier affiché */
    let lo, hi;
    if (kind === 'trouve') {
      const maxOct = Math.max(2, Math.floor((Math.min(window.innerWidth, 1180) - 70) / 26 / 7));
      const oct = Math.min(lvl <= 2 ? 2 : lvl === 3 ? 3 : 4, maxOct);
      lo = oct >= 4 || ex.zone === 'grave' ? 36 : 48; hi = lo + 12 * oct;
    } else {
      const src = kind === 'accord' ? [].concat.apply([], chords.map((c) => c.notes)) : win || notes;
      lo = whiteStep(Math.min.apply(null, src), -1); hi = whiteStep(Math.max.apply(null, src), 1);
    }
    const ROUNDS = { trouve: Math.min(kid ? 3 : 4, pcs.length * 2), joue: (kid ? 8 : 10) + (lvl >= 4 ? 2 : 0), lis: (kid ? 8 : 10) + (lvl >= 4 ? 2 : 0), suite: kid ? 3 : 4, accord: kid ? 5 : 6 }[kind];
    const title = step ? stepTitle(step) : KINDS[kind].title;
    const ctx = step ? 'Monde ' + step.world.n + ' · étape ' + step.n + ' sur ' + step.world.steps.length : (kid ? 'Entraînement express' : 'Entraînement adapté');
    const back = A.prevHash && A.prevHash.indexOf('exo') !== 0 ? '#' + A.prevHash : '#parcours';

    A.shell('parcours', A.header() +
      '<div class="row"><a href="' + back + '" class="icon-btn" aria-label="Retour">' + A.ICON.back + '</a><div style="min-width:0"><div class="eyebrow">' + ctx + '</div><div class="h2">' + A.esc(title) + '</div></div></div>' +
      '<div class="card exo-card" id="xcard"></div>' +
      '<div class="kbd-wrap"><div class="kbd exo-kbd" id="xkbd" aria-label="Clavier"></div></div>');
    const card = document.getElementById('xcard');
    const keys = keyboard(document.getElementById('xkbd'), lo, hi, ((kind === 'joue' || kind === 'suite' || kind === 'accord') && lvl <= 2) || (kind === 'lis' && lvl === 1));

    const S = { phase: 'start', round: 0, ok: 0, miss: 0, t0: 0, target: null, curMiss: false, seq: [], si: 0, todo: [], found: new Set(), prev: null, missed: new Set(), hintT: 0, mood: 'idle', chord: null, got: new Set() };
    /* plaquer trois notes ensemble n'a de sens qu'avec un vrai clavier : ni au micro (une note à la fois) ni avec les doigts sur l'écran */
    const together = kind === 'accord' && lvl >= 3 && DB.input.source === 'midi';
    const lit = new Set();
    function hint(m) { const k = keys[m]; if (k) k.classList.add('target'); if (DB.input.lights) { E.midi.light(m, true, m < 60 ? 'g' : 'd'); lit.add(m); } }
    function clearHints() { clearTimeout(S.hintT); Object.values(keys).forEach((k) => k.classList.remove('target')); lit.forEach((m) => E.midi.light(m, false)); lit.clear(); }
    const match = (m, t) => (exact ? m === t : m % 12 === t % 12);
    function makeSeq() {
      const len = Math.min(lvl + 2, 7); let i = lvl <= 2 ? 0 : Math.floor(Math.random() * win.length);
      const seq = [i], steps = lvl <= 2 ? [-1, 1] : [-2, -1, 1, 2];
      while (seq.length < len) { const o = steps.map((d) => i + d).filter((j) => j >= 0 && j < win.length); i = o[Math.floor(Math.random() * o.length)]; seq.push(i); }
      return seq.map((j) => ({ m: win[j], f: hand === 'g' ? win.length - j : j + 1 }));
    }
    function next() {
      clearHints();
      if (S.round >= ROUNDS) { finish(); return; }
      S.round++; S.curMiss = false;
      if (kind === 'trouve') {
        const t = pick(p, pcs.map((x) => 60 + x), S.prev); S.prev = t; S.target = t % 12;
        S.todo = []; for (let m = lo; m <= hi; m++) if (m % 12 === S.target) S.todo.push(m);
        S.found = new Set(); Object.values(keys).forEach((k) => k.classList.remove('found'));
      } else if (kind === 'suite') {
        S.seq = makeSeq(); S.si = 0; S.target = S.seq[0].m; if (lvl <= 1) hint(S.target);
      } else if (kind === 'accord') {
        const k = pick(p, chords.map((c, i) => 900 + i), S.prev); S.prev = k; S.chord = chords[k - 900]; S.target = k; S.got = new Set();
        if (lvl <= 1) S.chord.notes.forEach(hint);
      } else {
        S.target = pick(p, notes, S.prev); S.prev = S.target;
        if (kind === 'joue' && lvl <= 1) hint(S.target);
        if (kind === 'joue' && lvl === 2) S.hintT = setTimeout(() => hint(S.target), 4000);
      }
      draw();
    }
    const mascot = () => '<div class="mascot" id="xm" style="color:var(--text)">' + M.svg(p.mascot, S.mood) + '</div>';
    const pips = () => '<div class="pips">' + Array.from({ length: ROUNDS }, (_, k) => '<i class="' + (k < S.round - 1 ? 'ok' : '') + '"></i>').join('') + '</div>';
    const noteChips = (arr) => arr.map((m) => '<span class="chip small">' + MU.natName(m) + '</span>').join('');
    function draw() {
      if (S.phase === 'start') {
        card.innerHTML = '<div class="between"><span class="eyebrow">' + KINDS[kind].title + '</span><span class="chip lvl">Niveau ' + lvl + '</span></div>' +
          '<div class="challenge">' + mascot() + '<div><div class="say-row"><div class="label" style="flex:1">' + (kid ? KINDS[kind].kid : KINDS[kind].how) + '</div>' + A.sayBtn(kid ? KINDS[kind].kid : KINDS[kind].how + ' Ton niveau : ' + HINTS[kind][lvl - 1] + '.') + '</div>' + (kid ? '' : '<div class="help" style="margin-top:4px">Ton niveau : ' + HINTS[kind][lvl - 1] + '.</div>') + '</div></div>' +
            (kind === 'accord' ? '<div><div class="help" style="margin-bottom:6px">Accords travaillés</div><div class="row" style="flex-wrap:wrap;gap:6px">' + chords.map((c) => '<span class="chip small">' + c.name + '</span>').join('') + '</div></div>'
            : '<div><div class="help" style="margin-bottom:6px">' + (kind === 'trouve' && ex.pcs ? 'Note travaillée' : 'Tes notes, celles que tu as apprises') + '</div><div class="row" style="flex-wrap:wrap;gap:6px">' + noteChips(kind === 'trouve' ? pcs.map((x) => 60 + x) : win || notes.filter((m) => m <= 84)) + '</div></div>') +
          (hand === 'g' && kind !== 'accord' ? '<div class="help step-rule">Main gauche : le petit doigt est le doigt 5, le pouce le doigt 1.</div>' : '') +
          (kid ? '' : '<div class="help">L\'exercice s\'adapte : réussis-le à 90 % pour passer au niveau suivant.</div>') +
          '<button class="btn" id="xgo">' + A.ICON.play + (kid ? ' C\'est parti' : ' Commencer') + '</button>';
        if (A.sayAuto() && !S.said) { S.said = true; setTimeout(() => A.say(kid ? KINDS[kind].kid : KINDS[kind].how), 300); }
        document.getElementById('xgo').onclick = async (e) => { A.hush(); e.target.disabled = true; await A.startInput(); A.countdown(() => { S.phase = 'play'; S.t0 = performance.now(); next(); }); };
        return;
      }
      if (S.phase !== 'play') return;
      let ask = '';
      if (kind === 'trouve') {
        ask = '<div><div class="help">Trouve tous les</div><div class="ask">' + MU.FR_NAT[[0, 0, 1, 1, 2, 3, 3, 4, 4, 5, 5, 6][S.target]] + (E.isBlack(S.target) ? '♯' : '') + '</div><div class="help">' + S.found.size + ' sur ' + S.todo.length + ' trouvé' + (S.found.size > 1 ? 's' : '') + '</div></div>';
      } else if (kind === 'joue') {
        ask = '<div><div class="help">Joue</div><div class="ask">' + (exact ? E.name(S.target) : MU.natName(S.target)) + '</div><div class="help">' + (exact ? 'à la bonne octave' : 'n\'importe quel ' + MU.natName(S.target)) + '</div></div>';
      } else if (kind === 'lis') {
        const showName = lvl <= 1 || (lvl === 2 && S.curMiss);
        ask = '<div class="staff-box exo-staff">' + MU.staff({ notes: [{ m: S.target, d: 1, label: showName ? MU.natName(S.target) : '' }], clef: clefOf(S.target), width: 220, height: 130, gap: 12, top: 40, startX: 130, label: 'Note à jouer' }) + '</div>';
      } else if (kind === 'suite') {
        const onStaff = lvl >= 4;
        ask = onStaff
          ? '<div class="staff-box exo-staff wide">' + MU.staff({ notes: S.seq.map((n, i) => ({ m: n.m, d: 1, color: i < S.si ? 'var(--muted)' : i === S.si ? 'var(--accent)' : undefined })), clef: clefOf(win[0]), width: 120 + S.seq.length * 46, height: 130, gap: 12, top: 40, startX: 90, dx: 46, label: 'Suite à jouer' }) + '</div>'
          : (hand === 'g' ? '<div class="help">Main gauche</div>' : '') + '<div class="seq">' + S.seq.map((n, i) => '<span class="seq-n' + (i < S.si ? ' done' : i === S.si ? ' cur' : '') + '">' + (lvl <= 3 ? '<b>' + MU.natName(n.m) + '</b>' : '') + (lvl <= 2 ? '<i>doigt ' + n.f + '</i>' : '') + '</span>').join('') + '</div>';
      }
      if (kind === 'accord') {
        ask = '<div><div class="help">' + (S.chord.pair ? 'Main gauche + main droite' : 'Joue l\'accord de') + '</div><div class="ask">' + S.chord.name + '</div>' +
          (lvl <= 3 ? '<div class="row" style="gap:6px;margin-top:6px;flex-wrap:wrap">' + S.chord.notes.map((m) => '<span class="chip small' + (S.got.has(S.chord.pair || lvl >= 5 ? m : m % 12) ? ' got' : '') + '">' + (S.chord.pair ? (m < 60 ? 'gauche : ' : 'droite : ') + E.name(m) : MU.natName(m)) + '</span>').join('') + '</div>' : '<div class="help">' + S.got.size + ' note' + (S.got.size > 1 ? 's' : '') + ' sur ' + S.chord.notes.length + '</div>') +
          '<div class="help" style="margin-top:6px">' + (S.chord.pair ? (together ? 'Les deux en même temps' : 'Ensemble, ou l\'une après l\'autre') : together ? 'Les trois en même temps' : 'Ensemble ou l\'une après l\'autre') + '</div></div>';
      }
      card.innerHTML = '<div class="between"><span class="eyebrow">' + (kind === 'suite' ? 'Suite ' : 'Tour ') + S.round + ' sur ' + ROUNDS + '</span>' + pips() + '</div>' +
        '<div class="challenge">' + mascot() + ask + '</div>';
    }
    function react(mood) {
      S.mood = mood; const el = document.getElementById('xm'); if (!el) return;
      el.innerHTML = M.svg(p.mascot, mood); el.classList.remove('bounce', 'shake'); void el.offsetWidth; el.classList.add(mood === 'oops' ? 'shake' : 'bounce');
    }
    const blip = () => { if (DB.input.source !== 'micro') E.sound.blip(true); };
    function wrong() {
      S.miss++; if (!S.curMiss) { S.curMiss = true; mastery(p, kind === 'trouve' ? 60 + S.target : S.target, false); if (kind !== 'accord') S.missed.add(kind === 'trouve' ? 60 + S.target : S.target); else S.missed.add(S.chord.name); }
      if ((kind === 'joue' && lvl === 3) || (kind === 'suite' && lvl === 2)) hint(S.target);
      if (kind === 'lis' && lvl === 2) draw();
      react('oops');
    }
    E.expect = (m) => {
      if (S.phase !== 'play') return false;
      if (kind === 'trouve') return m % 12 === S.target;
      if (kind === 'accord') return S.chord.notes.some((c) => (S.chord.pair ? c === m : c % 12 === m % 12));
      return match(m, S.target);
    };
    A.onLeave(() => { E.expect = null; });
    const off = E.on((ev) => {
      if (ev.type === 'pedal') return;
      const k = keys[ev.midi]; if (k) k.classList.toggle('on', ev.type === 'on');
      if (ev.type !== 'on' || S.phase !== 'play') return;
      const m = ev.midi;
      if (kind === 'trouve') {
        if (m % 12 !== S.target) { wrong(); return; }
        if (S.found.has(m) || S.todo.indexOf(m) < 0) return;
        S.found.add(m); S.ok++; if (k) k.classList.add('found'); blip();
        if (S.found.size === S.todo.length) { if (!S.curMiss) mastery(p, 60 + S.target, true); react('happy'); S.phase = 'wait'; setTimeout(() => { if (S.phase !== 'wait') return; S.phase = 'play'; next(); }, 600); }
        else { draw(); react('happy'); }
        return;
      }
      if (kind === 'accord') {
        /* une note dans chaque main : l'octave compte (Do grave et Do aigu sont deux notes différentes) */
        const ex5 = lvl >= 5 || S.chord.pair, ck = (x) => (ex5 ? x : x % 12);
        const inChord = S.chord.notes.some((c) => ck(c) === ck(m));
        if (!inChord) { wrong(); return; }
        if (!S.got.has(ck(m))) { S.got.add(ck(m)); S.ok++; }
        const need = new Set(S.chord.notes.map(ck)).size;
        const done = together
          ? S.chord.notes.every((c) => Array.from(E.held).some((h) => ck(h) === ck(c)))
          : S.got.size >= need;
        if (done) { if (!S.curMiss) mastery(p, S.target, true); blip(); react('happy'); S.phase = 'wait'; draw(); setTimeout(() => { if (S.phase !== 'wait') return; S.phase = 'play'; next(); }, 700); }
        else draw();
        return;
      }
      if (!match(m, S.target)) { wrong(); return; }
      S.ok++; if (!S.curMiss) mastery(p, S.target, true);
      if (kind === 'suite') {
        S.si++; clearHints(); S.curMiss = false;
        if (S.si >= S.seq.length) { blip(); react('happy'); S.phase = 'wait'; draw(); setTimeout(() => { if (S.phase !== 'wait') return; S.phase = 'play'; next(); }, 600); }
        else { S.target = S.seq[S.si].m; if (lvl <= 1) hint(S.target); draw(); }
      } else { blip(); next(); react('happy'); }
    });
    A.onLeave(() => { off(); clearHints(); Object.values(keys).forEach((k) => k.classList.remove('on', 'found')); A.stopInput(); S.phase = 'gone'; });

    function finish() {
      S.phase = 'end'; clearHints(); Object.values(keys).forEach((k) => k.classList.remove('found'));
      const acc = S.ok + S.miss ? S.ok / (S.ok + S.miss) : 0, pct = Math.round(acc * 100), time = Math.round((performance.now() - S.t0) / 1000);
      let after = lvl;
      if (acc >= 0.9 && lvl < 5) after = lvl + 1; else if (acc < 0.6 && lvl > 1) after = lvl - 1;
      sk.lvl[kind] = after;
      let coins = 0; if (!step) { coins = Math.round(acc * 10); A.addCoins(p, coins); }
      A.save();
      const res = step ? report('clavier', step.id, { acc }) : null;
      const lvlMsg = after > lvl ? (kid ? 'Niveau ' + after + ' débloqué ! ' : 'Vous passez au niveau ' + after + ' : ') + HINTS[kind][after - 1] + '.'
        : after < lvl ? 'On revient au niveau ' + after + ' pour consolider : ' + HINTS[kind][after - 1] + '.'
        : 'Niveau ' + lvl + ' : ' + (acc >= 0.6 ? 'encore un essai à 90 % pour monter.' : 'c\'est le premier niveau, on continue.');
      const work = Array.from(S.missed).map((m) => (typeof m === 'string' ? 'accord de ' + m : MU.natName(m)));
      S.mood = acc >= 0.7 ? 'happy' : 'idle';
      card.innerHTML = '<div class="eyebrow">' + (acc >= 0.7 ? (kid ? 'Bravo !' : 'Terminé') : 'Presque') + '</div>' +
        '<div class="challenge">' + mascot() + '<div><div class="ask">' + pct + ' %</div><div class="help">' + S.ok + ' juste' + (S.ok > 1 ? 's' : '') + ' · ' + S.miss + ' erreur' + (S.miss > 1 ? 's' : '') + ' · ' + time + ' s' + (coins ? ' · +' + coins + ' pièces' : '') + '</div></div></div>' +
        '<div class="lvl-msg"><span class="chip lvl">Niveau ' + after + '</span><span class="help">' + lvlMsg + '</span></div>' +
        (work.length ? '<div class="help">À retravailler : <b>' + work.join(', ') + '</b>. Ces notes reviendront plus souvent.</div>' : '') +
        resultHtml(res) +
        '<div class="row" style="flex-wrap:wrap"><button class="btn ghost" id="xagain">Rejouer</button>' + (res && res.passed ? '' : '<a class="btn ghost" href="#parcours">Parcours</a>') + '</div>';
      document.getElementById('xagain').onclick = () => A.route();
    }
    draw();
  }

  /* ---------- Écran : parcours ---------- */
  function PathScreen() {
    const p = A.prof(), kid = A.isKid(), cur = current(p);
    const stepRow = (s) => {
      const done = isDone(p, s), here = s === cur, open = done || here;
      const num = done ? '✓' : here ? TICON[s.type] : TICON.lock;
      const inner = '<span class="path-num' + (done ? ' ok' : here ? ' now' : '') + '">' + num + '</span><span class="path-txt"><span class="label">' + A.esc(stepTitle(s)) + '</span><span class="help">' + stepMeta(s) + '</span></span>' + (here ? '<span class="chip now-chip">' + (kid ? 'À toi !' : 'Maintenant') + '</span>' : '');
      return open ? '<a class="path-item step' + (here ? ' current' : '') + '" href="' + href(s) + '">' + inner + '</a>' : '<button class="path-item step locked" data-locked="1" type="button">' + inner + '</button>';
    };
    const worlds = WORLDS.map((w) => {
      if (w.soon) return '<div class="world soon-w"><div class="world-head"><span class="world-n">' + w.n + '</span><span class="path-txt"><span class="eyebrow">Monde ' + w.n + ' · bientôt</span><span class="label">' + A.esc(worldName(w)) + '</span><span class="help">' + w.sum + '</span></span>' + TICON.lock + '</div></div>';
      const n = w.steps.filter((s) => isDone(p, s)).length, all = n === w.steps.length, isCur = cur && cur.world === w;
      return '<details class="world"' + (isCur ? ' open' : '') + '><summary class="world-head"><span class="world-n' + (all ? ' ok' : '') + '">' + (all ? '✓' : w.n) + '</span><span class="path-txt"><span class="eyebrow">Monde ' + w.n + ' · ' + n + ' / ' + w.steps.length + '</span><span class="label">' + A.esc(worldName(w)) + '</span><span class="help">' + w.sum + '</span></span></summary>' +
        '<div class="progress" style="margin:0 16px 10px"><i style="width:' + Math.round(n / w.steps.length * 100) + '%"></i></div>' +
        (all ? '<a class="btn small replay-concert" href="' + href(w.steps[w.steps.length - 1]) + '">' + TICON.concert + (kid ? ' Rejouer le concert' : ' Rejouer le concert') + '</a>' : '') +
        '<div class="path">' + w.steps.map(stepRow).join('') + '</div></details>';
    }).join('');
    const drill = (h, t, d) => '<a class="drill" href="' + h + '"><span class="label">' + t + '</span><span class="help">' + d + '</span></a>';
    const lessons = window.Learn.LESSONS;
    A.shell('parcours', A.header() + '<h1 class="h1">' + (kid ? 'Ta tournée' : 'Parcours') + '</h1>' +
      '<div class="cols"><div class="stack">' + worlds + '</div><div class="stack">' +
        '<div class="h2">Révisions</div>' +
        '<a class="drill drill-main" href="#exo-libre"><span class="label">' + (kid ? 'Entraînement express' : 'Entraînement adapté') + '</span><span class="help">Au clavier · avec tes notes : ' + learned(p).map((m) => MU.natName(m)).filter((x, i, a) => a.indexOf(x) === i).join(', ') + '</span></a>' +
        '<div class="drills">' + drill('#quiz-lecture-sol', 'Lis les notes', 'Clé de sol · sans piano') + drill('#quiz-lecture-fa', 'Lis les notes', 'Clé de fa · sans piano') + drill('#quiz-rythme', 'Les durées', 'Sans piano') +
          drill('#tape', 'Tape le rythme', 'Sans piano') + drill('#ecoute-aigu', 'Aigu ou grave ?', 'Oreille · sans piano') + drill('#ecoute-repete', 'Rejoue ce que tu entends', 'Oreille · au clavier') + '</div>' +
        '<details class="world lib"><summary class="world-head"><span class="path-txt"><span class="label">Toutes les leçons</span><span class="help">Pour relire une leçon, ou prendre de l\'avance</span></span></summary><div class="path">' +
          lessons.map((l) => { const r = (p.lessons || {})[l.id]; return '<a class="path-item" href="#cours-' + l.id + '"><span class="path-num' + (r && r.score >= r.total * 0.75 ? ' ok' : '') + '">' + TICON.lire + '</span><span class="path-txt"><span class="label">' + A.esc(l.title) + '</span><span class="help">' + l.min + ' min' + (r ? ' · quiz ' + r.score + '/' + r.total : '') + '</span></span></a>'; }).join('') +
        '</div></details>' +
      '</div></div>');
    {
      const cur2 = current(p);
      document.querySelectorAll('[data-locked]').forEach((b) => b.onclick = () => A.toast(cur2 ? (kid ? 'Finis d\'abord : ' : 'Terminez d\'abord : ') + stepTitle(cur2) : 'Étape bientôt disponible'));
    }
  }

  A.screens.parcours = PathScreen;
  A.screens.exo = Exo;
  window.Path = { WORLDS, STEPS, TICON, TLABEL, current, learned, isDone, unlocked, href, stepTitle, stepMeta, stepFor, report, resultHtml, worldName, skill, lvlOf, KINDS, keyboard, pick, mastery };
})();
