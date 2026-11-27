/* « Apprendre ce morceau » : un cours pas à pas, généré pour chaque morceau.
   Écouter, repérer les notes, phrase par phrase, chaque main, ensemble, en rythme, le tempo qui monte, puis le morceau entier. */
(function () {
  'use strict';
  const A = window.App, E = window.Engine, MU = window.Music, M = window.Mascots;

  /* mesures du morceau (même découpage que l'écran de jeu) */
  function bars(song) {
    const bar = song.bar || 4, pickup = song.pickup || 0;
    const measureOf = (t) => (t < pickup - 1e-6 ? 0 : Math.floor((t - pickup) / bar + 1e-6) + 1);
    return Math.max(1, measureOf(Math.max(0, song.length - 0.001)));
  }
  /* phrases : 2, 4 ou 8 mesures, pas plus de 6 phrases */
  function phrases(total) {
    if (total <= 3) return [[1, total]];
    let pb = [2, 4, 8].find((k) => Math.ceil(total / k) <= 6) || Math.ceil(total / 6);
    if (total <= 4) pb = 2;
    const out = []; for (let a = 1; a <= total; a += pb) out.push([a, Math.min(total, a + pb - 1)]);
    /* une dernière phrase d'une seule mesure se fond dans la précédente */
    if (out.length > 1 && out[out.length - 1][1] - out[out.length - 1][0] < 1) { const l = out.pop(); out[out.length - 1][1] = l[1]; }
    return out;
  }
  const T = (kid, adult) => (A.isKid() ? kid : adult);

  /* le plan du cours */
  function plan(song) {
    if (song._plan) return song._plan;
    MU.hands(song);
    const total = bars(song), both = MU.hasBoth(song), ph = phrases(total), main = both ? 'droite' : 'tout';
    const S = [];
    S.push({ id: 'ecoute', kind: 'listen', title: 'Écouter le morceau', tip: ['Écoute-le deux fois en suivant les notes des yeux. Chante l\'air dans ta tête : tes doigts l\'apprendront plus vite.', 'Écoutez-le deux fois en suivant la partition. Chanter l\'air intérieurement aide les doigts à le retenir.'] });
    S.push({ id: 'repere', kind: 'look', title: 'Repérer les notes et les pièges', tip: ['Avant de jouer, on regarde : quelles notes, quels doigts, où sont les endroits difficiles.', 'Avant de jouer, on observe : notes utilisées, position de la main, passages délicats.'] });
    ph.forEach((r, i) => S.push({ id: 'p' + (i + 1), kind: 'play', title: (ph.length > 1 ? 'Phrase ' + (i + 1) + ' · mesures ' + r[0] + ' à ' + r[1] : 'Les notes, tranquillement') + (both ? ' · main droite' : ''),
      pr: { hand: main, from: r[0], to: r[1] }, mode: 'tranquille', speed: 1, pass: 80,
      tip: i === 0 ? ['La musique attend la bonne note. Dis le nom des notes à voix haute en les jouant.', 'La musique attend la bonne note. Nommez les notes à voix haute en jouant : la lecture se fixe plus vite.']
        : ['Nouvelle phrase. Si une note bloque, rejoue juste les deux notes autour, trois fois.', 'Si un enchaînement bloque, isolez les deux notes concernées et répétez-les trois fois.'] }));
    if (ph.length > 1) S.push({ id: 'enchaine', kind: 'play', title: 'Enchaîner les phrases' + (both ? ' · main droite' : ''), pr: { hand: main, from: 1, to: total }, mode: 'tranquille', speed: 1, pass: 80,
      tip: ['Relie les phrases sans t\'arrêter : la fin de l\'une prépare le début de la suivante.', 'Reliez les phrases sans pause : anticipez le début de chaque phrase pendant la fin de la précédente.'] });
    if (both) {
      S.push({ id: 'gauche', kind: 'play', title: 'La main gauche seule', pr: { hand: 'gauche', from: 1, to: total }, mode: 'tranquille', speed: 1, pass: 80,
        tip: ['La main gauche joue moins de notes, mais c\'est elle qui tient la musique. Regarde la portée du bas.', 'La main gauche porte l\'harmonie et le rythme : travaillez-la seule jusqu\'à ce qu\'elle devienne automatique.'] });
      const half = total > 8 ? Math.ceil(total / 2) : 0;
      if (half) {
        S.push({ id: 'ens1', kind: 'play', title: 'Les deux mains · mesures 1 à ' + half, pr: { hand: 'tout', from: 1, to: half }, mode: 'tranquille', speed: 1, pass: 75, tip: ['Très lentement ! Ce qui est aligné sur les deux portées se joue en même temps.', 'Lentement : tout ce qui est aligné verticalement se joue ensemble.'] });
        S.push({ id: 'ens2', kind: 'play', title: 'Les deux mains · mesures ' + (half + 1) + ' à ' + total, pr: { hand: 'tout', from: half + 1, to: total }, mode: 'tranquille', speed: 1, pass: 75, tip: ['La deuxième moitié, toujours tranquille.', 'La deuxième moitié, au même rythme tranquille.'] });
      } else S.push({ id: 'ens', kind: 'play', title: 'Les deux mains ensemble', pr: { hand: 'tout', from: 1, to: total }, mode: 'tranquille', speed: 1, pass: 75, tip: ['Très lentement ! Ce qui est aligné sur les deux portées se joue en même temps.', 'Lentement : tout ce qui est aligné verticalement se joue ensemble.'] });
    }
    S.push({ id: 'rythme', kind: 'play', title: 'En rythme, lentement', pr: { hand: 'tout', from: 1, to: total }, mode: 'defi', speed: 0.7, pass: 70,
      tip: ['Maintenant la musique n\'attend plus : écoute le métronome et compte dans ta tête. 70 % de la vitesse, c\'est fait exprès.', 'La musique n\'attend plus : suivez le métronome, à 70 % de la vitesse. Le rythme compte autant que les notes.'] });
    S.push({ id: 'tempo', kind: 'play', title: 'Le tempo qui monte', pr: { hand: 'tout', from: 1, to: total, loop: true, ramp: true }, mode: 'defi', speed: 0.7, untilFull: true, pass: 85,
      tip: ['En boucle : chaque tour réussi à 90 % accélère. L\'étape est gagnée quand tu y arrives à la vraie vitesse.', 'En boucle : +10 % de vitesse à chaque tour réussi à 90 %. L\'étape est validée à 100 % de la vitesse avec au moins 85 %.'] });
    S.push({ id: 'final', kind: 'play', title: 'Le morceau entier, comme un concert', pr: { hand: 'tout', from: 1, to: total }, mode: 'defi', speed: 1, pass: 60, final: true,
      tip: ['Le grand moment ! Tout le morceau, en rythme, à la vraie vitesse.', 'Le morceau entier, en rythme, à la vitesse normale. Une étoile valide le cours ; visez les trois.'] });
    S.forEach((s, i) => { s.n = i; });
    song._plan = S;
    return S;
  }

  /* progression */
  function state(p, song) { p.courses = p.courses || {}; return p.courses[song.id] || (p.courses[song.id] = { s: {} }); }
  const isDone = (p, song, s) => !!state(p, song).s[s.id];
  function nextStep(p, song) { return plan(song).find((s) => !isDone(p, song, s)) || null; }
  function progress(p, song) { const P = plan(song), c = (p.courses || {})[song.id]; const n = c ? P.filter((s) => c.s[s.id]).length : 0; return { n, total: P.length, done: !!(c && c.done) }; }
  function mark(p, song, s, info) {
    const c = state(p, song), first = !c.s[s.id];
    c.s[s.id] = Object.assign({ at: Date.now() }, info || {});
    if (first) A.addCoins(p, s.final ? 20 : 5);
    if (!c.done && plan(song).every((x) => c.s[x.id])) { c.done = Date.now(); A.addCoins(p, 30); A.toast(T('Cours terminé ! +30 pièces', 'Cours terminé')); }
    A.save();
    return first;
  }
  const hrefOf = (song, s) => (s.kind === 'play' ? '#jeu-' + song.id + '-cours-' + s.n : '#apprendre-' + song.id + '-' + s.n);

  /* ce qu'on remarque dans le morceau, pour l'étape « Repérer » */
  function notice(song) {
    MU.hands(song); MU.fingers(song);
    const out = [], rh = song.notes.filter((n) => n.h === 'd'), lh = song.notes.filter((n) => n.h === 'g');
    const names = (ns) => Array.from(new Set(ns.map((n) => n.m))).sort((a, b) => a - b).map((m) => E.name(m));
    if (rh.length) out.push(['Notes de la main droite', names(rh).join(', ')]);
    if (lh.length) out.push(['Notes de la main gauche', names(lh).join(', ')]);
    const first = rh[0] || lh[0];
    if (first) out.push(['Pour commencer', 'Pose ' + (first.h === 'g' ? 'la main gauche' : 'la main droite') + ' : la première note, ' + E.name(first.m) + ', se joue avec le doigt ' + (first.f || 1) + '.']);
    const blacks = Array.from(new Set(song.notes.filter((n) => E.isBlack(n.m)).map((n) => MU.natName(n.m, n.fl))));
    if (blacks.length) out.push(['Touches noires', blacks.join(', ') + T(' : repère-les avant de jouer.', ' : repérez-les avant de jouer.')]);
    const short = song.notes.some((n) => n.d <= 0.5 + 1e-6), dotted = song.notes.some((n) => Math.abs(n.d - 1.5) < 1e-6 || Math.abs(n.d - 0.75) < 1e-6);
    if (short) out.push(['Croches', T('Des notes rapides : compte « 1 et 2 et ».', 'Des notes rapides : comptez « 1 et 2 et ».')]);
    if (dotted) out.push(['Rythme pointé', T('Longue… courte : la note pointée dure plus longtemps que la suivante.', 'Longue, courte : la note pointée occupe trois quarts du temps partagé avec la suivante.')]);
    /* grands sauts */
    let jump = null;
    [rh, lh].forEach((ns) => { const s = ns.slice().sort((a, b) => a.t - b.t); for (let i = 1; i < s.length; i++) { const d = Math.abs(MU.diat(s[i].m) - MU.diat(s[i - 1].m)); if (d >= 5 && (!jump || d > jump.d)) jump = { d, a: s[i - 1], b: s[i] }; } });
    if (jump) out.push(['Le plus grand saut', E.name(jump.a.m) + ' → ' + E.name(jump.b.m) + T(' : prépare ta main pendant la note d\'avant.', ' : déplacez la main pendant la note précédente.')]);
    /* la main change de position quand l'écart des doigts ne suit plus l'écart des touches */
    const rs = rh.slice().sort((a, b) => a.t - b.t), moves = rs.filter((n, i) => i > 0 && n.f && rs[i - 1].f && n.t > rs[i - 1].t && (n.f - rs[i - 1].f) !== (MU.diat(n.m) - MU.diat(rs[i - 1].m))).length;
    if (moves) out.push(['La main se déplace', T('Ta main change de place ' + moves + ' fois : suis les petits chiffres des doigts.', 'La main change de position ' + moves + ' fois : suivez les doigtés affichés.')]);
    out.push(['Tempo', song.tempo + ' battements par minute · mesure à ' + (song.bar || 4) + ' temps' + (song.pickup ? ', avec une levée' : '')]);
    return out;
  }

  /* lecture simple du morceau (étape « Écouter ») */
  function player(song, onEnd) {
    let timers = [], on = false;
    const stop = () => { timers.forEach(clearTimeout); timers = []; on = false; for (let m = 21; m <= 108; m++) E.sound.stop(m); };
    const play = () => {
      stop(); on = true; E.audio(); E.sound.enabled = true;
      const spb = 60 / song.tempo * 1000;
      song.notes.forEach((n) => {
        timers.push(setTimeout(() => E.sound.play(n.m, n.h === 'g' ? 70 : 90), 300 + n.t * spb));
        timers.push(setTimeout(() => E.sound.stop(n.m), 300 + (n.t + n.d * 0.92) * spb));
      });
      timers.push(setTimeout(() => { on = false; onEnd && onEnd(); }, 300 + song.length * spb + 400));
    };
    return { play, stop, get on() { return on; } };
  }

  /* ---------- Écran du cours ---------- */
  function Learn(param) {
    const parts = String(param || '').split('-');
    let open = null;
    if (parts.length > 1 && /^\d+$/.test(parts[parts.length - 1])) open = +parts.pop();
    const song = MU.song(parts.join('-'));
    if (!song) { A.go('morceaux'); return; }
    const p = A.prof(), kid = A.isKid(), P = plan(song), nx = nextStep(p, song);
    if (open === null && nx && nx.kind !== 'play') open = nx.n;
    const pg = progress(p, song), best = (p.songs || {})[song.id];
    const row = (s) => {
      const done = isDone(p, song, s), here = nx === s;
      const ic = s.kind === 'listen' ? '♪' : s.kind === 'look' ? '◎' : (s.mode === 'defi' ? '♩' : '•');
      return '<a class="path-item step' + (here ? ' current' : '') + '" href="' + hrefOf(song, s) + '"><span class="path-num' + (done ? ' ok' : here ? ' now' : '') + '">' + (done ? '✓' : ic) + '</span>' +
        '<span class="path-txt"><span class="label">' + A.esc(s.title) + '</span><span class="help">' + (s.kind === 'play' ? (s.mode === 'defi' ? 'En rythme' : 'Tranquille') + (s.speed < 1 ? ' · ' + Math.round(s.speed * 100) + ' %' : '') + ' · ' + (s.untilFull ? 'jusqu\'à 100 % de la vitesse' : 'valider à ' + s.pass + ' %') : s.kind === 'listen' ? 'Sans jouer' : 'À lire') + '</span></span>' +
        (here ? '<span class="chip now-chip">' + (kid ? 'À toi !' : 'Maintenant') + '</span>' : '') + '</a>';
    };
    let panel = '';
    if (open !== null && P[open] && P[open].kind !== 'play') {
      const s = P[open];
      if (s.kind === 'listen') panel = '<div class="card course-panel"><div class="eyebrow">Étape ' + (s.n + 1) + '</div><div class="h2">' + s.title + '</div><div class="help">' + T(s.tip[0], s.tip[1]) + '</div>' +
        '<div class="staff-box course-staff">' + MU.preview(song, { x0: 60, dx: 34, width: 560, height: 150, gap: 10, top: 40, gapG: 7, topG: 18, count: 14, label: 'Début de ' + song.title }) + '</div>' +
        '<div class="row" style="flex-wrap:wrap"><button class="btn" id="cplay">' + A.ICON.play + ' Écouter</button><button class="btn ghost" id="cok">' + (isDone(p, song, s) ? 'Étape suivante' : (kid ? 'C\'est écouté !' : 'C\'est écouté')) + '</button></div></div>';
      if (s.kind === 'look') panel = '<div class="card course-panel"><div class="eyebrow">Étape ' + (s.n + 1) + '</div><div class="h2">' + s.title + '</div><div class="help">' + T(s.tip[0], s.tip[1]) + '</div>' +
        '<div class="list" style="background:var(--surf2)">' + notice(song).map((x) => '<div class="item"><span class="label">' + x[0] + '</span><span class="help" style="text-align:right">' + A.esc(x[1]) + '</span></div>').join('') + '</div>' +
        '<div class="row" style="flex-wrap:wrap"><a class="btn ghost" href="#partition-' + song.id + '">Voir la partition entière</a><button class="btn" id="cok">' + (kid ? 'J\'ai repéré !' : 'C\'est noté') + '</button></div></div>';
    }
    A.shell('morceaux', A.header() +
      '<div class="row"><a href="#morceaux" class="icon-btn" aria-label="Retour aux morceaux">' + A.ICON.back + '</a><div style="min-width:0"><div class="eyebrow">' + (kid ? 'Apprendre ce morceau' : 'Cours · niveau ' + song.level) + '</div><div class="h2">' + A.esc(song.title) + '</div></div></div>' +
      '<div class="cols"><div class="stack">' + panel +
        '<div class="card course-head"><div class="between"><span class="label">' + pg.n + ' étape' + (pg.n > 1 ? 's' : '') + ' sur ' + pg.total + '</span>' + (best ? '<span class="song-stars">' + '★★★'.slice(0, best.stars) + '☆☆☆'.slice(0, 3 - best.stars) + '</span>' : '') + '</div><div class="progress"><i style="width:' + Math.round(pg.n / pg.total * 100) + '%"></i></div>' +
          (nx ? '<a class="btn" href="' + hrefOf(song, nx) + '">' + A.ICON.play + ' ' + (pg.n ? (kid ? 'Continuer' : 'Continuer') : (kid ? 'Commencer le cours' : 'Commencer')) + '</a>' : '<div class="wiz-ok">✓ ' + (kid ? 'Cours terminé : tu sais jouer ce morceau !' : 'Cours terminé') + '</div><a class="btn" href="#jeu-' + song.id + '">' + A.ICON.play + ' Jouer le morceau</a>') + '</div>' +
        '<div class="path">' + P.map(row).join('') + '</div>' +
      '</div><div class="stack">' +
        '<div class="tip" style="color:var(--text)">' + M.svg(p.mascot) + '<div><div class="label muted" style="font-size:12px">' + T('Comment on apprend', 'La méthode') + '</div><div style="font-size:14px;line-height:1.4">' +
          T('On découpe le morceau en petites phrases, on les apprend tranquillement, chaque main toute seule. Puis on assemble, on joue en rythme, et on accélère petit à petit.', 'Le morceau est découpé en phrases apprises en mode Tranquille, main par main, puis assemblées. Viennent ensuite le rythme au ralenti, la montée progressive du tempo, et le morceau entier.') + '</div></div></div>' +
        '<div class="card line"><div class="label">' + T('Les bonnes habitudes', 'Conseils de travail') + '</div><ul class="wiz-list help">' +
          '<li>' + T('Un peu chaque jour vaut mieux que beaucoup une fois.', 'Dix minutes par jour valent mieux qu\'une heure le dimanche.') + '</li>' +
          '<li>' + T('Lent et juste d\'abord, vite ensuite.', 'Lent et juste d\'abord : la vitesse vient toute seule.') + '</li>' +
          '<li>' + T('Une erreur ? Rejoue les deux notes autour, puis la phrase.', 'Une erreur récurrente : isolez la mesure, en boucle, plus lentement.') + '</li>' +
          '<li>' + T('Regarde la partition plutôt que tes mains.', 'Gardez les yeux sur la partition plutôt que sur les mains.') + '</li></ul></div>' +
        '<div class="row" style="flex-wrap:wrap"><a class="btn ghost small" href="#partition-' + song.id + '">Partition entière</a><a class="btn ghost small" href="#jeu-' + song.id + '">Jeu libre</a></div>' +
      '</div></div>');
    const s = open !== null ? P[open] : null;
    let pl = null;
    const cp = document.getElementById('cplay');
    if (cp) { pl = player(song, () => { cp.innerHTML = A.ICON.play + ' Réécouter'; }); cp.onclick = () => { if (pl.on) { pl.stop(); cp.innerHTML = A.ICON.play + ' Écouter'; } else { pl.play(); cp.textContent = 'Arrêter'; } }; A.onLeave(() => pl.stop()); }
    const ok = document.getElementById('cok');
    if (ok && s) ok.onclick = () => { if (pl) pl.stop(); mark(p, song, s); const n2 = nextStep(p, song); location.hash = n2 ? hrefOf(song, n2) : '#apprendre-' + song.id; };
    if (s && A.sayAuto()) setTimeout(() => A.say(s.title + '. ' + T(s.tip[0], s.tip[1])), 350);
  }

  /* appelé par l'écran de jeu à la fin d'une étape du cours */
  function after(song, step, r, over) {
    const p = A.prof();
    let ok = r.acc >= step.pass;
    if (step.untilFull) ok = r.speed >= 0.999 && r.acc >= step.pass;
    if (step.mode === 'defi' && r.mode !== 'defi') ok = false;
    if (ok) mark(p, song, step, { acc: r.acc });
    const nx = nextStep(p, song);
    const card = over && over.querySelector('.g-card'); if (!card) return;
    const box = document.createElement('div'); box.className = 'course-res';
    box.innerHTML = ok
      ? '<div class="wiz-ok">✓ ' + T('Étape du cours réussie !', 'Étape du cours validée') + '</div>' + (nx ? '<a class="btn" href="' + hrefOf(song, nx) + '">' + T('Étape suivante', 'Étape suivante') + ' ' + A.ICON.play + '</a><div class="help">Ensuite : ' + A.esc(nx.title) + '</div>' : '<a class="btn" href="#apprendre-' + song.id + '">' + T('Voir mon cours terminé', 'Cours terminé') + '</a>')
      : '<div class="help step-rule">' + (step.untilFull ? T('Continue jusqu\'à la vraie vitesse : chaque tour réussi à 90 % accélère.', 'Continuez jusqu\'à 100 % de la vitesse (chaque tour à 90 % accélère).') : T('Pour réussir cette étape : ' + step.pass + ' %. Encore un essai !', 'Pour valider cette étape : ' + step.pass + ' %. Encore un essai.')) + '</div>' +
        '<a class="btn ghost small" href="#apprendre-' + song.id + '">Retour au cours</a>';
    card.insertBefore(box, card.querySelector('.row'));
  }
  const stepOf = (song, n) => { const P = plan(song); return P[n] || null; };

  A.screens.apprendre = Learn;
  window.Course = { plan, stepOf, after, progress, nextStep, hrefOf, phrases, bars };
})();
