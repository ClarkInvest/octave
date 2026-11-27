/* Pack de Noël et morceaux en famille : mélodies du domaine public, arrangées à la main
   en version facile (main droite) et à deux mains (basse simple à gauche, position de Do). */
(function () {
  'use strict';
  const MU = window.Music;

  /* Vive le vent (Jingle Bells, J. Pierpont, 1857) : couplet puis refrain */
  const VENT_COUPLET = 'G3 E4 D4 C4 G3:3 G3:0.5 G3:0.5 G3 E4 D4 C4 A3:4 A3 F4 E4 D4 B3:4 G4 G4 F4 D4 E4:4 ' +
    'G3 E4 D4 C4 G3:4 G3 E4 D4 C4 A3:3 A3 A3 F4 E4 D4 G4 G4 G4 G4 A4 G4 F4 D4 C4:4';
  const VENT_REFRAIN = 'E4 E4 E4:2 E4 E4 E4:2 E4 G4 C4:1.5 D4:0.5 E4:4 F4 F4 F4:1.5 F4:0.5 F4 E4 E4 E4:0.5 E4:0.5 E4 D4 D4 E4 D4:2 G4:2 ' +
    'E4 E4 E4:2 E4 E4 E4:2 E4 G4 C4:1.5 D4:0.5 E4:4 F4 F4 F4 F4 F4 E4 E4 E4:0.5 E4:0.5 G4 G4 F4 D4 C4:4';
  /* basse du refrain : une ronde par mesure, Do, Fa et Sol (petit doigt sur Do, index sur Fa, pouce sur Sol) */
  const VENT_BASSE = 'C3:4 C3:4 C3:4 C3:4 F3:4 C3:4 G3:4 G3:4 C3:4 C3:4 C3:4 C3:4 F3:4 C3:4 G3:4 C3:4';

  /* Douce nuit (F. Gruber, 1818), en 3/4 */
  const NUIT = 'G4:1.5 A4:0.5 G4 E4:3 G4:1.5 A4:0.5 G4 E4:3 D5:2 D5 B4:3 C5:2 C5 G4:3 ' +
    'A4:2 A4 C5:1.5 B4:0.5 A4 G4:1.5 A4:0.5 G4 E4:3 A4:2 A4 C5:1.5 B4:0.5 A4 G4:1.5 A4:0.5 G4 E4:3 ' +
    'D5:2 D5 F5:1.5 D5:0.5 B4 C5:3 E5:3 C5:1.5 G4:0.5 E4 G4:1.5 F4:0.5 D4 C4:6';
  const NUIT_BASSE = 'C3:3 C3:3 C3:3 C3:3 G3:3 G3:3 C3:3 C3:3 F3:3 F3:3 C3:3 C3:3 F3:3 F3:3 C3:3 C3:3 G3:3 G3:3 C3:3 C3:3 C3:3 G3:3 C3:6';

  /* We wish you a Merry Christmas (traditionnel anglais), en 3/4 avec une levée */
  const WISH = 'G3 C4 C4:0.5 D4:0.5 C4:0.5 B3:0.5 A3 A3 A3 D4 D4:0.5 E4:0.5 D4:0.5 C4:0.5 B3 G3 G3 E4 E4:0.5 F4:0.5 E4:0.5 D4:0.5 C4 A3 G3:0.5 G3:0.5 A3 D4 B3 C4:2';
  const WISH_BASSE = 'r:1 C3:3 F3:3 G3:3 G3:3 C3:3 F3:3 G3:3 C3:2';

  /* Mon beau sapin (traditionnel allemand, E. Anschütz), les deux premières phrases, en 3/4 avec une levée */
  const SAPIN = 'G3 C4:0.75 C4:0.25 C4 D4 E4:0.75 E4:0.25 E4:1.5 E4:0.5 D4:0.5 E4:0.5 F4 B3 D4 C4 G3 ' +
    'C4:0.75 C4:0.25 C4 D4 E4:0.75 E4:0.25 E4:1.5 E4:0.5 D4:0.5 E4:0.5 F4 B3 D4 C4:2';
  const SAPIN_BASSE = 'r:1 C3:3 C3:3 G3:3 C3:3 C3:3 C3:3 G3:3 C3:3';

  const songs = [
    { id: 'vent', title: 'Vive le vent, en entier', by: 'J. Pierpont (1857)', level: 3, tempo: 112, kind: 'noel', pack: 'noel', key: { tonic: 0, mode: 'maj' },
      desc: 'Le couplet puis le refrain. Le couplet descend sous le Do du milieu : la main droite se déplace un peu.',
      rh: VENT_COUPLET + ' ' + VENT_REFRAIN },
    { id: 'vent2', title: 'Vive le vent à deux mains', by: 'J. Pierpont (1857)', level: 3, tempo: 100, kind: 'noel', pack: 'noel', key: { tonic: 0, mode: 'maj' },
      desc: 'Le refrain à droite, une note longue par mesure à gauche : Do, Fa ou Sol.',
      rh: VENT_REFRAIN, lh: VENT_BASSE },
    { id: 'doucenuit', title: 'Douce nuit', by: 'F. Gruber (1818)', level: 3, tempo: 72, kind: 'noel', pack: 'noel', bar: 3,
      desc: 'Une berceuse à trois temps, tout en douceur. Attention aux notes pointées : longue, courte.',
      rh: NUIT },
    { id: 'doucenuit2', title: 'Douce nuit à deux mains', by: 'F. Gruber (1818)', level: 4, tempo: 66, kind: 'noel', pack: 'noel', bar: 3,
      desc: 'La mélodie à droite, une basse tenue par mesure à gauche.',
      rh: NUIT, lh: NUIT_BASSE },
    { id: 'wish', title: 'We Wish You a Merry Christmas', by: 'Traditionnel anglais', level: 2, tempo: 104, kind: 'noel', pack: 'noel', bar: 3, pickup: 1,
      desc: 'La chanson qui souhaite un joyeux Noël, avec ses petites croches qui dansent.',
      rh: WISH },
    { id: 'wish2', title: 'We Wish You à deux mains', by: 'Traditionnel anglais', level: 3, tempo: 96, kind: 'noel', pack: 'noel', bar: 3, pickup: 1,
      desc: 'La mélodie à droite, une basse par mesure à gauche.',
      rh: WISH, lh: WISH_BASSE },
    { id: 'sapin', title: 'Mon beau sapin', by: 'Traditionnel', level: 2, tempo: 84, kind: 'noel', pack: 'noel', bar: 3, pickup: 1,
      desc: 'Les deux premières phrases, celles que tout le monde chante. Le petit rythme pointé fait toute la mélodie.',
      rh: SAPIN },
    { id: 'sapin2', title: 'Mon beau sapin à deux mains', by: 'Traditionnel', level: 3, tempo: 76, kind: 'noel', pack: 'noel', bar: 3, pickup: 1,
      desc: 'Avec une basse Do et Sol à la main gauche.',
      rh: SAPIN, lh: SAPIN_BASSE },

    /* en famille, toute l'année */
    { id: 'maman', title: 'Ah ! vous dirai-je, maman', by: 'Chanson traditionnelle', level: 1, tempo: 92, kind: 'chanson',
      desc: 'La mélodie de « Brille, brille, petite étoile », sur six notes.',
      rh: 'C4 C4 G4 G4 A4 A4 G4:2 F4 F4 E4 E4 D4 D4 C4:2 G4 G4 F4 F4 E4 E4 D4:2 G4 G4 F4 F4 E4 E4 D4:2 C4 C4 G4 G4 A4 A4 G4:2 F4 F4 E4 E4 D4 D4 C4:2' },
    { id: 'maman2', title: 'Ah ! vous dirai-je, maman à deux mains', by: 'Chanson traditionnelle', level: 2, tempo: 84, kind: 'chanson',
      desc: 'La mélodie à droite, des blanches à gauche.',
      rh: 'C4 C4 G4 G4 A4 A4 G4:2 F4 F4 E4 E4 D4 D4 C4:2 G4 G4 F4 F4 E4 E4 D4:2 G4 G4 F4 F4 E4 E4 D4:2 C4 C4 G4 G4 A4 A4 G4:2 F4 F4 E4 E4 D4 D4 C4:2',
      lh: 'C3:2 E3:2 F3:2 E3:2 D3:2 C3:2 G3:2 C3:2 E3:2 D3:2 E3:2 D3:2 E3:2 D3:2 E3:2 D3:2 C3:2 E3:2 F3:2 E3:2 D3:2 C3:2 G3:2 C3:2' },
    { id: 'anniv', title: 'Joyeux anniversaire', by: 'M. et P. Hill (1893)', level: 2, tempo: 92, kind: 'chanson', bar: 3, pickup: 1,
      desc: 'À jouer à chaque anniversaire de la famille ! Trois temps, et un saut vers l\'aigu à la fin.',
      rh: 'G3:0.75 G3:0.25 A3 G3 C4 B3:2 G3:0.75 G3:0.25 A3 G3 D4 C4:2 G3:0.75 G3:0.25 G4 E4 C4 B3 A3 F4:0.75 F4:0.25 E4 C4 D4 C4:3' },
    { id: 'canon', title: 'Canon de Pachelbel, version facile', by: 'J. Pachelbel', level: 3, tempo: 66, kind: 'classique',
      desc: 'La célèbre ronde de basses à gauche, une mélodie en blanches à droite. Lent et majestueux.',
      rh: 'E5:2 D5:2 C5:2 B4:2 A4:2 G4:2 A4:2 B4:2 C5:2 B4:2 A4:2 G4:2 F4:2 E4:2 F4:2 G4:2 E4:4',
      lh: 'C3:2 G2:2 A2:2 E2:2 F2:2 C3:2 F2:2 G2:2 C3:2 G2:2 A2:2 E2:2 F2:2 C3:2 F2:2 G2:2 C3:4' },
    { id: 'green', title: 'Greensleeves', by: 'Air anglais du XVIe siècle', level: 4, tempo: 84, kind: 'classique', bar: 3, pickup: 1,
      desc: 'Une mélodie ancienne en la mineur, à trois temps, avec des dièses (Sol♯, Fa♯) et des rythmes pointés.',
      rh: 'A4 C5:2 D5 E5:1.5 F5:0.5 E5 D5:2 B4 G4:1.5 A4:0.5 B4 C5:2 A4 A4:1.5 G#4:0.5 A4 B4:2 G#4 E4:2 A4 C5:2 D5 E5:1.5 F5:0.5 E5 D5:2 B4 G4:1.5 A4:0.5 B4 C5:1.5 B4:0.5 A4 G#4:1.5 F#4:0.5 G#4 A4:2' }
  ];
  songs.forEach((s) => { MU.build(s); MU.SONGS.push(s); });
})();
