/* Mascottes : chaque fonction renvoie un SVG (viewBox 200x200). mood = 'idle' | 'happy' | 'oops' */
window.Mascots = (function () {
  const INK = '#0E1630';

  function volt(mood) {
    const eyes = mood === 'happy'
      ? '<path d="M83 70l3.6 7.4 8.1.9-6 5.5 1.7 8-7.4-4.2-7.4 4.2 1.7-8-6-5.5 8.1-.9z" fill="#FFC23D"/><path d="M117 70l3.6 7.4 8.1.9-6 5.5 1.7 8-7.4-4.2-7.4 4.2 1.7-8-6-5.5 8.1-.9z" fill="#FFC23D"/>'
      : mood === 'oops'
        ? '<rect x="74" y="80" width="18" height="5" rx="2.5" fill="#4DA3FF"/><rect x="108" y="80" width="18" height="5" rx="2.5" fill="#4DA3FF"/>'
        : '<rect x="74" y="73" width="18" height="15" rx="6" fill="#4DA3FF"/><rect x="108" y="73" width="18" height="15" rx="6" fill="#4DA3FF"/>';
    const mouth = mood === 'happy' ? '<path d="M82 108q18 16 36 0z" fill="#FFFFFF"/>'
      : mood === 'oops' ? '<path d="M86 114q14-8 28 0" fill="none" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round"/>'
        : '<path d="M84 110q16 12 32 0" fill="none" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round"/>';
    const arm = mood === 'happy' ? '<path d="M130 146l26-34" stroke="#FFFFFF" stroke-width="7" stroke-linecap="round"/>' : '<path d="M130 146l24-6" stroke="#FFFFFF" stroke-width="7" stroke-linecap="round"/>';
    return '<svg viewBox="0 0 200 200" role="img" aria-label="Volt, le robot DJ">' +
      '<line x1="100" y1="22" x2="100" y2="40" stroke="#FFFFFF" stroke-width="4"/><circle cx="100" cy="16" r="7" fill="#FFC23D"/>' +
      '<path d="M70 146l-20 22" stroke="#FFFFFF" stroke-width="7" stroke-linecap="round"/>' + arm +
      '<rect x="70" y="132" width="60" height="46" rx="14" fill="#24305C" stroke="#FFFFFF" stroke-width="4"/>' +
      '<rect x="82" y="152" width="8" height="16" rx="2" fill="#4DA3FF"/><rect x="96" y="144" width="8" height="24" rx="2" fill="#FFC23D"/><rect x="110" y="156" width="8" height="12" rx="2" fill="#4DA3FF"/>' +
      '<path d="M42 94a58 58 0 0 1 116 0" fill="none" stroke="#FFFFFF" stroke-width="8"/>' +
      '<rect x="50" y="40" width="100" height="88" rx="30" fill="#24305C" stroke="#FFFFFF" stroke-width="4"/>' +
      '<rect x="62" y="64" width="76" height="34" rx="17" fill="#05080F"/>' + eyes +
      '<rect x="28" y="78" width="26" height="46" rx="11" fill="#FFC23D"/><rect x="146" y="78" width="26" height="46" rx="11" fill="#FFC23D"/>' +
      mouth + '</svg>';
  }

  function croche(mood) {
    const mouth = mood === 'happy' ? '<path d="M76 150q14 12 28-4z" fill="' + INK + '"/>'
      : mood === 'oops' ? '<path d="M80 156q10-6 20 0" fill="none" stroke="' + INK + '" stroke-width="4" stroke-linecap="round"/>'
        : '<path d="M78 152q12 8 24-4" fill="none" stroke="' + INK + '" stroke-width="4" stroke-linecap="round"/>';
    return '<svg viewBox="0 0 200 200" role="img" aria-label="Croche, la note à casquette">' +
      '<path d="M72 166v18h-14M100 162v22h14" fill="none" stroke="#FFFFFF" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<rect x="44" y="178" width="22" height="10" rx="5" fill="#2563EB"/><rect x="106" y="178" width="22" height="10" rx="5" fill="#2563EB"/>' +
      '<rect x="118" y="34" width="12" height="104" rx="4" fill="#FFFFFF"/><path d="M130 34q44 18 32 72-8-26-32-30z" fill="#FFFFFF"/>' +
      '<ellipse cx="86" cy="138" rx="44" ry="32" transform="rotate(-20 86 138)" fill="#FFC23D" stroke="#FFFFFF" stroke-width="4"/>' +
      '<path d="M44 128q14-34 58-26l4 10q-36-6-54 22z" fill="#2563EB"/><path d="M98 104l26 4-4 8-20-2z" fill="#1D4FC4"/>' +
      '<ellipse cx="74" cy="138" rx="6" ry="8" fill="' + INK + '"/><ellipse cx="98" cy="132" rx="6" ry="8" fill="' + INK + '"/>' +
      '<circle cx="76" cy="135" r="2" fill="#FFFFFF"/><circle cx="100" cy="129" r="2" fill="#FFFFFF"/>' + mouth + '</svg>';
  }

  function boule(mood) {
    const mouth = mood === 'happy' ? 'M74 128q26 26 52 0' : mood === 'oops' ? 'M80 138q20-10 40 0' : 'M80 132q20 8 40 0';
    return '<svg viewBox="0 0 200 200" role="img" aria-label="La boule jaune">' +
      '<ellipse cx="100" cy="186" rx="52" ry="8" fill="#000000" opacity=".18"/>' +
      '<circle cx="100" cy="102" r="76" fill="#FFD23D"/>' +
      '<ellipse cx="72" cy="66" rx="20" ry="12" transform="rotate(-30 72 66)" fill="#FFFFFF" opacity=".35"/>' +
      '<circle cx="78" cy="96" r="7" fill="#151515"/><circle cx="122" cy="96" r="7" fill="#151515"/>' +
      '<path d="' + mouth + '" fill="none" stroke="#151515" stroke-width="5" stroke-linecap="round"/></svg>';
  }

  function tempo(mood) {
    const ink = 'currentColor';
    const angle = mood === 'happy' ? 18 : mood === 'oops' ? -10 : 8;
    const mouth = mood === 'oops' ? 'M93 144q7-4 14 0' : 'M92 142q8 6 16 0';
    return '<svg viewBox="0 0 200 200" role="img" aria-label="Tempo, le métronome">' +
      '<path d="M70 176L84 40h32l14 136z" fill="var(--surf)" stroke="' + ink + '" stroke-width="4" stroke-linejoin="round"/>' +
      '<path d="M88 60h24M86 76h28M84 92h32" stroke="var(--line)" stroke-width="3" stroke-linecap="round"/>' +
      '<g transform="rotate(' + angle + ' 100 152)"><path d="M100 152V58" stroke="var(--accent)" stroke-width="5" stroke-linecap="round"/><rect x="92" y="80" width="16" height="12" rx="3" fill="var(--accent)"/></g>' +
      '<circle cx="90" cy="130" r="4" fill="' + ink + '"/><circle cx="110" cy="130" r="4" fill="' + ink + '"/>' +
      '<path d="' + mouth + '" fill="none" stroke="' + ink + '" stroke-width="3" stroke-linecap="round"/>' +
      '<rect x="60" y="174" width="80" height="10" rx="5" fill="' + ink + '"/></svg>';
  }

  const list = {
    volt: { name: 'Volt', kind: 'Le robot DJ', modes: ['enfant', 'adulte'], draw: volt },
    croche: { name: 'Croche', kind: 'La note à casquette', modes: ['enfant'], draw: croche },
    boule: { name: 'Boule', kind: 'Nom à trouver', modes: ['enfant'], draw: boule },
    tempo: { name: 'Tempo', kind: 'Le métronome', modes: ['adulte'], draw: tempo }
  };
  return {
    list,
    svg(id, mood) { return (list[id] || list.volt).draw(mood || 'idle'); },
    forMode(mode) { return Object.keys(list).filter((k) => list[k].modes.includes(mode)); }
  };
})();
