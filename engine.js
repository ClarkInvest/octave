/* Moteur d'entrée : MIDI, micro, clavier à l'écran + petit synthé. */
window.Engine = (function () {
  const listeners = new Set();
  const held = new Set();
  const FR = ['Do', 'Do♯', 'Ré', 'Ré♯', 'Mi', 'Fa', 'Fa♯', 'Sol', 'Sol♯', 'La', 'La♯', 'Si'];
  const EN = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];

  function emit(type, midi, vel, src) {
    if (type === 'on') held.add(midi); else held.delete(midi);
    listeners.forEach((fn) => { try { fn({ type, midi, vel, src }); } catch (e) { console.error(e); } });
  }
  const name = (m) => FR[m % 12] + (Math.floor(m / 12) - 2);
  const intl = (m) => EN[m % 12] + (Math.floor(m / 12) - 1);
  const isBlack = (m) => [1, 3, 6, 8, 10].includes(m % 12);

  /* ---------- Son ---------- */
  let ctx = null, master = null;
  const voices = new Map();
  function audio() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC({ latencyHint: 'interactive' });
      master = ctx.createGain(); master.gain.value = 0.5;
      /* limiteur doux : évite que plusieurs notes ensemble saturent le haut-parleur (grésillement) */
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -14; comp.knee.value = 8; comp.ratio.value = 12; comp.attack.value = 0.002; comp.release.value = 0.2;
      const out = ctx.createGain(); out.gain.value = 0.85;
      master.connect(comp); comp.connect(out); out.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
  const sound = {
    enabled: true,
    volume(v) { audio(); if (master) master.gain.value = v; },
    play(midi, vel) {
      if (!sound.enabled) return;
      const c = audio(); if (!c) return;
      sound.stop(midi, true);
      /* pas plus de 8 notes à la fois : on éteint la plus ancienne */
      if (voices.size >= 8) sound.stop(voices.keys().next().value, true);
      const f = 440 * Math.pow(2, (midi - 69) / 12), t = c.currentTime + 0.005, v = 0.08 + 0.3 * ((vel || 90) / 127);
      const g = c.createGain(), lp = c.createBiquadFilter();
      lp.type = 'lowpass'; lp.frequency.setValueAtTime(Math.min(9000, f * 8), t); lp.frequency.exponentialRampToValueAtTime(Math.max(400, f * 2), t + 1.2);
      const o1 = c.createOscillator(), o2 = c.createOscillator(), g2 = c.createGain();
      o1.type = 'triangle'; o1.frequency.value = f;
      o2.type = 'sine'; o2.frequency.value = f * 2; g2.gain.value = 0.25;
      o1.connect(g); o2.connect(g2); g2.connect(g); g.connect(lp); lp.connect(master);
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + 0.006);
      g.gain.exponentialRampToValueAtTime(v * 0.35, t + 0.5); g.gain.exponentialRampToValueAtTime(0.0008, t + 3.2);
      o1.start(t); o2.start(t); o1.stop(t + 3.3); o2.stop(t + 3.3);
      voices.set(midi, { g, o1, o2 });
    },
    stop(midi, fast) {
      const vo = voices.get(midi); if (!vo || !ctx) return;
      const t = ctx.currentTime;
      /* on fige le volume là où il en est avant de l'éteindre en douceur : sans ça, un saut de volume fait un clic */
      try {
        const gp = vo.g.gain;
        if (gp.cancelAndHoldAtTime) gp.cancelAndHoldAtTime(t); else { gp.cancelScheduledValues(t); gp.setValueAtTime(Math.max(0.0008, gp.value), t); }
        gp.setTargetAtTime(0, t, fast ? 0.012 : 0.07);
        vo.o1.stop(t + (fast ? 0.12 : 0.5)); vo.o2.stop(t + (fast ? 0.12 : 0.5));
      } catch (e) { /* déjà arrêté */ }
      voices.delete(midi);
    },
    blip(ok) {
      const c = audio(); if (!c) return;
      const t = c.currentTime, o = c.createOscillator(), g = c.createGain();
      o.type = 'sine'; o.frequency.setValueAtTime(ok ? 880 : 220, t); if (ok) o.frequency.setValueAtTime(1320, t + 0.07);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.15, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
      o.connect(g); g.connect(master); o.start(t); o.stop(t + 0.25);
    }
  };

  /* ---------- MIDI ---------- */
  const midi = {
    supported: !!navigator.requestMIDIAccess,
    access: null, inputs: [], outputs: [], outId: null, channel: 1, pedal: false, status: 'off', onchange: null,
    async init() {
      if (!midi.supported) { midi.status = 'unsupported'; return midi.status; }
      try {
        midi.access = await navigator.requestMIDIAccess({ sysex: false });
        midi.access.onstatechange = () => { midi.refresh(); midi.onchange && midi.onchange(); };
        midi.refresh();
        midi.status = midi.inputs.length ? 'ready' : 'nodevice';
      } catch (e) { midi.status = 'denied'; }
      return midi.status;
    },
    refresh() {
      if (!midi.access) return;
      midi.inputs = []; midi.outputs = [];
      midi.access.inputs.forEach((inp) => { midi.inputs.push({ id: inp.id, name: inp.name || 'Entrée MIDI' }); inp.onmidimessage = midi.handle; });
      midi.access.outputs.forEach((out) => midi.outputs.push({ id: out.id, name: out.name || 'Sortie MIDI' }));
      if (!midi.outputs.find((o) => o.id === midi.outId)) midi.outId = midi.outputs.length ? midi.outputs[0].id : null;
      midi.status = midi.inputs.length ? 'ready' : 'nodevice';
    },
    handle(e) {
      const [st, d1, d2] = e.data, cmd = st & 0xf0;
      if (cmd === 0x90 && d2 > 0) { emit('on', d1, d2, 'midi'); if (midi.echo) sound.play(d1, d2); }
      else if (cmd === 0x80 || (cmd === 0x90 && d2 === 0)) { emit('off', d1, 0, 'midi'); if (midi.echo) sound.stop(d1); }
      else if (cmd === 0xb0 && d1 === 64) { midi.pedal = d2 >= 64; listeners.forEach((fn) => fn({ type: 'pedal', value: midi.pedal })); }
    },
    echo: false,
    out() { return midi.access && midi.outId ? midi.access.outputs.get(midi.outId) : null; },
    light(note, on) {
      const o = midi.out(); if (!o) return false;
      const ch = (midi.channel - 1) & 0x0f;
      try { o.send(on ? [0x90 | ch, note, 40] : [0x80 | ch, note, 0]); return true; } catch (e) { return false; }
    },
    allOff() { for (let n = 21; n <= 108; n++) midi.light(n, false); }
  };

  /* ---------- Micro ---------- */
  const mic = {
    supported: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
    running: false, stream: null, an: null, buf: null, raf: 0, frame: 0,
    floor: 0.008, level: 0, freq: 0, cur: null, cents: 0, cand: null, candN: 0, peak: 0, status: 'off',
    /* filtre anti-voix : une note de piano démarre d'un coup (attaque) et garde une hauteur stable ;
       la voix monte plus doucement et sa hauteur glisse ou vibre */
    voiceFilter: true, onIgnore: null, hist: [], rmsHist: [], esHist: [], attackAt: -1e9, strikeAt: -1e9, usedStrike: -1e9, psStrike: 0, psn: 0, startAt: -1e9, candAt: 0, told: false, clarity: 0,
    async start() {
      if (!mic.supported) { mic.status = 'unsupported'; return mic.status; }
      const c = audio(); if (!c) { mic.status = 'unsupported'; return mic.status; }
      try {
        mic.stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
      } catch (e) { mic.status = 'denied'; return mic.status; }
      const src = c.createMediaStreamSource(mic.stream);
      mic.an = c.createAnalyser(); mic.an.fftSize = 2048; src.connect(mic.an);
      mic.buf = new Float32Array(mic.an.fftSize);
      mic.running = true; mic.status = 'ready'; mic.loop();
      return mic.status;
    },
    stop() {
      mic.running = false; cancelAnimationFrame(mic.raf);
      if (mic.stream) mic.stream.getTracks().forEach((t) => t.stop());
      if (mic.cur !== null) emit('off', mic.cur, 0, 'micro');
      mic.cur = null; mic.stream = null; mic.status = 'off';
    },
    async calibrate(ms) {
      const vals = [], t0 = performance.now();
      return new Promise((res) => {
        const tick = () => {
          vals.push(mic.level);
          if (performance.now() - t0 < (ms || 1500)) setTimeout(tick, 30);
          else { vals.sort((a, b) => a - b); const p = vals[Math.floor(vals.length * 0.9)] || 0.005; mic.floor = Math.max(0.006, p * 2.5); res(mic.floor); }
        };
        tick();
      });
    },
    loop() {
      if (!mic.running) return;
      mic.raf = requestAnimationFrame(mic.loop);
      mic.an.getFloatTimeDomainData(mic.buf);
      /* frappe d'une touche : l'énergie des 10 dernières millisecondes bondit par rapport à juste avant.
         Calculé à chaque image (léger), pour repérer une même note rejouée vite (do, do dans l'Ode à la joie) */
      /* fenêtre d'au moins deux périodes de la note en cours, sinon l'énergie d'une note grave « ondule » et simule des frappes */
      const B = mic.buf, nS = Math.min(B.length, Math.max(512, Math.round(2.2 * ctx.sampleRate / Math.max(55, mic.cur !== null ? mic.freq : 400)))); let es = 0;
      for (let i = B.length - nS; i < B.length; i++) es += B[i] * B[i];
      es = Math.sqrt(es / nS);
      const tNow = performance.now();
      const prevMin = mic.esHist.length >= 3 ? Math.min.apply(null, mic.esHist.slice(-5, -1)) : 0;
      mic.esHist.push(es); if (mic.esHist.length > 8) mic.esHist.shift();
      if (es > mic.floor * 1.5 && es > Math.max(prevMin, mic.floor * 0.4) * 1.5 && tNow - mic.strikeAt > 90) { mic.strikeAt = tNow; mic.attackAt = tNow; }
      if ((mic.frame++ & 1) === 1) return;
      let rms = 0; for (let i = 0; i < mic.buf.length; i++) rms += mic.buf[i] * mic.buf[i];
      rms = Math.sqrt(rms / mic.buf.length); mic.level = rms;
      let note = null, exact = 0;
      if (rms > mic.floor) {
        const f = detect(mic.buf, ctx.sampleRate);
        mic.clarity = detect.clarity;
        if (f > 25 && f < 4500) {
          mic.freq = f; exact = 69 + 12 * Math.log2(f / 440); note = Math.round(exact); mic.cents = Math.round((exact - note) * 100);
        }
      }
      const now = performance.now();
      /* attaque : le volume bondit par rapport à l'instant d'avant (~100 ms) */
      const before = mic.rmsHist.length >= 3 ? Math.min.apply(null, mic.rmsHist.slice(-4, -1)) : 0;
      if (rms > mic.floor * 2.5 && rms > Math.max(before, mic.floor * 0.5) * 2) mic.attackAt = now;
      const softRise = rms > mic.floor * 2 && rms > before * 1.35;
      mic.rmsHist.push(rms); if (mic.rmsHist.length > 8) mic.rmsHist.shift();
      const onset = rms > mic.peak * 1.8 && rms > mic.floor * 2;
      mic.peak = Math.max(rms, mic.peak * 0.93);
      if (note !== null && note === mic.cand) { mic.candN++; mic.hist.push(exact); if (mic.hist.length > 8) mic.hist.shift(); }
      else { mic.cand = note; mic.candN = note === null ? 0 : 1; mic.hist = note === null ? [] : [exact]; mic.candAt = now; mic.told = false; }
      if (note === null) { if (mic.cur !== null) { emit('off', mic.cur, 0, 'micro'); mic.cur = null; } return; }
      /* même touche frappée de nouveau : une frappe neuve, après le début de la note en cours */
      /* … confirmée par deux analyses de hauteur faites après la frappe (sinon c'est le début de la note suivante) */
      if (mic.strikeAt !== mic.psStrike) { mic.psStrike = mic.strikeAt; mic.psn = 0; }
      if (note === mic.cur && now - mic.strikeAt >= 45 && now - mic.strikeAt < 300) mic.psn++;
      const restrike = mic.strikeAt > mic.usedStrike && mic.strikeAt > mic.startAt + 60 && mic.psn >= 2;
      if (note === mic.cur) { if (restrike || (onset && mic.candN >= 2)) start(note, rms); return; }
      if (!mic.voiceFilter) {
        if (mic.candN >= 2) start(note, rms);
        return;
      }
      /* l'écran en cours peut dire quelles notes il attend : celles-là sont acceptées vite,
         les autres doivent vraiment ressembler à une touche de piano avant de compter comme une erreur */
      const expected = typeof api.expect === 'function' && api.expect(note);
      const spreadOf = (k) => { const h = mic.hist.slice(-k); return Math.max.apply(null, h) - Math.min.apply(null, h); };
      let why = '';
      if (expected) {
        if (mic.candN < 2) return;
        if (spreadOf(3) > 0.4) why = 'hauteur qui glisse';
      } else {
        const need = typeof api.expect === 'function' ? 5 : 3;
        if (mic.candN < need) return;
        const struck = mic.attackAt >= mic.candAt - 160 || (mic.cur !== null && softRise && now - mic.candAt < 200);
        if (spreadOf(need) > 0.25) why = 'hauteur qui glisse';
        else if (mic.clarity < 0.6) why = 'son peu net';
        else if (!struck) why = 'pas d\'attaque de touche';
      }
      if (!why) { start(note, rms); return; }
      if (!mic.told && mic.onIgnore) { mic.told = true; mic.onIgnore(note, why); }
      function start(m, r) {
        if (mic.cur !== null) emit('off', mic.cur, 0, 'micro');
        mic.cur = m; mic.startAt = now; mic.usedStrike = mic.strikeAt; emit('on', m, Math.min(127, Math.round(40 + r * 900)), 'micro');
      }
    }
  };

  /* Autocorrélation fenêtrée : renvoie la fréquence fondamentale en Hz ou -1. Coût limité pour tourner en continu sur tablette. */
  function detect(buf, sr) {
    const n = buf.length, maxLag = Math.min(n - 64, Math.floor(sr / 55)), minLag = Math.floor(sr / 4200), W = n - maxLag;
    const c = new Float32Array(maxLag + 1);
    for (let i = 0; i <= maxLag; i++) { let s = 0; for (let j = 0; j < W; j++) s += buf[j] * buf[j + i]; c[i] = s; }
    let d = minLag; while (d < maxLag && c[d] > c[d + 1]) d++;
    let max = -Infinity, pos = -1;
    for (let i = d; i < maxLag; i++) if (c[i] > max) { max = c[i]; pos = i; }
    detect.clarity = c[0] > 0 ? Math.max(0, max) / c[0] : 0;
    if (pos < 1 || max < c[0] * 0.3) return -1;
    /* préfère le premier pic proche du maximum (évite l'erreur d'octave) */
    for (let i = d; i < pos; i++) if (c[i] > max * 0.9 && c[i] >= c[i - 1] && c[i] >= c[i + 1]) { pos = i; break; }
    const x1 = c[pos - 1], x2 = c[pos], x3 = c[pos + 1], a = (x1 + x3 - 2 * x2) / 2, b = (x3 - x1) / 2;
    return sr / (a ? pos - b / (2 * a) : pos);
  }

  /* ---------- Clavier à l'écran ---------- */
  const screen = {
    down(m) { sound.play(m, 96); emit('on', m, 96, 'ecran'); },
    up(m) { sound.stop(m); emit('off', m, 0, 'ecran'); }
  };

  const api = { on(fn) { listeners.add(fn); return () => listeners.delete(fn); }, held, name, intl, isBlack, sound, midi, mic, screen, audio, expect: null };
  return api;
})();
