/* Mondes 4 « Les deux mains » et 5 « Plus loin » : leçons, quiz et morceaux (ajoutés aux listes existantes). */
(function () {
  'use strict';
  const MU = window.Music, L = window.Learn;
  const N = (s) => MU.parseNote(s);
  const n = (s, label, d, extra) => Object.assign({ m: N(s), d: d || 1, label: label || '' }, extra || {});

  L.LESSONS.push(
    /* ---------- Monde 4 ---------- */
    { id: 'deux-mains', title: 'Jouer avec les deux mains', min: 3, body: [
      { p: 'La main gauche se pose sur le <b>Do2</b>, la main droite sur le <b>Do3</b>, le Do du milieu. Chaque main garde sa position de cinq notes.' },
      { keys: [48, 50, 52, 53, 55, 60, 62, 64, 65, 67], from: 47, to: 69, cap: 'Main gauche : Do2 à Sol2 · main droite : Do3 à Sol3' },
      { p: 'Les deux mains sont comme un <b>miroir</b> : le pouce (1) est toujours au milieu, le petit doigt (5) au bord. Quand la droite monte avec 1-2-3, la gauche descend avec 1-2-3.' },
      { p: 'Sur la partition à deux mains, la <b>clé de sol</b> en haut est pour la main droite, la <b>clé de fa</b> en bas pour la main gauche. Une accolade relie les deux portées. Ce qui est l\'un au-dessus de l\'autre se joue <b>en même temps</b>.' },
      { grand: [n('C4', '', 1, { h: 'd', x: 90 }), n('C3', '', 1, { h: 'g', x: 90 }), n('E4', '', 1, { h: 'd', x: 160 }), n('C3', '', 1, { h: 'g', x: 160 }), n('G4', '', 2, { h: 'd', x: 230 }), n('G3', '', 2, { h: 'g', x: 230 })], cap: 'En haut la main droite, en bas la main gauche' },
      { p: 'La méthode qui marche : <b>chaque main seule</b> d\'abord, puis <b>les deux ensemble, très lentement</b>. On accélère seulement quand c\'est facile. Mieux vaut lent et juste que vite et faux.' }],
      quiz: [
        { q: 'Sur la partition à deux mains, quelle portée joue la main gauche ?', o: ['Celle du bas, en clé de fa', 'Celle du haut, en clé de sol', 'Les deux', 'Aucune'], why: 'En bas, la clé de fa : les notes graves, pour la main gauche.' },
        { q: 'Deux notes l\'une au-dessus de l\'autre, une sur chaque portée :', o: ['Se jouent en même temps', 'Se jouent l\'une après l\'autre', 'Se jouent avec la même main', 'Ne se jouent pas'], why: 'Tout ce qui est aligné verticalement se joue ensemble.' },
        { q: 'Quel est le meilleur moyen d\'apprendre un morceau à deux mains ?', o: ['Chaque main seule, puis ensemble lentement', 'Les deux mains tout de suite, vite', 'Seulement la main droite', 'Écouter sans jouer'], why: 'On sépare les difficultés, puis on les réunit au ralenti.' },
        { q: 'En position de Do, quel doigt de la main gauche joue le Sol2 ?', o: ['Le pouce (1)', 'Le petit doigt (5)', 'Le majeur (3)', 'L\'index (2)'], why: 'Petit doigt sur Do, pouce sur Sol : les pouces sont au milieu.' }] },
    { id: 'croches', title: 'Les croches : compter « et »', min: 3, body: [
      { p: 'Une <b>croche</b> dure un demi-temps. Deux croches tiennent dans un temps, à la place d\'une noire.' },
      { staff: [n('C4', '1', 1, { x: 70 }), n('D4', '2', 1, { x: 130 }), n('E4', '3', 0.5, { x: 190 }), n('F4', 'et', 0.5, { x: 235 }), n('G4', '4', 1, { x: 290 }), n('E4', 'et', 0.5, { x: 330 })], cap: 'Noire, noire, deux croches, noire…' },
      { p: 'Pour les compter, on dit <b>« 1 et 2 et 3 et 4 et »</b> : les chiffres tombent sur les temps, les « et » entre les temps. Une croche sur le chiffre, la suivante sur le « et ».' },
      { p: 'Seule, une croche a un <b>petit drapeau</b> sur sa hampe. Quand elles se suivent, on les relie souvent par une barre.' },
      { p: 'Astuce : tapez le rythme dans vos mains en comptant à voix haute avant de le jouer. Le métronome d\'Octave peut aussi faire entendre les « et ».' }],
      quiz: [
        { q: 'Combien de croches dans un temps ?', o: ['2', '1', '3', '4'], why: 'Une croche dure ½ temps : deux croches par temps.' },
        { q: 'Comment compte-t-on des croches ?', o: ['1 et 2 et 3 et 4 et', '1 2 3 4 seulement', '1 2 1 2', 'On ne les compte pas'], why: 'Les chiffres sur les temps, les « et » entre les temps.' },
        { q: 'Une croche seule se reconnaît à…', o: ['son petit drapeau sur la hampe', 'sa tête blanche', 'son point', 'son absence de hampe'], why: 'Le drapeau (ou la barre qui relie plusieurs croches).' },
        { q: 'Quatre croches durent autant que…', o: ['deux noires', 'une noire', 'quatre noires', 'une ronde'], why: '4 × ½ = 2 temps, soit deux noires (ou une blanche).' }] },
    /* ---------- Monde 5 ---------- */
    { id: 'dieses', title: 'Les touches noires : dièses et bémols', min: 3, body: [
      { p: 'Les touches noires n\'ont pas de nom à elles : on les nomme d\'après leurs voisines blanches.' },
      { p: 'Le <b>dièse ♯</b> monte d\'un demi-ton : <b>Fa♯</b> est la touche noire juste à droite du Fa. Le <b>bémol ♭</b> descend d\'un demi-ton : <b>Si♭</b> est la touche noire juste à gauche du Si.' },
      { keys: [65, 66, 71, 70], from: 60, to: 72, cap: 'Fa et Fa♯ · Si et Si♭' },
      { p: 'Une même touche noire a donc deux noms : la touche entre La et Si s\'appelle <b>La♯</b> ou <b>Si♭</b>, selon la musique.' },
      { staff: [n('F4', 'Fa', 1, { x: 80 }), n('F#4', 'Fa♯', 1, { x: 180 }), n('B4', 'Si', 1, { x: 290 }), n('Bb4', 'Si♭', 1, { x: 390, fl: true })], cap: 'Le signe se place juste avant la note' },
      { p: 'Un dièse ou un bémol écrit dans une mesure vaut <b>jusqu\'à la fin de la mesure</b>. S\'il est écrit tout au début de la portée (l\'armure), il vaut pour tout le morceau.' }],
      quiz: [
        { q: 'Que fait un dièse ♯ ?', o: ['Il monte la note d\'un demi-ton', 'Il descend la note d\'un demi-ton', 'Il allonge la note', 'Il la rend plus forte'], why: 'Dièse : un demi-ton plus haut, la touche juste à droite.' },
        { q: 'Où est le Fa♯ ?', o: ['La touche noire juste à droite du Fa', 'La touche noire juste à gauche du Fa', 'La touche blanche après le Fa', 'Il n\'existe pas'], why: 'Le dièse monte : on prend la touche juste à droite.' },
        { q: 'La touche noire entre La et Si s\'appelle…', o: ['La♯ ou Si♭', 'Seulement La♯', 'Seulement Si♭', 'Do♯'], why: 'Une touche noire a deux noms possibles.' },
        { q: 'Un dièse écrit dans une mesure vaut…', o: ['Jusqu\'à la fin de la mesure', 'Pour une seule note', 'Pour tout le morceau', 'Pour la mesure suivante'], why: 'Jusqu\'à la barre de mesure. Dans l\'armure, il vaut pour tout le morceau.' }] },
    { id: 'pointee', title: 'Les notes pointées', min: 3, body: [
      { p: 'Un <b>point</b> après une note l\'allonge de la moitié de sa valeur.' },
      { p: 'La <b>blanche pointée</b> dure 2 + 1 = <b>3 temps</b> (une mesure entière à trois temps). La <b>noire pointée</b> dure 1 + ½ = <b>1 temps et demi</b>.' },
      { staff: [n('G4', '3 temps', 3, { x: 90 }), n('E4', '1 ½', 1.5, { x: 220 }), n('D4', '½', 0.5, { x: 300 }), n('C4', '2', 2, { x: 380 })], cap: 'Blanche pointée, noire pointée et croche, blanche' },
      { p: 'La noire pointée est presque toujours suivie d\'une croche : ensemble, elles font 2 temps, « longue… courte ». C\'est le rythme de la fin de l\'Ode à la joie : <b>Mi… Ré Ré</b>.' },
      { p: 'Pour la sentir, comptez « 1 et 2 et » : la noire pointée prend « 1 et 2 », la croche tombe sur le dernier « et ».' }],
      quiz: [
        { q: 'Combien dure une noire pointée ?', o: ['1 temps et demi', '2 temps', '1 temps', '3 temps'], why: 'Le point ajoute la moitié : 1 + ½.' },
        { q: 'Combien dure une blanche pointée ?', o: ['3 temps', '2 temps et demi', '4 temps', '2 temps'], why: '2 + 1 = 3 temps.' },
        { q: 'Une noire pointée et une croche durent ensemble…', o: ['2 temps', '1 temps et demi', '3 temps', '1 temps'], why: '1 ½ + ½ = 2 temps.' },
        { q: 'Comment sonne « noire pointée + croche » ?', o: ['Longue, courte', 'Courte, longue', 'Deux notes égales', 'Sans rythme'], why: 'La première est trois fois plus longue que la seconde.' }] },
    { id: 'gamme-sol', title: 'La gamme de Sol et le passage du pouce', min: 3, body: [
      { p: 'Une <b>gamme</b>, ce sont huit notes qui montent d\'une note à la même une octave plus haut. La gamme de Sol : Sol, La, Si, Do, Ré, Mi, <b>Fa♯</b>, Sol.' },
      { keys: [55, 57, 59, 60, 62, 64, 66, 67], from: 53, to: 69, cap: 'La gamme de Sol majeur, avec son Fa♯' },
      { p: 'On n\'a que cinq doigts pour huit notes : on fait <b>passer le pouce</b> sous la main. Main droite : Sol 1, La 2, Si 3, puis le pouce passe sous le majeur pour jouer Do 1, Ré 2, Mi 3, Fa♯ 4, Sol 5.' },
      { staff: [n('G4', '1', 1, { x: 70 }), n('A4', '2', 1, { x: 125 }), n('B4', '3', 1, { x: 180 }), n('C5', '1', 1, { x: 235 }), n('D5', '2', 1, { x: 290 }), n('E5', '3', 1, { x: 345 }), n('F#5', '4', 1, { x: 410 }), n('G5', '5', 1, { x: 465 })], cap: 'Les doigts de la main droite' },
      { p: 'Le Fa♯ est toujours dièse dans cette gamme : on l\'écrit une fois pour toutes au début de la portée. C\'est l\'<b>armure</b> de Sol majeur.' },
      { p: 'Entraînez le passage du pouce lentement, sans tourner le poignet : le pouce glisse sous la paume pendant que le majeur joue.' }],
      quiz: [
        { q: 'Quelle note est dièse dans la gamme de Sol ?', o: ['Fa♯', 'Do♯', 'Si♭', 'Aucune'], why: 'Sol, La, Si, Do, Ré, Mi, Fa♯, Sol.' },
        { q: 'Combien de notes dans une gamme, en comptant les deux Sol ?', o: ['8', '5', '7', '12'], why: 'Huit notes, d\'une note à la même une octave plus haut.' },
        { q: 'Après Si (doigt 3), quel doigt joue le Do, main droite ?', o: ['Le pouce (1), qui passe dessous', 'Le doigt 4', 'Le doigt 5', 'Le doigt 2'], why: 'C\'est le passage du pouce : 1-2-3, puis 1-2-3-4-5.' },
        { q: 'Comment s\'appellent les dièses écrits au début de la portée ?', o: ['L\'armure', 'La clé', 'La mesure', 'Le tempo'], why: 'L\'armure indique les dièses ou bémols de tout le morceau.' }] }
  );

  const songs = [
    { id: 'alterne', title: 'Chacun son tour', by: 'Création Octave', level: 2, tempo: 84, kind: 'exercice',
      desc: 'La main gauche pose une question, la main droite répond la même chose une octave plus haut.',
      rh: 'r:2 C4 D4 r:2 E4 F4 r:2 G4 F4 r:2 E4 D4 r:2 C4 E4 r:2 G4 E4 r:2 C4:2',
      lh: 'C3 D3 r:2 E3 F3 r:2 G3 F3 r:2 E3 D3 r:2 C3 E3 r:2 G3 E3 r:2 C3:2 r:2' },
    { id: 'miroir', title: 'Le miroir', by: 'Création Octave', level: 2, tempo: 76, kind: 'exercice',
      desc: 'Les deux pouces partent du milieu et les mains s\'écartent, avec les mêmes doigts : 1, 2, 3, 4, 5.',
      rh: 'C4 D4 E4 F4 G4:4 G4 F4 E4 D4 C4:4',
      lh: 'G3 F3 E3 D3 C3:4 C3 D3 E3 F3 G3:4' },
    { id: 'ensemble', title: 'Ensemble !', by: 'Création Octave', level: 3, tempo: 76, kind: 'exercice',
      desc: 'Les deux mains jouent la même mélodie, à une octave d\'écart, exactement en même temps.',
      rh: 'C4 D4 E4 F4 G4:2 G4:2 F4 E4 D4 C4 G4:2 C4:2',
      lh: 'C3 D3 E3 F3 G3:2 G3:2 F3 E3 D3 C3 G3:2 C3:2' },
    { id: 'gammesol', title: 'La gamme de Sol', by: 'Exercice', level: 3, tempo: 72, kind: 'exercice', key: { tonic: 7, mode: 'maj' },
      desc: 'Avec son Fa♯ et le passage du pouce : 1-2-3, le pouce passe, 1-2-3-4-5. Puis on redescend.',
      rh: 'G4 A4 B4 C5 D5 E5 F#5 G5 F#5 E5 D5 C5 B4 A4 G4:2', fing: '1 2 3 1 2 3 4 5 4 3 2 1 3 2 1' }
  ];
  songs.forEach((s) => { MU.build(s); MU.SONGS.push(s); });
})();
