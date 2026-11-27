/* Le concert de fin de monde : scène, rideau, public, les trois coups, applaudissements et salut final. */
(function () {
  'use strict';
  const A = window.App, E = window.Engine, M = window.Mascots;

  /* ---------- sons de salle (synthétisés, aucun fichier) ---------- */
  let noiseBuf = null;
  function noise(c) {
    if (noiseBuf) return noiseBuf;
    const n = c.sampleRate * 1.5; noiseBuf = c.createBuffer(1, n, c.sampleRate);
    const d = noiseBuf.getChannelData(0); for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    return noiseBuf;
  }
  /* un clap de mains : bruit très court, filtré */
  function clap(c, t, gain, freq) {
    const s = c.createBufferSource(); s.buffer = noise(c);
    const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq || 1400 + Math.random() * 900; f.Q.value = 1.1;
    const g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(gain, t + 0.002); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.045 + Math.random() * 0.03);
    s.connect(f); f.connect(g); g.connect(c.destination); s.start(t, Math.random()); s.stop(t + 0.1);
  }
  /* applaudissements : des centaines de claps, qui montent puis s'apaisent */
  function applause(sec, strength) {
    const c = E.audio(); if (!c) return;
    const t0 = c.currentTime + 0.05, n = Math.round(sec * 70 * (strength || 1));
    for (let i = 0; i < n; i++) {
      const u = Math.pow(Math.random(), 0.8), t = t0 + u * sec;
      const env = Math.min(1, u * 5) * (1 - Math.max(0, (u - 0.6) / 0.4));
      clap(c, t, 0.05 + 0.13 * env * Math.random() * (strength || 1));
    }
    /* quelques sifflets joyeux */
    for (let k = 0; k < 2 * (strength || 1); k++) {
      const t = t0 + 0.4 + Math.random() * sec * 0.5, o = c.createOscillator(), g = c.createGain();
      o.type = 'sine'; o.frequency.setValueAtTime(1800, t); o.frequency.exponentialRampToValueAtTime(2600, t + 0.25); o.frequency.exponentialRampToValueAtTime(2100, t + 0.5);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.035, t + 0.05); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.55);
      o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + 0.6);
    }
  }
  /* murmure du public avant le concert */
  function murmur(sec) {
    const c = E.audio(); if (!c) return () => {};
    const s = c.createBufferSource(); s.buffer = noise(c); s.loop = true;
    const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 420; f.Q.value = 0.7;
    const g = c.createGain(), t = c.currentTime; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.05, t + 0.8);
    s.connect(f); f.connect(g); g.connect(c.destination); s.start();
    const lfo = setInterval(() => { try { g.gain.setTargetAtTime(0.025 + Math.random() * 0.035, c.currentTime, 0.3); } catch (e) { /* ignoré */ } }, 400);
    const stop = () => { clearInterval(lfo); try { g.gain.setTargetAtTime(0.0001, c.currentTime, 0.25); s.stop(c.currentTime + 1.2); } catch (e) { /* ignoré */ } };
    if (sec) setTimeout(stop, sec * 1000);
    return stop;
  }
  /* les trois coups du théâtre : un bâton frappé sur les planches */
  function knock(c, t) {
    const o = c.createOscillator(), g = c.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(55, t + 0.12);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.5, t + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
    o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + 0.25);
    const s = c.createBufferSource(); s.buffer = noise(c); const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 600;
    const g2 = c.createGain(); g2.gain.setValueAtTime(0.0001, t); g2.gain.exponentialRampToValueAtTime(0.25, t + 0.003); g2.gain.exponentialRampToValueAtTime(0.0001, t + 0.08);
    s.connect(f); f.connect(g2); g2.connect(c.destination); s.start(t); s.stop(t + 0.1);
  }
  function troisCoups() {
    const c = E.audio(); if (!c) return 0;
    const t = c.currentTime + 0.1;
    /* tradition : une série de coups rapides, puis trois coups espacés */
    for (let i = 0; i < 8; i++) knock(c, t + i * 0.13);
    [1.6, 2.4, 3.2].forEach((d) => knock(c, t + d));
    return 3.6;
  }

  /* ---------- la scène ---------- */
  function crowd(n, seed) {
    let h = '', r = seed || 7;
    const rnd = () => { r = (r * 9301 + 49297) % 233280; return r / 233280; };
    for (let i = 0; i < n; i++) {
      const x = (i + 0.5) * (1000 / n) + (rnd() - 0.5) * 18, s = 0.8 + rnd() * 0.5, y = 150 - rnd() * 14;
      h += '<g transform="translate(' + x.toFixed(1) + ' ' + y.toFixed(1) + ') scale(' + s.toFixed(2) + ')"><circle cx="0" cy="-34" r="15"/><path d="M-26 20c0-26 12-38 26-38s26 12 26 38z"/></g>';
    }
    return '<svg class="st-crowd" viewBox="0 0 1000 170" preserveAspectRatio="xMidYMax slice" aria-hidden="true"><g fill="#0A0812">' + h + '</g></svg>';
  }
  function stageEl(cls) {
    const d = document.createElement('div'); d.className = 'stage ' + (cls || ''); d.setAttribute('role', 'dialog');
    return d;
  }
  const worldOf = (songId) => { const PA = window.Path; const s = PA && PA.STEPS.find((x) => x.type === 'concert' && x.ref === songId); return s ? s.world : null; };

  /* avant le concert : le rideau est fermé, le public s'installe */
  function intro(song, done) {
    const p = A.prof(), kid = A.isKid(), w = worldOf(song.id);
    const d = stageEl('closed'); d.setAttribute('aria-label', 'Le concert va commencer');
    d.innerHTML = '<div class="st-back"></div><div class="st-spot"></div>' +
      '<div class="st-curtain l"></div><div class="st-curtain r"></div><div class="st-valance"></div>' +
      '<div class="st-bill"><div class="st-eyebrow">' + (w ? (kid ? 'Monde ' + w.n + ' · ' + A.esc(w.kid) : 'Monde ' + w.n + ' · ' + A.esc(w.title)) : 'Concert') + '</div>' +
        '<div class="st-tonight">Ce soir sur scène</div><div class="st-name">' + A.esc(p.name) + '</div>' +
        '<div class="st-song">joue <b>' + A.esc(song.title) + '</b>' + (song.by ? ' · ' + A.esc(song.by) : '') + '</div>' +
        '<div class="st-mascot">' + M.svg(p.mascot, 'happy', p.wear || null) + '</div>' +
        '<div class="st-rule">' + (kid ? 'Pour réussir le concert : au moins 1 étoile en mode Défi. Le public est là pour toi !' : 'Pour valider : au moins 1 étoile en mode Défi.') + '</div>' +
        '<button class="btn st-go" id="stgo">' + (kid ? 'Entrer en scène' : 'Entrer en scène') + '</button>' +
        '<button class="st-skip" id="stskip">Passer</button></div>' + crowd(16, 11);
    document.body.appendChild(d);
    let stopMur = null, gone = false;
    const finish = () => { if (gone) return; gone = true; if (stopMur) stopMur(); d.classList.add('open'); setTimeout(() => { d.remove(); done && done(); }, 1500); };
    A.onLeave(() => { if (!gone) { gone = true; if (stopMur) stopMur(); d.remove(); } });
    d.querySelector('#stgo').onclick = () => {
      E.audio(); stopMur = murmur();
      d.querySelector('.st-bill').classList.add('hide');
      d.classList.add('dim');
      if (A.sayAuto && A.sayAuto()) A.say('Silence, le concert commence !');
      setTimeout(() => { if (stopMur) { stopMur(); stopMur = null; } const t = troisCoups(); setTimeout(finish, t * 1000 + 200); }, 1400);
    };
    d.querySelector('#stskip').onclick = finish;
  }

  /* après le concert : applaudissements, saluts, et la suite de la tournée */
  function finale(o, done) {
    const p = A.prof(), kid = A.isKid(), ok = o.stars >= 1 && o.mode === 'defi', w = worldOf(o.song.id);
    const firstWin = ok && o.res && o.res.first && o.res.passed;
    const next = o.res && o.res.next, newWorld = firstWin && o.res.worldDone;
    const d = stageEl('open final' + (ok ? ' win' : '')); d.setAttribute('aria-label', 'Fin du concert');
    const stars = '★★★'.slice(0, o.stars) + '☆☆☆'.slice(0, 3 - o.stars);
    const line = ok
      ? (o.stars === 3 ? (kid ? 'Standing ovation ! Tout le monde est debout !' : 'Ovation debout : un concert parfait.') : o.stars === 2 ? (kid ? 'Le public adore ! Quels applaudissements !' : 'Très beau concert, le public est conquis.') : (kid ? 'Bravo ! Le public applaudit, le concert est réussi !' : 'Concert réussi, bravo.'))
      : (kid ? 'Le public t\'encourage : on fait un rappel ? Tu peux ralentir avec le bouton − .' : 'Le public attend un rappel : réessayez, au besoin un peu plus lentement.');
    d.innerHTML = '<div class="st-back"></div><div class="st-spot"></div>' +
      '<div class="st-curtain l"></div><div class="st-curtain r"></div><div class="st-valance"></div>' +
      '<div class="st-bill"><div class="st-eyebrow">' + (ok ? 'Fin du concert' : 'Rappel !') + '</div>' +
        '<div class="st-mascot bow">' + M.svg(p.mascot, ok ? 'happy' : 'idle', p.wear || null) + '</div>' +
        '<div class="st-stars">' + stars + '</div><div class="st-name small">' + o.acc + ' %</div>' +
        '<div class="st-song">' + line + '</div>' +
        (newWorld && next ? '<div class="st-next"><span class="st-eyebrow">Nouveau monde débloqué</span><b>Monde ' + next.world.n + ' · ' + A.esc(kid ? next.world.kid : next.world.title) + '</b></div>' : '') +
        (firstWin && !next ? '<div class="st-next"><b>' + (kid ? 'Tournée terminée ! Tu es une vraie star.' : 'Parcours terminé, félicitations.') + '</b></div>' : '') +
        '<button class="btn st-go" id="stok">' + (ok ? (kid ? 'Saluer le public' : 'Continuer') : (kid ? 'Je retente !' : 'Réessayer')) + '</button></div>' + crowd(16, 11);
    document.body.appendChild(d);
    if (ok) { applause(o.stars === 3 ? 6 : 4.5, o.stars === 3 ? 1.4 : 1); if (window.Trophies) window.Trophies.celebrate(o.stars >= 2 ? 'fireworks' : 'confetti', 3200); }
    else applause(1.6, 0.4);
    if (A.sayAuto && A.sayAuto()) setTimeout(() => A.say(line), 600);
    let gone = false;
    const close = () => { if (gone) return; gone = true; d.classList.add('closing'); setTimeout(() => { d.remove(); done && done(ok); }, 700); };
    A.onLeave(() => { if (!gone) { gone = true; d.remove(); } });
    d.querySelector('#stok').onclick = () => { if (ok) { d.querySelector('.st-mascot').classList.add('bowing'); applause(1.5, 0.7); setTimeout(close, 900); } else close(); };
  }

  window.Concert = { intro, finale, applause, worldOf };
})();
