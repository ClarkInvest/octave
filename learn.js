/* Solfège : leçons à lire, QCM, entraînements sans piano, et écran Parcours. */
(function () {
  'use strict';
  const A = window.App, M = window.Mascots, MU = window.Music, E = window.Engine;
  const N = (s) => MU.parseNote(s);

  /* clavier miniature en SVG pour illustrer */
  function miniKeys(mark, from, to) {
    from = from || 48; to = to || 72;
    const wh = []; for (let m = from; m <= to; m++) if (!E.isBlack(m)) wh.push(m);
    const kw = 30, W = wh.length * kw, H = 110;
    let s = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" role="img" aria-label="Clavier avec les touches repérées">';
    wh.forEach((m, i) => {
      const on = mark.includes(m);
      s += '<rect x="' + (i * kw + 1) + '" y="0" width="' + (kw - 2) + '" height="' + H + '" rx="4" fill="' + (on ? 'var(--accent)' : '#FFFFFF') + '" stroke="#C9C2B8"/>';
      if (m % 12 === 0) s += '<text x="' + (i * kw + kw / 2) + '" y="' + (H - 10) + '" text-anchor="middle" font-size="10" font-weight="600" fill="' + (on ? 'var(--on-accent)' : '#8A8580') + '">' + E.name(m) + '</text>';
    });
    for (let m = from; m <= to; m++) if (E.isBlack(m)) { const i = wh.indexOf(m - 1); s += '<rect x="' + ((i + 1) * kw - 9) + '" y="0" width="18" height="66" rx="3" fill="' + (mark.includes(m) ? 'var(--accent)' : '#1C1B1F') + '"/>'; }
    return s + '</svg>';
  }
  function handSvg() {
    const F = [[58, 34, 112], [98, 20, 124], [138, 32, 112], [176, 62, 84]];
    let s = '<svg viewBox="0 0 230 230" width="200" role="img" aria-label="Main droite avec les numéros des doigts">';
    const num = (x, y, n) => '<circle cx="' + x + '" cy="' + y + '" r="14" fill="var(--accent)"/><text x="' + x + '" y="' + (y + 5) + '" text-anchor="middle" font-size="15" font-weight="700" fill="var(--on-accent)">' + n + '</text>';
    s += '<rect x="40" y="110" width="36" height="86" rx="18" fill="var(--surf2)" stroke="var(--line)" stroke-width="2" transform="rotate(-40 58 196)"/>';
    F.forEach((f) => { s += '<rect x="' + f[0] + '" y="' + f[1] + '" width="34" height="' + f[2] + '" rx="17" fill="var(--surf2)" stroke="var(--line)" stroke-width="2"/>'; });
    s += '<rect x="40" y="128" width="168" height="96" rx="38" fill="var(--surf2)" stroke="var(--line)" stroke-width="2"/><rect x="60" y="126" width="146" height="24" fill="var(--surf2)"/>';
    s += num(16, 145, 1);
    F.forEach((f, i) => { s += num(f[0] + 17, f[1] + 20, i + 2); });
    return s + '</svg>';
  }
  const st = (notes, clef, w) => MU.staff({ notes, clef: clef || 'sol', width: w || 560, height: 130, gap: 11, top: 38, dx: 54 });
  const lab = (arr, clef) => arr.map((x) => { const [n, d] = x.split(':'); const m = N(n); return { m, d: d ? +d : 1, label: MU.natName(m) }; });

  /* ---------- Leçons ---------- */
  const LESSONS = [
    { id: 'clavier', title: 'Se repérer sur le clavier', min: 3, body: [
      { p: 'Le clavier répète toujours le même motif de 12 touches : 7 blanches et 5 noires. Les noires sont rangées par groupes de 2 et de 3.' },
      { p: 'Le <b>Do</b> est la touche blanche juste à gauche d\'un groupe de 2 noires. Une fois le Do trouvé, tout le reste suit.' },
      { keys: [48, 60, 72], cap: 'Les Do sur deux octaves' },
      { p: 'Les 7 notes s\'enchaînent vers la droite : Do, Ré, Mi, Fa, Sol, La, Si. Après le Si, on retrouve un Do, une octave plus haut.' },
      { p: 'En France, le Do du milieu de ton clavier s\'appelle <b>Do3</b> (on dit C4 en anglais). C\'est ton point de repère pour placer la main droite.' }],
      quiz: [
        { q: 'Où se trouve le Do ?', o: ['Juste à gauche d\'un groupe de 2 noires', 'Juste à droite d\'un groupe de 3 noires', 'Entre deux touches noires', 'Juste à droite d\'un groupe de 2 noires'], why: 'Le Do est la touche blanche collée à gauche des 2 noires.' },
        { q: 'Combien y a-t-il de noms de notes ?', o: ['7', '5', '8', '12'], why: 'Do, Ré, Mi, Fa, Sol, La, Si : 7 noms, qui se répètent à chaque octave.' },
        { q: 'Quelle note vient juste après le Si ?', o: ['Do', 'La', 'Ré', 'Sol'], why: 'Après Si, on recommence à Do, une octave plus haut.' },
        { q: 'Comment s\'appelle le Do du milieu, en France ?', o: ['Do3', 'Do1', 'Do4', 'Do5'], why: 'Do3 en France, C4 en anglais.' }] },
    { id: 'doigts', title: 'La posture et les numéros des doigts', min: 2, body: [
      { p: 'Assieds-toi face au milieu du clavier, le dos droit, les pieds à plat. Tes avant-bras sont à peu près à la hauteur des touches.' },
      { p: 'La main reste <b>arrondie</b>, comme si tu tenais une balle. On appuie avec le bout des doigts, sans écraser.' },
      { p: 'Chaque doigt a un numéro : le <b>pouce = 1</b>, l\'index = 2, le majeur = 3, l\'annulaire = 4 et le petit doigt = 5. C\'est la même chose pour les deux mains.' },
      { hand: true, cap: 'La main droite vue de dessus : du pouce (1) au petit doigt (5)' },
      { p: 'Sur les partitions, un petit chiffre au-dessus d\'une note indique le doigt à utiliser. Dans l\'appli, les exercices te les montrent aussi.' }],
      quiz: [
        { q: 'Quel est le numéro du pouce ?', o: ['1', '5', '2', '0'], why: 'Le pouce est toujours le doigt 1.' },
        { q: 'Quel est le numéro du petit doigt ?', o: ['5', '4', '1', '3'], why: 'Du pouce au petit doigt : 1, 2, 3, 4, 5.' },
        { q: 'Quel doigt porte le numéro 3 ?', o: ['Le majeur', 'L\'index', 'L\'annulaire', 'Le pouce'], why: 'Le majeur est le doigt du milieu : 3.' },
        { q: 'Comment doit être la main ?', o: ['Arrondie, comme autour d\'une balle', 'Bien à plat sur les touches', 'Les doigts tendus', 'Fermée en poing'], why: 'La main arrondie permet de jouer avec le bout des doigts.' }] },
    { id: 'do-re-mi', title: 'Do, Ré, Mi : tes trois premières notes', min: 2, body: [
      { p: 'Pose le <b>pouce droit (1)</b> sur le Do du milieu, le Do3. L\'index (2) tombe tout seul sur <b>Ré</b>, le majeur (3) sur <b>Mi</b>.' },
      { keys: [60, 62, 64], from: 55, to: 69, cap: 'Do avec le doigt 1, Ré avec le 2, Mi avec le 3' },
      { p: 'Ré est la touche blanche coincée entre les deux noires. Mi est juste à droite du groupe de deux noires.' },
      { p: 'Chaque doigt reste au-dessus de sa touche : pas besoin de bouger la main. Regarde la partition ou l\'écran, pas tes doigts !' }],
      quiz: [
        { q: 'Avec quel doigt joue-t-on le Do, en position de Do ?', o: ['Le pouce (1)', 'L\'index (2)', 'Le majeur (3)', 'Le petit doigt (5)'], why: 'Le pouce se pose sur Do, les autres doigts suivent.' },
        { q: 'Quelle note est entre les deux touches noires ?', o: ['Ré', 'Do', 'Mi', 'Fa'], why: 'Ré est coincé entre les deux noires.' },
        { q: 'Quel doigt joue le Mi ?', o: ['3', '2', '1', '4'], why: 'Do = 1, Ré = 2, Mi = 3.' }] },
    { id: 'fa-sol', title: 'Fa et Sol : la main entière', min: 2, body: [
      { p: 'Ajoute l\'annulaire (4) sur <b>Fa</b> et le petit doigt (5) sur <b>Sol</b>. Tes cinq doigts sont posés sur cinq notes : c\'est la <b>position de Do</b>.' },
      { keys: [60, 62, 64, 65, 67], from: 55, to: 72, cap: 'Position de Do : Do 1, Ré 2, Mi 3, Fa 4, Sol 5' },
      { p: 'Fa est la touche blanche juste à gauche du groupe de trois noires. Sol est juste après.' },
      { p: 'Avec ces cinq notes, tu peux déjà jouer l\'Ode à la joie de Beethoven : c\'est le concert de fin de ce monde !' }],
      quiz: [
        { q: 'Où se trouve le Fa ?', o: ['Juste à gauche d\'un groupe de 3 noires', 'Entre deux touches noires', 'Juste à droite d\'un groupe de 3 noires', 'Juste à gauche d\'un groupe de 2 noires'], why: 'Le Fa est collé à gauche des trois noires.' },
        { q: 'En position de Do, quel doigt joue le Sol ?', o: ['5', '4', '3', '1'], why: 'Do 1, Ré 2, Mi 3, Fa 4, Sol 5.' },
        { q: 'Combien de notes couvre la position de Do ?', o: ['5', '3', '7', '8'], why: 'Un doigt par note : de Do à Sol.' }] },
    { id: 'noire-blanche', title: 'Noire, blanche, ronde : compter les temps', min: 2, body: [
      { p: 'Pour jouer en rythme, on compte des <b>temps</b>, réguliers comme un tic-tac.' },
      { p: 'La <b>noire</b> (rond plein avec une barre) dure 1 temps. La <b>blanche</b> (rond vide avec une barre) dure 2 temps. La <b>ronde</b> (rond vide sans barre) dure 4 temps.' },
      { staff: [{ m: 71, d: 1, label: '1 temps' }, { m: 71, d: 2, label: '2 temps' }, { m: 71, d: 4, label: '4 temps' }], cap: 'Noire, blanche, ronde' },
      { p: 'Dans le jeu, la longueur des barres qui tombent montre la durée : plus la barre est longue, plus tu gardes la touche enfoncée.' }],
      quiz: [
        { q: 'Combien de temps dure une blanche ?', o: ['2 temps', '1 temps', '4 temps', '3 temps'], why: 'La blanche dure 2 temps.' },
        { q: 'Quelle note dure 1 temps ?', o: ['La noire', 'La blanche', 'La ronde', 'Aucune'], why: 'La noire est l\'unité : 1 temps.' },
        { q: 'Une ronde vaut combien de blanches ?', o: ['2', '1', '3', '4'], why: 'Ronde = 4 temps, blanche = 2 temps.' },
        { q: 'À quoi reconnaît-on la ronde ?', o: ['Un rond vide sans barre', 'Un rond plein avec une barre', 'Un rond vide avec une barre', 'Un rond plein sans barre'], why: 'La ronde n\'a pas de barre (hampe).' }] },
    { id: 'portee', title: 'La portée et la clé de sol', min: 3, body: [
      { p: 'La musique s\'écrit sur une <b>portée</b> : 5 lignes et 4 interlignes. On compte les lignes de bas en haut.' },
      { p: 'Plus une note est placée haut sur la portée, plus le son est aigu. Plus elle est bas, plus il est grave.' },
      { p: 'La <b>clé de sol</b> s\'enroule autour de la 2e ligne : la note posée sur cette ligne est un <b>Sol</b>. C\'est la clé de la main droite.' },
      { staff: lab(['G4:2']), cap: 'Le Sol, sur la 2e ligne' }],
      quiz: [
        { q: 'Combien de lignes a une portée ?', o: ['5', '4', '6', '7'], why: '5 lignes et 4 interlignes.' },
        { q: 'En clé de sol, quelle note est sur la 2e ligne ?', o: ['Sol', 'Mi', 'Do', 'La'], why: 'La clé de sol donne son nom à la note de la 2e ligne.' },
        { q: 'Une note placée plus haut sur la portée est…', o: ['plus aiguë', 'plus grave', 'plus longue', 'plus forte'], why: 'La hauteur sur la portée correspond à la hauteur du son.' },
        { q: 'Dans quel sens compte-t-on les lignes ?', o: ['De bas en haut', 'De haut en bas', 'De gauche à droite', 'Peu importe'], why: 'La 1re ligne est celle du bas.' }] },
    { id: 'notes-sol', title: 'Lire les notes en clé de sol', min: 4, body: [
      { p: 'Sur les <b>lignes</b>, de bas en haut : Mi, Sol, Si, Ré, Fa.' },
      { p: 'Dans les <b>interlignes</b>, de bas en haut : Fa, La, Do, Mi.' },
      { p: 'Le Do du milieu (Do3) se place sous la portée, sur une petite ligne en plus. Ensuite, les notes montent une par une : ligne, interligne, ligne…' },
      { staff: lab(['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5']), cap: 'De Do3 à Do4, note par note' }],
      quiz: [
        { q: 'Quelle est cette note ?', staff: ['E4'], o: ['Mi', 'Sol', 'Fa', 'Ré'], why: 'Sur la 1re ligne : Mi.' },
        { q: 'Quelle est cette note ?', staff: ['G4'], o: ['Sol', 'La', 'Mi', 'Si'], why: 'Sur la 2e ligne : Sol.' },
        { q: 'Quelle est cette note ?', staff: ['C4'], o: ['Do', 'Ré', 'Si', 'La'], why: 'Le Do du milieu, sur sa petite ligne sous la portée.' },
        { q: 'Quelle est cette note ?', staff: ['A4'], o: ['La', 'Sol', 'Si', 'Fa'], why: 'Dans le 2e interligne : La.' },
        { q: 'Quelle est cette note ?', staff: ['C5'], o: ['Do', 'Si', 'Ré', 'Mi'], why: 'Dans le 3e interligne : Do, une octave au-dessus du Do du milieu.' }] },
    { id: 'durees', title: 'Les durées des notes', min: 3, body: [
      { p: 'Le rythme se compte en <b>temps</b>. La <b>noire</b> dure 1 temps.' },
      { p: 'La <b>blanche</b> dure 2 temps, la <b>ronde</b> 4 temps. La <b>croche</b> dure un demi-temps : il en faut deux pour faire une noire.' },
      { staff: [{ m: N('B4'), d: 4, label: '4 temps' }, { m: N('B4'), d: 2, label: '2 temps' }, { m: N('B4'), d: 1, label: '1 temps' }, { m: N('B4'), d: 0.5, label: '½ temps' }], cap: 'Ronde, blanche, noire, croche' },
      { p: 'Un <b>point</b> placé après une note l\'allonge de la moitié : une blanche pointée dure 2 + 1 = 3 temps.' }],
      quiz: [
        { q: 'Combien de temps dure une noire ?', o: ['1 temps', '½ temps', '2 temps', '4 temps'], why: 'La noire est l\'unité : 1 temps.' },
        { q: 'Combien de temps dure une ronde ?', o: ['4 temps', '1 temps', '2 temps', '3 temps'], why: 'La ronde vaut 2 blanches, soit 4 temps.' },
        { q: 'Combien de croches dans une noire ?', o: ['2', '1', '3', '4'], why: 'Une croche dure ½ temps : 2 croches = 1 noire.' },
        { q: 'Combien dure une blanche pointée ?', o: ['3 temps', '2 temps', '2 temps et demi', '4 temps'], why: 'Le point ajoute la moitié : 2 + 1 = 3.' }] },
    { id: 'mesure', title: 'La mesure et le tempo', min: 3, body: [
      { p: 'La musique est découpée en <b>mesures</b>, séparées par des barres verticales sur la portée.' },
      { p: 'Le chiffre <b>4/4</b> au début du morceau signifie : 4 temps par mesure, et chaque temps vaut une noire. En <b>3/4</b>, il y a 3 temps par mesure, comme une valse.' },
      { p: 'Le 1er temps de chaque mesure est le plus appuyé. Pour garder le rythme, compte à voix haute : 1, 2, 3, 4.' },
      { p: 'Le <b>tempo</b> est la vitesse : il se mesure en battements par minute. Dans l\'appli, le réglage en % ralentit ou accélère le morceau.' }],
      quiz: [
        { q: 'Combien de temps dans une mesure à 4/4 ?', o: ['4', '2', '3', '8'], why: 'Le chiffre du haut donne le nombre de temps.' },
        { q: 'Combien de noires dans une mesure à 3/4 ?', o: ['3', '4', '2', '6'], why: '3 temps d\'une noire chacun.' },
        { q: 'Quel temps est le plus appuyé ?', o: ['Le 1er', 'Le 2e', 'Le dernier', 'Aucun'], why: 'Le 1er temps marque le début de chaque mesure.' },
        { q: 'Une mesure à 4/4 commence par une blanche. Combien de noires pour la compléter ?', o: ['2', '1', '3', '4'], why: '4 temps − 2 temps = 2 temps, soit 2 noires.' }] },
    { id: 'silences', title: 'Les silences', min: 2, body: [
      { p: 'Un <b>silence</b> est un moment où l\'on ne joue pas… mais où l\'on continue à compter.' },
      { p: 'Chaque durée de note a son silence : la <b>pause</b> dure 4 temps (comme la ronde), la <b>demi-pause</b> 2 temps, le <b>soupir</b> 1 temps et le <b>demi-soupir</b> ½ temps.' },
      { p: 'Les silences font respirer la musique : dans la Lettre à Élise, ce sont eux qui donnent l\'impression de questions et de réponses.' }],
      quiz: [
        { q: 'Combien de temps dure un soupir ?', o: ['1 temps', '½ temps', '2 temps', '4 temps'], why: 'Le soupir correspond à la noire.' },
        { q: 'Quel silence dure 4 temps ?', o: ['La pause', 'La demi-pause', 'Le soupir', 'Le demi-soupir'], why: 'La pause, comme la ronde.' },
        { q: 'Combien dure un demi-soupir ?', o: ['½ temps', '1 temps', '2 temps', '¼ de temps'], why: 'Comme la croche.' },
        { q: 'Pendant un silence, on…', o: ['continue de compter', 'arrête de compter', 'joue plus doucement', 'accélère'], why: 'Le silence fait partie du rythme : on compte toujours.' }] },
    { id: 'alterations', title: 'Dièses et bémols', min: 3, body: [
      { p: 'Le <b>dièse ♯</b> monte une note d\'un demi-ton : on joue la touche juste à droite, souvent une noire.' },
      { p: 'Le <b>bémol ♭</b> la descend d\'un demi-ton : on joue la touche juste à gauche.' },
      { keys: [66, 63], cap: 'Fa♯ et Ré♯ (aussi appelé Mi♭)' },
      { p: 'Une même touche noire porte donc deux noms : Ré♯ et Mi♭, par exemple. Entre Mi et Fa, et entre Si et Do, il n\'y a pas de touche noire : ces notes sont déjà à un demi-ton l\'une de l\'autre.' }],
      quiz: [
        { q: 'Que fait un dièse ?', o: ['Il monte la note d\'un demi-ton', 'Il descend la note d\'un demi-ton', 'Il double sa durée', 'Il la rend plus forte'], why: 'Dièse = un demi-ton plus haut.' },
        { q: 'Quelle note est la même touche que Mi♭ ?', o: ['Ré♯', 'Mi♯', 'Fa', 'Ré'], why: 'La noire entre Ré et Mi s\'appelle Ré♯ ou Mi♭.' },
        { q: 'Entre quelles notes n\'y a-t-il pas de touche noire ?', o: ['Mi et Fa', 'Do et Ré', 'Sol et La', 'La et Si'], why: 'Mi–Fa et Si–Do sont déjà séparés d\'un demi-ton.' },
        { q: 'Où se trouve le Fa♯ ?', o: ['La noire juste à droite du Fa', 'La noire juste à gauche du Fa', 'La blanche à droite du Fa', 'La blanche à gauche du Fa'], why: 'Dièse : la touche juste à droite.' }] },
    { id: 'cle-fa', title: 'La clé de fa (main gauche)', min: 4, body: [
      { p: 'La <b>clé de fa</b> sert pour les notes graves, en général celles de la main gauche.' },
      { p: 'Ses deux points entourent la 4e ligne : la note posée sur cette ligne est un <b>Fa</b> (Fa2).' },
      { p: 'Lignes, de bas en haut : Sol, Si, Ré, Fa, La. Interlignes : La, Do, Mi, Sol. Le Do du milieu se place au-dessus de la portée, sur une ligne en plus.' },
      { staffFa: lab(['G2', 'A2', 'B2', 'C3', 'D3', 'E3', 'F3', 'G3', 'A3']), cap: 'De Sol1 à La2 en clé de fa' }],
      quiz: [
        { q: 'En clé de fa, quelle note est sur la 4e ligne ?', o: ['Fa', 'Sol', 'Ré', 'La'], why: 'La clé de fa donne son nom à la 4e ligne.' },
        { q: 'Quelle est cette note ?', staffFa: ['G2'], o: ['Sol', 'Mi', 'Si', 'La'], why: 'En clé de fa, la 1re ligne est un Sol.' },
        { q: 'Quelle est cette note ?', staffFa: ['C3'], o: ['Do', 'La', 'Mi', 'Ré'], why: '2e interligne en clé de fa : Do.' },
        { q: 'La clé de fa sert surtout pour…', o: ['les notes graves', 'les notes aiguës', 'les silences', 'les accords'], why: 'Elle couvre les graves, souvent la main gauche.' }] }
  ];
  const lesson = (id) => LESSONS.find((l) => l.id === id);

  /* ---------- Entraînements générés ---------- */
  const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  function nameOptions(m) {
    const good = MU.natName(m), all = MU.FR_NAT.filter((x) => x !== good);
    return [good].concat(shuffle(all).slice(0, 3));
  }
  const DRILLS = {
    'lecture-sol': { title: 'Lis les notes · clé de sol', make() { const pool = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'D5', 'E5', 'F5', 'G5']; let prev = ''; return Array.from({ length: 10 }, () => { let n; do { n = pool[Math.floor(Math.random() * pool.length)]; } while (n === prev); prev = n; return { q: 'Quelle est cette note ?', staff: [n], o: nameOptions(N(n)), why: '' }; }); } },
    'lecture-fa': { title: 'Lis les notes · clé de fa', make() { const pool = ['E2', 'F2', 'G2', 'A2', 'B2', 'C3', 'D3', 'E3', 'F3', 'G3', 'A3', 'B3', 'C4']; let prev = ''; return Array.from({ length: 10 }, () => { let n; do { n = pool[Math.floor(Math.random() * pool.length)]; } while (n === prev); prev = n; return { q: 'Quelle est cette note ?', staffFa: [n], o: nameOptions(N(n)), why: '' }; }); } },
    'rythme': { title: 'Les durées', make() {
      const D = [[4, '4 temps', 'Une ronde'], [2, '2 temps', 'Une blanche'], [1, '1 temps', 'Une noire'], [0.5, '½ temps', 'Une croche'], [3, '3 temps', 'Une blanche pointée'], [1.5, '1 temps et demi', 'Une noire pointée']];
      return Array.from({ length: 8 }, () => { const d = D[Math.floor(Math.random() * D.length)]; return { q: 'Combien de temps dure cette note ?', dur: d[0], o: [d[1]].concat(shuffle(D.filter((x) => x !== d).map((x) => x[1])).slice(0, 3)), why: d[2] + ' dure ' + d[1] + '.' }; });
    } }
  };

  /* ---------- Écran : leçon ---------- */
  function Lesson(id) {
    const L = lesson(id); if (!L) { A.go('parcours'); return; }
    const p = A.prof(), done = (p.lessons || {})[id];
    const i = LESSONS.indexOf(L);
    const blocks = L.body.map((b) => {
      if (b.p) return '<p class="lesson-p">' + b.p + '</p>';
      if (b.hand) return '<figure class="lesson-fig"><div class="hand-box">' + handSvg() + '</div><figcaption>' + b.cap + '</figcaption></figure>';
      if (b.keys) return '<figure class="lesson-fig"><div class="kbd-mini">' + miniKeys(b.keys, b.from, b.to) + '</div><figcaption>' + b.cap + '</figcaption></figure>';
      if (b.staff) return '<figure class="lesson-fig"><div class="staff-box">' + st(b.staff, 'sol') + '</div><figcaption>' + b.cap + '</figcaption></figure>';
      if (b.staffFa) return '<figure class="lesson-fig"><div class="staff-box">' + st(b.staffFa, 'fa') + '</div><figcaption>' + b.cap + '</figcaption></figure>';
      return '';
    }).join('');
    const PA = window.Path, step = PA ? PA.stepFor(p, 'lire', id) : null, now = step && !PA.isDone(p, step);
    const ctx = step ? 'Monde ' + step.world.n + ' · étape ' + step.n + ' sur ' + step.world.steps.length + ' · ' + L.min + ' min' : 'Leçon · ' + L.min + ' min';
    A.shell('parcours', A.header() +
      '<div class="row"><a href="#parcours" class="icon-btn" aria-label="Retour au parcours">' + A.ICON.back + '</a><span class="eyebrow">' + ctx + '</span></div>' +
      '<article class="lesson"><h1 class="h1">' + A.esc(L.title) + '</h1>' + blocks +
      '<div class="lesson-end"><div class="tip" style="color:var(--text)">' + M.svg(p.mascot, 'happy') + '<div><div class="label">' + (now ? 'C\'est lu ?' : 'Prêt pour le quiz ?') + '</div><div class="help">' + (now ? 'Passe à l\'étape suivante du parcours.' : L.quiz.length + ' questions' + (done ? ' · dernier score ' + done.score + '/' + done.total : '')) + '</div></div></div>' +
      (now ? '<button class="btn" id="lread">J\'ai lu, étape suivante ' + A.ICON.play + '</button>' : '<a class="btn" href="#quiz-' + L.id + '">Faire le quiz</a>') + '</div></article>');
    const rb = document.getElementById('lread');
    if (rb) rb.onclick = () => { const res = PA.report('lire', id, {}); location.hash = res && res.next ? PA.href(res.next) : '#parcours'; };
  }

  /* ---------- Écran : quiz ---------- */
  function Quiz(id) {
    const L = lesson(id), D = DRILLS[id];
    if (!L && !D) { A.go('parcours'); return; }
    const p = A.prof(), kid = A.isKid();
    const qs = (L ? L.quiz : D.make()).map((q) => { const good = q.o[0]; return Object.assign({}, q, { opts: shuffle(q.o), good }); });
    const title = L ? 'Quiz · ' + L.title : D.title;
    let i = 0, score = 0, answered = false;
    A.shell('parcours', A.header() + '<div class="row"><a href="' + (L ? '#cours-' + L.id : '#parcours') + '" class="icon-btn" aria-label="Retour">' + A.ICON.back + '</a><span class="eyebrow">' + A.esc(title) + '</span></div><div id="qz" class="quiz"></div>');
    const box = document.getElementById('qz');
    function visual(q) {
      if (q.staff) return '<div class="staff-box q-staff">' + MU.staff({ notes: q.staff.map((n) => ({ m: N(n), d: 1 })), clef: 'sol', width: 260, height: 130, gap: 12, top: 40, startX: 150, label: 'Note à reconnaître' }) + '</div>';
      if (q.staffFa) return '<div class="staff-box q-staff">' + MU.staff({ notes: q.staffFa.map((n) => ({ m: N(n), d: 1 })), clef: 'fa', width: 260, height: 130, gap: 12, top: 40, startX: 150, label: 'Note à reconnaître' }) + '</div>';
      if (q.dur) return '<div class="staff-box q-staff">' + MU.staff({ notes: [{ m: N('B4'), d: q.dur }], clef: 'sol', width: 260, height: 130, gap: 12, top: 40, startX: 150, label: 'Durée à reconnaître' }) + '</div>';
      return '';
    }
    function show() {
      const q = qs[i]; answered = false;
      box.innerHTML = '<div class="between"><span class="eyebrow">Question ' + (i + 1) + ' sur ' + qs.length + '</span><div class="pips">' + qs.map((_, k) => '<i class="' + (k < i ? 'ok' : '') + '"></i>').join('') + '</div></div>' +
        '<div class="card q-card"><div class="h2 q-title">' + A.esc(q.q) + '</div>' + visual(q) +
        '<div class="q-opts">' + q.opts.map((o, k) => '<button class="q-opt" data-k="' + k + '">' + A.esc(o) + '</button>').join('') + '</div>' +
        '<div class="q-why" id="qwhy" hidden></div></div>';
      box.querySelectorAll('.q-opt').forEach((b) => b.onclick = () => answer(b));
    }
    function answer(b) {
      if (answered) return; answered = true;
      const q = qs[i], ok = q.opts[+b.dataset.k] === q.good;
      if (ok) score++;
      box.querySelectorAll('.q-opt').forEach((x) => { x.disabled = true; if (q.opts[+x.dataset.k] === q.good) x.classList.add('good'); });
      if (!ok) b.classList.add('bad');
      E.sound.blip(ok);
      const why = document.getElementById('qwhy'); why.hidden = false;
      why.innerHTML = '<div class="row" style="align-items:flex-start"><div class="q-mascot" style="color:var(--text)">' + M.svg(p.mascot, ok ? 'happy' : 'oops') + '</div><div><div class="label">' + (ok ? (kid ? 'Bien joué !' : 'Exact.') : 'Pas tout à fait : c\'est « ' + A.esc(q.good) + ' ».') + '</div>' + (q.why ? '<div class="help">' + A.esc(q.why) + '</div>' : '') + '</div></div>' +
        '<button class="btn" id="qnext" style="margin-top:12px">' + (i + 1 < qs.length ? 'Question suivante' : 'Voir mon score') + '</button>';
      document.getElementById('qnext').onclick = () => { i++; if (i < qs.length) show(); else end(); };
      document.getElementById('qnext').focus();
    }
    function end() {
      const total = qs.length;
      p.lessons = p.lessons || {};
      const prev = p.lessons[id];
      if (!prev || score >= prev.score) p.lessons[id] = { score, total };
      let coins = 0; if (kid) { coins = score * 2; p.coins += coins; }
      A.save();
      const great = score >= total * 0.75;
      const next = L ? LESSONS[LESSONS.indexOf(L) + 1] : null;
      const res = window.Path ? window.Path.report('quiz', id, { score, total }) : null;
      box.innerHTML = '<div class="card q-card" style="align-items:center;text-align:center"><div class="q-res-mascot" style="color:var(--text)">' + M.svg(p.mascot, great ? 'happy' : 'idle') + '</div>' +
        '<div class="h1" style="font-size:48px">' + score + '/' + total + '</div><div class="help">' + (great ? (kid ? 'Champion !' : 'Très bien, c\'est acquis.') : 'Relis la leçon et réessaie : ça viendra vite.') + (coins ? ' +' + coins + ' pièces' : '') + '</div>' +
        '<div class="row" style="flex-wrap:wrap;justify-content:center;margin-top:12px"><button class="btn ghost" id="qagain">Recommencer</button>' +
        (res ? '' : next ? '<a class="btn" href="#cours-' + next.id + '">Leçon suivante</a>' : '<a class="btn" href="#parcours">Parcours</a>') + '</div>' + (res ? '<div class="q-next">' + window.Path.resultHtml(res) + '</div>' : '') + '</div>';
      document.getElementById('qagain').onclick = () => A.route();
    }
    show();
  }

  A.screens.cours = Lesson;
  A.screens.quiz = Quiz;
  window.Learn = { LESSONS, DRILLS };
})();
