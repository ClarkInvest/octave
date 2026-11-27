/* Monde 3 « La main gauche » : leçons et morceaux graves (ajoutés aux listes existantes). */
(function () {
  'use strict';
  const MU = window.Music, L = window.Learn;
  const n = (m, label, x, d) => ({ m, d: d || 1, label: label || '', x });

  L.LESSONS.push(
    { id: 'main-gauche', title: 'La main gauche en position de Do', min: 3, body: [
      { p: 'La main gauche se place <b>une octave sous le Do du milieu</b>, sur le Do2.' },
      { p: 'Attention, à la main gauche les numéros vont dans l\'autre sens : le <b>petit doigt (5)</b> se pose sur Do, l\'annulaire (4) sur Ré, le majeur (3) sur Mi, l\'index (2) sur Fa et le <b>pouce (1)</b> sur Sol.' },
      { keys: [48, 50, 52, 53, 55], from: 43, to: 62, cap: 'Main gauche : Do 5, Ré 4, Mi 3, Fa 2, Sol 1' },
      { p: 'Ces notes graves s\'écrivent en <b>clé de fa</b>. Le Do2 est dans le 2e interligne en partant du bas.' },
      { staffFa: [n(48, 'Do'), n(50, 'Ré'), n(52, 'Mi'), n(53, 'Fa'), n(55, 'Sol')], cap: 'De Do2 à Sol2 en clé de fa' },
      { p: 'La main gauche joue souvent moins de notes que la droite, mais plus longues : elle pose la basse, comme le bassiste d\'un groupe.' }],
      quiz: [
        { q: 'En position de Do, quel doigt gauche joue le Do ?', o: ['Le petit doigt (5)', 'Le pouce (1)', 'L\'index (2)', 'Le majeur (3)'], why: 'À gauche, on part du petit doigt : Do 5, Ré 4, Mi 3, Fa 2, Sol 1.' },
        { q: 'Et quel doigt gauche joue le Sol ?', o: ['Le pouce (1)', 'Le petit doigt (5)', 'L\'annulaire (4)', 'Le majeur (3)'], why: 'Le pouce gauche est vers la droite, sur Sol.' },
        { q: 'Où se place la main gauche ?', o: ['Une octave sous le Do du milieu', 'Sur le Do du milieu', 'Une octave au-dessus du Do du milieu', 'Tout à droite du clavier'], why: 'Sur le Do2, une octave plus bas que le Do3.' },
        { q: 'Quelle est cette note ?', staffFa: ['C3'], o: ['Do', 'La', 'Mi', 'Si'], why: 'Le Do2, dans le 2e interligne de la clé de fa.' }] },
    { id: 'accords', title: 'Les accords : Do, Fa et Sol', min: 3, body: [
      { p: 'Un <b>accord</b>, ce sont plusieurs notes jouées ensemble. Les plus simples en ont trois.' },
      { p: 'L\'accord de <b>Do</b> : Do, Mi, Sol. On prend une note sur deux, en sautant une touche blanche à chaque fois. À la main gauche, on le joue avec les doigts 5, 3 et 1.' },
      { keys: [48, 52, 55], from: 40, to: 57, cap: 'Accord de Do : Do2, Mi2, Sol2' },
      { p: 'L\'accord de <b>Fa</b> : Fa, La, Do. L\'accord de <b>Sol</b> : Sol, Si, Ré. Même forme, on déplace juste la main.' },
      { keys: [41, 45, 48], from: 40, to: 52, cap: 'Accord de Fa : Fa1, La1, Do2' },
      { keys: [43, 47, 50], from: 40, to: 52, cap: 'Accord de Sol : Sol1, Si1, Ré2' },
      { staffFa: [n(48, 'Do', 90, 2), n(52, '', 90, 2), n(55, '', 90, 2), n(41, 'Fa', 210, 2), n(45, '', 210, 2), n(48, '', 210, 2), n(43, 'Sol', 330, 2), n(47, '', 330, 2), n(50, '', 330, 2)], cap: 'Les trois accords écrits en clé de fa' },
      { p: 'Avec ces trois accords, on peut déjà accompagner beaucoup de chansons, de Frère Jacques au blues.' }],
      quiz: [
        { q: 'Combien de notes ont ces accords ?', o: ['3', '2', '4', '5'], why: 'Trois notes, prises une sur deux.' },
        { q: 'Quelles notes forment l\'accord de Do ?', o: ['Do, Mi, Sol', 'Do, Ré, Mi', 'Do, Fa, Sol', 'Do, Mi, La'], why: 'Do, on saute Ré, Mi, on saute Fa, Sol.' },
        { q: 'Quelles notes forment l\'accord de Sol ?', o: ['Sol, Si, Ré', 'Sol, La, Si', 'Sol, Do, Mi', 'Sol, Si, Do'], why: 'Même forme que Do, en partant de Sol.' },
        { q: 'Avec quels doigts joue-t-on l\'accord de Do à la main gauche ?', o: ['5, 3 et 1', '1, 2 et 3', '2, 3 et 4', '5, 4 et 3'], why: 'Petit doigt sur Do, majeur sur Mi, pouce sur Sol.' }] }
  );

  const songs = [
    { id: 'ours', title: 'Le pas de l\'ours', by: 'Création Octave', level: 2, tempo: 80, kind: 'exercice', hand: 'gauche',
      desc: 'Une marche lourde à la main gauche, sur les cinq notes graves.',
      rh: 'C3:2 E3:2 G3:2 E3:2 C3 D3 E3 F3 G3:4 G3 F3 E3 D3 C3:2 G3:2 C3:4' },
    { id: 'valse', title: 'Petite valse des accords', by: 'Création Octave', level: 2, tempo: 84, kind: 'exercice', hand: 'gauche',
      desc: 'Les accords Do, Fa et Sol, un par mesure, à la main gauche.',
      rh: 'C3+E3+G3:3 F2+A2+C3:3 G2+B2+D3:3 C3+E3+G3:3 F2+A2+C3:3 C3+E3+G3:3 G2+B2+D3:3 C3+E3+G3:3' },
    { id: 'blues', title: 'Le blues de la main gauche', by: 'Création Octave', level: 3, tempo: 92, kind: 'groove', hand: 'gauche',
      desc: 'Une ligne de basse qui marche, puis un accord pour finir. Le concert du club !',
      rh: 'C3 E3 G3 F3 G3 E3 C3:2 F2 A2 C3 D3 C3 A2 F2:2 G2 B2 D3 B2 C3 E3 G3:2 C3+E3+G3:4' }
  ];
  songs.forEach((s) => { const p = MU.parse(s.rh); s.notes = p.notes; s.length = p.length; MU.SONGS.push(s); });
})();
