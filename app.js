/* Octave — application familiale d'apprentissage du piano (socle v0.1) */
(function () {
  'use strict';
  const VERSION = '0.6';
  const E = window.Engine, M = window.Mascots;
  const app = document.getElementById('app');
  const KEY = 'octave.v1';

  /* ---------- Données ---------- */
  const DEFAULT = {
    profiles: [
      { id: 'axel', name: 'Axel', mode: 'adulte', theme: 'peche', mascot: 'tempo', coins: 0, best: null },
      { id: 'leonard', name: 'Léonard', mode: 'enfant', theme: 'peche', mascot: 'volt', coins: 0, best: null }
    ],
    current: null,
    input: { source: 'midi', outId: null, channel: 1, lights: true, echo: false, volume: 0.6 }
  };
  const clone = (o) => JSON.parse(JSON.stringify(o));
  let DB = load();
  function load() {
    try {
      const s = JSON.parse(localStorage.getItem(KEY));
      if (s && Array.isArray(s.profiles)) return Object.assign(clone(DEFAULT), s, { input: Object.assign(clone(DEFAULT.input), s.input || {}) });
    } catch (e) { /* stockage indisponible */ }
    return clone(DEFAULT);
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(DB)); } catch (e) { /* ignoré */ } }
  const prof = () => DB.profiles.find((p) => p.id === DB.current) || null;
  const isKid = () => { const p = prof(); return !!p && p.mode === 'enfant'; };

  function applyTheme() {
    const p = prof();
    const theme = p ? (p.mode === 'enfant' ? 'scene' : p.theme) : 'peche';
    document.documentElement.dataset.theme = theme;
    document.documentElement.dataset.mode = p ? p.mode : 'adulte';
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim() || '#FBF2EC';
    E.sound.volume(DB.input.volume);
    E.midi.channel = DB.input.channel; E.midi.echo = DB.input.echo;
  }

  /* ---------- Outils ---------- */
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  let toastT = 0;
  function toast(msg) {
    const t = document.getElementById('toast'); t.textContent = msg; t.classList.add('show');
    clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2400);
  }
  const ICON = {
    home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M3 11l9-7 9 7v9H3z"/></svg>',
    path: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M4 19c4 0 4-6 8-6s4-8 8-8"/><circle cx="4" cy="19" r="1.5"/><circle cx="20" cy="5" r="1.5"/></svg>',
    songs: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/></svg>',
    keys: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="2.5" y="5" width="19" height="14" rx="2"/><path d="M7 5v9M12 5v9M17 5v9M5.5 14h3M10.5 14h3M15.5 14h3"/></svg>',
    gear: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/></svg>',
    back: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>',
    play: '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 4l13 8-13 8z"/></svg>',
    flame: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent-text)" stroke-width="2" aria-hidden="true"><path d="M12 2c1 4 5 6 5 11a5 5 0 0 1-10 0c0-2 1-4 2-5 0 2 1 3 2 3 0-3-1-6 1-9z"/></svg>'
  };

  function inputLabel() {
    const s = DB.input.source;
    if (s === 'midi') return E.midi.status === 'ready' ? (E.midi.inputs[0] ? E.midi.inputs[0].name : 'Clavier MIDI') : 'Câble MIDI · à connecter';
    if (s === 'micro') return E.mic.running ? 'Micro actif' : 'Micro · à activer';
    return 'Clavier à l\'écran';
  }
  const inputOn = () => (DB.input.source === 'midi' && E.midi.status === 'ready') || (DB.input.source === 'micro' && E.mic.running) || DB.input.source === 'ecran';

  /* ---------- Routeur ---------- */
  let cleanup = [];
  const onLeave = (fn) => cleanup.push(fn);
  function go(route) { location.hash = '#' + route; }
  const SCREENS = {};
  let param = '', lastHash = '', prevHash = '';
  function route() {
    cleanup.forEach((fn) => { try { fn(); } catch (e) { console.error(e); } }); cleanup = [];
    const raw = (location.hash || '').replace(/^#\/?/, '');
    if (raw !== lastHash) { prevHash = lastHash; lastHash = raw; }
    let name = raw.split('-')[0]; param = raw.slice(name.length + 1);
    if (!SCREENS[name]) { name = ''; param = ''; }
    if (!prof() && name !== 'qui' && name !== 'joueur') name = 'qui';
    if (!name) name = 'accueil';
    if (window.octaveUpdate && name === 'accueil') { location.reload(); return; }
    applyTheme();
    SCREENS[name](param);
    window.scrollTo(0, 0);
  }
  window.addEventListener('hashchange', route);

  function shell(active, inner) {
    const kid = isKid();
    const items = [
      ['accueil', kid ? 'Scène' : 'Accueil', ICON.home], ['parcours', kid ? 'Tournée' : 'Parcours', ICON.path],
      ['morceaux', 'Morceaux', ICON.songs], ['clavier', kid ? 'Clavier' : 'Mon clavier', ICON.keys], ['reglages', 'Réglages', ICON.gear]
    ];
    const nav = '<nav class="nav" aria-label="Navigation principale"><div class="brand" aria-hidden="true">' + brandMark() + '</div>' +
      items.map((it) => '<a href="#' + it[0] + '"' + (it[0] === active ? ' aria-current="page"' : '') + '>' + it[2] + it[1] + '</a>').join('') + '</nav>';
    const spots = kid ? '<div class="spot l" aria-hidden="true"></div><div class="spot r" aria-hidden="true"></div>' : '';
    app.innerHTML = '<div class="shell">' + nav + spots + '<main class="main">' + inner + '</main></div>';
  }
  const brandMark = () => '<svg width="28" height="28" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="4" height="16" rx="1.5" fill="var(--on-accent)"/><rect x="10" y="4" width="4" height="16" rx="1.5" fill="var(--on-accent)"/><rect x="17" y="4" width="4" height="16" rx="1.5" fill="var(--on-accent)"/><rect x="6" y="4" width="3" height="9" rx="1" fill="var(--accent)"/><rect x="13" y="4" width="3" height="9" rx="1" fill="var(--accent)"/></svg>';

  function header(extra) {
    const p = prof();
    const avatar = isKid()
      ? '<a href="#qui" class="row" style="text-decoration:none" aria-label="Changer de joueur"><span style="width:56px;height:56px;border-radius:28px;border:3px solid var(--accent);background:var(--surf);display:flex;align-items:center;justify-content:center;overflow:hidden">' + M.svg(p.mascot).replace('<svg ', '<svg width="48" height="48" ') + '</span>' +
        '<span><span style="display:block;font-family:var(--font-display);font-size:24px;letter-spacing:1px;line-height:1">' + esc(p.name.toUpperCase()) + '</span>' +
        '<span class="row" style="gap:8px;margin-top:4px"><span style="font-size:12px;font-weight:700;color:var(--accent)">NIVEAU ' + (1 + Math.floor(p.coins / 100)) + '</span><span class="progress" style="width:84px"><i style="width:' + (p.coins % 100) + '%"></i></span></span></span></a>'
      : '<a href="#qui" class="icon-btn" style="border:2px solid var(--accent);font-weight:600" aria-label="Changer de joueur">' + esc(p.name[0]) + '</a>';
    const gear = location.hash.indexOf('reglages') >= 0 ? '' : '<a href="#reglages" class="icon-btn" aria-label="Réglages">' + ICON.gear.replace('<svg ', '<svg width="20" height="20" ') + '</a>';
    return '<div class="between">' + avatar + '<div class="row" style="gap:8px">' + (extra || '') + gear + '</div></div>';
  }

  /* ---------- Écran : qui joue ? ---------- */
  function Who() {
    document.documentElement.dataset.theme = 'peche';
    app.innerHTML = '<div class="who"><div style="text-align:center"><div class="eyebrow">Octave</div><h1 class="h1" style="margin-top:8px">Qui joue ?</h1></div>' +
      '<div class="who-list">' + DB.profiles.map((p) =>
        '<button class="who-card" data-id="' + p.id + '">' + M.svg(p.mascot, 'happy').replace('<svg ', '<svg style="color:var(--text)" ') +
        '<span class="name">' + esc(p.name) + '</span><span class="meta">Mode ' + (p.mode === 'enfant' ? 'Enfant' : 'Adulte') + ' · ' + esc(M.list[p.mascot].name) + '</span></button>').join('') +
        '<a class="who-card who-add" href="#joueur-nouveau"><span class="who-plus" aria-hidden="true">+</span><span class="name">Ajouter</span><span class="meta">Un nouveau joueur</span></a>' +
      '</div><div class="help">Octave · version ' + VERSION + '</div></div>';
    app.querySelectorAll('.who-card[data-id]').forEach((b) => b.addEventListener('click', () => { DB.current = b.dataset.id; save(); E.audio(); go('accueil'); }));
  }

  /* ---------- Écran : accueil ---------- */
  const TIPS = [
    'Garde les doigts arrondis, comme si tu tenais une balle.',
    'Assieds-toi face au Do du milieu, les coudes à hauteur du clavier.',
    'Joue lentement et juste avant de jouer vite.',
    'Cinq minutes chaque jour valent mieux qu\'une heure le dimanche.'
  ];
  function Home() {
    const p = prof();
    const status = '<a href="#clavier" class="chip" style="text-decoration:none"><span class="dot' + (inputOn() ? ' on' : '') + '"></span>' + esc(inputLabel()) + '</a>';
    if (isKid()) return KidHome(p, status);
    const PA = window.Path, cur = PA.current(p), w = cur ? cur.world : PA.WORLDS.filter((x) => !x.soon).pop();
    const hour = new Date().getHours(), hello = hour < 18 ? 'Bonjour' : 'Bonsoir';
    const fresh = !p.path || !Object.keys(p.path).length;
    const dots = w.steps.map((s) => '<i class="' + (PA.isDone(p, s) ? 'ok' : s === cur ? 'now' : '') + '"></i>').join('');
    const after = cur ? w.steps.slice(cur.n, cur.n + 3) : [];
    const tip = TIPS[new Date().getDate() % TIPS.length];
    const notes = PA.learned(p).map((m) => window.Music.natName(m)).filter((x, i, a) => a.indexOf(x) === i);
    const songs = window.Music.SONGS.filter((s) => PA.STEPS.some((st) => (st.type === 'morceau' || st.type === 'concert') && st.ref === s.id && PA.unlocked(p, st)) || (p.songs || {})[s.id]);
    shell('accueil',
      header(status) +
      '<div><div class="muted" style="font-size:14px">' + hello + ', ' + esc(p.name) + '</div><h1 class="h1" style="margin-top:4px">' + (fresh ? 'On commence ?' : 'On continue ?') + '</h1></div>' +
      '<div class="cols"><div class="stack">' +
        '<div class="hero next-hero"><div class="nh-top"><span class="eyebrow accent-text">' + (cur ? (fresh ? 'Votre première étape' : 'Votre prochaine étape') : 'Parcours terminé') + '</span><span class="eyebrow">Monde ' + w.n + ' · ' + esc(w.title) + '</span></div><div class="body">' +
        (cur ? '<div class="row" style="align-items:flex-start"><span class="nh-icon">' + PA.TICON[cur.type] + '</span><div style="min-width:0"><div class="h2">' + esc(PA.stepTitle(cur)) + '</div><div class="muted" style="font-size:13px;margin-top:4px">Étape ' + cur.n + ' sur ' + w.steps.length + ' · ' + PA.stepMeta(cur) + '</div></div></div>' +
          '<div class="world-dots" aria-label="Avancement dans le monde">' + dots + '</div>' +
          '<a href="' + PA.href(cur) + '" class="btn">' + ICON.play + (fresh ? ' Commencer' : ' Continuer') + '</a>' +
          (after.length ? '<div class="help">Ensuite : ' + after.map((s) => esc(PA.stepTitle(s))).join(' · ') + '</div>' : '')
          : '<div class="h2">Les mondes suivants arrivent bientôt</div><div class="help">En attendant, révisez avec l\'entraînement adapté et les morceaux.</div><a href="#parcours" class="btn">Voir le parcours</a>') +
        '</div></div>' +
        '<div class="tip" style="color:var(--text)">' + M.svg(p.mascot) + '<div><div class="label muted" style="font-size:12px">Astuce de ' + esc(M.list[p.mascot].name) + '</div><div style="font-size:14px;line-height:1.35">' + tip + '</div></div></div>' +
      '</div><div class="stack">' +
        '<a class="drill drill-main" href="#exo-libre"><span class="eyebrow">Au clavier · 3 min</span><span class="label">Entraînement adapté</span><span class="help">Avec vos notes (' + notes.join(', ') + '). Plus vous réussissez, plus il se corse.</span></a>' +
        '<div class="between"><div class="h2" style="font-size:18px">Vos morceaux</div><a href="#morceaux" class="accent-text" style="font-size:13px;text-decoration:none">Tout voir</a></div>' +
        '<div class="path">' + songs.slice(0, 4).map((s) => { const b = (p.songs || {})[s.id]; return '<a class="path-item" href="#jeu-' + s.id + '"><span class="path-num' + (b && b.stars ? ' ok' : '') + '">' + (b ? b.stars + '★' : '♪') + '</span><span class="path-txt"><span class="label">' + esc(s.title) + '</span><span class="help">Niveau ' + s.level + ' · ' + esc(s.by) + '</span></span></a>'; }).join('') +
        (songs.length ? '' : '<div class="path-item"><span class="help">Vos premiers morceaux se débloquent dans le parcours.</span></div>') + '</div>' +
      '</div></div>');
  }

  function KidHome(p, status) {
    const PA = window.Path, MU = window.Music, cur = PA.current(p), w = cur ? cur.world : PA.WORLDS.filter((x) => !x.soon).pop();
    const dad = DB.profiles.find((x) => x.mode === 'adulte' && x.id !== p.id);
    const mine = p.songs || {};
    const open = MU.SONGS.filter((s) => PA.STEPS.some((st) => (st.type === 'morceau' || st.type === 'concert') && st.ref === s.id && PA.unlocked(p, st)) || mine[s.id]);
    const today = open.length ? open[new Date().getDate() % open.length] : null;
    const from = cur ? Math.max(0, Math.min(cur.n - 2, w.steps.length - 5)) : Math.max(0, w.steps.length - 5);
    const strip = w.steps.slice(from, from + 5);
    shell('accueil',
      header('<span class="chip"><span class="coin"></span>' + p.coins + '</span>') +
      '<h1 class="h1">Ce soir,<br>tu montes <span style="color:var(--accent)">sur scène</span></h1>' +
      '<div class="cols"><div class="stack">' +
        (cur ? '<a href="' + PA.href(cur) + '" class="kid-hero"><span class="mascot">' + M.svg(p.mascot, 'happy') + '</span>' +
          '<span style="font-size:12px;font-weight:700;letter-spacing:1.4px">PROCHAINE ÉTAPE · ' + cur.n + ' / ' + w.steps.length + '</span><span class="big">' + esc(PA.stepTitle(cur)) + '</span>' +
          '<span class="row" style="gap:6px;font-size:13px;font-weight:500">' + PA.TICON[cur.type] + PA.TLABEL[cur.type] + '</span><span class="btn go">' + ICON.play + ' C\'est parti</span></a>'
          : '<div class="kid-hero"><span class="mascot">' + M.svg(p.mascot, 'happy') + '</span><span style="font-size:12px;font-weight:700;letter-spacing:1.4px">TOURNÉE TERMINÉE</span><span class="big">Les prochains concerts arrivent</span></div>') +
        '<div class="between"><div class="h2">Ta tournée</div><a href="#parcours" class="muted" style="font-size:12px">Monde ' + w.n + ' · ' + esc(w.kid) + '</a></div>' +
        '<div class="tour"><div class="tour-line" aria-hidden="true"></div>' +
        strip.map((s) => { const done = PA.isDone(p, s), here = s === cur; return '<a href="' + (done || here ? PA.href(s) : '#parcours') + '" class="tour-step' + (here ? ' here' : done ? ' done' : '') + '"><span class="tour-dot">' + (done ? '✓' : here ? PA.TICON[s.type] : s.n) + '</span><span class="tour-lab">' + PA.TLABEL[s.type] + '</span></a>'; }).join('') + '</div>' +
      '</div><div class="stack">' +
        '<a class="drill drill-main" href="#exo-libre"><span class="eyebrow">Au clavier · 3 min</span><span class="label">Entraînement express</span><span class="help">Avec tes notes. Plus tu réussis, plus ça monte de niveau !</span></a>' +
        (today ? '<a class="card line kid-row" href="#jeu-' + today.id + '"><span class="eyebrow">Défi du jour</span><span class="label">' + esc(today.title) + '</span><span class="help">' + (mine[today.id] ? 'Ton record : ' + mine[today.id].stars + ' étoile' + (mine[today.id].stars > 1 ? 's' : '') : 'Pas encore joué') + '</span></a>' : '') +
        (dad ? '<div class="card line" style="flex-direction:row;align-items:center"><div class="row" style="gap:4px"><span class="icon-btn" style="background:var(--alt);font-weight:700">' + esc(p.name[0]) + '</span><span style="font-family:var(--font-display);color:var(--accent);font-size:18px">VS</span><span class="icon-btn" style="font-weight:700">' + esc(dad.name[0]) + '</span></div>' +
          '<div style="flex:1"><div class="label">Défi contre ' + esc(dad.name) + '</div><div class="help">' + (dad.path ? 'Il a validé ' + Object.keys(dad.path).length + ' étape' + (Object.keys(dad.path).length > 1 ? 's' : '') + ', et toi ' + Object.keys(p.path || {}).length + '.' : 'Il n\'a pas encore commencé !') + '</div></div></div>' : '') +
        '<a class="drill" href="#quiz-lecture-sol"><span class="label">Révise sans piano</span><span class="help">Lis les notes · 10 questions</span></a>' +
        '<div class="row">' + status + '</div>' +
      '</div></div>');
  }

  /* ---------- Écrans à venir ---------- */
  function Soon(which) {
    return function () {
      const p = prof();
      const txt = which === 'parcours' ? { t: isKid() ? 'Ta tournée' : 'Parcours', d: 'Les leçons, niveau par niveau, arrivent à l\'étape 3.' } : { t: 'Morceaux', d: 'L\'import de vos fichiers MIDI et la bibliothèque arrivent à l\'étape 4.' };
      shell(which, header() + '<h1 class="h1">' + txt.t + '</h1><div class="card" style="flex-direction:row;align-items:center;gap:18px"><div style="width:96px;height:96px;flex-shrink:0;color:var(--text)">' + M.svg(p.mascot) + '</div><div><div class="h2">Bientôt ici</div><div class="help" style="margin-top:6px">' + txt.d + '</div></div></div>');
    };
  }

  /* ---------- Verrou parent (en mode Enfant) ---------- */
  function gate(ok) {
    if (!isKid()) { ok(); return; }
    const a = 12 + Math.floor(Math.random() * 8), b = 3 + Math.floor(Math.random() * 6);
    const d = document.createElement('div'); d.className = 'gate'; d.setAttribute('role', 'dialog'); d.setAttribute('aria-label', 'Question pour les parents');
    d.innerHTML = '<div class="g-card"><div class="eyebrow">Réservé aux parents</div><div class="h2" style="margin:6px 0 12px">Combien font ' + a + ' × ' + b + ' ?</div>' +
      '<input id="gatein" class="gate-in" inputmode="numeric" autocomplete="off" aria-label="Réponse"><div class="row" style="margin-top:14px;justify-content:center"><button class="btn ghost" id="gateno">Annuler</button><button class="btn" id="gateok">Valider</button></div></div>';
    document.body.appendChild(d);
    const inp = d.querySelector('#gatein'); setTimeout(() => inp.focus(), 50);
    const close = () => d.remove();
    const check = () => { if (+inp.value === a * b) { close(); ok(); } else { inp.value = ''; inp.placeholder = 'Essaie encore'; } };
    d.querySelector('#gateno').onclick = close; d.querySelector('#gateok').onclick = check;
    inp.onkeydown = (e) => { if (e.key === 'Enter') check(); };
    onLeave(close);
  }

  /* ---------- Entrée active pour jouer (micro ou câble) ---------- */
  async function startInput() {
    E.audio();
    const s = DB.input.source;
    if (s === 'micro') {
      if (!E.mic.running) await E.mic.start();
      E.sound.enabled = false;
      if (!E.mic.running) toast('Micro indisponible : utilisez le clavier à l\'écran');
    } else {
      E.sound.enabled = true;
      if (s === 'midi' && E.midi.supported && E.midi.status === 'off') { await E.midi.init(); if (DB.input.outId) E.midi.outId = DB.input.outId; }
    }
  }
  function stopInput() { if (E.mic.running) E.mic.stop(); E.sound.enabled = true; }

  /* ---------- Écran : profil d'un joueur (créer, modifier, supprimer) ---------- */
  function Player(arg) {
    const isNew = arg === 'nouveau', p0 = isNew ? null : DB.profiles.find((x) => x.id === arg);
    if (!isNew && !p0) { go('qui'); return; }
    const d = p0 ? { name: p0.name, mode: p0.mode, mascot: p0.mascot, theme: p0.theme || 'peche' } : { name: '', mode: 'adulte', mascot: 'tempo', theme: 'peche' };
    const back = isNew ? (prof() ? '#reglages' : '#qui') : '#reglages';
    document.documentElement.dataset.theme = 'peche'; document.documentElement.dataset.mode = 'adulte';
    function draw() {
      const mascots = M.forMode(d.mode);
      if (mascots.indexOf(d.mascot) < 0) d.mascot = mascots[0];
      app.innerHTML = '<div class="player">' +
        '<div class="row"><a href="' + back + '" class="icon-btn" aria-label="Retour">' + ICON.back + '</a><h1 class="h1">' + (isNew ? 'Nouveau joueur' : 'Profil de ' + esc(p0.name)) + '</h1></div>' +
        '<div class="card"><label class="label" for="pname">Prénom</label><input id="pname" class="pfield" maxlength="20" autocomplete="off" value="' + esc(d.name) + '" placeholder="Prénom du joueur"></div>' +
        '<div class="card"><div class="label">Mode</div><div class="seg" role="group" aria-label="Mode"><button data-pm="adulte" aria-pressed="' + (d.mode === 'adulte') + '">Adulte</button><button data-pm="enfant" aria-pressed="' + (d.mode === 'enfant') + '">Enfant</button></div>' +
          '<div class="help">' + (d.mode === 'enfant' ? 'Ambiance « scène de concert », étapes plus courtes, pièces à gagner, réglages sensibles protégés.' : 'Design sobre, thème au choix, exercices un peu plus longs.') + '</div></div>' +
        '<div class="card"><div class="label">Mascotte</div><div class="pal-list">' + mascots.map((id) => '<button class="pal" data-pp="' + id + '" aria-pressed="' + (d.mascot === id) + '" style="color:var(--text)">' + M.svg(id) + esc(M.list[id].name) + '</button>').join('') + '</div></div>' +
        (d.mode === 'adulte' ? '<div class="card"><div class="label">Thème</div><div class="seg" role="group" aria-label="Thème"><button data-pt="peche" aria-pressed="' + (d.theme === 'peche') + '">Pêche</button><button data-pt="anthracite" aria-pressed="' + (d.theme === 'anthracite') + '">Anthracite</button></div></div>' : '') +
        '<div class="row" style="flex-wrap:wrap"><button class="btn" id="psave">' + (isNew ? 'Créer le joueur' : 'Enregistrer') + '</button><a class="btn ghost" href="' + back + '">Annuler</a></div>' +
        (!isNew && DB.profiles.length > 1 ? '<div class="card line"><div class="label">Supprimer ce joueur</div><div class="help">Sa progression sera effacée définitivement.</div><button class="btn small ghost danger" id="pdel">Supprimer ' + esc(p0.name) + '</button></div>' : '') +
        '</div>';
      const inp = document.getElementById('pname');
      inp.oninput = () => { d.name = inp.value; };
      if (isNew) setTimeout(() => inp.focus(), 50);
      app.querySelectorAll('[data-pm]').forEach((b) => b.onclick = () => { d.mode = b.dataset.pm; draw(); });
      app.querySelectorAll('[data-pp]').forEach((b) => b.onclick = () => { d.mascot = b.dataset.pp; draw(); });
      app.querySelectorAll('[data-pt]').forEach((b) => b.onclick = () => { d.theme = b.dataset.pt; draw(); });
      document.getElementById('psave').onclick = () => {
        const name = d.name.trim().replace(/\s+/g, ' ');
        if (!name) { toast('Écris un prénom'); inp.focus(); return; }
        if (DB.profiles.some((x) => x !== p0 && x.name.toLowerCase() === name.toLowerCase())) { toast('Ce prénom est déjà pris'); return; }
        const apply = () => {
          if (isNew) {
            const id = 'p' + Date.now().toString(36);
            DB.profiles.push({ id, name, mode: d.mode, theme: d.theme, mascot: d.mascot, coins: 0, best: null });
            DB.current = id; save(); toast('Bienvenue ' + name + ' !'); go('accueil');
          } else {
            Object.assign(p0, { name, mode: d.mode, theme: d.theme, mascot: d.mascot }); save(); toast('Profil enregistré'); go(DB.current === p0.id ? 'reglages' : 'qui');
          }
        };
        /* passer un profil enfant en adulte demande une réponse d'adulte */
        if (p0 && p0.mode === 'enfant' && d.mode !== 'enfant') gate(apply); else apply();
      };
      const del = document.getElementById('pdel');
      if (del) del.onclick = () => gate(() => {
        if (!del.dataset.ok) { del.dataset.ok = '1'; del.textContent = 'Sûr ? Touche encore pour supprimer'; return; }
        DB.profiles = DB.profiles.filter((x) => x !== p0);
        if (DB.current === p0.id) DB.current = null;
        save(); toast('Joueur supprimé'); go('qui');
      });
    }
    draw();
  }

  /* ---------- Écran : réglages ---------- */
  function Settings() {
    const p = prof();
    const themes = [['peche', 'Pêche', '#FBF2EC', '#26191A', '#6346CC', true], ['anthracite', 'Anthracite', '#17181C', '#EDEDE8', '#C8F04A', true], ['t3', 'À venir', '#EEEEEE', '#999999', '#CCCCCC', false], ['t4', 'À venir', '#EEEEEE', '#999999', '#CCCCCC', false]];
    const mascots = M.forMode(p.mode);
    shell('reglages', header() +
      '<h1 class="h1">Réglages</h1>' +
      '<div class="cols"><div class="stack">' +
        '<div class="eyebrow">Mode du profil de ' + esc(p.name) + '</div>' +
        '<div class="seg" role="group" aria-label="Mode"><button data-mode="adulte" aria-pressed="' + (p.mode === 'adulte') + '">Adulte</button><button data-mode="enfant" aria-pressed="' + (p.mode === 'enfant') + '">Enfant</button></div>' +
        (p.mode === 'adulte' ? '<div class="eyebrow">Thème</div><div class="theme-grid">' + themes.map((t) =>
          '<button class="theme-card" data-theme-id="' + t[0] + '" aria-pressed="' + (p.theme === t[0]) + '"' + (t[5] ? '' : ' disabled') + '><div class="pv" style="background:' + t[2] + '"><b style="background:' + t[3] + '"></b><i style="background:' + t[4] + '"></i></div><span class="label">' + t[1] + '</span></button>').join('') + '</div>'
          : '<div class="help">En mode Enfant, l\'appli prend l\'ambiance « scène de concert ».</div>') +
        '<div class="eyebrow">Ma mascotte</div><div class="pal-list">' + mascots.map((id) =>
          '<button class="pal" data-pal="' + id + '" aria-pressed="' + (p.mascot === id) + '" style="color:var(--text)">' + M.svg(id) + esc(M.list[id].name) + '</button>').join('') + '</div>' +
      '</div><div class="stack">' +
        '<div class="eyebrow">Son</div><div class="list"><div class="item"><label class="label" for="vol">Volume de l\'appli</label><input id="vol" type="range" min="0" max="1" step="0.05" value="' + DB.input.volume + '" style="width:160px;accent-color:var(--accent)"></div></div>' +
        '<div class="eyebrow">Joueurs</div><div class="list"><div class="item"><span class="label">Prénom, mode et mascotte de ' + esc(p.name) + '</span><a href="#joueur-' + p.id + '" class="btn small ghost">Modifier</a></div>' +
        '<div class="item"><span class="label">Changer de joueur</span><a href="#qui" class="btn small ghost">Qui joue ?</a></div>' +
        '<div class="item"><span class="label">Ajouter un joueur</span><a href="#joueur-nouveau" class="btn small ghost">Ajouter</a></div>' +
        '<div class="item"><span class="label">Remettre à zéro la progression de ' + esc(p.name) + '</span><button class="btn small ghost" id="reset">Effacer</button></div></div>' +
        '<div class="eyebrow">Niveaux au clavier</div><div class="list">' + ['trouve', 'joue', 'lis', 'suite'].map((k) => '<div class="item"><span class="label">' + window.Path.KINDS[k].title + '</span><span class="chip lvl">Niveau ' + window.Path.lvlOf(p, k) + '</span></div>').join('') + '</div>' +
        '<div class="help">Les niveaux s\'ajustent tout seuls : ils montent à 90 % de réussite et redescendent sous 60 %.' + (isKid() ? ' Le changement de mode et la remise à zéro demandent une réponse d\'adulte.' : '') + '</div>' +
        '<div class="help">Octave · version ' + VERSION + '</div>' +
      '</div></div>');
    app.querySelectorAll('[data-mode]').forEach((b) => b.onclick = () => gate(() => {
      p.mode = b.dataset.mode; if (!M.list[p.mascot].modes.includes(p.mode)) p.mascot = M.forMode(p.mode)[0];
      save(); route();
    }));
    app.querySelectorAll('[data-theme-id]').forEach((b) => b.onclick = () => { if (b.disabled) return; p.theme = b.dataset.themeId; save(); route(); });
    app.querySelectorAll('[data-pal]').forEach((b) => b.onclick = () => { p.mascot = b.dataset.pal; save(); route(); toast(M.list[p.mascot].name + ' t\'accompagne !'); });
    const vol = document.getElementById('vol');
    vol.oninput = () => { DB.input.volume = +vol.value; E.sound.volume(DB.input.volume); };
    vol.onchange = () => { save(); E.sound.play(67, 90); setTimeout(() => E.sound.stop(67), 300); };
    const reset = document.getElementById('reset');
    reset.onclick = () => gate(() => {
      if (!reset.dataset.ok) { reset.dataset.ok = '1'; reset.textContent = 'Sûr ? Touche encore'; return; }
      ['best', 'songs', 'lessons', 'path', 'skill'].forEach((k) => { delete p[k]; }); p.best = null; p.coins = 0;
      save(); toast('Progression effacée'); route();
    });
  }

  /* ---------- Écran : mon clavier ---------- */
  function Keyboard() {
    const p = prof(), kid = isKid(), src = DB.input.source;
    const defi = param === 'defi';
    const LOW = 36, HIGH = 96; /* 61 touches, comme le Casio */
    shell('clavier', header('<span class="chip"><span class="dot' + (inputOn() ? ' on' : '') + '" id="stdot"></span><span id="stlabel">' + esc(inputLabel()) + '</span></span>') +
      '<h1 class="h1">' + (kid ? 'Ton clavier' : 'Mon clavier') + '</h1>' +
      '<div class="seg" role="group" aria-label="Source du son"><button data-src="midi" aria-pressed="' + (src === 'midi') + '">Câble MIDI</button><button data-src="micro" aria-pressed="' + (src === 'micro') + '">Micro</button><button data-src="ecran" aria-pressed="' + (src === 'ecran') + '">Écran</button></div>' +
      '<div class="cols"><div class="stack"><div class="card" id="srcpanel"></div>' +
        '<div class="card"><div class="readout"><div class="note" id="rnote">—</div><div><div class="label" id="rintl">Joue une note</div><div class="sub" id="rsub">' + (src === 'ecran' ? 'Touche le clavier ci-dessous' : 'Elle s\'affichera ici') + '</div></div></div></div>' +
      '</div><div class="stack"><div class="card" id="challenge"></div></div></div>' +
      '<div class="kbd-wrap"><div class="kbd' + (src === 'ecran' ? ' big' : '') + '" id="kbd" aria-label="Clavier de 61 touches"></div></div>');

    /* clavier */
    const kbd = document.getElementById('kbd');
    const whites = []; for (let m = LOW; m <= HIGH; m++) if (!E.isBlack(m)) whites.push(m);
    const ww = 100 / whites.length, keyEls = {};
    let html = '';
    whites.forEach((m, i) => { html += '<div class="w" data-m="' + m + '" style="left:calc(' + (i * ww) + '% + 1px);width:calc(' + ww + '% - 2px)">' + (m % 12 === 0 ? E.name(m) : '') + '</div>'; });
    for (let m = LOW; m <= HIGH; m++) if (E.isBlack(m)) {
      const i = whites.indexOf(m - 1);
      html += '<div class="b" data-m="' + m + '" style="left:calc(' + ((i + 1) * ww - ww * 0.32) + '%);width:' + (ww * 0.64) + '%"></div>';
    }
    kbd.innerHTML = html;
    kbd.querySelectorAll('[data-m]').forEach((el) => { keyEls[el.dataset.m] = el; });
    if (src === 'ecran') {
      kbd.style.minWidth = '1100px';
      const active = new Map();
      kbd.addEventListener('pointerdown', (e) => {
        const el = e.target.closest('[data-m]'); if (!el) return;
        e.preventDefault(); try { kbd.setPointerCapture(e.pointerId); } catch (x) { /* ignoré */ }
        const m = +el.dataset.m; active.set(e.pointerId, m); E.screen.down(m);
      });
      const up = (e) => { const m = active.get(e.pointerId); if (m !== undefined) { E.screen.up(m); active.delete(e.pointerId); } };
      kbd.addEventListener('pointerup', up); kbd.addEventListener('pointercancel', up);
      requestAnimationFrame(() => { const c4 = keyEls[60]; if (c4) kbd.parentElement.scrollLeft = c4.offsetLeft - kbd.parentElement.clientWidth / 2 + 200; });
    }

    /* lecture des notes */
    const rnote = document.getElementById('rnote'), rintl = document.getElementById('rintl'), rsub = document.getElementById('rsub');
    const srcName = { midi: 'câble MIDI', micro: 'micro', ecran: 'écran' };
    const off = E.on((ev) => {
      if (ev.type === 'pedal') { rsub.textContent = ev.value ? 'Pédale enfoncée' : 'Pédale relâchée'; return; }
      const el = keyEls[ev.midi];
      if (el) el.classList.toggle('on', ev.type === 'on');
      if (ev.type === 'on') {
        rnote.textContent = E.name(ev.midi); rintl.textContent = E.intl(ev.midi) + ' · note ' + ev.midi;
        rsub.textContent = 'Force ' + ev.vel + ' · par ' + srcName[ev.src];
        challenge.hit(ev.midi);
      }
    });
    onLeave(off);
    onLeave(() => { Object.values(keyEls).forEach((el) => el.classList.remove('on')); E.midi.allOff(); });

    /* panneau de la source */
    const panel = document.getElementById('srcpanel');
    function refreshStatus() {
      const d = document.getElementById('stdot'), l = document.getElementById('stlabel');
      if (d) d.classList.toggle('on', inputOn()); if (l) l.textContent = inputLabel();
    }
    function midiPanel() {
      const m = E.midi;
      let body = '';
      if (m.status === 'off') body = '<div class="help">Branchez le câble USB-MIDI : la prise <b>OUT</b> du Casio va dans l\'entrée du câble, et la prise <b>IN</b> du Casio dans sa sortie (pour allumer les touches).</div><button class="btn" id="mconnect">Connecter le clavier</button>';
      else if (m.status === 'unsupported') body = '<div class="help">Ce navigateur ne gère pas le MIDI. Ouvrez l\'appli dans <b>Chrome</b> sur la tablette ou le téléphone Android.</div>';
      else if (m.status === 'denied') body = '<div class="help">L\'accès au MIDI a été refusé. Autorisez-le dans les réglages du site de Chrome, puis réessayez.</div><button class="btn" id="mconnect">Réessayer</button>';
      else if (m.status === 'nodevice') body = '<div class="help">Aucun clavier détecté. Vérifiez le câble et que le Casio est allumé ; l\'appli le verra dès qu\'il sera branché.</div><button class="btn ghost" id="mconnect">Chercher à nouveau</button>';
      else {
        body = '<div class="row"><span class="dot on"></span><span class="label">' + esc(m.inputs.map((i) => i.name).join(', ')) + '</span></div>' +
          '<div class="list" style="background:var(--surf2)">' +
          '<div class="item"><div><div class="label">Allumer les touches du Casio</div><div class="help">Montre la note à jouer sur le clavier</div></div><button class="switch" role="switch" id="mlights" aria-label="Allumer les touches" aria-checked="' + DB.input.lights + '"></button></div>' +
          (m.outputs.length ? '<div class="item"><label class="label" for="mout">Sortie</label><select id="mout">' + m.outputs.map((o) => '<option value="' + esc(o.id) + '"' + (o.id === m.outId ? ' selected' : '') + '>' + esc(o.name) + '</option>').join('') + '</select></div>' +
            '<div class="item"><label class="label" for="mch">Canal des lumières</label><select id="mch">' + Array.from({ length: 16 }, (_, i) => '<option' + (i + 1 === DB.input.channel ? ' selected' : '') + '>' + (i + 1) + '</option>').join('') + '</select></div>' : '') +
          '<div class="item"><div><div class="label">Son de l\'appli</div><div class="help">Utile si le haut-parleur du Casio est coupé</div></div><button class="switch" role="switch" id="mecho" aria-label="Son de l\'appli" aria-checked="' + DB.input.echo + '"></button></div></div>' +
          (m.outputs.length ? '<button class="btn ghost small" id="mtest">Tester les lumières</button>' : '');
      }
      panel.innerHTML = '<div class="between"><div class="h2">Câble MIDI</div></div>' + body;
      const c = document.getElementById('mconnect');
      if (c) c.onclick = async () => { c.disabled = true; await E.midi.init(); E.midi.onchange = () => { midiPanel(); refreshStatus(); }; midiPanel(); refreshStatus(); if (E.midi.status === 'ready') toast('Clavier connecté !'); };
      const ls = document.getElementById('mlights');
      if (ls) ls.onclick = () => { DB.input.lights = !DB.input.lights; save(); ls.setAttribute('aria-checked', DB.input.lights); if (!DB.input.lights) E.midi.allOff(); else challenge.relight(); };
      const ec = document.getElementById('mecho');
      if (ec) ec.onclick = () => { DB.input.echo = !DB.input.echo; E.midi.echo = DB.input.echo; save(); ec.setAttribute('aria-checked', DB.input.echo); };
      const mo = document.getElementById('mout'); if (mo) mo.onchange = () => { E.midi.outId = mo.value; DB.input.outId = mo.value; save(); };
      const mc = document.getElementById('mch'); if (mc) mc.onchange = () => { DB.input.channel = +mc.value; E.midi.channel = DB.input.channel; save(); };
      const mt = document.getElementById('mtest');
      if (mt) mt.onclick = () => {
        E.midi.allOff();
        [60, 64, 67, 72, 67, 64, 60].forEach((n, i) => { setTimeout(() => E.midi.light(n, true), i * 180); setTimeout(() => E.midi.light(n, false), i * 180 + 170); });
        toast('Les touches Do, Mi, Sol devraient s\'allumer');
      };
    }
    let micRaf = 0;
    function micPanel() {
      const m = E.mic;
      if (!m.running) {
        const msg = m.status === 'denied' ? 'L\'accès au micro a été refusé. Autorisez-le dans les réglages du site de Chrome.' : m.status === 'unsupported' ? 'Ce navigateur ne permet pas d\'utiliser le micro.' : 'Posez le téléphone ou la tablette sur le pupitre. L\'appli écoute une note à la fois.';
        panel.innerHTML = '<div class="h2">Micro</div><div class="help">' + msg + '</div>' + (m.status === 'unsupported' ? '' : '<button class="btn" id="micgo">Activer le micro</button>');
        const g = document.getElementById('micgo');
        if (g) g.onclick = async () => { g.disabled = true; E.sound.enabled = false; await E.mic.start(); micPanel(); refreshStatus(); };
        return;
      }
      panel.innerHTML = '<div class="between"><div class="h2">Micro</div><button class="btn small ghost" id="miccal">Calibrer</button></div>' +
        '<div><div class="between" style="margin-bottom:6px"><span class="label">Volume entendu</span><span class="help" id="micinfo">Seuil : bruit ambiant</span></div><div class="meter"><i id="miclvl"></i><b id="micfloor"></b></div></div>' +
        '<div><div class="between" style="margin-bottom:6px"><span class="label">Justesse</span><span class="help" id="miccents">—</span></div><div class="tuner"><b></b><i id="mictune"></i></div></div>' +
        '<div class="help">Pour calibrer : restez silencieux 2 secondes. Si le piano est un peu désaccordé, l\'appli reconnaît quand même la note.</div>';
      document.getElementById('miccal').onclick = async (e) => { e.target.disabled = true; e.target.textContent = 'Silence…'; await E.mic.calibrate(2000); e.target.disabled = false; e.target.textContent = 'Calibrer'; toast('Micro calibré'); };
      const lvl = document.getElementById('miclvl'), fl = document.getElementById('micfloor'), tune = document.getElementById('mictune'), cents = document.getElementById('miccents');
      const scale = (v) => Math.min(100, Math.sqrt(v / 0.25) * 100);
      const tick = () => {
        lvl.style.width = scale(m.level) + '%'; fl.style.left = scale(m.floor) + '%';
        if (m.cur !== null) { tune.style.left = (50 + m.cents) + '%'; cents.textContent = (m.cents > 0 ? '+' : '') + m.cents + ' centièmes'; }
        micRaf = requestAnimationFrame(tick);
      };
      tick();
    }
    onLeave(() => { cancelAnimationFrame(micRaf); if (E.mic.running) E.mic.stop(); E.sound.enabled = true; });
    function ecranPanel() {
      E.sound.enabled = true;
      panel.innerHTML = '<div class="h2">Clavier à l\'écran</div><div class="help">Pour s\'entraîner sans instrument : touchez les touches ci-dessous, plusieurs doigts à la fois si vous voulez. Faites glisser le clavier pour voir les autres octaves.</div>';
    }
    if (src === 'midi') { if (E.midi.status !== 'off' && E.midi.status !== 'unsupported') E.midi.refresh(); midiPanel(); }
    else if (src === 'micro') micPanel(); else ecranPanel();
    app.querySelectorAll('[data-src]').forEach((b) => b.onclick = () => { DB.input.source = b.dataset.src; save(); route(); });

    /* défi : joue la note demandée */
    const box = document.getElementById('challenge');
    const pool = [60, 62, 64, 65, 67, 69, 71, 72];
    const challenge = { on: false, list: [], i: 0, score: 0, t0: 0, misses: 0, target: null, mood: 'idle',
      draw() {
        const c = this;
        const mascot = '<div class="mascot" id="cm" style="color:var(--text)">' + M.svg(p.mascot, c.mood) + '</div>';
        if (!c.on && c.list.length === 0) {
          box.innerHTML = '<div class="eyebrow">' + (kid ? 'Défi · échauffement' : 'Test rapide') + '</div><div class="challenge">' + mascot +
            '<div><div class="h2">Joue la note demandée</div><div class="help" style="margin-top:4px">10 notes entre Do3 et Do4. ' + (p.best ? 'Record : ' + p.best.score + '/10 en ' + p.best.time + ' s.' : 'Premier essai !') + '</div></div></div><button class="btn" id="cgo">' + ICON.play + (kid ? ' C\'est parti' : ' Commencer') + '</button>';
          document.getElementById('cgo').onclick = () => c.start();
        } else if (c.on) {
          box.innerHTML = '<div class="between"><div class="eyebrow">Note ' + (c.i + 1) + ' sur 10</div><div class="pips">' + c.list.map((_, k) => '<i class="' + (k < c.score ? 'ok' : '') + '"></i>').join('') + '</div></div>' +
            '<div class="challenge">' + mascot + '<div><div class="help">Joue</div><div class="ask">' + E.name(c.target) + '</div><div class="help">' + E.intl(c.target) + '</div></div></div>';
        } else {
          const time = Math.round((performance.now() - c.t0) / 1000);
          box.innerHTML = '<div class="eyebrow">' + (kid ? 'Bravo !' : 'Terminé') + '</div><div class="challenge">' + mascot + '<div><div class="ask">' + c.score + '/10</div><div class="help">en ' + time + ' s · ' + c.misses + ' erreur' + (c.misses > 1 ? 's' : '') + (kid ? ' · +' + c.score * 5 + ' pièces' : '') + '</div></div></div><button class="btn" id="cgo">Rejouer</button>';
          document.getElementById('cgo').onclick = () => c.start();
        }
      },
      start() {
        const c = this; c.on = true; c.i = 0; c.score = 0; c.misses = 0; c.t0 = performance.now(); c.mood = 'idle';
        let prev = null; c.list = Array.from({ length: 10 }, () => { let n; do { n = pool[Math.floor(Math.random() * pool.length)]; } while (n === prev); prev = n; return n; });
        c.next();
      },
      next() {
        const c = this;
        if (c.target !== null) { const el = keyEls[c.target]; if (el) el.classList.remove('target'); E.midi.light(c.target, false); }
        if (c.i >= c.list.length) { c.finish(); return; }
        c.target = c.list[c.i];
        const el = keyEls[c.target]; if (el) el.classList.add('target');
        c.relight(); c.draw();
      },
      relight() { if (this.on && this.target !== null && DB.input.lights) E.midi.light(this.target, true); },
      hit(m) {
        const c = this; if (!c.on) return;
        const cm = () => document.getElementById('cm');
        if (m === c.target) {
          c.score++; c.i++; c.mood = 'happy'; if (DB.input.source !== 'micro') E.sound.blip(true);
          c.next(); const el = cm(); if (el) el.classList.add('bounce');
        } else {
          c.misses++; c.mood = 'oops'; c.draw(); const el = cm(); if (el) el.classList.add('shake');
        }
      },
      finish() {
        const c = this; c.on = false;
        const el = keyEls[c.target]; if (el) el.classList.remove('target'); E.midi.light(c.target, false); c.target = null;
        const time = Math.round((performance.now() - c.t0) / 1000);
        const better = !p.best || c.score > p.best.score || (c.score === p.best.score && time < p.best.time);
        if (better) p.best = { score: c.score, time };
        if (kid) p.coins += c.score * 5;
        c.mood = 'happy'; save(); c.draw();
        if (better) toast('Nouveau record !');
      }
    };
    challenge.draw();
    if (defi) setTimeout(() => challenge.start(), 300);
    onLeave(() => { challenge.on = false; });
  }

  /* ---------- Démarrage ---------- */
  if (DB.input.outId) E.midi.outId = DB.input.outId;
  if (DB.input.source === 'midi' && E.midi.supported && navigator.permissions && navigator.permissions.query) {
    navigator.permissions.query({ name: 'midi' }).then((st) => { if (st.state === 'granted') E.midi.init().then(() => { E.midi.onchange = null; if (DB.input.outId) E.midi.outId = DB.input.outId; route(); }); }).catch(() => {});
  }
  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    const hadSW = !!navigator.serviceWorker.controller;
    navigator.serviceWorker.register('sw.js').catch(() => {});
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!hadSW) return;
      const h = location.hash.replace('#', '');
      if (!h || h === 'accueil' || h === 'qui') location.reload(); else { window.octaveUpdate = true; toast('Nouvelle version prête : elle s\'affichera au retour à l\'accueil'); }
    });
  }
  Object.assign(SCREENS, { qui: Who, joueur: Player, accueil: Home, clavier: Keyboard, parcours: Soon('parcours'), morceaux: Soon('morceaux'), reglages: Settings });
  window.App = { get DB() { return DB; }, get prevHash() { return prevHash; }, startInput, stopInput, gate, save, prof, isKid, shell, header, esc, toast, go, onLeave, ICON, screens: SCREENS, route, inputOn, inputLabel, VERSION };
  window.addEventListener('DOMContentLoaded', route);
})();
