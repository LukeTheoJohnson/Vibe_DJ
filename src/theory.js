// theory.js — music theory for the DJ engine, tuned for elite modern hip-hop
// and widened with band and club colours (rock, metal, house, synthwave).
// Covers trap, boom bap, drill, R&B and lo-fi. Roots, scales, progressions and
// voicings are all chosen from the palette of working producers, not textbooks.
(function (SDJ) {
  'use strict';

  // All 12 chromatic roots. Flat keys dominate hip-hop: Bb minor, Eb minor and
  // Ab minor are bread-and-butter trap territory; F# / Db add edge.
  const ROOTS = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];

  // The full mode palette the engine can draw on — dark through bright. Genres
  // pull a genre-appropriate SUBSET of these (see GENRE_SCALES / GENRES[].scales),
  // so the mood widens across the set while each genre keeps its own character.
  // Every name here must be a valid tonal scale name — Strudel resolves scales
  // through tonal, which uses SPACE-separated names ("minor pentatonic"), NOT
  // camelCase. A camelCase name resolves to nothing and the whole n(...) layer
  // renders SILENT (zero events) while still showing in the code — no error.
  // In the generated code the words are joined with ':' (see scaleName) — a
  // bare space inside .scale("…") is split as mini-notation.
  const SCALES = [
    'minor',              // natural minor — the default dark canvas
    'dorian',             // minor with raised 6th — smooth R&B / neo-soul
    'phrygian',           // flat 2nd — sinister, street
    'harmonic minor',     // raised 7th — dramatic, cinematic
    'melodic minor',      // raised 6th & 7th — jazzy minor lift
    'minor pentatonic',   // five-note — clean hooks, sample-friendly
    'blues',              // minor pentatonic + flat 5 — grit and soul
    'phrygian dominant',  // flat 2nd + major 3rd — dark flamenco trap
    'mixolydian',         // major with flat 7 — gospel warmth
    'major',              // bright, open — soul / pop-leaning hooks
    'major pentatonic',   // bright five-note — clean, singable
    'lydian',             // raised 4th — dreamy, floating
  ];

  // Per-genre mood palette — the subset of SCALES a genre draws on. This is how a
  // genre keeps dictating the mood (trap/drill stay dark, R&B/lo-fi stay warm)
  // while still giving every track a genuinely different colour within that lane.
  // Order is loosely most- to least-characteristic; the pick is uniform.
  const GENRE_SCALES = {
    trap:    ['minor', 'phrygian', 'phrygian dominant', 'harmonic minor', 'minor pentatonic'],
    drill:   ['phrygian', 'phrygian dominant', 'harmonic minor', 'minor'],
    boomBap: ['dorian', 'minor pentatonic', 'blues', 'mixolydian', 'minor'],
    loFi:    ['dorian', 'minor pentatonic', 'mixolydian', 'major', 'major pentatonic', 'minor'],
    rb:      ['dorian', 'mixolydian', 'major', 'minor pentatonic', 'melodic minor'],
    // — beyond hip-hop: band and club palettes —
    rock:      ['minor pentatonic', 'mixolydian', 'blues', 'major', 'dorian'],
    metal:     ['phrygian', 'harmonic minor', 'minor', 'phrygian dominant'],
    house:     ['minor', 'dorian', 'minor pentatonic', 'mixolydian'],
    synthwave: ['dorian', 'minor', 'harmonic minor', 'major'],
  };

  // Hip-hop chord progressions — expressed as scale-degree roots. Read as minor
  // in a dark scale and as bright/major in a major-family scale (same degrees,
  // different colour), so the mood palette above does the heavy lifting.
  // Modern trap leans on 2–4 chord loops that dwell on the tonic; the brighter
  // turns near the end give major/mixolydian tracks somewhere warm to go.
  const PROGRESSIONS = [
    [0, 6, 3, 4],   // i – VII – iv – v     classic dark trap
    [0, 6, 5, 3],   // i – VII – VI – iv    descending soul
    [0, 5, 6, 4],   // i – VI – VII – v     emotional minor arc
    [0, 3, 6, 5],   // i – iv – VII – VI    R&B / neo-soul turn
    [0, 5],         // i – VI               2-chord dark drone (trap staple)
    [0, 6],         // i – VII              2-chord sinister loop
    [0, 3],         // i – iv               2-chord melancholic
    [0, 5, 0, 4],   // i – VI – i – v       pedal hook
    [0, 3, 5, 4],   // i – iv – VI – v      classic R&B
    [3, 6, 0, 5],   // iv – VII – i – VI    resolved lift
    [0, 6, 0, 5],   // i – VII – i – VI     rocking tension
    [0, 2, 3, 4],   // i – III – iv – v     modal, brooding
    [5, 3, 0, 6],   // VI – iv – i – VII    reverse dark
    [0, 0, 6, 5],   // i – i – VII – VI     tonic hold then fall
    [0, 4, 5, 3],   // i – v – VI – iv      emotional turn
    [0, 4, 5, 4],   // I – V – vi – V       bright pop lift (in major)
    [0, 3, 4, 0],   // I – IV – V – I       resolved cadence
    [0, 4, 3, 4],   // I – V – IV – V       gospel / rock vamp
    [0, 2, 4, 5],   // i – III – v – VI     modal climb
    [0, 5, 4, 3],   // i – VI – v – iv      long fall
    [0, 6, 4, 5],   // i – VII – v – VI     suspended lift
    [3, 4, 0, 0],   // iv – v – i – i       plagal-style resolve
  ];

  // Melodic cells — hip-hop phrasing: sparse, syncopated, breathe-heavy.
  // [] groups create triplets; <> alternate between two phrases each cycle.
  // Space (rests ~) is a first-class musical element here — silence sells.
  // The back half leans brighter/more rhythmic so major-family tracks get hooks
  // that don't all read as the same dark two-note motif.
  const MELODY_CELLS = [
    '~ ~ 0 ~ ~ 4 ~ ~',              // sparse two-note hook
    '0 ~ ~ ~ 4 ~ ~ 3',              // big space, emotional landing
    '0 ~ 3 ~ 5 ~ 3 0',              // minor pentatonic loop
    '7 ~ ~ 5 4 ~ ~ 2',              // descending pull
    '~ 7 ~ 5 ~ 4 ~ 2',              // falling from the top
    '0 ~ 2 0 ~ 3 ~ 0',              // root-bounce hook
    '~ 3 0 ~ 5 ~ 4 3',              // soulful curve
    '4 ~ 3 ~ 2 ~ 0 ~',              // slow descend
    '0 4 ~ 7 ~ 5 4 ~',              // trap jump
    '~ ~ 4 5 ~ 4 2 ~',              // suspension release
    '[0 2 4] ~ ~ 5 ~ 4 2 ~',        // triplet opener
    '~ 5 ~ 4 [2 3 2] ~ 0 ~',        // triplet ornament
    '0 ~ ~ [2 3] ~ 4 ~ 5',          // slide into phrase
    '0*2 ~ 3 ~ 5 7 ~',              // stutter start
    '~ ~ ~ 0 4 ~ 5 ~',              // late entry hook
    '7 5 4 ~ 2 ~ 0 ~',              // step-down melody
    '0 ~ 4 ~ ~ 3 5 ~',              // trap float
    '<0 7> ~ 3 ~ 5 ~ 4 ~',          // octave alternation hook
    '0 ~ <2 4> ~ 5 ~ 3 ~',          // alternating passing note
    '~ ~ 5 ~ 4 3 ~ 0',              // late resolution
    '0 ~ 2 4 ~ 5 4 ~',              // ascending bright hook
    '~ 0 2 4 ~ 5 ~ 7',              // rising run to the octave
    '7 ~ 5 4 ~ 2 0 ~',              // bright top-down
    '0 2 4 ~ 5 4 2 0',              // wave up and back
    '~ 4 ~ 7 ~ 5 ~ 4',              // upper-register float
    '0 ~ ~ 5 ~ 7 5 4',              // leap then fall
    '0 ~ 4 2 ~ 5 ~ 3',              // zigzag contour
    '~ ~ 7 5 ~ 4 ~ 0',              // high entry, long fall
    '4 ~ 5 7 ~ 5 4 ~',              // climb to the peak
    '0 3 ~ 2 ~ 4 ~ 5',              // stepwise rise
    '<0 4> ~ <5 7> ~ 4 ~ 2 ~',      // alternating bright cells
    '2 ~ 0 ~ 4 ~ 5 7',              // pickup into a leap
    // — ornamented & rhythmic cells: grace notes, trills, triplet turns —
    '0 ~ [0 2] ~ 4 ~ [5 4] ~',      // grace-note pairs
    '~ [4 5] ~ 7 ~ [5 4] 2 ~',      // ornamented upper line
    '0*2 ~ 4*2 ~ 5 ~ 4',           // stutter accents
    '~ 0 ~ 2 ~ [3 4 5] ~ ~',        // triplet run up
    '7 ~ [7 5] 4 ~ [4 2] 0 ~',      // descending with grace notes
    '0 ~ 4 ~ [7 5 4] ~ 2 ~',        // triplet turn mid-phrase
    '~ ~ 0 [2 3] 4 ~ 5 ~',          // pickup ornament into the hook
    '4 [5 4] 2 ~ 0 ~ ~ 0',          // trill-head, settle on the root
    '<0 4 7> ~ 5 ~ 4 ~ 2 ~',        // three-way degree rotation
    '0 ~ 2 ~ 4 ~ [5 7] ~',          // clean rise into an octave lift
    '~ 5 [4 5] ~ 7 ~ 4 ~',          // hovering ornament up high
    '0 [2 0] ~ 4 [5 4] ~ 2 ~',      // call-heavy grace phrase
  ];

  // Two-bar phrases — a CALL and its RESPONSE. Rendered as "<[call] [resp]>" so
  // the lead alternates them each cycle: a question that answers itself instead
  // of one motif looping forever. Each half is a full 8-step bar; calls open and
  // leave space, responses resolve back toward the tonic. This is the main lever
  // that stops every lead reading as the same two-note hook.
  const MELODY_PHRASES = [
    ['~ ~ 0 ~ 2 ~ 4 ~', '5 ~ 4 ~ 2 ~ 0 ~'],       // rise, then resolve home
    ['0 ~ ~ 4 ~ 5 ~ ~', '~ 7 ~ 5 4 ~ 2 ~'],       // leap up, fall back
    ['0 2 4 ~ ~ ~ ~ ~', '~ ~ 4 2 ~ 3 ~ 0'],       // statement, echoed answer
    ['~ 4 ~ 5 ~ 7 ~ ~', '7 ~ 5 ~ 4 ~ 2 0'],       // climb, then cascade down
    ['0 ~ 3 ~ 5 ~ 3 ~', '4 ~ 2 ~ 0 ~ ~ ~'],       // pentatonic call, soft land
    ['[0 2 4] ~ 5 ~ 4 ~', '~ 2 ~ 4 3 ~ 0 ~'],     // triplet call, winding reply
    ['7 ~ ~ 5 ~ ~ 4 ~', '2 ~ 0 ~ ~ 0 ~ ~'],       // high hold, resolve to root
    ['0 ~ 4 ~ 7 ~ 5 ~', '4 ~ 5 ~ 4 2 ~ 0'],       // arpeggio up, melodic down
    ['~ ~ 5 4 ~ 2 ~ 0', '0 ~ 2 ~ 3 ~ 4 ~'],       // fall, answered rising
    ['0 0 ~ 2 ~ 4 ~ ~', '~ 5 4 ~ 2 ~ 0 ~'],       // stutter start, graceful fall
    ['4 ~ 3 ~ 4 ~ 5 ~', '7 ~ 5 ~ 4 ~ 3 ~'],       // hover, lift then settle
    ['<0 7> ~ 4 ~ 5 ~ ~', '~ 4 ~ 2 ~ 3 ~ 0'],     // octave call, resolving reply
    ['0 ~ 2 [3 4] ~ 5 ~', '5 4 ~ 2 ~ 0 ~ ~'],     // slide up, tumble down
    ['~ 5 ~ 7 ~ 5 4 ~', '2 ~ 4 ~ 2 ~ 0 ~'],       // upper float, gentle descent
    ['0 ~ ~ ~ 4 ~ 5 7', '~ 5 ~ 4 ~ 2 0 ~'],       // sparse leap, run home
    ['0 2 3 ~ 4 ~ 2 ~', '3 ~ 2 ~ 0 ~ ~ 0'],       // stepwise wander, cadence
  ];

  // Drum machines — 808 leads because it defines modern hip-hop; 909 for energy.
  const DRUM_BANKS = ['RolandTR808', 'RolandTR909', 'RolandTR707', 'AkaiLinn'];

  // Genre colours — steer BPM range, the mood palette (scales), and how every
  // layer is rendered.
  const GENRES = [
    { id: 'trap',    bpmLo: 130, bpmHi: 155, label: 'Trap',     scales: GENRE_SCALES.trap    },
    { id: 'boomBap', bpmLo: 85,  bpmHi: 100, label: 'Boom Bap', scales: GENRE_SCALES.boomBap },
    { id: 'drill',   bpmLo: 138, bpmHi: 148, label: 'Drill',    scales: GENRE_SCALES.drill   },
    { id: 'loFi',    bpmLo: 70,  bpmHi: 90,  label: 'Lo-Fi',    scales: GENRE_SCALES.loFi    },
    { id: 'rb',      bpmLo: 95,  bpmHi: 115, label: 'R&B',      scales: GENRE_SCALES.rb      },
    { id: 'rock',      bpmLo: 110, bpmHi: 140, label: 'Rock',      scales: GENRE_SCALES.rock      },
    { id: 'metal',     bpmLo: 140, bpmHi: 175, label: 'Metal',     scales: GENRE_SCALES.metal     },
    { id: 'house',     bpmLo: 120, bpmHi: 128, label: 'House',     scales: GENRE_SCALES.house     },
    { id: 'synthwave', bpmLo: 84,  bpmHi: 108, label: 'Synthwave', scales: GENRE_SCALES.synthwave },
  ];

  // ---- generative melody: the lead's phrase builder -----------------------
  //
  // The hand-written cells above all share one shape — an 8-step bar of
  // degrees 0..7 in the same register — so however many there are, a set of
  // reworks read as "the same lead again". The builder below composes a line
  // from independent musical dimensions instead: a RHYTHM (a 16-step onset
  // mask from a genre-weighted feel family, or a euclidean spread), a CONTOUR
  // (arch, fall, pedal, zigzag…), a RANGE and starting degree, and a phrase
  // FORM that develops the motif (repeat, sequence up a step, inversion,
  // retrograde, a resolving answer, rhythmic displacement). Strong beats snap
  // to chord tones when the phrase lines up with the progression. Every
  // choice comes from the caller's seeded rng (or a variant-rotated pick), so
  // the same seed + variant is the same line, note for note.

  // 16-step onset masks ('x' = note, '.' = rest). 'T' opens a beat played as
  // a triplet (the beat's other three cells are ignored).
  const LEAD_RHYTHMS = {
    sparse:     ['x.......x.....x.', '..x.......x.....', 'x.....x.........', 'x.......x.x.....',
                 '....x.......x...', 'x..........x....', '......x.x.......', 'x...x...........'],
    eighths:    ['x.x.x.x.x.x.x.x.', 'x.x...x.x.x...x.', 'x...x.x.x...x.x.', 'x.x.x...x.x.x...',
                 '..x.x.x...x.x.x.', 'x.x.x.x.x...x...'],
    synco:      ['x..x..x...x..x..', 'x..x..x.x..x....', '..x..x..x..x..x.', 'x..x...x..x..x..',
                 'x...x..x..x.x...', '...x..x...x..x..', 'x..x..x.....x...'],
    sixteenths: ['x.xxx.x.....x.x.', 'xxx.x...xxx.x...', 'x.x.xxx.x.x.xx..', '....xxxx..x.x.x.',
                 'x.xx.xx.x.xx.x..', 'xxxx....x.x.....'],
    long:       ['x.......x.......', 'x...........x...', 'x.......x...x...', 'x.....x.....x...',
                 'x...............', '........x.......'],
    offbeat:    ['..x...x...x...x.', '..x...x.....x.x.', '..x.x...x...x.x.', '.x...x...x...x..',
                 '..x.....x.x...x.'],
    pickup:     ['..........x.x.xx', '........x.x.x.x.', '......x.x.x.xx..', '.........x.x.xx.'],
    triplet:    ['T...x.......T...', 'x...T...x...x...', '....T...T.......', 'T.......T...x...',
                 'x.......T...T...', 'T...T...x.......'],
  };

  // Which feels each genre reaches for, most characteristic first. The
  // caller rotates through this list by variant, so successive reworks
  // change the rhythmic feel, not just the notes.
  const LEAD_FEELS = {
    trap:      ['triplet', 'synco', 'sparse', 'sixteenths', 'pickup', 'euclid', 'eighths'],
    drill:     ['synco', 'triplet', 'sparse', 'sixteenths', 'euclid', 'pickup'],
    boomBap:   ['sparse', 'synco', 'eighths', 'long', 'pickup', 'euclid'],
    loFi:      ['long', 'sparse', 'synco', 'eighths', 'pickup', 'euclid'],
    rb:        ['synco', 'long', 'sixteenths', 'triplet', 'sparse', 'pickup', 'euclid'],
    rock:      ['eighths', 'synco', 'long', 'sixteenths', 'pickup', 'euclid'],
    metal:     ['sixteenths', 'eighths', 'synco', 'triplet', 'long', 'euclid'],
    house:     ['offbeat', 'synco', 'sparse', 'long', 'euclid', 'pickup'],
    synthwave: ['eighths', 'long', 'synco', 'sixteenths', 'offbeat', 'euclid'],
  };

  // Contours: height (0..1) at position x (0..1) through the bar's notes.
  const CONTOURS = [
    (x) => x,                                        // rise
    (x) => 1 - x,                                    // fall
    (x) => Math.sin(Math.PI * x),                    // arch
    (x) => 1 - Math.sin(Math.PI * x),                // valley
    (x, k) => (k % 2 ? 0.75 : 0.25) + x * 0.2,       // zigzag, drifting up
    (x) => 0.5 + 0.5 * Math.sin(Math.PI * 4 * x),    // wave
    (x, k) => (k % 3 === 1 ? 0.35 : 0),              // pedal: hold the root, neighbour flicks
    (x) => (x < 0.2 ? 1 : 1 - x),                    // leap up, then tumble
    (x) => Math.floor(x * 3) / 2,                    // terrace: climb in steps
    (x, k) => (k % 2 ? 1 : 0.6) - x * 0.3,           // hover high, sagging
  ];

  // Phrase forms. Each letter is one bar; primes are developed copies.
  //   A  motif           B  answer (mirrored contour, resolves home)
  //   S  A sequenced up   I  A inverted       R  A retrograde
  //   D  A displaced      C  a contrasting bar (new rhythm, same feel)
  const LEAD_FORMS = ['AB', 'A', 'AS', 'AAAB', 'ABAC', 'AI', 'AD', 'AR', 'ASAB', 'AC'];

  function euclidMask(k, n, rot) {
    const out = [];
    for (let j = 0; j < n; j++) out.push(Math.floor((j * k) / n) !== Math.floor(((j + 1) * k) / n) ? 'x' : '.');
    // rotate so the first onset need not sit on the downbeat
    const r = ((rot % n) + n) % n;
    return out.slice(n - r).concat(out.slice(0, n - r)).join('');
  }

  // rhythm mask -> list of slots: { beat, cell, trip } (trip = triplet slot 0..2)
  function slotsOf(mask) {
    const slots = [];
    for (let b = 0; b < 4; b++) {
      if (mask[b * 4] === 'T') { for (let t = 0; t < 3; t++) slots.push({ beat: b, trip: t }); continue; }
      for (let c = 0; c < 4; c++) if (mask[b * 4 + c] === 'x') slots.push({ beat: b, cell: c });
    }
    return slots;
  }

  // render one bar (mask + one token per slot) as mini-notation
  function barString(mask, toks) {
    const hasTrip = mask.indexOf('T') >= 0;
    let k = 0;
    const beats = [];
    for (let b = 0; b < 4; b++) {
      if (mask[b * 4] === 'T') { beats.push('[' + toks[k++] + ' ' + toks[k++] + ' ' + toks[k++] + ']'); continue; }
      const cells = [];
      for (let c = 0; c < 4; c++) cells.push(mask[b * 4 + c] === 'x' ? toks[k++] : '~');
      beats.push(cells);
    }
    // any odd 16th onset? then the bar needs the 16-step grid
    let sixteenth = false;
    for (let i = 1; i < 16; i += 2) if (mask[i] === 'x' && mask[i - (i % 4)] !== 'T') sixteenth = true;
    if (!hasTrip) {
      const flat = [];
      beats.forEach((cs) => { if (sixteenth) flat.push.apply(flat, cs); else flat.push(cs[0], cs[2]); });
      return flat.join(' ');
    }
    // with a triplet beat, every beat is its own group
    return beats.map((cs) => (typeof cs === 'string' ? cs
      : cs.every((c) => c === '~') ? '~'
      : sixteenth ? '[' + cs.join(' ') + ']' : '[' + cs[0] + ' ' + cs[2] + ']')).join(' ');
  }

  // A full lead line. opts:
  //   rng        seeded rng (variant-sensitive) for the fine detail
  //   feel       rhythm family name (LEAD_FEELS entry) — rotated by the caller
  //   contour    CONTOURS index — rotated by the caller
  //   form       LEAD_FORMS entry — rotated by the caller
  //   steps      scale steps per octave (5 pentatonic, 6 blues, 7 otherwise)
  //   prog       the song's progression (scale-degree roots, one per cycle)
  //   top        highest degree allowed (keeps the register sane)
  // Returns the mini-notation for n("…"): one bar, or "<[bar] [bar] …>".
  function melody(opts) {
    const rng = opts.rng;
    const O = opts.steps || 7;
    const pick = (a) => a[Math.floor(rng() * a.length)];
    const int = (lo, hi) => lo + Math.floor(rng() * (hi - lo + 1));
    const top = opts.top != null ? opts.top : O + 4;
    const newMask = () => (opts.feel === 'euclid'
      ? euclidMask(int(3, 7), 16, int(0, 15))
      : pick(LEAD_RHYTHMS[opts.feel] || LEAD_RHYTHMS.sparse));
    const maskA = newMask();
    // range: dense rhythms move stepwise in a narrow band; long notes leap wide
    const dense = slotsOf(maskA).length;
    const span = dense >= 9 ? int(3, 5) : dense <= 3 ? int(4, O + 2) : int(3, O);
    const base = Math.max(0, Math.min(pick([0, 0, 2, 4, O - 1]), top - span));
    const contour = CONTOURS[((opts.contour % CONTOURS.length) + CONTOURS.length) % CONTOURS.length];
    const form = opts.form || 'AB';
    const prog = opts.prog || [0];
    // strong beats lock to chord tones only when each bar sits over one chord
    const aligned = form.length % prog.length === 0 || prog.length === 1;
    const clampD = (d) => Math.max(0, Math.min(top, d));

    const tonesOf = (root) => {
      const t = [];
      for (let o = -1; o <= 2; o++) [0, 2, 4].forEach((x) => t.push(root + x + o * O));
      return t.filter((d) => d >= 0 && d <= top);
    };
    const nearest = (d, list) => list.reduce((b, x) => (Math.abs(x - d) < Math.abs(b - d) ? x : b), list[0]);

    // degrees for a mask under a contour function
    const degreesFor = (mask, cfn, shift) => {
      const sl = slotsOf(mask);
      const n = sl.length;
      const out = [];
      let prev = null;
      sl.forEach((s, k) => {
        const x = n > 1 ? k / (n - 1) : 0;
        let d = base + shift + Math.round(cfn(x, k) * span);
        // break up long same-note runs with a neighbour step
        if (prev !== null && d === prev && rng() < 0.5) d += rng() < 0.5 ? 1 : -1;
        d = clampD(d);
        out.push(d); prev = d;
      });
      return { sl, out };
    };
    const snap = (sl, out, root) => {
      if (!aligned) return out;
      const tones = tonesOf(root);
      if (!tones.length) return out;
      return out.map((d, k) => ((sl[k].cell === 0 || sl[k].trip === 0) ? nearest(d, tones) : d));
    };
    const tokens = (out) => out.map((d) => String(d));

    // build bar A, then develop it per the form
    const A = degreesFor(maskA, contour, 0);
    const bars = [];
    let maskC = null;
    for (let b = 0; b < form.length; b++) {
      const kind = form[b];
      const root = prog[b % prog.length];
      let mask = maskA;
      let degs;
      if (kind === 'A') degs = A.out.slice();
      else if (kind === 'S') degs = A.out.map((d) => clampD(d + (rng() < 0.6 ? 2 : 1)));
      else if (kind === 'I') {
        const lo = Math.min.apply(null, A.out), hi = Math.max.apply(null, A.out);
        degs = A.out.map((d) => clampD(lo + hi - d));
      } else if (kind === 'R') degs = A.out.slice().reverse();
      else if (kind === 'D') {
        // displace the motif by an 8th: same notes, the accents land elsewhere
        mask = maskA.indexOf('T') >= 0 ? maskA : maskA.slice(14) + maskA.slice(0, 14);
        degs = A.out.slice();
      } else if (kind === 'B') {
        // the answer: mirrored contour on the same rhythm, landing on the tonic
        degs = degreesFor(maskA, (x, k) => 1 - contour(x, k), 0).out;
        degs[degs.length - 1] = pick([0, 0, 2, 4].filter((d) => d <= top));
      } else {
        if (!maskC) maskC = newMask();
        mask = maskC;
        degs = degreesFor(maskC, CONTOURS[(opts.contour + 3) % CONTOURS.length], 0).out;
      }
      const sl = slotsOf(mask);
      degs = degs.slice(0, sl.length);
      while (degs.length < sl.length) degs.push(base);
      degs = snap(sl, degs, root);
      const toks = tokens(degs);
      // ornaments: a grace-note pair or a stutter on one weak note
      if (toks.length > 2 && toks.length < 10 && rng() < 0.35) {
        const at = int(1, toks.length - 1);
        if (sl[at].trip == null) {
          const d = degs[at];
          toks[at] = rng() < 0.6 ? '[' + clampD(d + 1) + ' ' + d + ']' : d + '*2';
        }
      }
      bars.push(barString(mask, toks));
    }
    if (bars.length === 1) return bars[0];
    return '<' + bars.map((b) => '[' + b + ']').join(' ') + '>';
  }

  // ---- bass figures --------------------------------------------------------
  //
  // A bass figure is a one-bar template over each chord: R = the chord root,
  // O = root up an octave, F = the fifth, P = a passing note into the NEXT
  // chord's root, N = the next root itself (an anticipation), ~ = rest.
  // bassFigure() expands it chord by chord into "<[bar] [bar] …>", so octave
  // jumps, fifths and walk-ups follow the harmony in any scale.
  const BASS_FIGURES = {
    sub808: ['R ~ ~ ~ ~ ~ ~ ~', 'R ~ ~ ~ R ~ ~ ~', 'R ~ ~ R ~ ~ ~ ~', 'R ~ R ~ ~ ~ R ~',
             'R ~ ~ ~ ~ ~ R ~', 'R ~ ~ R ~ ~ R ~', 'R ~ ~ O ~ ~ ~ ~', 'R ~ ~ ~ O ~ R ~',
             'R ~ ~ R ~ ~ ~ N', 'R ~ R ~ ~ ~ ~ [~ R]', 'R ~ ~ ~ ~ F ~ ~', 'R ~ ~ ~ R ~ [O ~] ~'],
    house:  ['~ R ~ R ~ R ~ R', '~ R ~ R ~ R ~ [R R]', '~ R ~ [R R] ~ R ~ R', '~ R ~ O ~ R ~ O',
             '~ R ~ R ~ F ~ O', '~ R R ~ ~ R ~ N', '[~ R] [~ R] [~ O] [~ R]', '~ R ~ R ~ R ~ P'],
    wave:   ['R R R R R R R R', 'R ~ R R R ~ R R', 'R R R ~ R R R ~', 'R R O R R O R R',
             'R R R R F F O O', 'R O R O R O R O', 'R R O R F R O N'],
    rock:   ['R ~ R R ~ R R ~', 'R R ~ R R ~ R R', 'R ~ R ~ R R ~ R', 'R R R R R R F O',
             'R ~ R F ~ R O ~', 'R ~ ~ R F ~ R P', 'R R F R R F O R'],
    metal:  ['R R R R R R R R', 'R R R R R R [R R] R', '[R R] R R R [R R] R R R', 'R R R R R R F O',
             '[R R] R [R R] R [R R] R F O', 'R R ~ R R ~ R F', 'R R R F R R R O'],
    melodic:['R ~ ~ ~ R ~ ~ ~', 'R ~ ~ R R ~ ~ ~', 'R ~ R ~ R ~ R R', 'R R ~ R R ~ R R',
             'R ~ R ~ ~ ~ R ~', 'R ~ ~ F ~ ~ P ~', 'R ~ O ~ F ~ P ~', 'R ~ ~ R ~ F ~ ~',
             'R ~ ~ [~ R] ~ ~ F ~', 'R ~ F ~ O ~ F P'],
  };

  function bassFigure(prog, tpl, steps) {
    const O = steps || 7;
    const F = O === 5 ? 3 : 4; // the fifth: degree 3 in a pentatonic, 4 otherwise
    const bars = prog.map((root, i) => {
      const next = prog[(i + 1) % prog.length];
      const pass = next > root ? next - 1 : next + 1;
      return tpl.replace(/[ROFPN]/g, (c) => String(
        c === 'R' ? root : c === 'O' ? root + O : c === 'F' ? root + F : c === 'P' ? pass : next));
    });
    return '<' + bars.map((b) => '[' + b + ']').join(' ') + '>';
  }

  // Voice-led chords: each chord takes whichever inversion of the voicing sits
  // closest to the one before it, so the comping moves by small steps instead
  // of jumping in parallel blocks. Degrees never go below 0.
  function ledSeq(prog, kind, pentatonic, steps) {
    const O = steps || (pentatonic ? 5 : 7);
    let prevMid = null;
    const out = prog.map((d) => {
      const base = Theory.voicing(kind, d, pentatonic).slice().sort((a, b) => a - b);
      const cands = [];
      let v = base.slice();
      for (let inv = 0; inv < base.length; inv++) {
        cands.push(v.slice());
        if (v[0] - O >= 0) cands.push(v.map((x) => x - O));
        v = v.slice(1).concat([v[0] + O]);
      }
      const mid = (c) => c.reduce((a, b) => a + b, 0) / c.length;
      let best = cands[0];
      if (prevMid !== null) {
        best = cands.reduce((b, c) => (Math.abs(mid(c) - prevMid) < Math.abs(mid(b) - prevMid) ? c : b), cands[0]);
      }
      prevMid = mid(best);
      return '[' + best.join(',') + ']';
    });
    return '<' + out.join(' ') + '>';
  }

  const Theory = {
    ROOTS,
    SCALES,
    GENRE_SCALES,
    PROGRESSIONS,
    MELODY_CELLS,
    MELODY_PHRASES,
    DRUM_BANKS,
    GENRES,
    LEAD_RHYTHMS,
    LEAD_FEELS,
    LEAD_FORMS,
    CONTOUR_COUNT: CONTOURS.length,
    BASS_FIGURES,
    melody,
    bassFigure,
    ledSeq,

    // Scale steps per octave — the degree distance of an octave in n().scale():
    // 5 in a pentatonic, 6 in the blues scale, 7 in every mode here.
    stepsIn(scale) {
      return /pentatonic/.test(scale) ? 5 : /blues/.test(scale) ? 6 : 7;
    },

    // The mood palette for a genre — the subset of SCALES it draws on. Falls back
    // to the full palette for a genre with no declared mood set (or no genre).
    scalesFor(genre) {
      return (genre && genre.scales && genre.scales.length) ? genre.scales : SCALES;
    },

    // Build a Strudel scale string, e.g. "C3:minor" or "C3:harmonic:minor".
    // The scale argument is itself parsed as mini-notation, so a SPACE splits
    // it into a two-step sequence: "A2:harmonic minor" played the first half of
    // every bar in a broken scale and dropped or repeated the second half
    // (probed on @strudel/web 1.3.0). Strudel reads ':' as the word separator
    // ("A2:minor:pentatonic"), so multi-word names are joined with colons.
    scaleName(root, octave, type) {
      return root + octave + ':' + String(type).split(' ').join(':');
    },

    // Triad rooted on scale degree d: d, d+2, d+4
    triad(d) {
      return d + ',' + (d + 2) + ',' + (d + 4);
    },

    // 7th chord (four stacked scale degrees) — R&B / neo-soul depth
    seventh(d) {
      return d + ',' + (d + 2) + ',' + (d + 4) + ',' + (d + 6);
    },

    // Chord voicings in scale-degree space, beyond the plain triad. Quartal
    // (stacked fourths) and shell (3rd + 7th, no 5th) are the neo-soul / modern
    // colours; sixth and ninth add extension depth; sus4 and spread open it up.
    // All stay inside the scale, so they never fight the mood palette.
    // The power chord — root, fifth, octave in degree space — is the rock and
    // metal wall of sound: no third, so it reads neither major nor minor.
    VOICINGS: ['triad', 'seventh', 'sixth', 'ninth', 'quartal', 'shell', 'sus4', 'spread', 'power'],
    // `pentatonic` caps the widest extensions: in a 5-note scale a scale-degree
    // step spans a bigger interval, so d+8/d+9 blow out ~1.8 octaves. Pull the
    // top voice of `ninth`/`spread` in a step so they stay under an octave.
    voicing(kind, d, pentatonic) {
      switch (kind) {
        case 'seventh': return [d, d + 2, d + 4, d + 6];
        case 'sixth':   return [d, d + 2, d + 4, d + 5];
        case 'ninth':   return pentatonic ? [d, d + 2, d + 4, d + 6] : [d, d + 2, d + 4, d + 6, d + 8];
        case 'quartal': return [d, d + 3, d + 6];        // stacked fourths
        case 'shell':   return [d, d + 2, d + 6];        // 3rd + 7th, drop the 5th
        case 'sus4':    return [d, d + 3, d + 4];        // suspended 4th
        case 'spread':  return pentatonic ? [d, d + 4, d + 7] : [d, d + 4, d + 9]; // open: root, 5th, 9th (capped for pentatonic)
        case 'power':   return [d, d + 4, d + 7];        // root–fifth–octave — rock/metal
        default:        return [d, d + 2, d + 4];        // triad
      }
    },

    // Per-cycle chord sequence in a named voicing, e.g. voicingSeq([0,5],'ninth').
    // `pentatonic` (optional) caps the widest extensions so 5-note scales don't
    // blow out ~1.8 octaves — see voicing().
    voicingSeq(prog, kind, pentatonic) {
      return '<' + prog.map((d) => '[' + Theory.voicing(kind, d, pentatonic).join(',') + ']').join(' ') + '>';
    },

    // A walking bassline for the progression: each chord's root, then a single
    // scale-step toward the next chord's root — the classic "walk into the one".
    // Stepwise motion keeps it valid in any scale (no octave-size assumptions),
    // and two notes per chord give the low end forward momentum.
    walkingSeq(prog) {
      const out = [];
      for (let i = 0; i < prog.length; i++) {
        const root = prog[i];
        const next = prog[(i + 1) % prog.length];
        // When the next chord repeats the tonic there's no target to walk into,
        // so give the passing tone contour: alternate the leading step by index
        // parity (up on even bars, down on odd) instead of always walking up.
        const step = next > root ? 1 : next < root ? -1 : (i % 2 === 0 ? 1 : -1);
        out.push('[' + root + ' ' + (root + step) + ']');
      }
      return '<' + out.join(' ') + '>';
    },

    // Per-cycle root sequence: [0,5,3,4] -> "<0 5 3 4>"
    rootSeq(prog) {
      return '<' + prog.join(' ') + '>';
    },

    // Per-cycle triad sequence
    chordSeq(prog) {
      return '<' + prog.map((d) => '[' + Theory.triad(d) + ']').join(' ') + '>';
    },

    // Per-cycle 7th-chord sequence
    seventhSeq(prog) {
      return '<' + prog.map((d) => '[' + Theory.seventh(d) + ']').join(' ') + '>';
    },
  };

  SDJ.Theory = Theory;
})(window.SDJ = window.SDJ || {});
