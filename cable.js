/* Assistant de branchement du câble MIDI (Casio LK) et mesure du délai de l'entrée. */
(function () {
  'use strict';
  const A = window.App, E = window.Engine, MU = window.Music;

  /* applique les réglages MIDI enregistrés au moteur */
  function applyMidi() {
    const I = A.DB.input;
    E.midi.channel = I.channel; E.midi.lchannel = I.lchan !== false && I.channel > 1 ? I.channel - 1 : 0; E.midi.lightVel = I.lightVel || 40;
  }
  /* ordre de recherche du canal : 4 (Casio LK), puis 1, puis les autres */
  const ORDER = [4, 1, 3, 2, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];

  function Cable(param) {
    const DB = A.DB, kid = A.isKid();
    const S = { step: param === 'delai' ? 'delai' : 'intro', notes: [], chi: 0, timer: 0, blink: 0, tap: null };
    const onlyDelay = param === 'delai';
    const back = onlyDelay ? '#clavier' : '#clavier';
    A.shell('clavier', A.header() +
      '<div class="row"><a href="' + back + '" class="icon-btn" aria-label="Retour">' + A.ICON.back + '</a><div style="min-width:0"><div class="eyebrow">' + (onlyDelay ? 'Mon clavier' : 'Câble MIDI') + '</div><div class="h2">' + (onlyDelay ? 'Mesurer le délai' : 'Assistant de branchement') + '</div></div></div>' +
      (onlyDelay ? '' : '<div class="wiz-steps" id="wsteps"></div>') +
      '<div class="card wiz" id="wcard"></div>');
    const card = document.getElementById('wcard');
    const STEPS = [['intro', 'Câble'], ['connect', 'Connexion'], ['touche', 'Touches'], ['lumiere', 'Lumières'], ['son', 'Son'], ['delai', 'Délai'], ['fin', 'Prêt']];
    const stopBlink = () => { clearInterval(S.blink); S.blink = 0; clearTimeout(S.timer); E.midi.allOff(); };
    A.onLeave(() => { stopBlink(); if (S.tap) S.tap.stop(); });

    const offIn = E.on((ev) => {
      if (ev.type !== 'on') return;
      if (S.step === 'touche') { S.notes.push(ev); if (S.notes.length > 6) S.notes.shift(); draw(); }
      if (S.step === 'delai' && S.tap) S.tap.hit(performance.now());
    });
    A.onLeave(offIn);

    function go(step) { stopBlink(); if (S.tap) { S.tap.stop(); S.tap = null; } S.step = step; draw(); }
    function steps() {
      const el = document.getElementById('wsteps'); if (!el) return;
      const i = STEPS.findIndex((x) => x[0] === S.step);
      el.innerHTML = STEPS.map((x, k) => '<span class="wiz-dot' + (k < i ? ' ok' : k === i ? ' now' : '') + '"><b>' + (k < i ? '✓' : k + 1) + '</b><i>' + x[1] + '</i></span>').join('');
    }
    const nav = (prev, next, label) => '<div class="row wiz-nav">' + (prev ? '<button class="btn ghost" data-go="' + prev + '">Retour</button>' : '') + (next ? '<button class="btn" data-go="' + next + '">' + (label || 'Suivant') + '</button>' : '') + '</div>';
    function bind() { card.querySelectorAll('[data-go]').forEach((b) => b.onclick = () => go(b.dataset.go)); }

    function draw() {
      steps();
      const m = E.midi;
      let h = '';
      if (S.step === 'intro') {
        h = '<div class="h2">Ce qu\'il vous faut</div>' +
          '<ul class="wiz-list"><li>Le câble <b>USB-MIDI</b> (deux prises rondes d\'un côté, une prise USB de l\'autre).</li>' +
          '<li>Si le téléphone ou la tablette n\'a qu\'une prise USB-C : un petit <b>adaptateur USB-C vers USB</b> (dit « OTG »).</li>' +
          '<li>Octave ouvert dans <b>Chrome</b> (les autres navigateurs ne gèrent pas toujours le MIDI).</li></ul>' +
          '<div class="h2" style="margin-top:6px">Le branchement</div>' +
          '<div class="wiz-plug"><div><b>Prise OUT</b> du Casio</div><span>→</span><div>prise du câble marquée <b>IN</b> (ou de couleur « entrée »)</div></div>' +
          '<div class="wiz-plug"><div><b>Prise IN</b> du Casio</div><span>←</span><div>prise du câble marquée <b>OUT</b></div></div>' +
          '<div class="help">Sur certains câbles, c\'est l\'inverse : les étiquettes décrivent l\'appareil d\'en face. Si rien ne marche à l\'étape 3, inversez simplement les deux prises rondes. La prise OUT sert à lire vos notes, la prise IN à allumer les touches.</div>' +
          '<div class="help">Allumez le Casio, branchez la prise USB sur le téléphone ou la tablette, puis continuez.</div>' + nav(null, 'connect', 'C\'est branché');
      } else if (S.step === 'connect') {
        const st = m.status;
        if (st === 'ready') h = '<div class="wiz-ok">✓ Clavier détecté</div><div class="list" style="background:var(--surf2)"><div class="item"><span class="label">Entrée</span><span class="help">' + A.esc(m.inputs.map((x) => x.name).join(', ')) + '</span></div><div class="item"><span class="label">Sortie</span><span class="help">' + (m.outputs.length ? A.esc(m.outputs.map((x) => x.name).join(', ')) : 'aucune : les touches ne pourront pas s\'allumer') + '</span></div></div>' + nav('intro', 'touche');
        else if (st === 'unsupported') h = '<div class="h2">Ce navigateur ne gère pas le MIDI</div><div class="help">Ouvrez Octave dans <b>Chrome</b> sur la tablette ou le téléphone Android (l\'appli installée sur l\'écran d\'accueil utilise Chrome).</div>' + nav('intro');
        else if (st === 'denied') h = '<div class="h2">Accès au MIDI refusé</div><div class="help">Dans Chrome : touchez le cadenas à gauche de l\'adresse, puis <b>Autorisations</b> → <b>Appareils MIDI</b> → Autoriser. Revenez ensuite ici.</div><button class="btn" id="wconn">Réessayer</button>' + nav('intro');
        else if (st === 'nodevice') h = '<div class="h2">Aucun clavier détecté</div><ul class="wiz-list"><li>Le Casio est-il allumé ?</li><li>La prise USB est-elle bien enfoncée (et l\'adaptateur USB-C, s\'il y en a un) ?</li><li>Débranchez puis rebranchez le câble : Octave le voit dès qu\'il apparaît.</li></ul><button class="btn" id="wconn">Chercher à nouveau</button>' + nav('intro');
        else h = '<div class="h2">Connexion</div><div class="help">Chrome va vous demander l\'autorisation d\'utiliser les appareils MIDI : acceptez.</div><button class="btn" id="wconn">Connecter le clavier</button>' + nav('intro');
      } else if (S.step === 'touche') {
        const last = S.notes[S.notes.length - 1];
        h = '<div class="h2">Appuyez sur quelques touches du Casio</div><div class="help">Octave doit afficher chaque note jouée, avec sa force.</div>' +
          '<div class="readout"><div class="note">' + (last ? E.name(last.midi) : '—') + '</div><div><div class="label">' + (last ? 'Force ' + last.vel + ' sur 127' : 'En attente…') + '</div><div class="sub">' + S.notes.map((n) => E.name(n.midi)).join(' · ') + '</div></div></div>' +
          (S.notes.length >= 3 ? '<div class="wiz-ok">✓ Le Casio parle à Octave</div>' + nav('connect', 'lumiere')
            : '<div class="help">Rien ne s\'affiche ? Inversez les deux prises rondes sur le Casio (OUT et IN), et vérifiez que le Casio n\'est pas en mode démo.</div>' + nav('connect', 'lumiere', 'Passer'));
      } else if (S.step === 'lumiere') {
        if (!m.outputs.length) { h = '<div class="h2">Pas de sortie MIDI</div><div class="help">Le câble ne propose pas de sortie : les touches ne pourront pas s\'allumer. Vous pouvez quand même jouer, en suivant le clavier à l\'écran.</div>' + nav('touche', 'son'); }
        else if (S.search) {
          const ch = ORDER[S.chi];
          h = '<div class="h2">Recherche du canal : canal ' + ch + '</div><div class="help">Octave allume Do, Mi, Sol au milieu du clavier, sur le canal ' + ch + '. Regardez le Casio.</div>' +
            '<div class="row wiz-nav"><button class="btn" id="wyes">Ça s\'allume !</button><button class="btn ghost" id="wno">Rien, canal suivant</button></div>' +
            '<div class="help">Canal ' + (S.chi + 1) + ' essayé sur 16.</div>';
        } else if (S.lh) {
          h = '<div class="h2">Et la main gauche ?</div><div class="help">Octave allume maintenant le Do grave (main gauche) sur le canal ' + Math.max(1, DB.input.channel - 1) + ', comme les leçons Casio.</div>' +
            '<div class="row wiz-nav"><button class="btn" id="wlyes">Il s\'allume</button><button class="btn ghost" id="wlno">Non</button></div>';
        } else {
          h = '<div class="h2">Les touches s\'allument-elles ?</div><div class="help">Octave allume <b>Do, Mi, Sol</b> au milieu du clavier, sur le canal ' + DB.input.channel + ' (le canal de guidage des Casio LK, 4 d\'origine).</div>' +
            '<div class="row wiz-nav"><button class="btn" id="wyes">Oui, je vois les lumières</button><button class="btn ghost" id="wno">Non</button></div>' +
            '<div class="help">Si le Casio est en mode leçon ou démo, revenez d\'abord au mode normal.</div>';
        }
      } else if (S.step === 'son') {
        h = '<div class="h2">Le son des lumières</div><div class="help">Pour allumer une touche, Octave envoie la note au Casio, qui peut aussi la jouer. Choisissez :</div>' +
          '<div class="seg" role="group" aria-label="Force des lumières">' + [[1, 'Douce (presque muette)'], [40, 'Normale']].map(([v, l]) => '<button data-lv="' + v + '" aria-pressed="' + ((DB.input.lightVel || 40) === v) + '">' + l + '</button>').join('') + '</div>' +
          '<button class="btn ghost small" id="wtry">Allumer quelques touches pour écouter</button>' +
          '<div class="help step-rule">Astuce Casio : pendant qu\'une touche est allumée par Octave, appuyez sur le bouton <b>RIGHT</b> (ou TRACK 2) du Casio : il coupe le son de la main droite et garde les lumières. Le bouton <b>LEFT</b> (ou TRACK 1) fait de même pour la main gauche. Selon les modèles, le réglage revient à l\'extinction.</div>' +
          '<div class="item between"><div><div class="label">Son de l\'appli en plus du Casio</div><div class="help">Laissez coupé : le haut-parleur du Casio suffit</div></div><button class="switch" role="switch" id="wecho" aria-label="Son de l\'appli" aria-checked="' + DB.input.echo + '"></button></div>' +
          nav('lumiere', 'delai');
      } else if (S.step === 'delai') {
        const src = DB.input.source, cur = (DB.input.lat || {})[src];
        const T = S.tap;
        h = '<div class="h2">Mesurer le délai' + (onlyDelay ? ' (' + ({ midi: 'câble MIDI', micro: 'micro', ecran: 'écran' }[src]) + ')' : '') + '</div>' +
          '<div class="help">Octave joue 4 bips pour compter, puis 8 bips. Sur chacun des 8, jouez <b>n\'importe quelle touche</b>, pile en même temps. Le mode Défi en tiendra compte.</div>' +
          (T ? '<div class="tap-box"><div class="tap-beats">' + Array.from({ length: 12 }, (_, k) => '<i class="' + (k < 4 ? 'cnt' : '') + (k < T.beat ? ' on' : '') + '"></i>').join('') + '</div><div class="label">' + (T.beat < 4 ? 'Écoutez…' : T.beat < 12 ? 'Jouez sur chaque bip' : 'Calcul…') + '</div></div>'
            : (S.res ? '<div class="wiz-ok">' + S.res + '</div>' : '') + '<button class="btn" id="wtap">' + A.ICON.play + (S.res ? ' Recommencer' : ' Commencer') + '</button>') +
          '<div class="help">Délai actuel : ' + (typeof cur === 'number' ? Math.round(cur * 1000) + ' ms (mesuré ou réglé par le jeu)' : 'valeur de départ') + '.</div>' +
          (onlyDelay ? '<div class="row wiz-nav"><a class="btn ghost" href="#clavier">Terminé</a></div>' : nav('son', 'fin', S.res ? 'Suivant' : 'Passer'));
      } else if (S.step === 'fin') {
        h = '<div class="wiz-ok">✓ Tout est prêt</div><div class="list" style="background:var(--surf2)">' +
          '<div class="item"><span class="label">Lumières</span><span class="help">' + (DB.input.lights ? 'canal ' + DB.input.channel + (DB.input.lchan !== false && DB.input.channel > 1 ? ', main gauche canal ' + (DB.input.channel - 1) : '') : 'éteintes') + '</span></div>' +
          '<div class="item"><span class="label">Force</span><span class="help">' + ((DB.input.lightVel || 40) <= 1 ? 'douce' : 'normale') + '</span></div>' +
          '<div class="item"><span class="label">Délai</span><span class="help">' + (typeof (DB.input.lat || {}).midi === 'number' ? Math.round(DB.input.lat.midi * 1000) + ' ms' : 'valeur de départ (20 ms)') + '</span></div></div>' +
          '<div class="help">Tout se retrouve dans <b>Mon clavier</b>. Pour les accords plaqués, le câble change tout : Octave entend les trois notes ensemble.</div>' +
          '<div class="row wiz-nav"><a class="btn" href="#jeu-lune">' + A.ICON.play + ' Essayer un morceau</a><a class="btn ghost" href="#clavier">Mon clavier</a></div>';
      }
      card.innerHTML = h; bind();
      after();
    }
    function after() {
      const m = E.midi;
      const wc = document.getElementById('wconn');
      if (wc) wc.onclick = async () => { wc.disabled = true; await m.init(); if (DB.input.outId && m.outputs.find((o) => o.id === DB.input.outId)) m.outId = DB.input.outId; DB.input.source = 'midi'; m.onchange = () => { if (S.step === 'connect') draw(); }; A.save(); draw(); if (m.status === 'ready') A.toast('Clavier connecté !'); };
      if (S.step === 'connect' && m.status === 'off' && m.supported && navigator.permissions) {
        navigator.permissions.query({ name: 'midi' }).then((st) => { if (st.state === 'granted' && S.step === 'connect' && m.status === 'off') m.init().then(draw); }).catch(() => {});
      }
      if (S.step === 'touche') { A.DB.input.source = 'midi'; }
      if (S.step === 'lumiere' && m.outputs.length) {
        const flash = (fn) => { stopBlink(); let on = false; const tick = () => { on = !on; fn(on); }; tick(); S.blink = setInterval(tick, 700); };
        if (S.search) flash((on) => [60, 64, 67].forEach((n) => m.lightOn(ORDER[S.chi], n, on)));
        else if (S.lh) flash((on) => m.light(48, on, 'g'));
        else flash((on) => [60, 64, 67].forEach((n) => (on ? m.light(n, true, 'd') : m.light(n, false))));
        const y = document.getElementById('wyes'), n = document.getElementById('wno');
        if (y) y.onclick = () => {
          if (S.search) { DB.input.channel = ORDER[S.chi]; S.search = false; }
          DB.input.lights = true; applyMidi(); A.save(); stopBlink();
          if (DB.input.channel > 1) { S.lh = true; draw(); } else go('son');
        };
        if (n) n.onclick = () => {
          stopBlink();
          if (!S.search) { S.search = true; S.chi = 0; }
          else S.chi++;
          if (S.chi >= ORDER.length) { S.search = false; S.chi = 0; card.innerHTML = '<div class="h2">Aucune lumière sur les 16 canaux</div><ul class="wiz-list"><li>Vérifiez la prise <b>IN</b> du Casio (ou inversez les deux prises rondes).</li><li>Mettez le Casio en mode normal (ni démo, ni leçon, ni morceau en cours).</li><li>Certains modèles n\'allument les touches que pour leurs morceaux intégrés : dans ce cas, suivez le clavier à l\'écran, tout le reste fonctionne.</li></ul>' + nav('touche', 'son', 'Continuer sans lumières'); bind(); return; }
          draw();
        };
        const ly = document.getElementById('wlyes'), ln = document.getElementById('wlno');
        if (ly) ly.onclick = () => { DB.input.lchan = true; applyMidi(); A.save(); S.lh = false; go('son'); };
        if (ln) ln.onclick = () => { DB.input.lchan = false; applyMidi(); A.save(); S.lh = false; go('son'); };
      }
      if (S.step === 'son') {
        card.querySelectorAll('[data-lv]').forEach((b) => b.onclick = () => { DB.input.lightVel = +b.dataset.lv; applyMidi(); A.save(); draw(); demo(); });
        const t = document.getElementById('wtry'); if (t) t.onclick = demo;
        const ec = document.getElementById('wecho'); if (ec) ec.onclick = () => { DB.input.echo = !DB.input.echo; E.midi.echo = DB.input.echo; A.save(); ec.setAttribute('aria-checked', DB.input.echo); };
      }
      if (S.step === 'delai') { const b = document.getElementById('wtap'); if (b) b.onclick = startTap; }
    }
    function demo() { [60, 64, 67, 72].forEach((n, i) => { setTimeout(() => E.midi.light(n, true, 'd'), i * 350); setTimeout(() => E.midi.light(n, false), i * 350 + 330); }); }

    /* --- mesure du délai : 4 bips d'élan, puis 8 bips où l'on joue --- */
    async function startTap() {
      await A.startInput();
      const c = E.audio(); if (!c) { A.toast('Son indisponible'); return; }
      const spb = 60 / 80, t0 = c.currentTime + 0.6, p0 = performance.now(), c0 = c.currentTime;
      const outLat = (c.outputLatency || c.baseLatency || 0);
      const clickAt = (k) => p0 + (t0 + k * spb - c0 + outLat) * 1000;
      for (let k = 0; k < 12; k++) {
        const t = t0 + k * spb, o = c.createOscillator(), g = c.createGain();
        o.frequency.value = k < 4 ? 900 : 1500; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.18, t + 0.003); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.07);
        o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + 0.08);
      }
      const offs = [];
      const T = S.tap = { beat: 0, ivl: 0,
        hit(now) {
          let best = null, bd = 1e9;
          for (let k = 4; k < 12; k++) { const d = now - clickAt(k); if (Math.abs(d) < Math.abs(bd)) { bd = d; best = k; } }
          if (best !== null && Math.abs(bd) < spb * 450) offs.push(bd);
        },
        stop() { clearInterval(T.ivl); }
      };
      T.ivl = setInterval(() => {
        const b = Math.floor((performance.now() - clickAt(0)) / (spb * 1000)) + 1;
        if (b !== T.beat) { T.beat = Math.max(0, b); draw(); }
        if (performance.now() > clickAt(11) + 700) {
          T.stop(); S.tap = null;
          if (offs.length < 5) S.res = 'Seulement ' + offs.length + ' note' + (offs.length > 1 ? 's' : '') + ' entendue' + (offs.length > 1 ? 's' : '') + ' sur 8 : recommencez en jouant sur chaque bip.';
          else {
            const o = offs.slice().sort((a, b2) => a - b2), med = o[Math.floor(o.length / 2)];
            const spread = o[o.length - 2] - o[1];
            const src = DB.input.source, val = Math.max(0, Math.min(350, Math.round(med)));
            DB.input.lat = DB.input.lat || {}; DB.input.lat[src] = val / 1000; A.save();
            S.res = 'Délai mesuré : ' + val + ' ms' + (spread > 160 ? ' (vos notes étaient assez irrégulières : vous pouvez recommencer pour affiner)' : '') + '. C\'est enregistré.';
          }
          draw();
        }
      }, 40);
      draw();
    }
    draw();
  }

  A.screens.cable = Cable;
  window.Cable = { applyMidi };
})();
